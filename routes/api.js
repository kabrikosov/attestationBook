const express = require('express');
const router = express.Router();
const {openConnection, groupDisciplineTeacherGroup, groupTeacherDisciplineGroup, asTransaction, prepareStudent} = require('../helpers');
const {isAuthenticated} = require('./isAuth')

router.delete('/edit/student_group_session', isAuthenticated, (req, res) => {
    const db = openConnection();
    const dbreq = db.prepare('DELETE FROM student_group_session WHERE id = @student_group_session_id').run(req.body)
    console.log(dbreq)
    res.sendStatus(200);
})

router.put('/edit/attestation_book/theme', isAuthenticated, (req, res) =>{
    const db = openConnection();
    const body = req.body;

    const dbreq = db.prepare(`
UPDATE attestation_book 
SET theme = @theme
WHERE id = @attestation_book_id`).run(body);

    res.sendStatus(200);
})

router.put('/edit/student_group_session', isAuthenticated, (req, res) =>{
    const db = openConnection();
    const body = req.body;
    const sgs = {
        id: body.student_group_session_id,
        student_group_id: body.student_group_id,
        report_type_id: body.report_type_id,
        semester: body.semester,
        mark_date: body.mark_date
    }

    const dbreq = db.prepare(`
UPDATE student_group_session 
SET student_group_id = @student_group_id, 
report_type_id = @report_type_id, 
semester = @semester, 
mark_date = @mark_date 
WHERE id = @id`).run(sgs); // {changes: x, lastInsertRowid: 0}

    res.sendStatus(200);
})

router.put('/edit/attestation_book/mark', isAuthenticated, (req, res) =>{
    const db = openConnection();
    const body = req.body;
    const sgs = {
        id: body.attestation_book_id,
        mark: body['mark'],
    }
    db.prepare(`
UPDATE attestation_book 
SET mark = @mark
WHERE id = @id`).run(sgs)
    res.sendStatus(200);
});

router.put('/edit/student_group_session/date', isAuthenticated, (req, res) =>{
    const db = openConnection();
    const body = req.body;
    const sgs = {
        id: body.attestation_book_id,
        mark_date: body.mark_date,
    }
    db.prepare(`UPDATE student_group_session
SET mark_date = @mark_date
WHERE (id = (SELECT ab.student_group_session_id FROM attestation_book ab WHERE ab.id = @id))`).run(sgs);
    res.sendStatus(200);
})

router.post('/add/student_group_session', isAuthenticated, (req, res) => {
    const db = openConnection();
    const body = req.body;

    const insertSgs = db.prepare(`
INSERT INTO student_group_session (student_group_id, report_type_id, teacher_discipline_id, mark_date, semester)
VALUES (@student_group_id, @report_type_id, @teacher_discipline_id, @mark_date, @semester)`);
    const insertAttestationBook = db.prepare(`
INSERT INTO attestation_book (student_id, student_group_session_id)
SELECT s.id AS student_id, (@student_group_session_id) AS student_group_session_id 
FROM student s 
WHERE s.student_group_id = @student_group_id
`);

    const insertSgsAndAttestationBook = asTransaction((data) => {
        data.student_group_session_id = insertSgs.run(data).lastInsertRowid;
        data.attestation_book_id = insertAttestationBook.run(data).lastInsertRowid;
    }, db)

    insertSgsAndAttestationBook(body);

    res.send(body);
})


router.get('/students/search', (req, res) => {
    const db = openConnection();
    const searchParams = req.query?.search?.split(" ");
    const parameters = ['lastname', 'firstname', 'middlename', 'group_name'];

    const sql = `
SELECT lastname, firstname, IFNULL(middlename, '') middlename, g.name AS group_name, s.id AS student_id 
FROM student s JOIN student_group g ON s.student_group_id = g.id 
WHERE ${searchParams
        .map((param, i) => `${searchParams.length === 1 && (parameters[i] + ' LIKE ' + "'%" + param + "%' OR") || ''} ${parameters[i]} IN (${searchParams.map(el => "'" + el + "'").join(', ')})`)
        .join(' AND ')}`;

    const prepare = db.prepare(sql)
    const students = prepare.all();
    res.send(JSON.stringify(students));
    db.close();
});

router.get('/students/delete/:studentId', (req, res) => {
    const db = openConnection();
    const student = db.prepare('DELETE FROM student WHERE id = ?').run(req.params.studentId);
    console.log(student);
    if (student?.changes)
        res.sendStatus(200)
    else res.sendStatus(400);
    db.close();
});

router.get('/teachers/search', (req, res) => {
    const db = openConnection();
    const searchParams = req.query?.search?.split(" ");
    const parameters = ['lastname', 'firstname', 'middlename'];

    let teachers = db.prepare(`
SELECT t.id as teacher_id, t.lastname, t.middlename, t.firstname, d.name AS discipline_name, td.id AS teacher_discipline_id, sg.name AS student_group_name, sg.id AS student_group_id
FROM teacher t
JOIN teacher_discipline td on t.id = td.teacher_id
JOIN discipline d ON td.discipline_id = d.id
JOIN student_group_session sgs ON sgs.teacher_discipline_id = td.id
JOIN student_group sg ON sg.id = sgs.student_group_id
WHERE ${searchParams
        .map((param, i) => `${searchParams.length === 1 && (parameters[i] + ' LIKE ' + "'%" + param + "%' OR") || ''} ${parameters[i]} IN (${searchParams.map(el => "'" + el + "'").join(', ')})`)
        .join(' AND ')}
`).all();

    teachers = groupTeacherDisciplineGroup(teachers);

    res.send(JSON.stringify(teachers));
    db.close();
});

router.get('/getStudent/:studentId', (req, res) => {
    const db = openConnection();
    const parameters = {student_id: req.params.studentId, semester: req.query.semester}
    const sort = req.query['sort'];
    const direction = req.query['direction'];
    const student = db.prepare(`SELECT s.middlename AS student_middlename, s.lastname AS student_lastname, s.firstname AS student_firstname,
t.middlename AS teacher_middlename, t.lastname AS teacher_lastname, t.firstname AS teacher_firstname,
mark, theme, mark_date, semester, rt.name report_type_name,
student_id, teacher_id, student_group_session_id, ab.id attestation_book_id,
teacher_discipline_id, sgs.student_group_id, report_type_id, sg.name student_group_name, d.name discipline_name, d.id discipline_id
FROM student s
LEFT JOIN attestation_book ab ON s.id = ab.student_id
LEFT JOIN student_group_session sgs ON sgs.id = ab.student_group_session_id
LEFT JOIN teacher_discipline td ON td.id = sgs.teacher_discipline_id
LEFT JOIN teacher t ON td.teacher_id = t.id
LEFT JOIN discipline d ON d.id = td.discipline_id
LEFT JOIN report_type rt ON rt.id = sgs.report_type_id
LEFT JOIN student_group sg ON sgs.student_group_id = sg.id
WHERE s.id = @student_id AND semester = @semester
ORDER BY rt.id DESC
`).all(parameters);
    res.send(prepareStudent(student, sort, direction));
})


module.exports = router;
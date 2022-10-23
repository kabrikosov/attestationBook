const express = require('express');
const router = express.Router();
require("core-js/actual/array/group-by");
const {openConnection, groupTeacherDisciplineGroup, asTransaction} = require('../helpers');

/*    REST    */
/**************/

router.get("/", (req, res) => {
    const db = openConnection();
    let teachers = db.prepare(`
SELECT t.id as teacher_id, t.lastname, t.middlename, t.firstname, d.name AS discipline_name, td.id AS teacher_discipline_id, sg.name AS student_group_name, sg.id AS student_group_id
FROM teacher t
LEFT JOIN teacher_discipline td on t.id = td.teacher_id
LEFT JOIN discipline d ON td.discipline_id = d.id
LEFT JOIN student_group_session sgs ON sgs.teacher_discipline_id = td.id
LEFT JOIN student_group sg ON sg.id = sgs.student_group_id
`).all();

    teachers = groupTeacherDisciplineGroup(teachers);

    res.render('teacher/teachers', {teachers});
    db.close();
})

router.get("/add", (req, res) => {
    const db = openConnection();
    const disciplines = db.prepare('SELECT * from discipline').all();
    console.dir(disciplines);
    res.render('teacher/add_teacher', {disciplines});
})

router.get("/:teacherId", (req, res) => {
    const db = openConnection();
    const teacher = db.prepare('SELECT * FROM teacher where id = ?').get([req.params?.teacherId]);
    const disciplines_groups = db.prepare(`
SELECT d.name as discipline_name, discipline_id, teacher_id, student_group_id, rt.name as report_type, sg.name as student_group_name from discipline d
LEFT JOIN teacher_discipline td ON d.id = td.discipline_id
LEFT JOIN teacher t ON t.id = td.teacher_id
LEFT JOIN student_group_session sgs ON sgs.teacher_discipline_id = td.id
LEFT JOIN student_group sg ON sgs.student_group_id = sg.id
JOIN report_type rt on rt.id = sgs.report_type_id
WHERE t.id = ?`)
        .all([req.params?.teacherId]).groupBy(({discipline_name}) => discipline_name);
    res.render('teacher/teacher', {teacher, disciplines_groups});
    console.log(disciplines_groups);
    db.close();
})

router.get('/edit/:teacherId', (req, res) => {
    const db = openConnection();
    const teacher = db.prepare('SELECT * FROM teacher t WHERE t.id = ?').get([req.params?.teacherId]);
    teacher.disciplines = db.prepare(`
SELECT *, max(td.teacher_id = ?) AS selected 
FROM teacher_discipline td 
LEFT JOIN discipline d ON td.discipline_id = d.id
GROUP BY d.id`)
        .all([req.params?.teacherId]);
    res.render('teacher/edit_teacher', {teacher});
})

router.put('/edit', (req, res) => {
    const db = openConnection();
    const teacher = JSON.parse(JSON.stringify(req.body));
    const t = db.prepare('UPDATE teacher SET lastname = @lastname, firstname = @firstname, middlename = @middlename WHERE id = @id').run(teacher);
    const disciplines = db.prepare(`SELECT td.discipline_id FROM teacher_discipline td WHERE td.teacher_id = ${teacher.id}`).all().map(({discipline_id}) => discipline_id);

    if (!Array.isArray(teacher.disciplines))
        teacher.disciplines = [teacher.disciplines];

    teacher.disciplines = teacher.disciplines.map(el => +el)

    //teacher.disciplines - то, что стало. disciplines - то, что было.
    const insert = teacher.disciplines.filter(el => !disciplines.includes(el));
    const remove = disciplines.filter(el => !teacher.disciplines.includes(el));

    const td_insert = insert.length && db.prepare(`INSERT INTO teacher_discipline (teacher_id, discipline_id) VALUES ${insert.map(el => '(' + teacher.id + ',' + el + ')').join('\n')}`).run();

    const td_remove = remove.length && db.prepare(`DELETE FROM teacher_discipline WHERE teacher_id = ${teacher.id} AND discipline_id IN (${remove.join(', ')})`).run();

    if (t.changes)
        res.redirect('/teachers/' + teacher.id);
})


router.post('/add', (req, res) => {
    const db = openConnection();
    const teacher = JSON.parse(JSON.stringify(req.body));
    teacher.disciplines = Array.isArray(teacher.disciplines) ? teacher.disciplines : [teacher.disciplines];

    const insertTeacher = db.prepare(`INSERT INTO teacher (lastname, firstname, middlename) VALUES (@lastname, @firstname, @middlename)`);
    const insertTd = db.prepare(`INSERT INTO teacher_discipline (discipline_id, teacher_id) VALUES ${teacher.disciplines.map(el => '(' + el + ', @id)').join(', ')}`);

    const insertTeacherAndTd = asTransaction((data) => {
        data.id = insertTeacher.run(data).lastInsertRowid;
        insertTd.run(data);
    }, db)

    insertTeacherAndTd(teacher);

    res.redirect(303, `/teachers/${teacher.id}`);
})

router.delete('/delete/:teacherId', (req, res) => {
    const db = openConnection();
    db.prepare('DELETE FROM teacher WHERE id = ?').run(req.params.teacherId);
    res.sendStatus(200);
})

router.delete('/delete', (req, res) => {
    const db = openConnection();
    const body = JSON.parse(req.body);
    db.prepare('DELETE FROM teacher WHERE id = ?').run(body.teacher_id);
    res.sendStatus(200);
})

module.exports = router
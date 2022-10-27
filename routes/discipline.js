const express = require('express');
const router = express.Router();
const {openConnection, groupDisciplineTeacherGroup} = require('../helpers');
const {isAuthenticated} = require('./isAuth')

router.get("/", (req, res) => {
    const db = openConnection();
    let teachers = db.prepare(`
SELECT t.id as teacher_id, t.lastname, t.middlename, t.firstname, d.name AS discipline_name, td.id AS teacher_discipline_id, sg.name AS student_group_name, sg.id AS student_group_id, d.id AS discipline_id
FROM discipline d
LEFT JOIN teacher_discipline td on d.id = td.discipline_id
LEFT JOIN teacher t ON td.teacher_id = t.id
LEFT JOIN student_group_session sgs ON sgs.teacher_discipline_id = td.id
LEFT JOIN student_group sg ON sg.id = sgs.student_group_id
`).all();
    const disciplines = groupDisciplineTeacherGroup(teachers)
    res.render('discipline/disciplines', {disciplines});
    db.close();
})

router.get("/add", isAuthenticated, (req, res) => {
    const db = openConnection();
    const teachers = db.prepare('SELECT * from teacher').all();
    res.render('discipline/add_discipline', {teachers});
})

router.get("/:disciplineId", (req, res) => {
    const db = openConnection();
    const discipline = db.prepare('SELECT * FROM discipline where id = ?').get([req.params?.disciplineId]);
    const teachers = db.prepare(`
SELECT *, t.id as teacher_id FROM teacher t
LEFT JOIN teacher_discipline td ON td.teacher_id = t.id 
LEFT JOIN student_group_session sgs ON td.id = sgs.teacher_discipline_id 
LEFT JOIN student_group sg ON sgs.student_group_id = sg.id 
WHERE td.discipline_id = ?`)
        .all([req.params?.disciplineId]); //список всех преподавателей, ведущих данную дисциплину
    console.log(teachers);
    res.render('discipline/discipline', {discipline, teachers});
    db.close();
})

router.get('/edit/:disciplineId', isAuthenticated, (req, res) => {
    const db = openConnection();
    const teachers = db.prepare(`SELECT * from teacher`).all();
    const disciplines = db.prepare(`
SELECT d.name, d.id, t.id as teacher_id, td.id as teacher_discipline_id FROM discipline d
LEFT JOIN teacher_discipline td on td.discipline_id = d.id
LEFT JOIN teacher t on td.teacher_id = t.id
WHERE d.id = ?`
    ).all([req.params?.disciplineId]);
    const groups = db.prepare(`SELECT student_group_id, sg.name as student_group_name, discipline_id, semester, mark_date, td.id as teacher_discipline_id, rt.id as report_type_id, td.teacher_id as teacher_id, rt.name as report_type_name, (td.discipline_id = ${req.params?.disciplineId}) AS picked, sgs.id AS student_group_session_id from student_group sg 
LEFT JOIN student_group_session sgs ON sgs.student_group_id = sg.id 
LEFT JOIN teacher_discipline td ON td.id = sgs.teacher_discipline_id
LEFT JOIN report_type rt ON sgs.report_type_id = rt.id`).all();

    const allGroups = db.prepare('SELECT * FROM student_group').all();
    const allReports = db.prepare('SELECT * FROM report_type').all();
    res.render('discipline/edit_discipline', { disciplines, teachers, groups, allGroups, allReports, disciplineId: req.params?.disciplineId});
})

router.put('/edit', isAuthenticated, (req, res) => {
    const db = openConnection();
    const discipline = JSON.parse(JSON.stringify(req.body));
    const d = db.prepare('UPDATE discipline SET name = @name WHERE id = @discipline_id').run(discipline);
    let td;
    if (discipline.teacher_discipline_id)
        td = db.prepare('UPDATE teacher_discipline SET teacher_id = @teacher_id WHERE id = @teacher_discipline_id').run(discipline);
    else td = db.prepare('INSERT INTO teacher_discipline (teacher_id, discipline_id) VALUES (@teacher_id, @discipline_id)').run(discipline);
    td.changes && d.changes && res.redirect('/disciplines/' + discipline.discipline_id);
})


router.post('/add', isAuthenticated, (req, res) => {
    const db = openConnection();
    const discipline = JSON.parse(JSON.stringify(req.body), (k, v) => v === "null" ? null : v);

    const {lastInsertRowid} = db.prepare(`INSERT INTO discipline (name) VALUES (@name)`).run(discipline);
    discipline['id'] = lastInsertRowid;

    if (discipline?.teacher_id && lastInsertRowid)
        db.prepare(`INSERT INTO teacher_discipline (teacher_id, discipline_id) VALUES (@teacher_id, @id)`).run(discipline);

    res.redirect(303, `/disciplines/${lastInsertRowid}`);
})

router.delete('/deletetd/:tdisciplineId', isAuthenticated, (req, res) => {
    const db = openConnection();
    db.prepare('DELETE FROM teacher_discipline WHERE id = ?').run(req.params.tdisciplineId);
    res.sendStatus(200);
})

router.delete('/delete/:disciplineId', isAuthenticated, (req, res) => {
    const db = openConnection();
    db.prepare('DELETE FROM discipline WHERE id = ?').run(req.params.disciplineId);
    res.sendStatus(200);
})

module.exports = router
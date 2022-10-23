const express = require('express');
const router = express.Router();
const {openConnection} = require('../helpers');

router.get("/", (req, res) => {
    res.render('student/students');
})

router.get("/add", (req, res) => {
    const db = openConnection();
    const groups = db.prepare('SELECT * from student_group').all();
    res.render('student/add_student', {groups});
    db.close();
})

router.put('/edit', (req, res) => {
    const student = JSON.parse(JSON.stringify(req.body));
    const db = openConnection();
    const s = db.prepare(`UPDATE student SET lastname = @lastname, firstname = @firstname, middlename = @middlename, student_group_id = @student_group_id WHERE id = @id`)
        .run(student);
    console.log(s);
    res.redirect(303, `/students/${student.id}`);
})

router.get("/edit/:studentId", (req, res) => {
    const db = openConnection();
    const groups = db.prepare('SELECT * from student_group').all();
    const student = db.prepare('SELECT * FROM student s WHERE s.id = ?').get([req.params.studentId]);
    console.log({groups, student});
    res.render('student/edit_student', {groups, student});
    db.close();
})

router.get("/:studentId", (req, res) => {
    const db = openConnection();
    const student = db.prepare("SELECT *, s.id AS id, g.name AS group_name FROM student s JOIN student_group g ON s.student_group_id = g.id WHERE s.id = ?").get([req.params.studentId]);
    console.log(student);
    db.close();
    res.render('student/student', {student});
})

router.post('/add', (req, res) => {
    const student = JSON.parse(JSON.stringify(req.body));
    const db = openConnection();
    const s = db.prepare(`INSERT INTO student (lastname, firstname, middlename, student_group_id) VALUES (@lastname, @firstname, @middlename, @student_group_id)`)
        .run(student);
    res.redirect(`/students/${s.lastInsertRowid}`);
})

router.delete('/delete/:studentId', (req, res) => {
    const db = openConnection();
    db.prepare('DELETE FROM student WHERE id = ?').run(req.params.studentId);
    res.sendStatus(200);
})


module.exports = router;
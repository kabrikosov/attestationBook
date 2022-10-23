const express = require('express');
const router = express.Router();
const {openConnection} = require('../helpers');

/*    REST    */

/**************/

router.get("/", (req, res) => {
    const db = openConnection();
    const groups = db.prepare('SELECT * FROM student_group').all();
    res.render('group/groups', {groups});
    db.close();
})

router.put('/edit', (req, res) => {
    const db = openConnection();
    const group = JSON.parse(JSON.stringify(req.body));
    const g = db.prepare('UPDATE student_group SET name = @name WHERE id = @id').run(group);
    if (g.changes)
        res.redirect('/groups/' + group.id);

})

router.get("/add", (req, res) => {
    res.render('group/add_group');
})

router.get("/:groupId", (req, res) => {
    const db = openConnection();
    const group = db.prepare('SELECT * FROM student_group where id = ?').get([req.params?.groupId]);
    const students = db.prepare('SELECT *, s.id AS id FROM student s JOIN student_group sg ON s.student_group_id = sg.id WHERE sg.id = ?').all([req.params?.groupId]);
    res.render('group/group', {group, students});
    db.close();
})

router.get('/edit/:groupId', (req, res) => {
    const db = openConnection();
    const group = db.prepare('SELECT * FROM student_group WHERE id = ?').get([req.params?.groupId]);
    res.render('group/edit_group', { group });
})

router.post('/add', (req, res) => {
    const group = JSON.parse(JSON.stringify(req.body));
    const db = openConnection();;
    const g = db.prepare(`INSERT INTO student_group (name) VALUES (@name)`)
        .run(group);
    res.redirect(303, `/groups/${g?.lastInsertRowid}`);
})

router.delete('/delete/:groupId', (req, res) => {
    const db = openConnection();
    db.prepare('DELETE FROM student_group WHERE id = ?').run(req.params.groupId);
    res.sendStatus(200);
})

module.exports = router
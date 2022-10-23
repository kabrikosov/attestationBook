const express = require('express');
const router = express.Router();
const {openConnection} = require('../helpers');

router.get('/', (req, res) => {
    const db = openConnection();
    const report_types = db.prepare('SELECT * FROM report_type').all();

    res.render('report/reports', {report_types});
});

router.get('/add', (req, res) => {
    res.render('report/add_report')
});

router.get('/:reportId', (req, res) => {
    const db = openConnection();
    const report_type = db.prepare('SELECT * FROM report_type rt WHERE rt.id = ?').get([req.params.reportId]);

    res.render('report/report', {report_type});
});

router.get('/edit/:reportId', (req, res) => {
    const db = openConnection();
    const report = db.prepare('SELECT * FROM report_type rt WHERE rt.id = ?').get([req.params.reportId]);
    //TODO создать представление
    res.render('report/edit_report', {report});
});

router.post('/add', (req, res) => {
    const db = openConnection();
    const body = req.body;

    body.id = db.prepare('INSERT INTO report_type (name) VALUES (@name)').run(body).lastInsertRowid;

    res.redirect('/reports/' + body.id);
})

router.put('/edit', (req, res) => {
    const db = openConnection();
    const body = req.body;
    db.prepare('UPDATE report_type SET name = @name WHERE id = @id').run(body);
    res.redirect('/reports/' + body.id);
})

router.delete('/:reportId', (req, res) => {
    const db = openConnection();
    const body = req.params.reportId;
    db.prepare('DELETE FROM report_type WHERE id = ?').run(body);
    res.redirect('/reports/');
})
//TODO put, post, delete method handlers...

module.exports = router
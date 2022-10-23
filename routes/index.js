const express = require('express');
const router = express.Router();
const {openConnection} = require('../helpers');

/* GET home page. */
router.get('/', function(req, res, next) {
  const db = openConnection();
  const students = db.prepare('SELECT lastname, firstname, middlename, g.name AS group_name, s.id FROM student s JOIN student_group g ON s.student_group_id = g.id').all();
  console.log(students);
  res.render('index', { students });
  db.close();
});

module.exports = router;

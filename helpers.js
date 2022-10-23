const openConnection = () => {
    return require('better-sqlite3')('./database.db');
}

const getTeacher = ({teacher_id, firstname, middlename, lastname}) => ({teacher_id, firstname, middlename, lastname});
const getGroup = ({student_group_name, student_group_id}) => ({student_group_name, student_group_id});
const getDiscipline = ({discipline_name, discipline_id, teacher_discipline_id, student_group_session_id}) => ({discipline_name, discipline_id, teacher_discipline_id, student_group_session_id});

const groupTeacherDisciplineGroup = (teachers) => {
    teachers = teachers.reduce((prev, curr) => {
        prev[curr.teacher_id] = prev[curr.teacher_id] || (getTeacher(curr));
        prev[curr.teacher_id].disciplines = prev[curr.teacher_id].disciplines || [];
        prev[curr.teacher_id].disciplines[curr.teacher_discipline_id] = prev[curr.teacher_id].disciplines[curr.teacher_discipline_id] || getDiscipline(curr);
        prev[curr.teacher_id].disciplines[curr.teacher_discipline_id].groups = prev[curr.teacher_id].disciplines[curr.teacher_discipline_id].groups || [];
        prev[curr.teacher_id].disciplines[curr.teacher_discipline_id].groups.push(getGroup(curr));
        prev[curr.teacher_id].disciplines = prev[curr.teacher_id].disciplines.filter(e => e != null);
        return prev;
    }, [])

    teachers = Object.values(teachers);

    console.dir(teachers);
    return teachers;
}

const groupDisciplineTeacherGroup = (arr) => {
    arr = arr.reduce((prev, curr) => {
        prev[curr.discipline_id] = prev[curr.discipline_id] || (getDiscipline(curr));
        prev[curr.discipline_id].teachers = prev[curr.discipline_id].teachers || ({});
        prev[curr.discipline_id].teachers[curr.teacher_id] = prev[curr.discipline_id].teachers[curr.teacher_id] || getTeacher(curr);
        prev[curr.discipline_id].teachers[curr.teacher_id].groups = prev[curr.discipline_id].teachers[curr.teacher_id].groups || [];
        prev[curr.discipline_id].teachers[curr.teacher_id].groups.push(getGroup(curr));

        return prev;
    }, [])

    arr = Object.values(arr);
    arr.forEach(el => el.teachers = Object.values(el.teachers));

    return arr;
}

const begin = (db) => db.prepare('BEGIN');
const commit = (db) => db.prepare('COMMIT');
const rollback = (db) => db.prepare('ROLLBACK');

const asTransaction = (func, db) => {
    return function (...args) {
        begin(db).run();
        try {
            func(...args);
            commit(db).run();
        } finally {
            if (db.inTransaction) rollback(db).run();
        }
    };
}

const prepareStudent = (student, sort = 'report_type_id', direction = 1) => {
    const getStudentData = ({student_middlename, student_lastname, student_firstname, student_id, student_group_id, student_group_name}) => ({student_middlename, student_lastname, student_firstname, student_id, student_group_id, student_group_name});
    const getDiscipline = ({student_middlename, student_lastname, student_firstname, student_id, student_group_id, student_group_name, ...etc}) => etc;

    student = student.reduce((prev, curr) => {
        prev = prev || getStudentData(curr);
        prev.disciplines = prev.disciplines || ({});
        prev.disciplines[curr.discipline_id] = prev.disciplines[curr.discipline_id] || [];
        prev.disciplines[curr.discipline_id] = [...prev.disciplines[curr.discipline_id], (getDiscipline(curr))];

        return prev;
    }, null)
    if (student) {
        student.disciplines = Object.values(student.disciplines);
        student.disciplines = student.disciplines.map(Object.values).reduce((prev, curr) => [...prev, ...Object.values(curr)], []);

        if (sort === 'teacher')
            student.disciplines = student.disciplines.sort((a, b) => direction * `${a.teacher_lastname} ${a.teacher_firstname} ${a.teacher_middlename}`.localeCompare(`${b.teacher_lastname} ${b.teacher_firstname} ${b.teacher_middlename}`));
        else if (sort === 'date') {
            const parseDate = (date) => {
                let a = date.split('-');
                return new Date(a[2], a[1] - 1, a[0]);
            }
            student.disciplines = student.disciplines.sort((a, b) => direction * (parseDate(a.mark_date) - parseDate(b.mark_date)));
        } else if (sort === 'discipline'){
            student.disciplines = student.disciplines.sort((a, b) => direction * (a.discipline_name.localeCompare(b.discipline_name)));
        } else
         student.disciplines = student.disciplines.sort((a, b) => direction * (a[sort] - b[sort]));
    }
    return student;
}

/*

{
    "student_middlename": null,
    "student_lastname": "Абрикосов",
    "student_firstname": "Константин",
    "student_id": 12,
    "student_group_id": 1,
    "student_group_name": "fi_2019",
    disciplines: [
        "teacher_middlename": "Иннокентьевич",
        "teacher_lastname": "Пантелеев",
        "teacher_firstname": "Владимир",
        "teacher_id": 2,
        "discipline_name": "Математическая логика",
        "discipline_id": 5,
        "mark": null,
        "theme": null,
        "mark_date": null,
        "semester": 5,
        "report_type_name": "Экзамен",
        "report_type_id": 1,
        "student_group_session_id": 24,
        "attestation_book_id": 5,
        "teacher_discipline_id": 16,
    ]
}
 */

module.exports = {openConnection, groupTeacherDisciplineGroup, groupDisciplineTeacherGroup, asTransaction, prepareStudent}
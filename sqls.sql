-- insert into student_group (name)
-- values ('fi_2019');

--insert into teacher (lastname, firstname, middlename)
--values ('Кириченко', 'Константин', 'Дмитриевич'), 
--('Пантелеев', 'Владимир', 'Иннокентьевич'), ('Попова', 'Виктория', 'Алексеевна');

--insert into discipline (name)
--values ('Архитектура веб-приложений'), ('Теория графов'), ('Алгебраические системы');

--insert into report_type (name)
--values ('Экзамен'), ('Зачет');

--insert into student (lastname, firstname, middlename, student_group_id)
--values ('Абрикосов', 'Константин', null, 1), ('Бубнова', 'Виктория', 'Константиновна', 1);

--insert into teacher_discipline (teacher_id, discipline_id)
--VALUES (1, 1), (2, 3), (3, 4);

-- insert into student_group_session (student_group_id, report_type_id, teacher_discipline_id, semester)
-- values (1, 1, 1, 7), (1, 1, 2, 5), (1, 1, 3, 7);

-- INSERT INTO attestation_book 
-- (student_id, student_group_session_id, mark) VALUES 
-- (1, 1, NULL), 
-- (2, 2, NULL);

-- SELECT s.firstname, s.lastname, s.middlename, g.name AS group_name
-- FROM student s
-- LEFT JOIN student_group g ON s.student_group_id = g.id

-- SELECT t.lastname, t.firstname, t.middlename, d.name as discipline_name FROM teacher t
-- JOIN teacher_discipline td ON td.teacher_id = t.id
-- JOIN  discipline d ON d.id = td.discipline_id

-- SELECT s.lastname, d.name AS discipline_name, b.mark
-- FROM student s
-- JOIN attestation_book b ON b.student_id = s.id
-- JOIN student_group_session sgs ON sgs.id = b.student_group_session_id
-- JOIN teacher_discipline td ON td.id = sgs.teacher_discipline_id
-- JOIN discipline d ON d.id = td.discipline_id
-- WHERE s.id=1 

-- SELECT sg.name, rt.name FROM student_group sg
-- JOIN student_group_session sgs on sgs.student_group_id = sg.id
-- JOIN report_type rt ON rt.id = sgs.report_type_id

-- select s.lastname, s.firstname, s.middlename, ab.mark from student s
-- join attestation_book ab on ab.student_id = s.id
-- join student_group_session sgs on ab.student_group_session_id = sgs.id
-- where ab.mark < ?
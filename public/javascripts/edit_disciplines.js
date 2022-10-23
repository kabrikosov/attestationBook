const editModal = new bootstrap.Modal(document.getElementById('editModal'));
const addModal = new bootstrap.Modal(document.getElementById('addModal'));

const fetchOptions = (data, method = 'POST') => ({
    method: method,
    mode: 'cors',
    cache: 'no-cache',
    credentials: 'same-origin',
    headers: {
        'Content-Type': 'application/json'
    },
    redirect: 'follow',
    referrerPolicy: 'no-referrer',
    body: JSON.stringify(data)
})

const removeElementWithTimeOut = (el) => {
    el.classList.add('removing');
    setTimeout(() => el.remove(), 500);
}

const parseStringDate = ([day, month, year]) => day == null ? null : new Date(+year, +month - 1, +day + 1);
const parseDate = date => date.startsWith("NaN") ? null : parseStringDate(date.split('-'));

const dateToString = date => dateDateToString(new Date(date));
const dateDateToString = date => date ? `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}` : null;

const createEditForm = (data, e) => {
    console.log(data);
    const student_group = document.getElementById('edit_student_group');
    const report_type = document.getElementById('edit_report_type');
    const semester = document.getElementById('edit_semester');
    const mark_date = document.getElementById('edit_mark_date');
    const teacher_discipline_id = document.getElementById('edit_teacher_discipline_id');

    Array.from(student_group.options).forEach(el => el.selected = +el.value === +data.student_group_id);
    Array.from(report_type.options).forEach(el => el.selected = +el.value === +data.report_type_id);
    semester.value = data.semester;
    mark_date.value = parseDate(data.mark_date)?.toISOString()?.substring(0, 10);
    teacher_discipline_id.value = data.teacher_discipline_id;

    document.getElementById('editSubmitButton').onclick = (ev) => {
        const d = [student_group.options[student_group.selectedIndex].text, report_type.options[report_type.selectedIndex].text, `${semester.value}-й семестр`];
        data = ({
            ...data,
            semester: semester.value,
            report_type_name: d[1],
            report_type_id: report_type.value,
            student_group_id: student_group.value,
            student_group_name: d[0],
            mark_date: dateToString(mark_date.value),
            teacher_discipline_id: teacher_discipline_id.value,
        })
        console.log(data);
        fetch('/api/edit/student_group_session', fetchOptions(data, 'PUT'))
        e.target.dataset.groupData = JSON.stringify(data);
        Array.from(e.target.parentNode.previousSibling.childNodes).forEach((el, i) => el.innerText = d[i]);
        editModal.hide(ev)
    }
}

const createAddForm = (e, tdId) => {
    const student_group = document.getElementById('add_student_group');
    const report_type = document.getElementById('add_report_type');
    const semester = document.getElementById('add_semester');
    const mark_date = document.getElementById('add_mark_date');
    const teacher_discipline_id = document.getElementById('add_teacher_discipline_id');
    teacher_discipline_id.value = tdId;

    document.getElementById('addSubmitButton').onclick = (ev) => {
        const d = [student_group.options[student_group.selectedIndex].text, report_type.options[report_type.selectedIndex].text, `${semester.value}-й семестр`];
        let data = ({
            semester: semester.value,
            report_type_name: d[1],
            report_type_id: report_type.value,
            student_group_id: student_group.value,
            student_group_name: d[0],
            mark_date: dateToString(mark_date.value),
            teacher_discipline_id: teacher_discipline_id.value,
        })
        const p = fetch('/api/add/student_group_session', fetchOptions(data, 'POST'))
            .then(resp => resp.json())
            .then(resp => {
                data = ({...data, ...resp});
                console.log(data);
                addModal.hide(ev)
                createNewNode(data, e);
            })
            .catch(console.warn);
    }
}

document.querySelectorAll("button[data-group-edit]")
    .forEach(el => {
            el.onclick = (e) =>
                createEditForm(JSON.parse(e.target.dataset.groupData), e)
        }
    );

document.querySelectorAll("button[data-group-delete]")
    .forEach(el => {
            el.onclick = (e) => {
                const obj = ({student_group_session_id: e.target.dataset.groupDelete})
                fetch(`/api/edit/student_group_session/`, fetchOptions(obj, 'DELETE'))
                    .then(el => el.json())
                    .then(console.log)
                    .catch(e => console.warn(e));
                removeElementWithTimeOut(e.target.parentNode.parentNode);
            };
        }
    );

Array.from(document.querySelectorAll('button[data-td-id]'))
    .forEach(el => el.onclick = e => createAddForm(e, +e.target.dataset.tdId));

Array.from(document.querySelectorAll('button[data-custom-delete-td]'))
    .forEach(el => el.onclick = e =>
        fetch('/disciplines/deletetd/' + e.target.dataset.customDeleteTd, {method: 'DELETE'})
            .then(() => location.reload())
            .catch(console.warn)
    )

document.querySelector('button[data-custom-delete-d]').addEventListener('click', e => {
    fetch('/disciplines/delete/' + e.target.dataset.customDeleteD, {method: 'DELETE'})
        .then(() => window.location = '/disciplines/')
        .catch(console.warn)
})

const createNewNode = (data, e) => {
    const parentDiv = document.createElement('div');
    const innerDiv = document.createElement('div');
    const buttonsDiv = document.createElement('div');


    const groupBadge = document.createElement('span');
    const reportBadge = document.createElement('span');
    const semesterBadge = document.createElement('span');

    const editButton = document.createElement('button');
    const deleteButton = document.createElement('button');

    parentDiv.classList.add('container', 'd-flex', 'justify-content-around', 'align-items-center', 'mt-3', 'flex-column', 'flex-md-row');
    innerDiv.classList.add('container', 'd-flex', 'flex-column', 'align-items-center', 'mb-3');
    buttonsDiv.classList.add('container', 'd-flex', 'flex-column', 'justify-content-around', 'align-items-stretch');
    groupBadge.classList.add('badge', 'bg-success', 'rounded-pill', 'mx-2', 'mt-2', 'font-monospace', 'fs-6');
    reportBadge.classList.add('badge', 'bg-warning', 'rounded-pill', 'mx-2', 'mt-2', 'font-monospace', 'fs-6')
    semesterBadge.classList.add('badge', 'bg-danger', 'rounded-pill', 'mx-2', 'mt-2', 'font-monospace', 'fs-6')
    editButton.classList.add('btn', 'btn-warning');
    deleteButton.classList.add('btn', 'btn-danger', 'mt-3');

    groupBadge.innerText = data.student_group_name;
    reportBadge.innerText = data.report_type_name;
    semesterBadge.innerText = `${data.semester}-й семестр`;

    innerDiv.append(groupBadge, reportBadge, semesterBadge);

    editButton.dataset.groupEdit = data.student_group_id;
    editButton.dataset.groupData = JSON.stringify(data);
    editButton.type = 'button';
    editButton.setAttribute('data-bs-toggle', 'modal');
    editButton.setAttribute('data-bs-target', '#editModal')
    editButton.innerText = 'Редактировать'
    editButton.onclick = (e) =>
        createEditForm(data, e)

    deleteButton.dataset.groupDelete = data.student_group_session_id;
    deleteButton.type = 'button';
    deleteButton.innerText = 'Удалить'
    deleteButton.onclick = (e) => {
        fetch('/api/edit/student_group_session', fetchOptions(data, 'DELETE'))
            .then(e => e.json())
            .catch(e => console.warn(e));
        removeElementWithTimeOut(e.target.parentNode.parentNode);
    };

    buttonsDiv.append(editButton, deleteButton);
    parentDiv.append(innerDiv, buttonsDiv);
    e.target.parentNode.insertBefore(parentDiv, e.target);
}
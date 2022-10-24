let course = 0;
let semester = 0;
let direction = 1;
let sort = '';
const tabIndexOffset = 200;
const transition = 500;
const {from, fromTo, to} = gsap;

const courses = Array.from(document.getElementById('courses').children);
const semesters = ['fall_semester', 'spring_semester'].map(el => document.getElementById(el));
const tableBody = document.getElementById('tableBody');
let container = document.createElement('div')
container.style.width = '100%';
container.classList.add('d-flex', 'flex-column', 'text-center', 'justify-content-between')
tableBody.append(container);

let disciplines = [];

const sorting = {
    discipline: 'discipline',
    mark: 'mark',
    date: 'date',
    teacher: 'teacher',
    report: 'report_type_id'
}

const disciplineSortButton = document.getElementById('discipline');
const markSortButton = document.getElementById('mark');
const dateSortButton = document.getElementById('date');
const teacherSortButton = document.getElementById('teacher');
const reportSortButton = document.getElementById('report');
const sortingButtons = [disciplineSortButton, markSortButton, dateSortButton, teacherSortButton, reportSortButton];

const createTag = (tagName, ...classes) => {
    const a = document.createElement(tagName);
    a.classList.add(...classes);
    return a;
}
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

const parseStringDate = ([day, month, year]) => day == null ? null : new Date(+year, +month - 1, +day + 1);
const parseDate = date => date === '' || date.startsWith("NaN") ? null : parseStringDate(date.split('-'));

const dateToString = date => dateDateToString(new Date(date));
const dateDateToString = date => date ? `${date.getDate().toString().padStart(2, '0')}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getFullYear()}` : null;

const createRow = (discipline, i) => {
    const tr = createTag('div', 'flex-row', 'd-flex', 'justify-content-between', 'mt-2');
    tr.style.order = i;
    tr.dataset.id = discipline.attestation_book_id;

    const number = createTag('span', 'col-1', 'd-none', 'd-md-block');
    number.innerText = (i + 1).toString();

    const d = createTag('span', 'col-5', 'col-md-3');
    d.innerText = discipline.discipline_name;

    const mark = createTag('div', 'col-2', 'col-md-1', 'd-flex', 'justify-content-center', 'align-items-center')
    const markInput = document.createElement('input');
    markInput.tabIndex = i + tabIndexOffset;
    markInput.type = 'number';
    markInput.max = '100';
    markInput.min = '0';
    markInput.value = discipline['mark'];
    markInput.classList.add('form-control');
    markInput.style.maxWidth = '2rem!important';
    markInput.onblur = (ev) => {
        ev.target.value = parseInt(ev.target.value);
        ev.target.value = ev.target.value > 100 ? 100 : ev.target.value;
        ev.target.value = ev.target.value < 0 ? 0 : ev.target.value;
        fetch('/api/edit/attestation_book/mark', fetchOptions({mark: ev.target.value, attestation_book_id: discipline.attestation_book_id}, 'PUT'))
            .then(resp => resp.json())
            .then(resp => console.log(discipline.discipline_name + ': ' + ev.target.value + '\n' + resp))
            .catch(console.warn);
    };
    markInput.onkeydown = ev => {
        if (ev.key === 'Enter'){
            ev.target.blur();
        }
    }
    mark.append(markInput);

    const date = createTag('div', 'col-2', 'd-none', 'd-md-flex', 'justify-content-center');
    const dateInput = createTag('input')
    dateInput.tabIndex = disciplines.length + i + tabIndexOffset;
    dateInput.type = 'date';
    dateInput.value = parseDate(discipline.mark_date)?.toISOString()?.substring(0, 10);
    dateInput.classList.add('form-control');
    dateInput.style.maxWidth = '2rem!important';
    dateInput.onblur = (ev) =>
        fetch('/api/edit/student_group_session/date', fetchOptions({attestation_book_id: discipline.attestation_book_id, mark_date: dateToString(ev.target.value)}, 'PUT'))
            .then(resp => resp.json())
            .then(resp => console.log(discipline.discipline_name + ': ' + ev.target.value + '\n' + resp))
            .catch(console.warn);
    date.append(dateInput);

    const teacher = createTag('span', 'col-5', 'col-md-3');
    teacher.innerText = `${discipline.teacher_lastname} ${discipline.teacher_firstname} ${discipline.teacher_middlename}`;

    // id - 4 => курсач
    const report = +discipline.report_type_id === 4
        ? createTag( 'a', 'col-1', 'd-none', 'd-md-block', 'btn', 'btn-secondary', 'text-center', 'p-0')
        : createTag( 'span', 'col-1', 'd-none', 'd-md-block');

    report.innerText = discipline.report_type_name;
    if (+discipline.report_type_id === 4){
        report.setAttribute('tabIndex', '-5');
        report.setAttribute('data-bs-toggle', 'popover');
        report.setAttribute('data-bs-title', 'Название курсовой работы')
        const input = createTag('input', 'form-control');
        const popover = new bootstrap.Popover(report, {html: true, content: input, trigger: 'click manual'});
        input.setAttribute('type', 'text');
        input.value = discipline.theme;
        input.name = 'theme';
        input.onblur = ev => {
            const object = {theme: ev.target.value, attestation_book_id: discipline.attestation_book_id};
            fetch('/api/edit/attestation_book/theme', fetchOptions(object, 'PUT'))
                .then(resp => resp.json())
                .catch(console.warn);
            popover.hide();
        }
    }

    tr.append(number, d, mark, date, teacher, report);

    return tr;
}

const updateRow = (row, data) => {
    const [_, d, mark, date, teacher, report] = row.children;
    const [markInput] = mark.children;
    const [dateInput] = date.children;
    d.innerText = data.discipline_name;
    if (+markInput.value !== +data['mark']) {
        to(markInput, {value: +data['mark'], duration: 1, snap: {value: 1}});
    }
    dateInput.value = parseDate(data?.mark_date)?.toISOString()?.substring(0, 10) || '';
    teacher.innerText = `${data.teacher_lastname} ${data.teacher_firstname} ${data.teacher_middlename}`;
    report.innerText = data.report_type_name;
    if (+data.report_type_id === 4){
        report.setAttribute('tabIndex', '-5');
        report.setAttribute('data-bs-toggle', 'popover');
        report.setAttribute('data-bs-title', 'Название курсовой работы')

        let popover = bootstrap.Popover.getInstance(report);
        let popoverInput;
        if (popover) {
            popoverInput = popover._config.content
        } else {
            popoverInput = createTag('input', 'form-control');
            popover = new bootstrap.Popover(report, {html: true, content: popoverInput, trigger: 'click manual'});
        }

        popoverInput.value = data.theme || popoverInput.value || "";
        popoverInput.setAttribute('type', 'text');
        popoverInput.name = 'theme';
        popoverInput.onblur = ev => {
            const object = {theme: ev.target.value, attestation_book_id: data.attestation_book_id};
            fetch('/api/edit/attestation_book/theme', fetchOptions(object, 'PUT'))
                .then(resp => resp.json())
                .catch(console.warn);
            popover.hide();
        }
    }

}

const fillTable = (student) => {
    let elements = disciplines.map(el => ({node: el, x: el.offsetLeft, y: el.offsetTop})); // сохраняю информацию о предыдущем положении

    // разобрался с библиотекой, это оказалась GSAP - greenSock Animation Platform.

    const order_dis = new Array(student.disciplines?.length || 0);
    if (!student.disciplines && disciplines.at(-1)?.tagName.toLowerCase() !== 'h5'){
        let noData = createTag('h5', 'h5')
        noData.innerText = 'Нет данных'
        disciplines.push(noData);
        container.append(noData);
        elements.push({node: noData, x: noData.offsetLeft, y: noData.offsetTop})
    } else
    student.disciplines?.forEach((discipline, i) => {
        const dis = disciplines.find(el => +el.dataset.id === discipline.attestation_book_id);

        if (!dis){
            disciplines.push(createRow(discipline, i));
            let d = disciplines.at(-1);
            container.append(d);
            elements.push({node: d, x: d.offsetLeft, y: d.offsetTop})
        } else {
            order_dis[i] = dis;
            updateRow(dis, discipline);
        }
    })

    for (let d = 0; d < order_dis.length && order_dis[d] != null; d++){
        order_dis[d].style.order = d;
        order_dis[d].children[2].children[0].tabIndex = tabIndexOffset + d;
        order_dis[d].children[3].children[0].tabIndex = tabIndexOffset + d + order_dis.length;
    }

    elements.forEach(el => { // анимирую изменение положения. Танцами с бубнами получаю новое
        fromTo(el.node, {duration: .5, x: el.x - el.node.offsetLeft, y: el.y - el.node.offsetTop}, {x: 0, y: 0})
    });
}

let student = fetch(`/api/getStudent/${location.pathname.split('/').at(-1)}?semester=${course * 2 + semester + 1}`)
    .then(resp => resp.json())
    .then(fillTable)
    .catch(fillTable);


const renderTable = (fetchParams = '') => {
    student = fetch(`/api/getStudent/${location.pathname.split('/').at(-1)}?semester=${course * 2 + semester + 1}&${fetchParams}`)
        .then(resp => resp.json())
        .then(fillTable)
        .catch(fillTable);
}

courses.map((el, i) => el.onclick = e => {
    if (!el.classList.contains('btn-primary')) {
        disciplines = [];
        const direction = course < i ? -1 : 1;
        container.classList.add('disappear', course < i ? 'disappear--left' : 'disappear--right');
        container = createTag('div', 'd-flex', 'flex-column', 'text-center', 'justify-content-between', 'w-100', 'disappear', (course > i ? 'disappear--left' : 'disappear--right'))

        fromTo(tableBody.children[0], {duration: transition, ease: 'power3.in', x: 0, y: 0, opacity: 1}, {opacity: 0, x: direction * 500});
        setTimeout(() => {
            tableBody.children[0].remove();
            tableBody.prepend(container);
            fromTo(container, {duration: transition, ease: 'power3.in', x: -direction * 500, opacity: 0}, {opacity: 1, x: 0});
            renderTable();
        }, transition);

        courses.filter(e => e !== el).forEach(c => c.classList.remove('btn-primary'))
        el.classList.add('btn-primary')
        course = i;
        sortingButtons.forEach(el => el.classList.remove('bg-primary', 'bg-warning'));
        sort = '';
    }
});

semesters.map((el, i) => el.onclick = e => {
    if (!el.classList.contains('btn-primary')) {
        disciplines = [];
        let direction = semester < i ? -1 : 1;
        container.classList.add('disappear', semester < i ? 'disappear--left' : 'disappear--right');
        container = createTag('div', 'd-flex', 'flex-column', 'text-center', 'justify-content-between', 'w-100', 'disappear', (semester > i ? 'disappear--left' : 'disappear--right'));

        fromTo(tableBody.children[0], {duration: transition, ease: 'power3.in', x: 0, y: 0, opacity: 1}, {opacity: 0, x: direction * 500});
        setTimeout(() => {
            tableBody.children[0].remove();
            tableBody.prepend(container);
            fromTo(container, {duration: transition, ease: 'power3.in', x: -direction * 500, opacity: 0}, {opacity: 1, x: 0});
            renderTable();
        }, transition);

        semesters.filter(e => e !== el).forEach(sem => sem.classList.remove('btn-primary'))
        el.classList.add('btn-primary')
        semester = i;
        sortingButtons.forEach(el => el.classList.remove('bg-primary', 'bg-warning'));
        sort = '';

    }
});

sortingButtons.forEach(button => button.onclick = ev => {
    const id = button.id;
    if (sort === id) {
        direction *= -1;
        button.classList.toggle('bg-primary');
        button.classList.toggle('bg-warning');
    }
    else {
        sortingButtons.forEach(el => el.classList.remove('bg-primary', 'bg-warning'));
        button.classList.add('bg-primary');
        direction = 1;
        sort = id;
    }
    const fetchparams = `sort=${sorting[sort]}&direction=${direction}`;
    renderTable(fetchparams);
})
const container = document.getElementById("container");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

const query = `${window.origin}/api/teachers/search?search=`

const fillContainer = (arr) =>
    arr.flatMap(({lastname, firstname, middlename, teacher_id, disciplines}) => {
        const name = [lastname, firstname, middlename].filter(e => e !== '').join(' ');
        const c = document.createElement('div')
        c.classList.add('container', 'd-flex', 'flex-column', 'justify-content-center', 'align-items-start');
        const a = document.createElement('a');
        a.classList.add('h5', 'mt-2', 'link-dark');
        a.href = './' + teacher_id;
        a.innerText = name;
        c.append(a);
        return [c, ...disciplines.flatMap(
            discipline => discipline.groups.map(
                group => {
                    const innerA = document.createElement('a');
                    innerA.classList.add('badge', 'bg-success', 'rounded-pill', 'mx-2', 'mt-2', 'link-light');
                    innerA.innerText = group.student_group_name;
                    const attr_val = [
                        ['style', "text-decoration: none!important"],
                        ['role', 'button'],
                        ['data-bs-placement', "top"],
                        ["data-bs-toggle", "popover"],
                        ['data-bs-trigger', "hover focus"],
                        ['data-bs-content', discipline.discipline_name],
                        ['href', '/groups/' + group.student_group_id]
                    ];
                    attr_val.forEach(([attr, val]) => innerA.setAttribute(attr, val));
                    return innerA;
                })
        )];
    });


searchButton.addEventListener('click', (e) => {
    e.preventDefault();
    fetch(query + searchInput.value)
        .then(e => e.json())
        .then(fillContainer)
        .then(e => container.replaceChildren(...e))
        .catch(console.log);
})
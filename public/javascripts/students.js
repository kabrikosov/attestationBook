const tbody = document.getElementById("tbody");
const searchInput = document.getElementById("searchInput");
const searchButton = document.getElementById("searchButton");

const query = `${window.origin}/api/students/search?search=`

const fillTable = (arr) =>
    arr.map(({lastname, firstname, middlename, group_name, student_id}, i) => {
        const name = [lastname, firstname, middlename].filter(e => e !== '').join(' ');
        const tr = document.createElement("tr");
        tr.innerHTML = `<th scope="row">${i + 1}</th><td>${name}</td><td>${group_name}</td>`
        tr.onclick = () => {
            window.location = `${window.origin}/students/${student_id}`;
        }
        return tr;
    });


searchButton.addEventListener('click', (e) => {
    e.preventDefault();
    fetch(query + searchInput.value)
        .then(e => e.json())
        .then(fillTable)
        .then(e => tbody.replaceChildren(...e))
        .catch(console.log);
})

searchButton.click();
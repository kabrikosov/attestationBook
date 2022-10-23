const deleteButton = document.getElementById("delete")
deleteButton.onclick = () => {
    fetch(window.origin + '/students/delete/' + deleteButton.getAttribute('data-id'), {method: 'DELETE'})
        .then(() => window.location = '/students/')
        .catch(console.warn);
}
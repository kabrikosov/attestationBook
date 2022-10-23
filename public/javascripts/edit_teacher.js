const deleteButton = document.getElementById("delete")
deleteButton.onclick = () => {
    fetch(window.origin + '/teachers/delete/' + deleteButton.getAttribute('data-id'), {method: 'DELETE'})
        .then(() => window.location = '/teachers/')
        .catch(console.warn);
}
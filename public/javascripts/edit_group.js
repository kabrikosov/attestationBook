const deleteButton = document.getElementById("delete")
deleteButton.onclick = () => {
    fetch(window.origin + '/groups/delete/' + deleteButton.getAttribute('data-id'), {method: 'DELETE'})
        .then(() => window.location = '/groups/')
        .catch(console.warn);
}
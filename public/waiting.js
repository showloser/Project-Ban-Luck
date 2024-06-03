const sessionId = localStorage.getItem('sessionId')
const clientPlayerId = localStorage.getItem('playerId')
const username = localStorage.getItem('username')
const sessionCode = localStorage.getItem('sessionCode')
const socket = io(); // Connect to the server

document.getElementById('roomIdDisplay').textContent = sessionCode

function renderUI(sessionData){
    const playerContainer = document.getElementById('playerList')
    playerContainer.textContent = '' // clear previous player elements

    // Extract data from the player_data object
    const playerKeys = Object.keys(sessionData)
    // const playerLength = playerKeys.length;

    for (let i = 0 ; i < playerKeys.length; i++){
        const playerId = playerKeys[i];
        const playerInfo = sessionData[playerId];

        const playerContainerDiv = document.createElement('li');
        playerContainerDiv.className = 'player-container'
        playerContainerDiv.id = playerId

        playerContainerDiv.innerHTML = `
            <img src="images/profile_icons/${i+1}.png" alt="${playerInfo.username} Profile" class='profile-pic'>
            <span class="username">${playerInfo.username}</span>
        `
        playerContainer.append(playerContainerDiv)
    }


}

// send data to ready = true/false

function markReady() {
    const playerContainer = document.getElementById(clientPlayerId)
    playerContainer.classList.toggle('ready');
    socket.emit('test')


}


socket.on('test', (data) => {
    console.log(data)
})





socket.on('connect', () => {
    // send api request for current waiting room status.
    socket.emit('waitingRoom', sessionId)
    socket.on('waitingRoom' , (sessionData) => {
        // console.log(sessionData)
        renderUI(sessionData)
    })  



});


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

        if (playerInfo.readyStatus == 'True'){
            playerContainerDiv.classList.add('ready')
        }

        playerContainerDiv.innerHTML = `
            <img src="images/profile_icons/${i+1}.png" alt="${playerInfo.username} Profile" class='profile-pic'>
            <span class="username">${playerInfo.username}</span>
        `
        playerContainer.append(playerContainerDiv)
    }


}

// send data to ready = true/false
function markReady() {
    socket.emit('readyStatus', sessionId, clientPlayerId)

    const button = document.getElementById('readyButton')
    // check if current playyer is ready (and change button text accordingly)
    if (document.getElementById(clientPlayerId).classList.contains('ready')){
        button.textContent = 'Ready'
    }
    else{
        button.textContent = 'Not Ready'
    }    
}

function renderReadyUI(readyUserIds){
    document.getElementById('startGameButton').style.display = 'none'
    // remove ready class from all <player-container> div
    for (const li of document.getElementById('playerList').getElementsByTagName('li')){
        li.classList.remove('ready')
    }

    Object.keys(readyUserIds).forEach(key => {
        if (readyUserIds[key] == 'True'){
            const element = document.getElementById(key)
            if (!element.classList.contains('ready')){
                element.classList.add('ready')
            } 
            else{
                window.alert('Opps! Something went wrong..')
            }
        }
    })
}


function startGame(){
    socket.emit('redirect_to_game', sessionId, clientPlayerId)
}


socket.on('connect', () => {
    // send api request for current waiting room status.
    socket.emit('waitingRoom', sessionId)
    socket.on('waitingRoom' , (sessionData) => {
        renderUI(sessionData)
    })  

    socket.on('renderReadyStatus', (readyUserIds) => {
        renderReadyUI(readyUserIds)
    })

    socket.on('allPlayersReady', (condition, partyLeader) => {
    // [IMPT] this can be implemented more efficinelty 
        if (partyLeader == clientPlayerId){
            document.getElementById('startGameButton').style.display = 'block'
        }
        else{
            document.getElementById('startGameButton').style.display = 'none'
        }
    })

    socket.on('redirect_all_clients_to_game', () => {
        window.location.href = `poker.html?code=${sessionCode}`;
    })



    // Errors [IMPT] -> (DONESNT FUCKING WORK)
    socket.on('error', (errorMsg) => {
        window.alert(errorMsg)
    })

});


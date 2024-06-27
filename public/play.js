document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    let timeout;

    // Function to set the chat window's opacity to 0.1
    const dimChatWindow = () => {
        chatWindow.style.opacity = '0.3';
    };

    // Set a timeout to dim the chat window after a period of inactivity
    const resetTimeout = () => {
        clearTimeout(timeout);
        timeout = setTimeout(dimChatWindow, 5000);
    };

    // Ensure the chat window is fully visible when the user hovers over it
    chatWindow.addEventListener('mouseenter', () => {
        chatWindow.style.opacity = '0.8';
        resetTimeout(); // Reset the timeout to dim the chat window again after interaction
    });



    // Initialize the timeout
    resetTimeout();
});


// socket.io connections.
const sessionId = localStorage.getItem('sessionId')
const clientPlayerId = localStorage.getItem('playerId')
const username = localStorage.getItem('username')
const socket = io(); // Connect to the server

function loadGameUI(gameData){
    const playersContainer = document.getElementById('playersContainer')
    playersContainer.innerHTML = '' // clear all existing elements (refresh)

    // Extract player keys from the player_data object
    const playerKeys = Object.keys(gameData);
    const activePlayers = playerKeys.length;

    for (let i = 0; i < activePlayers; i++) {
        const playerId = playerKeys[i];
        const playerInfo = gameData[playerId];

        const playerDiv = document.createElement('div');
        playerDiv.className = 'player';
        playerDiv.id = playerId;
        playerDiv.innerHTML = `
            <div class="betAmount"></div>
            <div class="cards"></div>
            <div class="profile">
                <img class="playerIcon" src="images/profile_icons/1.png" alt="">
                <div class="playerUsername">${playerInfo.username   }</div>
            </div>
        `;
    }

    playersContainer.appendChild(playerDiv);
}


loadGameUI({banker: 'False', currentHand: 'king_of_spades,4_of_clubs,queen_of_spades,king_of_spades', endTurn: 'undefined', readyStatus: 'True', username: 'V'})
function addCard(playerId, cards) {
    const player = document.getElementById(playerId);
    if (!player) {
        console.error(`Player with ID ${playerId} not found.`);
        return;
    }

    const playerCards = player.querySelector('.playerCards');
    if (!playerCards) {
        console.error(`Cards container not found for player ${playerId}.`);
        return;
    }

    // clear previous cards
    playerCards.innerHTML = ''

    cards = cards.split(',')
    const cardElements = [];

    cards.forEach( (card) => {
        const cardImg = document.createElement('img');
        cardImg.src = `images/cards/${card}.svg`; 
        cardImg.alt = `${card}`;
        playerCards.appendChild(cardImg);
        cardElements.push(cardImg); //pushes the img html
    })

    // Wait for all images to load before updating the card fan [to fix the cb animation error]
    Promise.all(cardElements.map(cardImg => {
        return new Promise((resolve) => {
            cardImg.onload = resolve;
        });
    })).then(() => {
        requestAnimationFrame(() => {
            updateCardFan(playerId);
        });
    });


}

function updateCardFan(playerId) {
    const player = document.getElementById(playerId);
    if (!player) {
        console.error(`Player with ID ${playerId} not found.`);
        return;
    }

    const playerCards = player.querySelector('.playerCards');
    if (!playerCards) {
        console.error(`Cards container not found for player ${playerId}.`);
        return;
    }

    const cards = playerCards.querySelectorAll('img');
    const count = cards.length;
    const spread = 40; // Total spread angle for the fan (adjust as needed)
    const spacing = 30; // Spacing between cards (adjust as needed)

    const baseRotationAngle = spread / 2;

    cards.forEach((card, index) => {
        const increment = spread / (count - 1); // Correctly distribute the cards
        const rotationAngle = -baseRotationAngle + increment * index;
        
        if (index === count - 1) {
            // Center the last card
            card.style.left = `calc(50%)`;
        } else {
            const leftOffset = (index - (count - 1) / 2) * spacing; // Center the cards correctly
            card.style.left = `calc(50% - ${card.clientWidth / 2}px + ${leftOffset}px)`;
        }
        
        card.style.transform = `rotate(${rotationAngle}deg)`;
    });
}

// JavaScript to dynamically generate and position player elements
function loadPlayerUI(player_data) {
    const playersContainer = document.getElementById('playersContainer');
    playersContainer.innerHTML = '';  // Clear any existing player elements

    // Extract player keys from the player_data object
    const playerKeys = Object.keys(player_data);
    const activePlayers = playerKeys.length;

    for (let i = 0; i < activePlayers; i++) {
        const playerId = playerKeys[i];
        const playerInfo = player_data[playerId];

        const playerDiv = document.createElement('div');
        playerDiv.className = 'player';
        playerDiv.id = playerId;
        playerDiv.innerHTML = `
            <h2>${playerInfo.username}</h2>
            <div class="playerCards"></div>
            <div class="playerValue">${playerInfo.value}</div>
        `;

        // Position the playerDiv in a circle around the center of the container
        let x, y;
        if (activePlayers === 1) {
            // Center the single player
            x = 50;
            y = 80;
        } else {
            const angle = 135 - (i * (90 / (activePlayers - 1))); 
            const radius = 35; 
            x = 50 + radius * Math.cos(angle * Math.PI / 180);
            y = 50 + radius * Math.sin(angle * Math.PI / 180);
        }

        playerDiv.style.left = `${x}%`;
        playerDiv.style.top = `${y}%`;
        playerDiv.style.transform = 'translate(-50%, -50%)';

        playersContainer.appendChild(playerDiv);

        //  TO UNCOMMENT !! ( ONLY CURRENT USER SHOULD BE ABLE TO SEE HIS CARD / ALL OTHER PLAYERS ARE FACED DOWN.)
        // if (playerId == clientPlayerId){ 
        //     addCard(playerId, playerInfo.currentHand)
        // }

        addCard(playerId, playerInfo.currentHand)

    }
}

function playerReady() {
    const buttonElement = document.getElementById('playerReady')
    if (buttonElement.classList.contains('READY')){
        // change state to not ready
        buttonElement.innerHTML = 'CANCEL'
        socket.emit('gameState', sessionId, clientPlayerId, 'notReady')
    }
    else{
        // change state to ready
        buttonElement.innerHTML = 'READY'
        socket.emit('gameState', sessionId, clientPlayerId, 'Ready')
    }
}

function playerHit() {
    socket.emit('playerHit', sessionId, clientPlayerId) //send request to 'hit'

    socket.on('error_card_length_5', () => {
        document.getElementById('message').innerHTML = "Max Cards allowed is 5"
    })
}

function restart(){
    socket.emit('restartGame', sessionId, clientPlayerId)
    location.reload()
}

function chat(){
    const chatInput = document.getElementById('chat-input');
    chatInput.addEventListener('keyup', (event) => {
      // Check if Enter key was pressed and prevent default form submission
      if (event.key === 'Enter' && !event.ctrlKey) {
        event.preventDefault(); // Prevent default form submission behavior
    
        // Additional checks and logic (optional)
        if (chatInput.value.trim() !== '') { // Check if message isn't empty
          sendMessage(); // Send the message
        } else {
          // Handle empty message case (e.g., display an error message)
          window.alert('Empty message cannot be sent!');
        }
      }
    });
}

// CHAT FUNCTIONALITY
function sendMessage(){
    const chatInput = document.getElementById('chat-input');
    socket.emit('chat', sessionId, clientPlayerId, username, chatInput.value)
    chatInput.value = '' // reset input field to nothing
}

function appendChatMessage(username, chatData) {
    // Create a new message element (e.g., a paragraph)
    const messageElement = document.createElement('p');
    messageElement.classList.add('chat-message-child');
  
    // Build the message content (username, timestamp, etc.)
    const messageContent = `<b>${username}:</b> ${chatData}`;
    messageElement.innerHTML = messageContent;
  
    // Get the chat messages container element
    const chatMessages = document.getElementById('chat-messages');
    chatMessages.appendChild(messageElement);
}


// socket.io connections.
const sessionId = localStorage.getItem('sessionId')
const clientPlayerId = localStorage.getItem('playerId')
const username = localStorage.getItem('username')
const socket = io(); // Connect to the server
chat()

socket.on('connect', () => {
    socket.emit('sessionId', sessionId, clientPlayerId); // Send sessionId to the server

    socket.on('loadExistingSession', (player_data) => {
        loadPlayerUI(player_data)
    })
});

socket.on('chat_broadcast', (username, chatData) => {
    appendChatMessage(username, chatData);
})
socket.on('chat_error', (error) => {
    window.alert(error)
})




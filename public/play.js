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

function loadGameElements(gameData){
    const playersContainer = document.getElementById('playersContainer')
    playersContainer.innerHTML = '' // clear all existing elements (refresh)

    // Extract player keys from the player_data object
    const playerKeys = Object.keys(gameData);
    const activePlayers = playerKeys.length;

    for (let i = 0; i < activePlayers; i++) {
        const playerId = playerKeys[i];
        const playerInfo = gameData[playerId];

        // load card images
        if (playerId == clientPlayerId){
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player';
            playerDiv.id = playerId;
            playerDiv.innerHTML = `
                <div class="betAmount"></div>
                <div class="arrow-container">
                    <div class="arrow-label">${playerInfo.value}</div>
                    <div class="arrow"></div>
                </div>
                <div style="margin-bottom: 150px;"></div>
                <div class="cards"></div>
                <div class="profile">
                    <img class="playerIcon" src="images/profile_icons/1.png" alt="">
                    <div class="playerUsername">${playerInfo.username}</div>
                </div>
            `;
            playersContainer.appendChild(playerDiv);
            addCards(playerId, playerInfo.currentHand, true)
        }
        else{
            const playerDiv = document.createElement('div');
            playerDiv.className = 'player';
            playerDiv.id = playerId;
            playerDiv.innerHTML = `
                <div class="betAmount"></div>
                <div class="cards"></div>
                <div class="profile">
                    <img class="playerIcon" src="images/profile_icons/1.png" alt="">
                    <div class="playerUsername">${playerInfo.username}</div>
                </div>
            `;
            playersContainer.appendChild(playerDiv);
            addCards(playerId, playerInfo.currentHand, false)
        }
    }

}


function addCards(playerId, cardData, facedUpOrDown){ // [IMPT change server to send only each player's card, rest should be faced down]
    const player = document.getElementById(playerId) 
    if (!player) {
        window.alert(`Player with ID ${playerId} not found.`); // client playerId error
        return;
    }

    const cardContainer = player.querySelector('.cards');
    if (!cardContainer) {
        console.error(`Cards container not found for player ${playerId}.`);
        return;
    }

    // clear previous cards
    cardContainer.innerHTML = ''
    cardData = cardData.split(',')

    const promises = []; // lets all img load before running 

    if (facedUpOrDown){
        cardData.forEach( (card) => {
            const cardImg = document.createElement('img');
            cardImg.src = `images/pixelCards/${card}.png`; 
            cardImg.alt = `${card}`;
            cardImg.classList.add('currentPlayerImgElement')
            cardContainer.appendChild(cardImg);
            
            const promise = new Promise((resolve) => {
                cardImg.onload = resolve;
            });
            promises.push(promise);
        })

        // Wait for all images to load before running cardFan
        Promise.all(promises).then(() => {
                cardFan(playerId);
        });
    }

    else{
        cardData.forEach( () => {
            const cardImg = document.createElement('img');
            cardImg.src = `images/pixelCards/Back1.png`; 
            cardImg.alt = `cardBackImage`;
            cardImg.classList.add('stacked')
            cardContainer.appendChild(cardImg);
        })
        const emptyDiv = document.createElement('div')
        emptyDiv.classList.add('emptyDiv')
        cardContainer.append(emptyDiv);
    }
}


function cardFan (playerId){
    const player = document.getElementById(playerId);
    const playerCards = player.querySelector('.cards');


    const cards = playerCards.querySelectorAll('img');
    const count = cards.length;
    const spread = 40; // Total spread angle for the fan 
    const spacing = 30; // Spacing between cards
    
    const baseRotationAngle = spread / 2;

    if (count == 2){
        cards.forEach((card, index) => {
            const spread = 30; 
            
            // calculate the rotation angle for each card
            const rotationAngle = (index === 0 ? -1 : 1) * spread / 2;
            
            // horizontal offset (leftOffset) for each card to move closer together
            const leftOffset = index === 0 ? -card.clientWidth / 4 : card.clientWidth / 4;
        
            card.style.left = `calc(50% - ${card.clientWidth / 2}px + ${leftOffset}px)`;
            card.style.transform = `rotate(${rotationAngle}deg)`;
        });
    }
    else{
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


}

function playerHit() {
    socket.emit('playerHit', sessionId, clientPlayerId) //send request to 'hit'

    socket.on('error_card_length_5', () => {
        window.alert("Max Cards allowed is 5")
    })
}

function restart(){
    socket.emit('restartGame', sessionId, clientPlayerId)
    location.reload()
}

// socket.io connections.
const sessionId = localStorage.getItem('sessionId')
const clientPlayerId = localStorage.getItem('playerId')
const username = localStorage.getItem('username')
const socket = io(); // Connect to the server

socket.on('connect', () => {
    socket.emit('sessionId', sessionId, clientPlayerId) // send sessionInfo to server

    socket.on('loadExistingSession', (player_data) => {
        loadGameElements(player_data)
    })
})

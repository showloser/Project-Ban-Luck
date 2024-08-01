document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    let timeout;

    const dimChatWindow = () => {
        chatWindow.style.opacity = '0.3';
    };

    const resetTimeout = () => {
        clearTimeout(timeout);
        timeout = setTimeout(dimChatWindow, 5000);
    };

    chatWindow.addEventListener('mouseenter', () => {
        chatWindow.style.opacity = '0.8';
        resetTimeout();
    });

    resetTimeout();
});

function loadGameElements(gameData) {
    const playersContainer = document.getElementById('playersContainer');
    playersContainer.innerHTML = ''; // clear all existing elements (refresh)

    const playerKeys = Object.keys(gameData);
    const activePlayers = playerKeys.length;

    for (let i = 0; i < activePlayers; i++) {
        const playerId = playerKeys[i];
        const playerInfo = gameData[playerId];

        // load card images
        if (playerId === clientPlayerId) {
            // current player
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
            addCards(playerId, playerInfo.currentHand, true);
            

            localStorage.setItem('balance', playerInfo.bets.playerBalance);
        } else {
            // other players
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
            addCards(playerId, playerInfo.currentHand, false);
        }
    }
}

function addCards(playerId, cardData, facedUpOrDown) {
    const player = document.getElementById(playerId);
    if (!player) {
        window.alert(`Player with ID ${playerId} not found.`);
        return;
    }

    const cardContainer = player.querySelector('.cards');
    if (!cardContainer) {
        console.error(`Cards container not found for player ${playerId}.`);
        return;
    }

    // clear previous cards
    cardContainer.innerHTML = '';
    cardData = cardData.split(',');

    const promises = []; // lets all img load before running 

    if (facedUpOrDown) {
        cardData.forEach((card) => {
            dealCard(playerId, card, true, cardContainer, promises);
        });

        // Wait for all images to load before running cardFan
        Promise.all(promises).then(() => {
            cardFan(playerId);
        });
    } else {
        cardData.forEach(() => {
            const cardImg = document.createElement('img');
            cardImg.src = `images/pixelCards/Back1.png`;
            cardImg.alt = `cardBackImage`;
            cardImg.classList.add('stacked');
            cardContainer.appendChild(cardImg);
        });
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('emptyDiv');
        cardContainer.append(emptyDiv);
    }
}

function dealCard(playerId, card, facedUpOrDown, cardContainer, promises) {
    const cardPile = document.getElementById('cardPile');
    if (!cardPile) {
        console.error('Card pile element not found.');
        return;
    }

    const player = document.getElementById(playerId);
    if (!player) {
        console.error(`Player with ID ${playerId} not found.`);
        return;
    }

    const cardPileRect = cardPile.getBoundingClientRect();
    const playerRect = player.getBoundingClientRect();


    const temptCardContainer = document.createElement('div');
    temptCardContainer.classList.add('currentPlayerImgElement');
    temptCardContainer.style.position = 'absolute';
    temptCardContainer.style.left = `${cardPileRect.left}px !important`;
    temptCardContainer.style.top = `${cardPileRect.top}px !important`;

    temptCardContainer.style.zIndex = '9999'; // Ensure it's on top of other content

    // Add placeholder image for the back
    const backImage = document.createElement('img');
    backImage.src = 'images/pixelCards/Back1.png'; // Placeholder back image
    backImage.classList.add('back');
    
    temptCardContainer.appendChild(backImage);

    // Add front image temporarily
    const frontImage = document.createElement('img');
    frontImage.src = facedUpOrDown ? `images/pixelCards/${card}.png` : 'images/pixelCards/Back1.png';
    frontImage.classList.add('front');
    temptCardContainer.appendChild(frontImage);

    cardPile.appendChild(temptCardContainer); // Stack the card on top of the card pile


    

    // Calculate destination position
    const destLeft = playerRect.left + (playerRect.width / 2) - (temptCardContainer.clientWidth / 2);
    const destTop = playerRect.top + (playerRect.height / 2) - (temptCardContainer.clientHeight / 2);

    // Apply movement animation
    temptCardContainer.style.setProperty('--move-x', `${destLeft - cardPileRect.left}px`);
    temptCardContainer.style.setProperty('--move-y', `${destTop - cardPileRect.top}px`);
    temptCardContainer.style.animation = 'moveCard 1.5s forwards';

    // Trigger flip animation after a delay
    setTimeout(() => {
        temptCardContainer.classList.add('flip');
    }, 1500); // Delay to sync with the moveCard animation

    // Move the card to the player's card container after animations
    setTimeout(() => {
        cardContainer.appendChild(temptCardContainer);
        temptCardContainer.style.animation = '';
    }, 1500); // Adjust timing to match animation duration


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


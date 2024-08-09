let playerStates = {}; // Track player states globally


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

    const playerKeys = Object.keys(gameData);
    const activePlayers = playerKeys.length;

    for (let i = 0; i < activePlayers; i++) {
        const playerId = playerKeys[i];
        const playerInfo = gameData[playerId];

        let playerDiv = document.getElementById(playerId);
        if (!playerDiv){
            playerDiv = document.createElement('div');
            playerDiv.className = 'player';
            playerDiv.id = playerId;

            if (playerId === clientPlayerId) {
                // Current player's UI structure
                playerDiv.innerHTML = `
                    <div class="betAmount"></div>
                    <div class="arrow-container">
                        <div class="arrow-label" id = '${playerId}_arrow'>${playerInfo.value}</div>
                        <div class="arrow"></div>
                    </div>
                    <div style="margin-bottom: 150px;"></div>
                    <div class="cards"></div>
                    <div class="profile">
                        <img class="playerIcon" src="images/profile_icons/1.png" alt="">
                        <div class="playerUsername">${playerInfo.username}</div>
                    </div>
                `;
                // Save balance locally for the current player
                localStorage.setItem('balance', playerInfo.bets.playerBalance)
            }
            else{
                playerDiv.innerHTML = `
                <div class="betAmount"></div>
                <div class="cards"></div>
                <div class="profile">
                    <img class="playerIcon" src="images/profile_icons/1.png" alt="">
                    <div class="playerUsername">${playerInfo.username}</div>
                </div>
            `;
            }
            playersContainer.appendChild(playerDiv);
        }

        // Only update the player's hand if it has changed
        if (!playerStates[playerId] || playerStates[playerId].currentHand !== playerInfo.currentHand) {
            addCards(playerId, playerInfo.currentHand, playerId === clientPlayerId);

            // update global obj
            playerStates[playerId] = { currentHand: playerInfo.currentHand };
        }
    }

    // change value of arrow denoting user's card Val
    playerKeys.forEach(playerId => {
        if (playerId == clientPlayerId){
            const arrowValue = document.getElementById(`${playerId}_arrow`)
            arrowValue.textContent = gameData[playerId].value

            if (gameData[playerId].value >= 22){
                arrowValue.textContent = 'Bust'
            }

        }
    })

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

    // Ensure playerStates[playerId] and playerStates[playerId].currentHand are initialized
    if (!playerStates[playerId]) {
        playerStates[playerId] = { currentHand: [] };
    }

    // query global obj to add only new cards (for animation)
    const newCards = cardData.split(',');
    const cardsToAdd = newCards.filter(card => !playerStates[playerId].currentHand.includes(card));

    const promises = []; // Array to hold promises

    if (facedUpOrDown) {
        cardsToAdd.forEach((card, index) => {
            const promise = new Promise((resolve) => {
                setTimeout(() => {
                    dealCard(playerId, card, true, cardContainer).then(resolve);
                }, index * 500); // Delay each card by 500ms
            });
            promises.push(promise);
        });

        // Wait for all promises to resolve before running cardFan
        Promise.all(promises).then(() => {
            cardFan(playerId);
        });
    } else {
        cardsToAdd.forEach((card, index) => {
            // {facedUpOrDown} Set to false, (Back Image will appear instead)
            setTimeout(() => {
                dealCard(playerId, card, false, cardContainer);
            }, index * 500); // Delay each card by 500ms
        });
        const emptyDiv = document.createElement('div');
        emptyDiv.classList.add('emptyDiv');
        cardContainer.append(emptyDiv);
    }
}

function dealCard(playerId, card, facedUpOrDown, cardContainer) {
    return new Promise( (resolve) => {
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
            resolve()
        }, 1500); // Adjust timing to match animation duration
    })
}

function cardFan(playerId) {
    const player = document.getElementById(playerId);
    const playerCards = player.querySelector('.cards');
    const cards = playerCards.querySelectorAll('.currentPlayerImgElement');
    const count = cards.length;
    const spread = 40; // Total spread angle for the fan
    const spacing = 30; // Spacing between cards
    const baseRotationAngle = spread / 2;

    // Set initial position for cards (so the fucking transition for 'left' will work)
    cards.forEach((card) => {
        card.style.position = 'absolute'; 
        card.style.left = '0'; 
    });

    cards.forEach((card, index) => {
        if (count === 2) {
            const spread = 30;
            const rotationAngle = (index === 0 ? -1 : 1) * spread / 2;
            const leftOffset = index === 0 ? -card.clientWidth / 4 : card.clientWidth / 4;

            card.style.left = `calc(50% - ${card.clientWidth / 2}px + ${leftOffset}px)`;
            card.style.transform = `rotate(${rotationAngle}deg) rotateY(180deg)`;
        } else {
            const increment = spread / (count - 1);
            const rotationAngle = -baseRotationAngle + increment * index;

            if (index === count - 1) {
                card.style.left = `calc(50%)`;
            } else {
                const leftOffset = (index - (count - 1) / 2) * spacing;
                card.style.left = `calc(50% - ${card.clientWidth / 2}px + ${leftOffset}px)`;
            }

            card.style.transform = `rotate(${rotationAngle}deg) rotateY(180deg)`;
        }
    });
}

function playerHit() {
    socket.emit('playerHit', sessionId, clientPlayerId) //send request to 'hit'

    socket.on('error_card_length_5', () => {
        window.alert("Max Cards allowed is 5")
    })
}

function playerStand(){
    socket.emit('playerStand', sessionId, clientPlayerId)
}



function restart(){
    socket.emit('restartGame', sessionId, clientPlayerId)
    location.reload()
}






function deactivateButtons(){
    const hitButton = document.getElementById('hitButton')
    const standButton = document.getElementById('standButton')

    hitButton.style.opacity = 0.5
    hitButton.style.pointerEvents = 'none'
    standButton.style.opacity = 0.5
    standButton.style.pointerEvents = 'none'
}

function activateButtons(){
    const hitButton = document.getElementById('hitButton')
    const standButton = document.getElementById('standButton')

    hitButton.style.opacity = 1
    hitButton.style.pointerEvents = 'auto'
    standButton.style.opacity = 1
    standButton.style.pointerEvents = 'auto'
}


// socket.io connections.
const sessionId = localStorage.getItem('sessionId')
const clientPlayerId = localStorage.getItem('playerId')
const username = localStorage.getItem('username')
const socket = io(); // Connect to the server

socket.on('connect', () => {
    socket.emit('sessionId', sessionId, clientPlayerId) // send sessionInfo to server
    socket.on('error', (errorMsg) => {
        console.log(errorMsg)
        window.alert(errorMsg)
    })


    socket.on('loadExistingSession', (player_data) => {
        loadGameElements(player_data)
    })

    socket.on('assignPlayerTurn', (currentOrder, fullOrder) => {
        console.log(`currentOrder: ${currentOrder}`)
        console.log(`fullOrder: ${fullOrder}`)
        console.log('clientId: ' + clientPlayerId)
        
        if (clientPlayerId != currentOrder){
            deactivateButtons()
        }
        else{
            activateButtons()
        }

    })
})


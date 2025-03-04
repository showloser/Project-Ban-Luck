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


function loadUI(bankerOrPlayer){
    const table = document.getElementById('table')
    table.innerHTML = ''
    const middleArea = document.createElement('div')
    middleArea.className = 'middleArea'
    middleArea.innerHTML = `
        <div class="cardPile third-column">
            <div class="cards">
                <div id="cardPile"></div>
                <img src="images/pixelCards/Back1.png" id="cardPileImg">
                <div class='CardPilePlaceHolderContainer'>
                    <div class='CardPilePlaceHolder'></div>
                    <div class='CardPilePlaceHolder'></div>
                    <div class='CardPilePlaceHolder'></div>
                    <div class='CardPilePlaceHolder'></div>
                    <div class='CardPilePlaceHolder'></div>
                    <div class='CardPilePlaceHolder'></div>
                    <div class='CardPilePlaceHolder'></div>
                    <div class='CardPilePlaceHolder'></div>
                    <div class='CardPilePlaceHolder'></div>
                </div>

            </div>
    `
    const playerContainer = document.createElement('div')
    playerContainer.className = 'players'
    playerContainer.id = 'playersContainer'

    if (bankerOrPlayer == 'player'){
        const bankerContainer = document.createElement('div')
        bankerContainer.className = 'bankers'
        bankerContainer.id = 'bankerContainer'

        table.append(bankerContainer)
        table.append(middleArea)
        table.append(playerContainer)
    }
    else{
        const bankerContainer = document.createElement('div')
        bankerContainer.className = 'bankers'
        bankerContainer.id = 'bankerContainer'

        table.append(playerContainer)
        table.append(middleArea)
        table.append(bankerContainer)
    }



}






function loadGameElements_NEW(gameData, role) {
    if (role == 'player'){
        const playersContainer = document.getElementById('playersContainer');
        const bankerContainer = document.getElementById('bankerContainer')
        const playerKeys = Object.keys(gameData);
        const activePlayers = playerKeys.length;
    
        for (let i = 0; i < activePlayers; i++) {
            const playerId = playerKeys[i];
            const playerInfo = gameData[playerId];
    
    
            // [IMPT] to fix? (instead of skipping data if 'banker' == 'true' maybe can remove it from list) [NEED TO DO THIS FROM SERVER SIDE TO PREVENT CHEATING]
            if (playerInfo['banker'] == 'True'){
                let bankerDiv = document.getElementById(playerId)
                if (!bankerDiv){
                    bankerDiv = document.createElement('div')
                    bankerDiv.className = 'banker'
                    bankerDiv.id = playerId
                    bankerDiv.innerHTML = `
                    <div class="cards"></div>
                    <div class="profile">
                        <img class="playerIcon" src="images/profile_icons/1.png" alt="">
                        <div class="playerUsername">${playerInfo.username}</div>
                    </div>
                    <div class="betAmount"></div>
                    `
                    bankerContainer.appendChild(bankerDiv)
                } 
            }   
            else{
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
    else{
        const playersContainer = document.getElementById('playersContainer');
        const bankerContainer = document.getElementById('bankerContainer')
        const playerKeys = Object.keys(gameData);
        const activePlayers = playerKeys.length;
    
        for (let i = 0; i < activePlayers; i++) {
            const playerId = playerKeys[i];
            const playerInfo = gameData[playerId];
    
    
            // [IMPT] to fix? (instead of skipping data if 'banker' == 'true' maybe can remove it from list) [NEED TO DO THIS FROM SERVER SIDE TO PREVENT CHEATING]
            if (playerInfo['banker'] == 'True'){
                let bankerDiv = document.getElementById(playerId)
                if (!bankerDiv){
                    bankerDiv = document.createElement('div')
                    bankerDiv.className = 'banker'
                    bankerDiv.id = playerId
                    bankerDiv.innerHTML = `
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
                    `
                    bankerContainer.appendChild(bankerDiv)
                }
            }   
            else{
                let playerDiv = document.getElementById(playerId);
                if (!playerDiv){
                    playerDiv = document.createElement('div');
                    playerDiv.className = 'player';
                    playerDiv.id = playerId;

                    playerDiv.innerHTML = `
                    <button id="bankerChallenge_${playerId}" class="bankerChallenge" onclick='endGameOpenSingle(sessionId, this.id)'>
                        <span>开</span>
                    </button>
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
            const promise = new Promise((resolve) => {
                setTimeout(() => {
                    dealCard(playerId, card, false, cardContainer).then(resolve);
                }, index * 500); // Delay each card by 500ms
            });
            promises.push(promise);
        });

        // Wait for all promises to resolve before running cardFan
        Promise.all(promises).then(() => {
            cardFan(playerId);
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
    
        temptCardContainer.style.zIndex = '2'; // Ensure it's on top of other content
    
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
        }, 500); // Delay to sync with the moveCard animation
    
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
        card.style.transition = 'left 0.3s'; // Enable transition effect
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
    var audio = document.getElementById("cardOpenPackage2");
    audio.play()

    socket.emit('playerHit', sessionId, clientPlayerId) //send request to 'hit'

    socket.on('error_card_length_5', () => {
        window.alert("Max Cards allowed is 5")
    })
}

function playerStand(){
    socket.emit('playerStand', sessionId, clientPlayerId)

    if (role === "banker"){
        const allBankerChallengeBtn = document.getElementsByClassName('bankerChallenge')
        for (let btn of allBankerChallengeBtn){
            btn.classList.remove('show');
        }
    }
}

function restart(){
    socket.emit('restartGame', sessionId, clientPlayerId)
    location.reload()
}





function gameEnd(){
    GameEndCardAnimation()
    cardShuffleAnimation()
}

function GameEndCardAnimation() {
    // remove arrow container
    // document.querySelectorAll(".arrow-container").forEach(el => el.remove());

    const bankerContainer = document.getElementById('bankerContainer');
    const bankerCards = bankerContainer.querySelectorAll('.currentPlayerImgElement');

    const playerContainer = document.getElementById('playersContainer');
    const playerCards = playerContainer.querySelectorAll('.currentPlayerImgElement');

    const deck = document.getElementById('cardPileImg');
    const deckRect = deck.getBoundingClientRect();

    function animateAndRemove(card) {
        card.style.transition = "none"; // Disable any existing transition
        card.style.transform = "";

        // Get each card position
        const cardRect = card.getBoundingClientRect();

        // Calculate the distance to move the card to the deck
        const deltaX = deckRect.left - cardRect.left;
        const deltaY = deckRect.top - cardRect.top + (deckRect.height / 2) - (cardRect.height / 2);

        // Apply the animation
        card.style.transition = 'transform 1s ease';
        card.style.transform = `translate(${deltaX}px, ${deltaY}px)`;

        // Wait for the animation to end, then remove the card
        card.addEventListener('transitionend', () => {
            card.remove();
        }, { once: true }); // Ensures event listener runs only once per card
    }

    bankerCards.forEach(animateAndRemove);
    playerCards.forEach(animateAndRemove);
}


function cardShuffleAnimation() {

    function shuffleCardPilePlaceholders() {
        return new Promise((resolve) => {
            const cardPile = document.querySelector(".CardPilePlaceHolderContainer");
            const placeholders = Array.from(cardPile.querySelectorAll(".CardPilePlaceHolder"));

            // Fisher-Yates shuffle algorithm to randomize elements
            for (let i = placeholders.length - 1; i > 0; i--) {
                let j = Math.floor(Math.random() * (i + 1));
                cardPile.appendChild(placeholders[j]); // Move randomly chosen placeholder to the end
            }

            // Create shuffle effect (to show animation to user)
            let i = 0;
            let time = 0;
            let shuffle_time = 2;
            let counter = 0;

            placeholders.reverse().forEach((placeholder) => {
                setTimeout(() => {
                    placeholder.style.transition = "margin-left 0.1s ease";
                    placeholder.style.marginLeft = "100px";

                    setTimeout(() => {
                        placeholder.style.zIndex = i;
                        placeholder.style.marginLeft = "0px";
                    }, 300);

                    i++;
                }, time);

                time += 500;
                counter++;

                // Limit shuffle to a specific number of times
                if (counter > shuffle_time) return;
            });

            // Resolve the promise after the shuffle is done
            setTimeout(() => {
                resolve();
            }, time + 500); // Wait for the shuffle animations to complete
        });
    }
    
    shuffleCardPilePlaceholders()
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



//[CAB] TO BE REDONE
function updateBalance(outcome){
    const balanceElement = document.getElementById("playerBalance")
    
    outcome.forEach((data) => {
        const key = Object.keys(data)[0]; // Get the key of the object
        if (key == clientPlayerId){
            balanceElement.innerText = data[key].playerBalance
        }
    })
}
 
function hideAllChallengeButton(playerData){
    for (let player in playerData){
        if (player == clientPlayerId){continue}
        const temptBankerChallengeBtn = document.getElementById(`bankerChallenge_${player}`)
        temptBankerChallengeBtn.style.visibility = 'hidden';
        temptBankerChallengeBtn.style.opacity = 0;
    }
}

function renderBankerChallengeButtons(playerData){
    for (let player in playerData){
        if (player == clientPlayerId){continue}
        if (playerData[player].competedWithBanker == false){
            const temptBankerChallengeBtn = document.getElementById(`bankerChallenge_${player}`)
            temptBankerChallengeBtn.classList.add("show");
        }
        else if (playerData[player].competedWithBanker == true){
            const temptBankerChallengeBtn = document.getElementById(`bankerChallenge_${player}`)
            temptBankerChallengeBtn.classList.remove("show");
        }
    }
}


function showTurnBanner() {
    const turnBanner = document.getElementById('turnBanner');
    let bannerTimeout;

    // Clear any existing timeout
    if (bannerTimeout) clearTimeout(bannerTimeout);

    // Reset animations
    turnBanner.style.display = 'block';
    turnBanner.style.animation = 'bannerEntrance 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';

    // Auto-hide after 3 seconds
    bannerTimeout = setTimeout(() => {
        turnBanner.style.animation = 'bannerExit 0.5s cubic-bezier(0.4, 0, 0.2, 1) forwards';
        setTimeout(() => {
        turnBanner.style.display = 'none';
        }, 500);
    }, 3000);
}

function showHand(playerId, cardData){

    const fakeData = {playerId: '-OKWJ9R6oxCeldaJIOss', betAmount: 0, playerBalance: 1000, currentHand: '7_of_spades,8_of_spades', value: Array(1)}

    const playerDiv = document.getElementById(playerId)
    const playerCards = playerDiv.querySelectorAll('.currentPlayerImgElement')
    
    playerCards.forEach(card => {
        console.log(card)
        card.src = `images/pixelCards/7_of_spades.png`
        card.style.transition = 'transform 0.5s ease-in-out'; // Smooth flipping animation
        card.style.transform = 'rotateY(0deg)'; // Flip to the back side
    });

}


function endGameOpenSingle(sessionId, targetPlayerId){
    targetPlayerId = targetPlayerId.replace('bankerChallenge_', '')
    socket.emit('endGameOpenSingle', sessionId, clientPlayerId, targetPlayerId)

    socket.on('error', (err) => {
        window.alert(err)
    })

}

// socket.io connections.
const sessionId = localStorage.getItem('sessionId')
const clientPlayerId = localStorage.getItem('playerId')
const username = localStorage.getItem('username')
const role = localStorage.getItem('role')
const socket = io(); // Connect to the server
let lastTurnOrder = null // for turnBanner (so that multiple assignPlayerTurn does not trigger animation due to playerHit)
loadUI(role)


socket.on('connect', () => {
    socket.emit('sessionId', sessionId, clientPlayerId) // send sessionInfo to server
    socket.on('error', (errorMsg) => {
        window.alert(errorMsg)
    })


    socket.on('loadExistingSession', (player_data) => {
        loadGameElements_NEW(player_data, role)
    })
    
    socket.on('assignPlayerTurn', (currentOrder, renderBCdata) => {
        if (clientPlayerId == currentOrder){
            activateButtons()

            if (role === 'banker'){
                renderBankerChallengeButtons(renderBCdata)
            }

            if (lastTurnOrder != currentOrder){
                showTurnBanner();

                document.body.addEventListener('click', () => { // disable animation (click anywhere)
                    turnBanner.style.animation = 'bannerExit 0.5s forwards';
                    setTimeout(() => {
                        turnBanner.style.display = 'none';
                    }, 500);
                });
            }
        }
        else{
            deactivateButtons()
        }
        lastTurnOrder = currentOrder; // Update last turn


    })

    // socket.on('gameEnd' , (outcome) => {
    //     console.log(outcome)

    //     // showBanner(outcome)

    //     //function to move cards back to deck
    //     GameEndCardAnimation()
        
    //     updateBalance(outcome)

    //     socket.emit('restartGame', sessionId, clientPlayerId)
    // })


    // gameEnd version 2 (merge expected data from endGame and endGameSingle into 1 api)
    socket.on('endGameUpdates', (outcome) => {
        for (const obj of outcome){
            console.log(obj)
            if (obj.playerId != clientPlayerId){
                showHand(obj.playerId, obj)
            }
        }

    })


    //  current workaround for sending restartGame cue to server
    socket.on('RESTARTGAME', () => {
        socket.emit('restartGame', sessionId, clientPlayerId)
        console.log('RESTART GAME TRIGGERRED')
    })
})




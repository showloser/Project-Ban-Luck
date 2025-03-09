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
                    <div class="arrow-container_opposite nonPlayerArrows" id="${playerId}_arrowContainer" style="display: none;">
                        <div class="arrow_opposite"></div>
                        <div class="arrow-label" id = '${playerId}_arrow'>${playerInfo.value}</div>
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
        
                    if (playerId === clientPlayerId) {
                        // Current player's UI structure
                        playerDiv.innerHTML = `
                            <div class="betAmount"></div>
                            <div class="arrow-container" id="${playerId}_arrowContainer">
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
                        <div class="arrow-container nonPlayerArrows" id="${playerId}_arrowContainer" style="display: none;">
                            <div class="arrow-label" id = '${playerId}_arrow'>${playerInfo.value}</div>
                            <div class="arrow"></div>
                        </div>
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
                    <div class="arrow-container" id="${playerId}_arrowContainer">
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
                        <div class="arrow-container_opposite nonPlayerArrows" id="${playerId}_arrowContainer" style="display: none;">
                        <div class="arrow_opposite"></div>
                        <div class="arrow-label" id = '${playerId}_arrow'>${playerInfo.value}</div>
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
    
        // Add front image temporarily
        const frontImage = document.createElement('img');
        frontImage.src = facedUpOrDown ? `images/pixelCards/${card}.png` : 'images/pixelCards/Back1.png';
        frontImage.classList.add('front');

        temptCardContainer.appendChild(frontImage);
        temptCardContainer.appendChild(backImage);
        cardPile.appendChild(temptCardContainer); // Stack the card on top of the card pile
    
        if (facedUpOrDown) {
            frontImage.style.zIndex = '1';
            backImage.style.zIndex = '0';
        }
        else{
            frontImage.style.zIndex = '0';
            backImage.style.zIndex = '1';
        }
        
        // Calculate destination position
        const destLeft = playerRect.left + (playerRect.width / 2) - (temptCardContainer.clientWidth / 2);
        const destTop = playerRect.top + (playerRect.height / 2) - (temptCardContainer.clientHeight / 2);
    
        // Apply movement animation
        temptCardContainer.style.setProperty('--move-x', `${destLeft - cardPileRect.left}px`);
        temptCardContainer.style.setProperty('--move-y', `${destTop - cardPileRect.top}px`);

        if (facedUpOrDown) {
            temptCardContainer.style.animation = 'moveCardWithFlip 1.5s forwards';
        }
        else{
            temptCardContainer.style.animation = 'moveCardWithoutFlip 1s forwards';

        }

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
            
            // for some fked up reason smt is causing the card to flip back to front. tempt soln rotateY(180deg) if hand belongs client (will fix soon)
            if (playerId == clientPlayerId){card.style.transform = `rotate(${rotationAngle}deg) rotateY(180deg)`;}
            else{card.style.transform = `rotate(${rotationAngle}deg)`;}
            
        } else {
            const increment = spread / (count - 1);
            const rotationAngle = -baseRotationAngle + increment * index;

            if (index === count - 1) {
                card.style.left = `calc(50%)`;
            } else {
                const leftOffset = (index - (count - 1) / 2) * spacing;
                card.style.left = `calc(50% - ${card.clientWidth / 2}px + ${leftOffset}px)`;
            }

            // for some fked up reason smt is causing the card to flip back to front. tempt soln rotateY(180deg) if hand belongs client (will fix soon)
            if (playerId == clientPlayerId){card.style.transform = `rotate(${rotationAngle}deg) rotateY(180deg)`;}
            else{card.style.transform = `rotate(${rotationAngle}deg)`;}
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
    removeArrow()
    GameEndCardAnimation()
    cardShuffleAnimation()
}

function removeArrow(){
    const allArrows = document.querySelectorAll('.nonPlayerArrows')
    allArrows.forEach(arrow => {
        arrow.style.display = 'none'
    })
}

function GameEndCardAnimation() {
    removeArrow()
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
    const currentHand = cardData.currentHand.split(',')
    const playerDiv = document.getElementById(playerId)
    // remove display = none for arrows(just for show)
    const arrow = document.getElementById(`${playerId}_arrowContainer`)
    arrow.style.display = 'flex'
    const playerCards = playerDiv.querySelectorAll('.currentPlayerImgElement')
    playerCards.forEach((card, index) => {
        const frontCard = card.querySelector('.front')
        frontCard.src = `images/pixelCards/${currentHand[index]}.png`
        card.style.transition = 'transform 0.5s ease-in-out'; // Smooth flipping animation
        card.style.transform = 'rotateY(180deg)'; // Flip to the back side
    });

    

}



function endGameOpenSingle(sessionId, targetPlayerId){
    targetPlayerId = targetPlayerId.replace('bankerChallenge_', '')
    socket.emit('endGameOpenSingle', sessionId, clientPlayerId, targetPlayerId)

    socket.on('error', (err) => {
        window.alert(err)
    })

}






function showBanner(outcome){
    const amount = outcome.betAmount;
    let outcomeText, amountText, bannerColor, bannerBg;

    if (outcome.outcome === 'win') {
        isWin = 'win';
        outcomeText = 'YOU WIN!';
        amountText = `+$${amount}`;
        bannerColor = '#4cd137'; 
        bannerBg = 'rgba(46, 174, 52, 0.7)'; // Darker green for background
    } else if (outcome.outcome === 'lose') {
        isWin = 'lose';
        outcomeText = 'YOU LOSE!';
        amountText = `-$${amount}`;
        bannerColor = '#ff3838'; 
        bannerBg = 'rgba(214, 48, 49, 0.7)'; // Darker red for background
    } else {
        isWin = 'draw';
        outcomeText = 'DRAW!';
        amountText = `$${amount}`;
        bannerColor = '#ffa502'; 
        bannerBg = 'rgba(225, 112, 0, 0.7)'; // Darker yellow for background
    }
    
    const existingBanner = document.querySelector('.result-banner');
    if (existingBanner) {
        existingBanner.remove();
    }

    const bannerTemplate = `
        <div class="result-banner">
            <div class="content-container">
                <div class="result-pixel-border result-pixel-border-top"></div>
                <h2 class="result-text">${outcomeText}</h2>
                <div class="amount-text">${amountText}</div>
                <button class="close-button">CONTINUE</button>
                <div class="result-pixel-border result-pixel-border-bottom"></div>
            </div>
        </div>
    `;


    document.body.insertAdjacentHTML('beforeend', bannerTemplate);
    const banner = document.querySelector('.result-banner');

    // Apply dynamic CSS variables
    banner.style.setProperty('--banner-color', bannerColor);
    banner.style.setProperty('--banner-bg', bannerBg);
    banner.style.animation = 'fadeIn 0.5s forwards';

    const closeButton = document.querySelector('.close-button');
    // Close the banner when clicking the button
    closeButton.addEventListener('click', () => {
        banner.style.animation = 'fadeOut 0.5s';
        setTimeout(() => {
        banner.remove();
        }, 480);
    });

    // Play sound effect based on win/lose
    playSound(isWin);

    // Auto-remove after 5 seconds if user doesn't click
    setTimeout(() => {
        if (document.body.contains(banner)) {
            banner.style.animation = 'fadeOut 0.5s forwards';
            setTimeout(() => {
                if (document.body.contains(banner)) {
                    banner.remove();
                }
            }, 480);
        }
    }, 5000);

    // simple sound effect
    function playSound(isWin) {
        // Create audio context
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        const audioCtx = new AudioContext();
        
        // Create oscillator
        const oscillator = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        
        // Connect nodes
        oscillator.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        
        // Set properties based on win/lose
        if (isWin === 'win') {
            // Win sound: ascending notes
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
            oscillator.frequency.linearRampToValueAtTime(440, audioCtx.currentTime + 0.1);
            oscillator.frequency.linearRampToValueAtTime(880, audioCtx.currentTime + 0.2);
            
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.3);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.3);
        } else if (isWin === 'lose'){
            // Lose sound: descending notes
            oscillator.type = 'sawtooth';
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime);
            oscillator.frequency.linearRampToValueAtTime(220, audioCtx.currentTime + 0.1);
            oscillator.frequency.linearRampToValueAtTime(110, audioCtx.currentTime + 0.3);
            
            gainNode.gain.setValueAtTime(0.3, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.4);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.4);
        } else if (isWin === 'draw') {
            // Draw sound: alternating notes
            oscillator.type = 'triangle';
            // Start time
            oscillator.frequency.setValueAtTime(330, audioCtx.currentTime);
            // Alternate between two tones
            oscillator.frequency.setValueAtTime(330, audioCtx.currentTime + 0.1);
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime + 0.2);
            oscillator.frequency.setValueAtTime(330, audioCtx.currentTime + 0.3);
            oscillator.frequency.setValueAtTime(440, audioCtx.currentTime + 0.4);
            
            // Set volume
            gainNode.gain.setValueAtTime(0.2, audioCtx.currentTime);
            gainNode.gain.linearRampToValueAtTime(0.25, audioCtx.currentTime + 0.2);
            gainNode.gain.linearRampToValueAtTime(0, audioCtx.currentTime + 0.5);
            
            oscillator.start();
            oscillator.stop(audioCtx.currentTime + 0.5);
        }
    }

    // Function to animate balance changes with enhanced visual effects
    function animateBalanceChange(result, amount, currentBalance) {
        // Get the balance element
        const balanceEl = document.getElementById("playerBalance");
        const originalPosition = balanceEl.getBoundingClientRect();
        
        // Create overlay for more dramatic effects
        const overlay = document.createElement('div');
        overlay.style.cssText = `
            position: absolute;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(overlay);
        
        if (result === 'win') {            
            // Create a floating amount element for wins with enhanced styling
            const floatingAmount = document.createElement('div');
            floatingAmount.textContent = `+$${amount}`;
            floatingAmount.style.cssText = `
                position: absolute;
                color: #2ecc71;
                font-weight: bold;
                left: ${originalPosition.left + originalPosition.width / 2}px;
                top: ${originalPosition.top - 60}px;
                transform: translateX(-50%);
                opacity: 0;
                font-size: 32px;
                text-shadow: 0 0 10px rgba(46, 204, 113, 0.8), 0 0 20px rgba(46, 204, 113, 0.5);
                z-index: 1001;
                font-family: Arial, sans-serif;
            `;
            overlay.appendChild(floatingAmount);
            
            // Add a glow effect to the balance
            balanceEl.style.transition = 'all 0.3s ease';
            balanceEl.style.textShadow = '0 0 15px rgba(46, 204, 113, 0.8)';
            balanceEl.style.color = '#2ecc71';
            
            // Add particles for more dramatic effect
            for (let i = 0; i < 20; i++) {
                createParticle(originalPosition, '#2ecc71', overlay);
            }
            
            // Animate the floating amount
            let startTime = null;
            const duration = 2000;
            
            function animateWin(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Animate size and position
                const scale = progress < 0.4 ? 1 + progress : 1 + 0.4 - (progress - 0.4) * 0.5;
                const moveProgress = Math.min(progress * 1.5, 1);
                
                // Enhanced movement and fading
                floatingAmount.style.opacity = progress < 0.7 ? progress * 1.4 : (1 - (progress - 0.7) * 3);
                floatingAmount.style.top = `${originalPosition.top - 60 + (moveProgress * 70)}px`;
                floatingAmount.style.transform = `translateX(-50%) scale(${scale})`;
                
                if (progress < 1) {
                    requestAnimationFrame(animateWin);
                } else {
                    // Update the final balance when animation completes
                    setTimeout(() => {
                        balanceEl.textContent = `${currentBalance + amount}`;
                        balanceEl.style.textShadow = '';
                        balanceEl.style.color = '';
                        overlay.remove();
                    }, 200);
                }
            }
            
            requestAnimationFrame(animateWin);
            
        } else if (result === 'lose') {            
            // Create a floating amount element for losses with enhanced styling
            const floatingAmount = document.createElement('div');
            floatingAmount.textContent = `-$${amount}`;
            floatingAmount.style.cssText = `
                position: absolute;
                color: #e74c3c;
                font-weight: bold;
                left: ${originalPosition.left + originalPosition.width / 2}px;
                top: ${originalPosition.top + originalPosition.height / 2 - 10}px;
                transform: translateX(-50%) translateY(-50%) scale(1);
                opacity: 0;
                font-size: 32px;
                text-shadow: 0 0 10px rgba(231, 76, 60, 0.8), 0 0 20px rgba(231, 76, 60, 0.5);
                z-index: 1001;
                font-family: Arial, sans-serif;
            `;
            overlay.appendChild(floatingAmount);
            
            // Add a flash effect to the balance
            balanceEl.style.transition = 'all 0.3s ease';
            balanceEl.style.textShadow = '0 0 15px rgba(231, 76, 60, 0.8)';
            balanceEl.style.color = '#e74c3c';
            
            // Add particles for more dramatic effect
            for (let i = 0; i < 15; i++) {
                createParticle(originalPosition, '#e74c3c', overlay);
            }
            
            // Animate the floating amount
            let startTime = null;
            const duration = 2000;
            
            function animateLose(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Enhanced pulsing effect
                const pulseScale = 1 + Math.sin(progress * Math.PI * 3) * 0.2 * (1 - progress);
                
                // Fade in then out with movement
                if (progress < 0.3) {
                    floatingAmount.style.opacity = progress * 3;
                    floatingAmount.style.transform = `translateX(-50%) translateY(-50%) scale(${1 + progress})`;
                } else {
                    floatingAmount.style.opacity = 1 - ((progress - 0.3) * 1.4);
                    floatingAmount.style.top = `${originalPosition.top + originalPosition.height / 2 + ((progress - 0.3) * 60)}px`;
                    floatingAmount.style.transform = `translateX(-50%) translateY(-50%) scale(${pulseScale})`;
                }
                
                // Shake the balance text during animation
                if (progress < 0.7) {
                    const shake = Math.sin(progress * 40) * 4 * (0.7 - progress);
                    balanceEl.style.transform = `translateX(${shake}px)`;
                } else {
                    balanceEl.style.transform = 'translateX(0)';
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animateLose);
                } else {
                    // Update the final balance when animation completes
                    setTimeout(() => {
                        balanceEl.textContent = `${currentBalance - amount}`;
                        balanceEl.style.textShadow = '';
                        balanceEl.style.color = '';
                        balanceEl.style.transform = '';
                        overlay.remove();
                    }, 200);
                }
            }
            
            requestAnimationFrame(animateLose);
            
        } else if (result === 'draw') {            
            let startTime = null;
            const duration = 1500;
            
            // Create "DRAW" text that pops up briefly
            const drawText = document.createElement('div');
            drawText.textContent = 'DRAW';
            drawText.style.cssText = `
                position: absolute;
                color: #f39c12;
                font-weight: bold;
                left: ${originalPosition.left + originalPosition.width / 2}px;
                top: ${originalPosition.top - 40}px;
                transform: translateX(-50%) scale(0);
                opacity: 0;
                font-size: 28px;
                text-shadow: 0 0 10px rgba(243, 156, 18, 0.6);
                z-index: 1001;
                font-family: Arial, sans-serif;
            `;
            overlay.appendChild(drawText);
            
            // Add a yellow glow to the balance
            balanceEl.style.transition = 'color 0.2s ease';
            balanceEl.style.textShadow = '0 0 8px rgba(243, 156, 18, 0.7)';
            
            function animateDraw(timestamp) {
                if (!startTime) startTime = timestamp;
                const elapsed = timestamp - startTime;
                const progress = Math.min(elapsed / duration, 1);
                
                // Enhanced vibration effect with varying amplitude and frequency
                if (progress < 0.8) {
                    // Generate a more intense shake effect
                    const frequency = 25 + Math.sin(progress * 10) * 10;
                    const amplitude = 7 * (1 - progress * 1.25);
                    const vibration = Math.sin(progress * frequency) * amplitude;
                    balanceEl.style.transform = `translateX(${vibration}px)`;
                    
                    // Make balance pulse in size slightly
                    const pulseScale = 1 + Math.sin(progress * Math.PI * 4) * 0.05;
                    balanceEl.style.scale = pulseScale;
                    
                    // Alternate color slightly
                    if (Math.sin(progress * 30) > 0) {
                        balanceEl.style.color = '#f39c12';
                    } else {
                        balanceEl.style.color = '';
                    }
                } else {
                    // Gradually stop the effect
                    const easeOutProgress = (progress - 0.8) * 5; // 0 to 1 in the last 20% of time
                    const finalVibration = Math.sin((0.8 + easeOutProgress * 0.2) * 25) * (1 - easeOutProgress) * 2;
                    balanceEl.style.transform = `translateX(${finalVibration}px)`;
                    balanceEl.style.scale = 1;
                    balanceEl.style.color = '';
                }
                
                // Animate the "DRAW" text
                if (progress < 0.15) {
                    // Pop in
                    drawText.style.opacity = progress / 0.15;
                    drawText.style.transform = `translateX(-50%) scale(${progress / 0.15})`;
                } else if (progress < 0.7) {
                    // Stay visible and pulse
                    drawText.style.opacity = 1;
                    const pulseScale = 1 + Math.sin((progress - 0.15) * 15) * 0.1;
                    drawText.style.transform = `translateX(-50%) scale(${pulseScale})`;
                } else {
                    // Fade out
                    drawText.style.opacity = Math.max(0, 1 - ((progress - 0.7) / 0.3));
                    drawText.style.transform = `translateX(-50%) scale(${1 + (progress - 0.7)})`;
                }
                
                if (progress < 1) {
                    requestAnimationFrame(animateDraw);
                } else {
                    // Reset position when done
                    balanceEl.style.transform = 'translateX(0)';
                    balanceEl.style.scale = '1';
                    balanceEl.style.color = '';
                    balanceEl.style.textShadow = '';
                    overlay.remove();
                }
            }
            
            requestAnimationFrame(animateDraw);
        }
    }

    // Helper function to create particle effects
    function createParticle(origin, color, container) {
        const particle = document.createElement('div');
        const size = 5 + Math.random() * 15;
        
        particle.style.cssText = `
            position: absolute;
            width: ${size}px;
            height: ${size}px;
            background-color: ${color};
            border-radius: 50%;
            left: ${origin.left + origin.width / 2 + (Math.random() - 0.5) * 20}px;
            top: ${origin.top + origin.height / 2 + (Math.random() - 0.5) * 20}px;
            opacity: ${0.5 + Math.random() * 0.5};
            pointer-events: none;
        `;
        
        container.appendChild(particle);
        
        // Random velocity
        const angle = Math.random() * Math.PI * 2;
        const speed = 2 + Math.random() * 4;
        const vx = Math.cos(angle) * speed;
        const vy = Math.sin(angle) * speed - 2; // Slight upward bias
        
        let startTime = null;
        const duration = 1000 + Math.random() * 1000;
        
        function animateParticle(timestamp) {
            if (!startTime) startTime = timestamp;
            const elapsed = timestamp - startTime;
            const progress = Math.min(elapsed / duration, 1);
            
            // Update position
            const newLeft = parseFloat(particle.style.left) + vx;
            const newTop = parseFloat(particle.style.top) + vy + progress * 2; // Add gravity
            
            particle.style.left = `${newLeft}px`;
            particle.style.top = `${newTop}px`;
            
            // Fade out
            particle.style.opacity = (1 - progress) * (0.5 + Math.random() * 0.5);
            
            if (progress < 1) {
                requestAnimationFrame(animateParticle);
            } else {
                container.removeChild(particle);
            }
        }
        
        requestAnimationFrame(animateParticle);
    }

    animateBalanceChange(outcome.outcome, amount, parseInt(localStorage.getItem('balance')))
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
            if (obj.playerId != clientPlayerId){
                showHand(obj.playerId, obj)
            }
            else{
                showBanner(obj)
            }
        }
    })


    //  current workaround for sending restartGame cue to server
    socket.on('RESTARTGAME', () => {
        //function to move cards back to deck
        GameEndCardAnimation()

        socket.emit('restartGame', sessionId, clientPlayerId)
        console.log('RESTART GAME TRIGGERRED')
    })
})




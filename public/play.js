const socket = io(); // Connect to the server

//  handle data recieved from server (dealt cards):
socket.on('bankerCards', (cards, cardValue) => {
    updateDealerCards(cards);
    updateBankerCardValue(cardValue)
});

// Handle player cards received from the server
socket.on('playerCards', (cards, cardValue) => {
    updatePlayerCards(cards);
    updatePlayerCardValue(cardValue);
});

function updateDealerCards(cards) {
    const dealerCardsDiv = document.getElementById('dealer-cards');
    dealerCardsDiv.innerHTML = ''; // Clear previous cards

    cards.forEach(card => {
        const img = document.createElement('img');
        img.src = `/images/cards/${card}.svg`;
        img.alt = card;
        dealerCardsDiv.appendChild(img);
    });
}

function updatePlayerCards(cards) {
    const playerCardsDiv = document.getElementById('player-cards');
    playerCardsDiv.innerHTML = ''; // Clear previous cards

    cards.forEach(card => {
        const img = document.createElement('img');
        img.src = `/images/cards/${card}.svg`;
        img.alt = card;
        playerCardsDiv.appendChild(img);
    });
}

function updatePlayerCardValue(value){
    const playerCardValueElement = document.getElementById('value_player')
    playerCardValueElement.innerHTML = value; // Overwrite previous value
}

function updateBankerCardValue(value){
    const playerCardValueElement = document.getElementById('value_banker')
    playerCardValueElement.innerHTML = value; // Overwrite previous value
}

function playerHit(){
    socket.emit('playerHit') //send request to hit
    socket.on('playerHit', (cards, cardValue) => { //get data
        updatePlayerCards(cards);
        updatePlayerCardValue(cardValue)
    })

}





const socket = io(); // Connect to the server

//  handle data recieved from server (dealt cards):
socket.on('dealerCards', (cards) => {
    updateDealerCards(cards);
});

// Handle player cards received from the server
socket.on('playerCards', (cards) => {
    updatePlayerCards(cards);
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

function playerHit(){
    socket.emit('playerHit') //send request to hit
    socket.on('playerHit', (cards) => { //get data
        updatePlayerCards(cards);
    })

}





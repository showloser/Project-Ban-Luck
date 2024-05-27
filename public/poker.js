// JavaScript to dynamically add card images to player's cards
function addCard(playerId, cardValue, cardSuit) {
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

    // Create card image element
    const cardImg = document.createElement('img');
    cardImg.src = `/images/cards/${cardValue}_of_${cardSuit}.svg`; // Adjust the path to your card images
    cardImg.alt = `${cardValue} of ${cardSuit}`;
    
    // Calculate rotation angle based on the number of existing cards
    const rotationAngle = 20 * playerCards.childElementCount;

    // Apply rotation to the new card
    cardImg.style.transform = `rotate(${rotationAngle}deg)`;

    // Append the card image to the player's cards
    playerCards.appendChild(cardImg);
}



addCard('player1', 'king', 'clubs');
addCard('player1', 'king', 'clubs');
addCard('player1', 'king', 'clubs');

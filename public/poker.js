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

    // Wait for all images to load before updating the card fan [cb animation error]
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
const maxPlayers = 5;
const activePlayers = 3; // Example: Change this value based on your game logic

const playersContainer = document.getElementById('playersContainer');
for (let i = 1; i <= activePlayers; i++) {
    const playerDiv = document.createElement('div');
    playerDiv.className = 'player';
    playerDiv.id = `player${i}`;
    playerDiv.innerHTML = `
        <h2>Player ${i}</h2>
        <div class="playerCards"></div>
        <div class="playerValue"></div>
    `;

    const angle = 135 - ((i - 1) * (90 / (activePlayers - 1))); 
    const radius = 35; 
    const x = 50 + radius * Math.cos(angle * Math.PI / 180);
    const y = 50 + radius * Math.sin(angle * Math.PI / 180);

    playerDiv.style.left = `${x}%`;
    playerDiv.style.top = `${y}%`;
    playerDiv.style.transform = 'translate(-50%, -50%)';

    playersContainer.appendChild(playerDiv);
}


// addCard('player2', '2_of_hearts,6_of_spades');
// addCard('player2', '6_of_spades');
// addCard('player2', '8_of_hearts');



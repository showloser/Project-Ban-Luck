// Define global variables
let deck = [];
let playerHand = [];
let dealerHand = [];
let message = "";

// Function to initialize the deck with cards
function initializeDeck() {
    const suits = ["hearts", "diamonds", "clubs", "spades"];
    const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];
    deck = [];
    for (let suit of suits) {
        for (let value of values) {
            deck.push(`${value}_of_${suit}`);
        }
    }
    shuffleDeck();
}

// Function to shuffle the deck
function shuffleDeck() {
    for (let i = deck.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [deck[i], deck[j]] = [deck[j], deck[i]];
    }
}

// Function to deal a card from the deck
function dealCard() {
    return deck.pop();
}

// Function to calculate the total value of a hand
function calculateHandValue(hand) {
    let total = 0;
    let numAces = 0;
    for (let card of hand) {
        const value = card.split("_")[0];
        if (value === "A") {
            numAces++;
            total += 11;
        } else if (value === "J" || value === "Q" || value === "K") {
            total += 10;
        } else {
            total += parseInt(value);
        }
    }
    while (total > 21 && numAces > 0) {
        total -= 10;
        numAces--;
    }
    return total;
}

// Function to start a new game
function startGame() {
    initializeDeck();
    playerHand = [dealCard(), dealCard()];
    dealerHand = [dealCard(), dealCard()];
    message = "";

    // Display initial hands
    displayHands();

    // Check for blackjack
    if (calculateHandValue(playerHand) === 21) {
        message = "Blackjack! You win!";
        displayMessage();
        return;
    }

    // Check if dealer has blackjack
    if (calculateHandValue(dealerHand) === 21) {
        message = "Dealer has blackjack. You lose!";
        displayMessage();
        return;
    }

    // Otherwise, let the player take their turn
    message = "Your turn: Hit or Stand?";
    displayMessage();
}

// Function to display hands with SVG images
function displayHands() {
    const playerCardsContainer = document.getElementById("player-cards");
    const dealerCardsContainer = document.getElementById("dealer-cards");

    // Clear existing cards
    playerCardsContainer.innerHTML = "";
    dealerCardsContainer.innerHTML = "";

    // Display player's cards
    for (let card of playerHand) {
        const img = document.createElement("img");
        img.src = `../images/cards/${card}.svg`; // Assuming your SVG images are stored in an 'images' folder
        img.alt = card;
        playerCardsContainer.appendChild(img);
    }

    // Display dealer's cards (hide the second card if the game is ongoing)
    for (let i = 0; i < dealerHand.length; i++) {
        const card = i === 0 ? dealerHand[i] : "card_back"; // "card_back" could be an SVG image of the card back
        const img = document.createElement("img");
        img.src = `../images/cards/${card}.svg`; // Assuming your SVG images are stored in an 'images' folder
        img.alt = card;
        dealerCardsContainer.appendChild(img);
    }
}

// Function to display message
function displayMessage() {
    document.getElementById("message").innerText = message;
}

// Function for player to hit
function hit() {
    playerHand.push(dealCard());
    displayHands();
    
    // Check if player busts
    if (calculateHandValue(playerHand) > 21) {
        message = "Busted! You lose!";
        displayMessage();
    }
}

// Function for player to stand
function stand() {
    // Dealer takes their turn
    while (calculateHandValue(dealerHand) < 17) {
        dealerHand.push(dealCard());
    }
    displayHands();
    
    // Determine the winner
    const playerTotal = calculateHandValue(playerHand);
    const dealerTotal = calculateHandValue(dealerHand);
    if (playerTotal > 21) {
        message = "Busted! You lose!";
    } else if (dealerTotal > 21 || playerTotal > dealerTotal) {
        message = "You win!";
    } else if (playerTotal < dealerTotal) {
        message = "Dealer wins!";
    } else {
        message = "It's a tie!";
    }
    displayMessage();
}

// Start the game when the page loads
document.addEventListener("DOMContentLoaded", startGame);

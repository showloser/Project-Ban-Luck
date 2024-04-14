const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const path = require('path'); 
const { start } = require('repl');



const publicPath = path.join(__dirname, '../public')
app.use(express.static(publicPath));


// Serve the HTML page when accessing the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'play.html'));
});


//  GAME LOGIC:
function initializeDeck(){ // to be ran only ONCE
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];
  deck = [];

  for (let suit of suits){
    for (let value of values){
      deck.push(`${value}_of_${suit}`)
    }
  }
  deck = shuffleDeck(deck)
} 

function shuffleDeck(deck){ // using Fisher-Yates algorith, which is truly random (https://en.wikipedia.org/wiki/Fisher%E2%80%93Yates_shuffle)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1)); // Generate a random index
    [deck[i], deck[j]] = [deck[j], deck[i]]; // Swap elements at index i and j
  }
  return deck;
}

function dealCard(){
  return deck.pop()
}

function startGame(socket) {
  // deal initial cards to dealer and player
  initializeDeck()
  playerHand = [dealCard(), dealCard()]
  bankerHand = [dealCard(), dealCard()]  

  bankerCardValue = CalculateValue(bankerHand)
  playerCardValue = CalculateValue(playerHand)

  socket.emit('bankerCards', bankerHand, bankerCardValue);
  socket.emit('playerCards', playerHand, playerCardValue);
}

function playerHit(){
  playerHand.push(dealCard())
}

function CalculateValue(hand){
  // [Calculation formula: https://en.wikipedia.org/wiki/Chinese_Blackjack]
  // K, Q, J = 10
  // 10, 9, 8, 7, 6, 5, 4, 3, 2 = respective face value
  // If your total number of cards is 2, then Ace = 11 or 10
  // If your total number of cards is 3, then Ace = 10 or 1
  // If your total number of cards is 4 or 5, then Ace = 1

  function determineValue(hand){
      var total = 0;
      var aces = 0;
      for (let card of hand){
      const value = card.split('_')[0]; //get the value (king/queen/jack/10/9/ace)
          if (value === 'ace'){
              aces = aces + 1
          }
          else if (value === 'king' || value == 'queen' || value == 'jack'){
              total = total + 10
          }
          else{
              total = total + parseInt(value)
          }
      }
  
      if (aces != 0){
          // [TWO CARDS]:
          if (hand.length == 2){
              if (aces == 2){
                  return ['BanBan']
              }
              else if (aces = 1 && total == 10)
                  return ['BanLuck']
              else{
                  return [parseInt(total + 11)]
              }
          }
          // [THREE CARDS]:
          else if (hand.length == 3){
              // check if bust:
              if ((total + 10) > 21 ){
                  return [parseInt(total + 1)]
              }
              else{
                  return [parseInt(total+1), parseInt(total + 10)]
              }
          }
          // [FOUR OR FIVE CARDS]:
          else{
              return [parseInt(total + aces)]
          }
      }
      else{
          return [parseInt(total)]
      }
  }

  result = determineValue(hand)
  if (result.length == 2 || typeof result[0] === 'string'){
      return result
  }
  else{
      if (result[0] > 21){
          return ['Bust!']
      }
      else{
          return result
      }
  }
}



// CONNECTION LOGIC:
// Handle 'connect' event
io.on('connection', (socket) => {
  console.log('a connection is established')

  // Deal initial cards when a client connects
  startGame(socket);

  // Handle [Hit]  requests
  socket.on('playerHit', ()=>{
    // check card amount (card amount cannot > 5)
    if (playerHand.length >= 5){
      socket.emit('error_card_length_5')
    }
    else{
      playerHit(playerHand)
      totalCardValue = CalculateValue(playerHand)
      socket.emit('playerCards', playerHand, totalCardValue)
    }
  } )

  // Handle [Stand] requests
socket.on('playerStand', () => {

  //  testing
  

})


  // Handle client disconnect
  socket.on('disconnect', (socket) => {
    console.log('A client disconnected');
});

})



// Start the server
const PORT = process.env.PORT || 8888;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

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

  socket.emit('dealerCards', bankerHand);
  socket.emit('playerCards', playerHand);
}

function playerHit(){
  playerHand.push(dealCard())
}









// CONNECTION LOGIC:
// Handle 'connect' event
io.on('connection', (socket) => {
  console.log('a connection is established')

  // Deal initial cards when a client connects
  startGame(socket);

  // Handle hit card requests
  socket.on('playerHit', ()=>{
    playerHit(socket)
    socket.emit('playerCards', playerHand)
  } )




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

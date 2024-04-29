const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const bodyParser = require('body-parser');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
const path = require('path'); 
const { start } = require('repl');



// !!!!!!!!!!!!!!!!!!!!!!!!!     [ FireBase ]     !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!


// Current json Firebase hierarchy  
// - sessions
//   - {sessionId}
//     - players
//       - {playerId}
//         - username
//         - currentHand
//         - value
//         - endTurn
//     - gameStatus
//       - gameState
//       - currentPlayerId
//       - winner
//     - deck
//       - {cardId}
//         - suit
//         - value
//     - createdAt


// Import the functions you need from the SDKs you need
const { initializeApp, SDK_VERSION } = require('firebase/app');
const { getDatabase, ref, get, child, set, update, remove, push } = require('firebase/database');
const { create } = require('domain');

const firebaseConfig = {
  apiKey: "AIzaSyAlJ1gEXCOAIEN2Q1w69sKnzuxeUvpYge4",
  authDomain: "project-banluck.firebaseapp.com",
  databaseURL: "https://project-banluck-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "project-banluck",
  storageBucket: "project-banluck.appspot.com",
  messagingSenderId: "871217754770",
  appId: "1:871217754770:web:d2ea6d51e97e7c3bb72c4b",
  measurementId: "G-96W3YXLBNY"
};

// Initialize Firebase
const firebaseApp = initializeApp(firebaseConfig);
const db = getDatabase();


function create_session(db, sessionId){
  set(ref(db, '/project-bunluck/sessions/', sessionId))
}


function update_data_in_session(db, data){
  push(ref(db, '/project-bunluck/sessions/' + data.session_id), {
    userid : data.userid,
    username : data.username,
    current_hand : data.current_hand,
    value : data.value,
    end_turn : data.end_turn
  })

}

function get_all_data(db){
  get(child(ref(db) , '/project-banluck' )).then((snapshot) => {
    if (snapshot.exists()){
      console.log(snapshot.val())
    }
    else{
      console.log('No Data Available')
    }
  }).catch((error) => {
    console.log(error)
  }) 
}

function delete_all_data_in_session(db, session_id){

  const sessionRef =  ref(db, '/project-bunluck/sessions/' + session_id);

  remove(sessionRef)
    .then(() => {
      console.log(`All data for session ${session_id} deleted successfully.`);
    })
    .catch((error) => {
      console.error(`Error deleting data for session ${session_id}:`, error);
    });

}


function get_data_from_session_userid(db, session_id, player_userid){

  const db_ref = ref(db, `/project-bunluck/sessions/${session_id}`)

  get(db_ref).then((snapshot) => {
    if (snapshot.exists()){
      snapshot.forEach((childNode) => {

        if (childNode.key == player_userid){
          result = childNode.val()
          console.log(result)
        }
      })
    }
    else{
      console.log('SERVER_ERROR_404: Session does not exist')
    }
  }).catch((error) => {
    console.log('Error retrieving data: ' + error.message)
  })
}

// !!!!!!!!!!!!!!!!!!!!!!!!!     [ FireBase ]     !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!





const publicPath = path.join(__dirname, '../public')
app.use(express.static(publicPath));
app.use(bodyParser.urlencoded({ extended: true }));


// Serve the HTML page when accessing the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});


//  GAME LOGIC:
function initializeDeck(sessionId){ // to be ran only ONCE
  const suits = ["hearts", "diamonds", "clubs", "spades"];
  const values = ["2", "3", "4", "5", "6", "7", "8", "9", "10", "jack", "queen", "king", "ace"];
  deck = [];

  for (let suit of suits){
    for (let value of values){
      deck.push(`${value}_of_${suit}`)
    }
  }
  deck = shuffleDeck(deck)

  return deck

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

function startGame(socket, sessionId) {
  // deal initial cards to dealer and player
  deck = initializeDeck(sessionId)

  //write data to firebase
  writeDeckToDatabase(sessionId, deck)

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

function bankerHit(){
  bankerHand.push(dealCard())
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

  socket.on('sessionId', (sessionId) => {
    const current_sessionId = sessionId

  // Deal initial cards when a client connects
  startGame(socket, current_sessionId);

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
    while(true){
      totalCardValue_banker = CalculateValue(bankerHand)
      if (totalCardValue_banker.length == 2){
        if (totalCardValue_banker[-1] >= 16){
          socket.emit('playerStand', totalCardValue_banker[-1])
          break
        }
        else{
          bankerHit()
        }
      }
      else if(totalCardValue_banker <= 16){
        bankerHit()
      }
      else{
        // send data over
        socket.emit('playerStand', bankerHand, totalCardValue_banker)
        break
      }
    }
  })
})


  // Handle client disconnect
  socket.on('disconnect', (socket) => {
    console.log('A client disconnected');
});

})


// handle data from index.html
app.post('/form_createRoom', (req, res) => {
  const username = req.body.username;

  try{
    // create session and add player into current session
    data = createSessionAndAddPlayer(username)

    // send success response with generated session ID
    res.status(200).json({ success: true, sessionId: data.sessionId , playerId: data.playerId});
  }
  catch{
    res.status(400).json({ success: false, message: 'Failed to create session.'})
  }


})

app.post('/form_joinRoom', (req, res) => {
  const username = req.body.username;
  const roomCode = req.body.roomCode;

  //to do 
  //send success
  res.status(200).json({ success: true, message: "Form data submitted successfully" });
})


function createSessionAndAddPlayer(username) {
  const db = getDatabase();
  const sessionRef = push(ref(db, '/project-bunluck/sessions')); // Generate unique session ID
  const sessionId = sessionRef.key; // Get the generated session ID

  const playerRef = push(ref(db, `/project-bunluck/sessions/${sessionId}/players`)); // Generate unique player ID
  const playerId = playerRef.key; // Get the generated player ID

  // Store the session ID and player's username along with their player ID in the database
  set(sessionRef, {
    sessionId: sessionId,
    createdAt: new Date().toISOString() // Timestamp indicating when the session was created
  });
  set(playerRef, {
    username: username
  });

  return { sessionId: sessionId, playerId: playerId };
  }

function writeDeckToDatabase(sessionId, deck) {
  const db = getDatabase();
  const deckRef = ref(db, `/project-bunluck/sessions/${sessionId}/deck`);

  set(deckRef, deck)
    .then(() => {
      console.log('Deck data written to the database under session ID:', sessionId);
    })
    .catch((error) => {
      console.error('Error writing deck data to the database:', error);
    });
}



// Start the server
const PORT = process.env.PORT || 8888;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});


// [TO DO]
// remove all const db = getdatabase()
  // to be removed
let bankerId;

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
//     - chat
//       - {messageId}
//         - senderId
//         - senderUsername
//         - message
//         - timestamp

// Import the functions you need from the SDKs you need
const { initializeApp, SDK_VERSION } = require('firebase/app');
const { getDatabase, ref, get, child, set, update, remove, push, onValue } = require('firebase/database');
const { create } = require('domain');
const { type } = require('os');
const { error, timeStamp } = require('console');

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

// !!!!!!!!!!!!!!!!!!!!!!!!!     [ FireBase ] END    !!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!

const publicPath = path.join(__dirname, '../public')
app.use(express.static(publicPath));
app.use(bodyParser.urlencoded({ extended: true }));


// Serve the HTML page when accessing the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(publicPath, 'index.html'));
});


//  GAME LOGIC:
function initializeDeck(){ 
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

async function startGame(socket, sessionId, playerId) {
  deck = initializeDeck()

  //write data to firebase
  writeDeckToDatabase(sessionId, deck)

  // draw initial hands for player n banker
  await drawInitialHand(sessionId, playerId)

  let sessionData = await loadExistingSession(sessionId)
  socket.emit('loadExistingSession', sessionData)
  
  // change 'Restart' to 'False' in firebase
  await changeSessionRestartStatus(sessionId)

}

async function drawInitialHand(sessionId, playerId) {
  await playerHit(sessionId, playerId);
  await playerHit(sessionId, playerId);
}

async function calculatePlayerCardValue(sessionId, playerId){
  try{
    let hand = await getHand(sessionId, playerId)
    hand = hand.split(',')
    return CalculateValue(hand)
  }
  catch(error){
    console.error(error)
  }
}

async function playerHit(sessionId, playerId){
  // try{
    let currentDeck = await getDeck(sessionId)
    let playerCurrentHand = await getHand(sessionId, playerId)
    let dealtCard = currentDeck.shift()

    if (playerCurrentHand == 'undefined' || playerCurrentHand == null) {playerCurrentHand = dealtCard}
    else {playerCurrentHand = `${playerCurrentHand},${dealtCard}`}

    // rewrite deck in database
    await writeDeckToDatabase(sessionId, currentDeck)
  
    // rewrite player's hand
    await writeHandToDatabase(sessionId,playerId, playerCurrentHand)


    // calculate hand 
    let value = await calculatePlayerCardValue(sessionId, playerId)
    await writeValueToDatabase(sessionId, playerId, value)
  // } catch (error){console.error('[/playerHit] Error: ', error)}
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
                return [parseInt(total + 10),parseInt(total + 11)]
            }
        }
        // [THREE CARDS]:
        else if (hand.length == 3){
  
            if (aces  == 1){
              return [parseInt(total+1), parseInt(total+10)]
            }
  
            else if (aces == 2){
              return [parseInt(total+2),parseInt(total+11)]
            }
  
            else{
              return [21]
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
  

  return determineValue(hand)
}

function generateSessionCode(){
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}


async function checkExistingSession(sessionId){
  const db = getDatabase()
  const sessionRef = ref(db, `/project-bunluck/sessions/${sessionId}`)
  try{
    const snapshot = await get(sessionRef)
    return snapshot.exists()
  } catch(error){
    console.log('[Error] {checkExistingSession}')
      throw error
  }
}

async function checkSessionRestart(sessionId){
  const db = getDatabase()
  const sessionRef = ref(db, `/project-bunluck/sessions/${sessionId}/Restart`)
  try{
    const snapshot = await get(sessionRef)
    return snapshot.val()
  } catch(error){
    console.log('[Error] {checkSessionRestart}')
      throw error
  }
}

async function changeSessionRestartStatus(sessionId){
  const db = getDatabase()
  const restartRef = ref(db, `/project-bunluck/sessions/${sessionId}/Restart`)
  try {
    // Update the value of restartRef to 'False'
    await set(restartRef, 'False');
  } catch (error) {
    console.error('Error updating restart value:', error);
  }
}

async function loadExistingSession(sessionId){
  const db = getDatabase()
  sessionRef = ref(db, `/project-bunluck/sessions/${sessionId}/players`)

  try{
    const snapshot = await get(sessionRef)
    if (snapshot.exists()){
      return snapshot.val()
    } 
  } catch (error) {
    console.log('[Error] {loadExistingSession}')
    throw error
  }
}



// Firebase [WRITE]
function createSession(username) {
  const db = getDatabase();
  const sessionCode = generateSessionCode() // generate unique session code
  const sessionRef = push(ref(db, '/project-bunluck/sessions')); // Generate unique session ID
  const sessionId = sessionRef.key; // Get the generated session ID

  const playerRef = push(ref(db, `/project-bunluck/sessions/${sessionId}/players`)); // Generate unique player ID
  const playerId = playerRef.key; // Get the generated player ID
  // Store the session ID and player's username along with their player ID in the database
  set(sessionRef, {
    sessionId: sessionId,
    createdAt: new Date().toISOString(), // Timestamp indicating when the session was created
    Restart: 'True',
    sessionCode: sessionCode
  });
  
  set(playerRef, {
    username: username,
    currentHand : 'undefined',
    value : 'undefined',
    endTurn: 'undefined',
    banker: 'False'
  });

  // // dummy account
  // const bankerRef = push(ref(db, `/project-bunluck/sessions/${sessionId}/players`)); // Generate unique dummy ID
  // bankerId = bankerRef.key; 

  // set(bankerRef, {
  //   username: 'Banker',
  //   currentHand : 'undefined',
  //   value : 'undefined',
  //   endTurn: 'undefined',
  //   banker: 'True'
  // });

  return { sessionId: sessionId, playerId: playerId, sessionCode: sessionCode };
}

function writePlayerToSession(sessionId, username){
  const db = getDatabase()
  const playerRef = push(ref(db, `/project-bunluck/sessions/${sessionId}/players`)); // Generate unique player ID
  const playerId = playerRef.key;

  set(playerRef, {
    username: username,
    currentHand : 'undefined',
    value : 'undefined',
    endTurn: 'undefined',
    banker: 'False'
  });

  return { sessionId: sessionId, playerId: playerId};


}

function writeDeckToDatabase(sessionId, deck) {
  const db = getDatabase();
  const deckRef = ref(db, `/project-bunluck/sessions/${sessionId}/deck`);

  set(deckRef, deck)
    .then(() => {
      // console.log('Deck data written to the database under session ID:', sessionId);
    })
    .catch((error) => {
      console.error('[/playerHit] Error writing deck data to the database:', error);
    });
}

function writeHandToDatabase(sessionId, playerId, data){
  const db = getDatabase()
  const handRef = ref(db, `/project-bunluck/sessions/${sessionId}/players/${playerId}/currentHand`)

  set(handRef, data)
    .then( () => {
      // console.log(`Data written to the database under: /${sessionId}/${playerId}`);
    })
    .catch( (error) => {
      console.error('[/playerHit] Error writing hand data to the database:', error);
    })
}

function writeValueToDatabase(sessionId, playerId, value){
  const db = getDatabase()
  const valueRef = ref(db, `/project-bunluck/sessions/${sessionId}/players/${playerId}/value`)

  set(valueRef, value)
    .then( () => {
      // console.log(`Value written to the database under: /${sessionId}/${playerId}`);
    })
    .catch( (error) => {
      console.error('[Write Value] Error writing hand data to the database:', error);
    })
}

// Firebase [GET]

async function getPlayers(sessionId){
  const db = getDatabase()
  sessionRef = ref(db, `/project-bunluck/sessions/${sessionId}/players`)

  try{
    const snapshot = await get(sessionRef)
    if (snapshot.exists()){
      return Object.keys(snapshot.val())
    } 
  } catch (error) {
    console.log('[Error] {loadExistingSession}')
    throw error
  }
}

async function getSessionId(sessionCode){
  const db = getDatabase()
  const sessionSnapshot = await get(ref(db, '/project-bunluck/sessions'))

  if (sessionSnapshot.exists()){
    const sessions = sessionSnapshot.val();
    for (const sessionId in sessions){
      if (sessions[sessionId].sessionCode === sessionCode){
        return sessionId
      }
    }
    return false
  }
  else{
    throw new Error('Game with the provided code not found');
  }



}

async function getDeck(sessionId) {
  // jibai firebase only can async. Need to use promise to wait for data to be resolved so that it is 'Synchronous' (refer to func [fetchData for usage])
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const deckRef = ref(db, `/project-bunluck/sessions/${sessionId}/deck`);

    onValue(deckRef, (snapshot) => {
      const deck = snapshot.val();
      resolve(deck);
    }, (error) => {
      console.error('Error fetching deck:', error);
      reject(error);
    });
  });
}

async function getHand(sessionId, playerId){
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const handRef = ref(db, `/project-bunluck/sessions/${sessionId}/players/${playerId}/currentHand`);

    onValue(handRef, (snapshot) => {
      const hand = snapshot.val();
      resolve(hand);
    }, (error) => {
      console.error('Error fetching deck:', error);
      reject(error);
    });
  });
}

async function getValue(sessionId, playerId){
  return new Promise((resolve, reject) => {
    const db = getDatabase();
    const valueRef = ref(db, `/project-bunluck/sessions/${sessionId}/players/${playerId}/value`);

    onValue(valueRef, (snapshot) => {
      const value = snapshot.val();
      resolve(value);
    }, (error) => {
      console.error('Error fetching deck:', error);
      reject(error);
    });
  });
}

async function restartGame(sessionId){
  try{
    const db = getDatabase()
    const sessionRef = ref(db, `/project-bunluck/sessions/${sessionId}`)
  
    const snapshot = await get(sessionRef);
  
    if (snapshot.exists()) {
      const data = snapshot.val();
      const updates = {}; // obj to hold all updates

      // change restart var to 'True'
      updates['Restart'] = 'True'
    
      // Update currentHand and value for each player
      if (data.players) {
        Object.keys(data.players).forEach(playerId => {
          updates[`players/${playerId}/currentHand`] = 'undefined';
          updates[`players/${playerId}/value`] = 'undefined';
        });
      }
      
      // Write the updates to the database
      await update(sessionRef, updates);
    }
  } catch(error){
    console.error('Error rewriting nodes: ' + error)
  }

}


async function chat(sessionId, playerId, username, chatData){
  const db = getDatabase()
  const chatRef = ref(db, `/project-bunluck/sessions/${sessionId}/chat`)

  const newMessageRef = push(chatRef); // Generate a unique message ID

  // message object
  const messageObj = {
    senderId: playerId,
    senderUsername: username,
    message: chatData,
    timeStamp: new Date().toString()
  }

  //push message into fb node'
  set(newMessageRef, messageObj)
  .catch((error) => {
    console.error('Error sending message: ' + error)
  })

}

function escapeHtml(str){
  const htmlEscapes = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  };
  return str.replace(/[&<>"']/g, (char) => htmlEscapes[char]);  
}


// CONNECTION LOGIC:
// Handle 'connect' event
io.on('connection', (socket) => {
  socket.on('sessionId', async (sessionId, playerId) => {
    const current_sessionId = sessionId
    const current_playerId = playerId

    // check if session already exist: 
    let sessionCheck = await checkExistingSession(sessionId)
    if (!sessionCheck){
      console.log("[ DO SOMETHING ]")
      // should not run for now!!!

      // Deal initial cards when a client connects
      // startGame(socket, current_sessionId, current_playerId);
    }
    else{
      let sessionRestart = await checkSessionRestart(sessionId)
      if (sessionRestart === 'True'){

        // wait until minimum of 2 players AND all players are ready
        const currentPlayers = await getPlayers(sessionId)
        // console.log(currentPlayers)
        console.log(currentPlayers.length)

        if (currentPlayers.length >= 2){
          console.log('normal')
        }
        else{
          console.log('wtf?')
        }

        // startGame(socket, current_sessionId, current_playerId);
      }
      else{
        console.log("[ Load Existing Session ]")
        let sessionData = await loadExistingSession(sessionId)

        socket.emit('loadExistingSession', sessionData)
      }
    }

  // Handle [Hit]  requests
  socket.on('playerHit', async (sessionId, playerId) => {

    // get current player's hand
    let playerHand = (await getHand(sessionId, playerId)).split(',')

    // check card amount (card amount cannot > 5)
    if (playerHand.length >= 5){
      socket.emit('error_card_length_5')
    }
    else{
      await playerHit(sessionId, playerId)
      let sessionData = await loadExistingSession(sessionId)
      socket.emit('loadExistingSession', sessionData)    }
  } )

  // // Handle [Stand] requests

  //  FAKE BANKER (TO BE CHANGED TO REAL BANKER -> WILL RUN ON DEFAULT IF PLAYER UNRESPONSIVE THOUGH)
  socket.on('playerStand', async (sessionId, playerId) => {
    while (true){
      let current_value = await getValue(sessionId, bankerId)
      if (current_value.length == 1){
        // check for BanLuck/BanBan
        if (typeof(current_value) == 'string' || current_value > 21){
          break
        }
        else if (current_value <= 16){
          await playerHit(sessionId, bankerId)
        }
        else{ // values between 17 and 21
          break 
        }
      }
  
      else{
        if ((current_value[0] >= 17 && current_value[0] <= 21) || (current_value[1] >= 17 && current_value[1] <= 21)){
          // if (current_value[0] > current_value[1]){
          //   return current_value[0]
          // } else{
          //   return current_value[1]
          // }
          break
        }
        else if ((current_value[0] > 21) && (current_value[1] > 21)){
          break
        }
        else{
          await playerHit(sessionId, bankerId)
        }
      }
    }

    let sessionData = await loadExistingSession(sessionId)
    socket.emit('loadExistingSession', sessionData)


  })
})

socket.on('chat', async (sessionId, playerId, username, chatData) => {

  // Escape HTML entities
  const sanitizedUsername = escapeHtml(username); 
  const sanitizedChatData = escapeHtml(chatData); 
  
  chat(sessionId, playerId, username, sanitizedChatData) // push data to database

  // send this data to everyone (including sender) [!! Only sends the new message !!]
  // improvements to make:
  // 1) if client is connected: only send the new message
  // 2) if client is new, send the latest 20 message
  // 3) every 10mins, refresh the chat (delete everything except the latest 20 message) 
  socket.emit('chat_broadcast', sanitizedUsername, sanitizedChatData)

})


socket.on('restartGame', async (sessionId, playerId) => {
    restartGame(sessionId) //erase all relevant data from db
  })

  // Handle client disconnect
socket.on('disconnect', () => {
    // if (socket.sessionId){
    //   deleteSession(socket.sessionId)
    // }
    // console.log('A client disconnected');
});

})

// handle data from index.html
app.post('/form_createRoom', (req, res) => {
  const username = req.body.username;
  try{
    // create session and add player into current session
    data = createSession(username)

    // send success response with generated session ID
    res.status(200).json({ success: true, sessionId: data.sessionId , playerId: data.playerId, sessionCode: data.sessionCode});
  }
  catch(e){
    console.log(e)
    res.status(400).json({ success: false, message: 'Failed to create session.'})
  }


})

app.post('/form_joinRoom', async (req, res) => {
  const username = req.body.username;
  const sessionCode = req.body.sessionCode;

  // try{
    const sessionId = await getSessionId(sessionCode)

    if (sessionId != false){
      // add player into database
      data = writePlayerToSession(sessionId, username)

      res.status(200).json({ success: true, sessionId: data.sessionId , playerId: data.playerId, sessionCode: sessionCode});
    }
    else{
      res.status(404).json({ success: false, message: "Session not found" });
    }
  // } catch (error){
  //   console.log(error)
  // }
})




// Start the server
const PORT = process.env.PORT || 8888;
server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});



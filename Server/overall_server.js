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
  const { randomBytes } = require('crypto');
  const { read } = require('fs');
  const { promises } = require('dns');
  
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
  
  async function startGame(socket, sessionId, players) {
    deck = initializeDeck()
  
    //write data to firebase
    writeDeckToDatabase(sessionId, deck)
  
    for (let playerIndex = 0; playerIndex < players.length; playerIndex++ ){
      await drawInitialHand(sessionId, players[playerIndex])
    }
  
    let sessionData = await loadExistingSession(sessionId)
    io.to(sessionId).emit('loadExistingSession', sessionData)
  
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
  
  async function getSessionInfo(sessionId){
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
  
  async function getPartyLeader(sessionId){
    const db = getDatabase()
    gamestateRef = ref(db, `/project-bunluck/sessions/${sessionId}/gameState/partyLeader`)
  
    try{
      const snapshot = await get(gamestateRef)
      if (snapshot.exists()){
        return snapshot.val()
      }
  
    } catch (error){
      console.log('[Error] {getPartyLeader}')
      throw error  
    }
  
  }
  
  async function getFullOrder(sessionId){
    const db = getDatabase()
  
    orderRef = ref(db, `/project-bunluck/sessions/${sessionId}/gameState/Order`)
    try{
      const snapshot = await get(orderRef)
      if (snapshot.exists()){
        return snapshot.val()
      }
  
    } catch (error){
      console.log('[Error] {getOrder}')
      throw error
    }
  }
  
  async function getCurrentOrder(sessionId){
    const db = getDatabase()
    currentOrderRef = ref(db, `/project-bunluck/sessions/${sessionId}/gameState/currentOrder`)
    try{
      const snapshot = await get(currentOrderRef)
      if (snapshot.exists()){
        return snapshot.val()
      }
  
    } catch (error){
      console.log('[Error] {getOrder}')
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
    
  
    // [IMPT] to be removed and change to subset under 'gameStatus'
    set(sessionRef, {
      sessionId: sessionId,
      createdAt: new Date().toISOString(), // Timestamp indicating when the session was created
      Restart: 'True',
      sessionCode: sessionCode
    });
  
    set(ref(db, `/project-bunluck/sessions/${sessionId}/gameState`), {
      sessionId: sessionId,
      createdAt: new Date().toISOString(), // Timestamp indicating when the session was created
      Restart: 'True',
      sessionCode: sessionCode,
      partyLeader: playerId,
      gameStatus: 'undefined',
      Bets: {
        bettingTimerEnd: 'undefined',
        resetTimerBoolean: 'True'
      },
      Order: {
        0 : 'undefined'
      },
      currentOrder: 'undefined',
      outcome: 'undefined'
    })
    
    set(playerRef, {
      username: username,
      currentHand : 'undefined',
      value : 'undefined',
      endTurn: 'undefined',
      banker: 'True',
      readyStatus: 'False',
      bets: {
        playerBalance: 1000,
        currentBet: 0
      }
    });
  
    return { sessionId: sessionId, playerId: playerId, sessionCode: sessionCode, role: 'banker'};
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
      banker: 'False',
      readyStatus: 'False',
      bets: {
        playerBalance: 1000,
        currentBet: 0
      }
    });
  
    return { sessionId: sessionId, playerId: playerId, role: 'player'};
  
  
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
  
  async function toggleReadyStatus(sessionId, playerId){
    // highly likely will be fucked if called at the exact same time.
    const db = getDatabase()
  
    // get current ready status.
    const readyStatusRef = ref(db, `/project-bunluck/sessions/${sessionId}/players/${playerId}/readyStatus`)
    try{
      const snapshot = await get(readyStatusRef)
      if (snapshot.val() == 'True'){
        set(ref(db, `/project-bunluck/sessions/${sessionId}/players/${playerId}/readyStatus`), 'False')
        .then( () => {
          // console.log(`Data written to the database under: /${sessionId}/${playerId}`);
        })
        .catch( (error) => {
          console.error('[/playerHit] Error writing hand data to the database:', error);
        })
      }
      else{
        set(ref(db, `/project-bunluck/sessions/${sessionId}/players/${playerId}/readyStatus`), 'True')
        .then( () => {
          // console.log(`Data written to the database under: /${sessionId}/${playerId}`);
        })
        .catch( (error) => {
          console.error('[/playerHit] Error writing hand data to the database:', error);
        })
      }
  
      // get obj of all 'ready-ed' players
      const snapshotV2 = await get(ref(db, `/project-bunluck/sessions/${sessionId}/players/`))
  
      const readyUserIds = Object.entries(snapshotV2.val()).reduce((acc, [key, value]) => {
        acc[key] = value.readyStatus;
        return acc;
      }, {});
  
      return readyUserIds
  
     } catch (error){
      console.error(error)
    }
  }  
  
  
  async function getReadyStatus(sessionId){
    const db = getDatabase()
  
    const snapshot = await get(ref(db, `/project-bunluck/sessions/${sessionId}/players/`))
    const readyUserIds = Object.entries(snapshot.val()).reduce((acc, [key, value]) => {
      acc[key] = value.readyStatus;
      return acc;
    }, {});
  
    return readyUserIds
  }
  
  function changeGameStatus(sessionId, gameStatus){
    const db = getDatabase()
  
    const valueRef = ref(db, `/project-bunluck/sessions/${sessionId}/gameState/gameStatus`)
    set(valueRef, gameStatus)
    .then( () => {
      return true
    })
    .catch( (error) => {
      console.error('[Write Value] Error writing hand data to the database: ', error);
    })
  
  }
  
  function generateNewBettingPhaseEndtime(sessionId, timeAllocated){
    const db = getDatabase()
    const dbRef = ref(db, `/project-bunluck/sessions/${sessionId}/gameState/Bets/bettingTimerEnd`)
  
    set(dbRef, (Date.now() + parseInt(timeAllocated) * 1000))
    .then(() => {
      // toogle [resetTimerBoolean] to false
      set(ref(db, `/project-bunluck/sessions/${sessionId}/gameState/Bets/resetTimerBoolean`) , 'False')
      .then(() => {
        return true
      })
      .catch( (error) => {
        console.error('[bettingPhaseTimer] Error writing data to the database: ', error);
      })
    })
    .catch( (error) => {
      console.error('[bettingPhaseTimer] Error writing data to the database: ', error);
    })
  }
  
  
  
  function writePlayerBets(sessionId, playerId, betAmount){
    const db = getDatabase()
    dbRef = ref(db, `/project-bunluck/sessions/${sessionId}/players/${playerId}/bets/currentBet`)
  
    set(dbRef, betAmount)
    .then( () => {
      return true
    })
    .catch( (error) => {
      console.error('[Write Value] Error writing hand data to the database: ', error);
    })
  
  
  
  }
  
  
  async function setOrderOfPlayers(sessionId){
    // function will overwrite previous orders
  
    orderObj = {}
    const db = getDatabase()
    try {
        // get all current players
      currentPlayers = await getPlayersId(sessionId) // returns an array of playerIds
      
      currentPlayers.forEach((playerId, index) => {
        orderObj[index] = playerId
      })
  
      orderRef = ref(db, `/project-bunluck/sessions/${sessionId}/gameState/Order`)
      set(orderRef, orderObj)
    } catch (error){
      console.log('[Error] {setOrderOfPlayers}')
      throw error
    }
  }
  
  function setCurrentOrder(sessionId, order){
    const db = getDatabase()
    currentOrderRef = ref(db, `/project-bunluck/sessions/${sessionId}/gameState/currentOrder`)
    try{
      set(currentOrderRef, order)
    } catch(error) {
      console.log('[Error] {setCurrentOrder}')
      throw error
    }
  }
  
  
  // DOING DOING  DOING  DOING  DOING  DOING  DOING  DOING  DOING 
  // DOING DOING  DOING  DOING  DOING  DOING  DOING  DOING  DOING 
  // DOING DOING  DOING  DOING  DOING  DOING  DOING  DOING  DOING 
  
  // There will be 3 different types of ways to 'EndGame'
  // 1) Normal open all (endGameOpenAll)
  // 2) Open single (banker Only)
  // 3) Open single (player)
  // 3) Open at the start (only for banban and banluck)
  // 4) WU LONG 5 Card
  


async function endGameOpenAll(sessionId){
  const data = await getAllInfo(sessionId)

  // initialise first oni
  const outcome = []
  var tempt_totalBetAmount = 0

    let bankerId = null
    let bankerBalance = null
    let bankerCardValue = null

  
  // get banker's Card Value
  for (let key in data) {
    if (data[key].banker === 'True') {
        bankerId = key
        bankerBalance = data[key].bets.playerBalance
        bankerCardValue = data[key].value[0];
        break;
    }
  }
  
  // Check each player's value against the banker's value
  for (let key in data) {
    const playerData = data[key]
    const playerValue = playerData.value[0]

    // skip to next player if currentPlayer == banker
    if (playerData.banker == 'True'){continue}
    
  // main comparison logic
  if (playerValue === "BanLuck" || playerValue === "BanBan") {
    if (bankerCardValue === "BanLuck" || bankerCardValue === "BanBan") {
        if (bankerCardValue === "BanBan" && playerValue === "BanLuck") {
            // Banker wins with BanBan against player's BanLuck
            let multiplier = 3;
            tempt_totalBetAmount += playerData.bets.currentBet * multiplier;
            outcome.push({
                [key]: {
                    betAmount: playerData.bets.currentBet,
                    playerBalance: playerData.bets.playerBalance - playerData.bets.currentBet * multiplier
                }
            });
        } else if (bankerCardValue === "BanLuck" && playerValue === "BanBan") {
            // Player wins with BanBan against banker's BanLuck
            let multiplier = 3;
            tempt_totalBetAmount -= playerData.bets.currentBet * multiplier;
            outcome.push({
                [key]: {
                    betAmount: playerData.bets.currentBet,
                    playerBalance: playerData.bets.playerBalance + playerData.bets.currentBet * multiplier
                }
            });
        } else {
            // Both player and banker have the same special hands, it's a tie
            outcome.push({
                [key]: {
                    betAmount: playerData.bets.currentBet,
                    playerBalance: playerData.bets.playerBalance
                }
            });
        }
    } else {
        // Player wins with a special hand
        let multiplier = playerValue === "BanLuck" ? 2 : 3;
        tempt_totalBetAmount -= playerData.bets.currentBet * multiplier;
        outcome.push({
            [key]: {
                betAmount: playerData.bets.currentBet,
                playerBalance: playerData.bets.playerBalance + playerData.bets.currentBet * multiplier
            }
        });
    }
  } else if (bankerCardValue === "BanLuck" || bankerCardValue === "BanBan") {
    // Banker wins with a special hand
    let multiplier = bankerCardValue === "BanLuck" ? 2 : 3;
    tempt_totalBetAmount += playerData.bets.currentBet * multiplier;
    outcome.push({
        [key]: {
            betAmount: playerData.bets.currentBet,
            playerBalance: playerData.bets.playerBalance - playerData.bets.currentBet * multiplier
        }
    });
  } else if (playerValue > 21) {
    if (bankerCardValue > 21) {
        tempt_totalBetAmount += 0;
        outcome.push({
            [key]: {
                betAmount: playerData.bets.currentBet,
                playerBalance: playerData.bets.playerBalance
            }
        });
    } else {
        tempt_totalBetAmount += playerData.bets.currentBet;
        outcome.push({
            [key]: {
                betAmount: playerData.bets.currentBet,
                playerBalance: playerData.bets.playerBalance - playerData.bets.currentBet
            }
        });
    }
  } else if (bankerCardValue > 21 || (playerValue <= 21 && playerValue > bankerCardValue)) {
    tempt_totalBetAmount -= playerData.bets.currentBet;
    outcome.push({
        [key]: {
            betAmount: playerData.bets.currentBet,
            playerBalance: playerData.bets.playerBalance + playerData.bets.currentBet
        }
    });
  } else if (playerValue < bankerCardValue) {
    tempt_totalBetAmount += playerData.bets.currentBet;
    outcome.push({
        [key]: {
            betAmount: playerData.bets.currentBet,
            playerBalance: playerData.bets.playerBalance - playerData.bets.currentBet
        }
    });
  } else {
    tempt_totalBetAmount += 0;
    outcome.push({
        [key]: {
            betAmount: playerData.bets.currentBet,
            playerBalance: playerData.bets.playerBalance
        }
    });
  }
  }
  

  outcome.push({
    [bankerId] : {
      playerBalance: bankerBalance + tempt_totalBetAmount
    }
  })

  return outcome
}



  

  
  
  
  
  
  
  async function getAllInfo(sessionId){
    const db = getDatabase()
    sessionRef = ref(db, `/project-bunluck/sessions/${sessionId}/players`)
    try{
      const snapshot = await get(sessionRef)
      return snapshot.val()
    } catch (error) {
      console.log('[Error] {loadExistingSession}')
      throw error
    }
  }
  
  async function writeOutcome(sessionId, outcome){
    // const db = getDatabase()
    // sessionRef = ref(db, `/project-bunluck/sessions/${sessionId}/gameState/outcome`)
    // set(sessionRef, {
    //   winners: outcome.winners,
    //   losers: outcome.losers,
    //   draws: outcome.draws
    // })
  
  }
  
  
  
  
  // DOING DOING  DOING  DOING  DOING  DOING  DOING  DOING  DOING 
  // DOING DOING  DOING  DOING  DOING  DOING  DOING  DOING  DOING 
  // DOING DOING  DOING  DOING  DOING  DOING  DOING  DOING  DOING 
  
  
  
  
  // 
  
  
  // Firebase [GET]
  
  async function getPlayersId(sessionId){
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
  
  async function getGameStatus(sessionId){
    try{
      const db = getDatabase()
      const gameStatusRef = ref(db, `/project-bunluck/sessions/${sessionId}/gameState/gameStatus`)
      const snapshot = await get(gameStatusRef);
  
      if (snapshot.exists()){
        return snapshot.val()
      }
      else{
        console.error('Error obtaining [GameStatus]: <snapshot does not exist>')
      }
  
  
    } catch(error){
      console.error('Error obtaining [GameStatus]: ' + error)
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
  
  async function getBettingPhaseInfo(sessionId){
    const db = getDatabase()
    dbRef = ref(db, `/project-bunluck/sessions/${sessionId}/gameState/Bets`)
  
    try{
      const snapshot = await get(dbRef)
      if (snapshot.exists()){
        return snapshot.val()
      }
      else{
        console.log('[NO DATA] @ FUNCTION [checkBettingPhaseTimer]')
      }
    }
    catch (error) {
      console.log('[Error] @ FUNCTION [checkBettingPhaseTimer]')
    }
  }
  
  
  
  // OTHER FUNCTIONS:
  async function bettingPhase(socket, sessionId){
    // define time allowed for betting: (e.g. 15 seconds)
    timeAllocated = 3
  
    // check if bettingPhaseTimer needs reset:
    overwriteBettingPhaseEndtime = await getBettingPhaseInfo(sessionId)
  
    // overwrite current bettingEndTime
    if (overwriteBettingPhaseEndtime['resetTimerBoolean'] == 'True'){
      await generateNewBettingPhaseEndtime(sessionId, timeAllocated)
      overwriteBettingPhaseEndtime = await getBettingPhaseInfo(sessionId)
    }     
  
    // send bettingTime to clients
    io.to(sessionId).emit('bettingPhase', overwriteBettingPhaseEndtime['bettingTimerEnd'])
  
  
    // new promise which resolves when bettingPhase timer completes
    return new Promise( (resolve) => {
      const bettingPhaseDuration = timeAllocated * 1000
      const timer = setTimeout( () => {
        resolve()
      }, bettingPhaseDuration)
  
      socket.on('playerBets', (dataObj) => {
        writePlayerBets(dataObj['sessionId'], dataObj['playerId'], dataObj['betAmount'])
      })
  
    })
  }
  
  async function configuringOrder(sessionId){
    // set the current order of players and set the first player to be first turn.
    await setOrderOfPlayers(sessionId)
    const orders =  await getFullOrder(sessionId)
    setCurrentOrder(sessionId, 0)
  }
  
  
  // function to handle player's turn using <recursion>
  async function assignPlayerTurn(socket, sessionId){
    const fullOrder = await getFullOrder(sessionId)
  
    // function to handle current player's turn
    async function handleCurrentTurn(){
      // get currentPlayer's turn
      const currentOrder = fullOrder[await getCurrentOrder(sessionId)]
      
      // socket broadcast current client's turn
      io.to(sessionId).emit('assignPlayerTurn', currentOrder, fullOrder)
  
      // Handle player[HIT] || player[STAND] REQUESTS
      socket.once('playerHit', async (sessionId, playerId) => {
  
        // get the correct order from database
        currentPlayerIdOrderIndex = await getCurrentOrder(sessionId)
  
        if (playerId === fullOrder[currentPlayerIdOrderIndex]){
          // get current player's hand
          let playerHand = (await getHand(sessionId, playerId)).split(',')
    
          // check card amount (card amount cannot > 5)
          if (playerHand.length >= 5){
            socket.emit('error_card_length_5')
          }
          else{
            await playerHit(sessionId, playerId)
            let sessionData = await loadExistingSession(sessionId)
            io.to(sessionId).emit('loadExistingSession', sessionData)    
          }
        }
        else{
          socket.emit('error', 'The first IF')
        }
        // Move to the next player's turn
        // handleNextPlayer();
        handleCurrentTurn()
      })
  
      socket.once('playerStand', async (sessionId, playerId) => {
  
        // get the correct order from database
        currentPlayerIdOrderIndex = await getCurrentOrder(sessionId)
  
        if (playerId === fullOrder[currentPlayerIdOrderIndex]){
          // check if currentPlayer is last in order:
            if (currentPlayerIdOrderIndex === fullOrder.length - 1) {
              console.log('ROUND END')
              const outcome = await endGameOpenAll(sessionId)

              writeOutcome(sessionId, outcome)
              
              changeGameStatus(sessionId, 'completed')

              io.to(sessionId).emit('gameEnd', outcome)

              console.log('[GAME END]')  
  
            }
            else{
              // Change order to next person
              setCurrentOrder(sessionId, (currentPlayerIdOrderIndex + 1))
              // handleNextPlayer();
              handleCurrentTurn()
            }
        }
        else{
          socket.emit('error', 'The Second If')
          console.log(currentPlayerOrderIndex)
        }
      })
    }
  
    // async function handleNextPlayer(){
    //   handleCurrentTurn()
    // }
    
    handleCurrentTurn()
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
  
        // startGame(socket, current_sessionId, current_playerId);
      }
      else{
        let sessionRestart = await checkSessionRestart(sessionId)
  
        // create socket rooms for all clients in same session
        socket.join(sessionId)
        if (sessionRestart === 'True'){
          // wait until minimum of 2 players AND all players are ready
          const currentPlayers = await getPlayersId(sessionId)
  
          if (currentPlayers.length >= 2){ 
            const currentGameStatus = await getGameStatus(sessionId)
            if (currentGameStatus == 'undefined' || currentGameStatus == 'completed') {
  
  
              // [START OF GAME LOGIC]
              await configuringOrder(sessionId)
              await bettingPhase(socket, sessionId);
  
              
              const gameStatus = await getGameStatus(sessionId)
  
              if (gameStatus != 'inProgress'){
                // startGame (initialize deck) -> [using gameStatus as checkflag so startGame ONLY runs once]
                startGame(socket, sessionId, currentPlayers)
  
                // chanage gameStatus to in progress            
                changeGameStatus(sessionId, 'inProgress')
              }
  
              assignPlayerTurn(socket, sessionId)
  
              // function to end the game.
  
  
            }
            else{
              // console.log("[ Load Existing Session ]")
              let sessionData = await loadExistingSession(sessionId)
              socket.emit('loadExistingSession', sessionData)
            }
          }
          else{
            socket.emit('NotEnoughPlayers')
          }
  
        }
        else{
          console.log("[ Load Existing Session ]")
          let sessionData = await loadExistingSession(sessionId)
          socket.emit('loadExistingSession', sessionData)
  
          assignPlayerTurn(socket, sessionId)
        }
      }
  
    // // Handle [Hit]  requests
    // socket.on('playerHit', async (sessionId, playerId) => {
  
    //   // get current player's hand
    //   let playerHand = (await getHand(sessionId, playerId)).split(',')
  
    //   // check card amount (card amount cannot > 5)
    //   if (playerHand.length >= 5){
    //     socket.emit('error_card_length_5')
    //   }
    //   else{
    //     await playerHit(sessionId, playerId)
    //     let sessionData = await loadExistingSession(sessionId)
    //     io.to(sessionId).emit('loadExistingSession', sessionData)    }
    // } )
  
  
  
  
    // // // Handle [Stand] requests
  
    // //  FAKE BANKER (TO BE CHANGED TO REAL BANKER -> WILL RUN ON DEFAULT IF PLAYER UNRESPONSIVE THOUGH)
    // socket.on('playerStand', async (sessionId, playerId) => {
    //   while (true){
    //     let current_value = await getValue(sessionId, bankerId)
    //     if (current_value.length == 1){
    //       // check for BanLuck/BanBan
    //       if (typeof(current_value) == 'string' || current_value > 21){
    //         break
    //       }
    //       else if (current_value <= 16){
    //         await playerHit(sessionId, bankerId)
    //       }
    //       else{ // values between 17 and 21
    //         break 
    //       }
    //     }
    
    //     else{
    //       if ((current_value[0] >= 17 && current_value[0] <= 21) || (current_value[1] >= 17 && current_value[1] <= 21)){
    //         // if (current_value[0] > current_value[1]){
    //         //   return current_value[0]
    //         // } else{
    //         //   return current_value[1]
    //         // }
    //         break
    //       }
    //       else if ((current_value[0] > 21) && (current_value[1] > 21)){
    //         break
    //       }
    //       else{
    //         await playerHit(sessionId, bankerId)
    //       }
    //     }
    //   }
  
    //   let sessionData = await loadExistingSession(sessionId)
    //   socket.emit('loadExistingSession', sessionData)
  
  
    // })
  
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
  
  });
  
  socket.on('waitingRoom', async (sessionId) => {
    // should put socket.join upper in the hierarchy [IMPT]
    socket.join(sessionId)
    let sessionInfo = await getSessionInfo(sessionId)
    io.to(sessionId).emit('waitingRoom', sessionInfo)
  })
  
  socket.on('readyStatus', async (sessionId, playerId) => {
    const readyUserIds = await toggleReadyStatus(sessionId, playerId)
    io.to(sessionId).emit('renderReadyStatus', readyUserIds) 
  
    // check if all players are ready.
    const allPlayersReady = Object.values(readyUserIds).every(value => value === 'True');
  
      // all players are ready
    if (allPlayersReady){
      let partyLeader = await getPartyLeader(sessionId) // change 'startGame button display to true'
      io.to(sessionId).emit('allPlayersReady', true, partyLeader)
    }
  })
  
  
  socket.on('redirect_to_game', async (sessionId, playerId) => {
    try{
    // check if sender is party leader
      let partyLeader = await getPartyLeader(sessionId)
  
      if (playerId == partyLeader){
        // check if all players are ready
        const allPlayersReady = Object.values(await getReadyStatus(sessionId, playerId)).every(value => value === 'True');
        if (allPlayersReady){
          io.to(sessionId).emit('redirect_all_clients_to_game')
        }
      }
    } catch (e){
      io.to(sessionId).emit('error', 'Oops! Something bad happened.')
      console.log(e)
    }
  
  })
  
  })
  
  
  // handle data from index.html
  app.post('/form_createRoom', (req, res) => {
    const username = req.body.username;
    try{
      // create session and add player into current session
      data = createSession(username)
  
      // send success response with generated session ID
      res.status(200).json({ success: true, sessionId: data.sessionId , playerId: data.playerId, sessionCode: data.sessionCode, role: data.role});
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
  
        res.status(200).json({ success: true, sessionId: data.sessionId , playerId: data.playerId, sessionCode: sessionCode, role: data.role});
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
  
  
  
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
  
  async function startGame(socket, sessionId, players){
    await changeGameInitializationStatus(sessionId, 'INPROGRESS')
    // // [START OF GAME LOGIC]
    deck = initializeDeck()
    //write data to firebase
    writeDeckToDatabase(sessionId, deck)
    for (let playerIndex = 0; playerIndex < players.length; playerIndex++ ){
      await drawInitialHand(sessionId, players[playerIndex])
    }

    await changeGameInitializationStatus(sessionId, 'COMPLETED')
    let sessionData = await loadExistingSession(sessionId)
    io.to(sessionId).emit('loadExistingSession', sessionData)

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
  
  async function GetgameInitializationStatus(sessionId){
    const db = getDatabase()
    const sessionRef = ref(db, `/project-bunluck/sessions/${sessionId}/gameState/gameInitializationStatus`)
    try{
      const snapshot = await get(sessionRef)
      return snapshot.val()
    } catch(error){
      console.log('[Error] {checkSessionRestart}')
        throw error
    }
  }
  

  async function changeGameInitializationStatus(sessionId, value){
    const db = getDatabase()
    const restartRef = ref(db, `/project-bunluck/sessions/${sessionId}/gameState/gameInitializationStatus`)
    try {
      // Update the value of restartRef to either [INPROGRESS or COMPLETED]
      await set(restartRef, value);
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
      sessionCode: sessionCode
    });
  
    set(ref(db, `/project-bunluck/sessions/${sessionId}/gameState`), {
      gameInitializationStatus: 'INPROGRESS', // either [INPROGRESS or COMPLETED]
      partyLeader: playerId,
      gameStatus: 'new',
      Bets: {
        bettingTimerEnd: 'undefined',
        resetTimerBoolean: 'True'
      },
      Order: {
        0 : 'undefined'
      },
      currentOrder: 'undefined',
    })
    
    set(playerRef, {
      username: username,
      currentHand : 'undefined',
      value : 'undefined',
      banker: 'True',
      readyStatus: 'False',
      bets: {
        playerBalance: 1000,
        currentBet: 0
      },
      competedWithBanker: null // by right banker dont need 
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
      banker: 'False',
      readyStatus: 'False',
      bets: {
        playerBalance: 1000,
        currentBet: 0
      },
      competedWithBanker: false

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
    
  function setCurrentOrder(sessionId, order){
    const db = getDatabase()
    currentOrderRef = ref(db, `/project-bunluck/sessions/${sessionId}/gameState/currentOrder`)
    try{
      set(currentOrderRef, order)
    } catch(error) {
      console.error('[Error] {setCurrentOrder}')
      throw error
    }
  }
  
  
  // DOING DOING  DOING  DOING  DOING  DOING  DOING  DOING  DOING 
  // DOING DOING  DOING  DOING  DOING  DOING  DOING  DOING  DOING 
  // DOING DOING  DOING  DOING  DOING  DOING  DOING  DOING  DOING 
  
  // There will be 3 different types of ways to 'EndGame'
  // 1) Normal open all (endGameOpenAll)
  // 2) Open single (banker Only)
  // 3) Open at the start (only for banban and banluck)
  // 4) WU LONG 5 Card
  
  function changeCompetedWithBankerStatus(sessionId, playerId, status){
    console.log(playerId)
    console.log(status)
    const db = getDatabase()
    dbRef = ref(db, `/project-bunluck/sessions/${sessionId}/players/${playerId}/competedWithBanker`)
    try{
      set(dbRef, status) // either true/false 
    } catch(error) {
      console.error('[Error] {changeCompetedWithBankerStatus}')
      throw error
    }
  }

  async function getCompetedWithBankerStatus(sessionId, playerId){
    const db = getDatabase()
    try{
      const snapshot = await get(ref(db, `/project-bunluck/sessions/${sessionId}/players/${playerId}/competedWithBanker`))
      return snapshot.val()
    } catch(error) {
      console.error('[Error] {getCompetedWithBankerStatus}')
    }
  }

  async function getAllCompetedWithBankerStatus(sessionId){
    const db = getDatabase()
    
    const result = {}
    try{
      const snapshot = await get(ref(db, `/project-bunluck/sessions/${sessionId}/players`))
      let playersData = snapshot.val();
      for (let playerId in playersData) {
          if (playersData[playerId].hasOwnProperty("competedWithBanker")) {
              result[playerId] = { competedWithBanker: playersData[playerId].competedWithBanker };
          }
      }
      return result;
    } catch(error) {
      console.error('[Error] {getAllCompetedWithBankerStatus}')
    }
  }

  async function endGameOpenSingle(sessionId, targetPlayerId){
    // [CAW]
    // during banker turn, load bankerUI & load "playerWaiting" UI
    // banker has option to open single or all (either clicking on playerIcon or Stand)
    // load functions depending on action
    // implement new db for outcomes? 
    // make a event-driven loop to track either allPlayersHaveOpen or banker wu long
    const data = await getAllInfo(sessionId)
    
    let banker = {}
    let players = {}
    
    for (let key in data) {
      if (data[key].banker === 'True') {
        banker['bankerId'] = key
        banker['bankerBalance'] = data[key].bets.playerBalance
        banker['cardValue'] = data[key].value[0];
      }
      if(key == targetPlayerId){
        players[`${key}`] = data[key]
      }
      

      console.log(banker)
      console.log(players)

      console.log('================')
      // comparison logic
      const outcome = await comparisonLogic(banker, players)
    
    
      // update db
      writeOutcome(sessionId, outcome);


      io.to(sessionId).emit('endGameSingle', outcome)


      // reload session
      // const sessionInfo = await getSessionInfo(sessionId)
      // io.to(sessionId, sessionInfo)

    } 
    
    
    
    
    
    
    
    
  }
  
  async function endGameOpenAll(sessionId){
    const data = await getAllInfo(sessionId)
    let banker = {}
    let players = {}
  
    // get banker's Card Value
    for (let key in data) {
      if (data[key].banker === 'True') {
          banker['bankerId'] = key
          banker['bankerBalance'] = data[key].bets.playerBalance
          banker['cardValue'] = data[key].value[0];
          break;
      }
    }
    
    for (let key in data) {
      // skip to next player if currentPlayer == banker
      if (data[`${key}`].banker == "True"){continue}
      players[`${key}`] = data[key]
    }

    // toggle competedWithBankerStatus
    for (let player in players) {
      await changeCompetedWithBankerStatus(sessionId, player, 'true')
    }

    const outcome = await comparisonLogic(banker, players)
    writeOutcome(sessionId, outcome);

    return outcome
  }

  function comparisonLogic(banker, players){
    const outcome = []
    let tempt_totalBetAmount = 0


    for (let player in players){
      // main comparison logic
      if (players[`${player}`].value[0] === "BanLuck" || players[`${player}`].value[0] === "BanBan") {  
        if (banker.cardValue === "BanLuck" || banker.cardValue === "BanBan") {
            if (banker.cardValue === "BanBan" && players[`${player}`].value[0] === "BanLuck") {
                // Banker wins with BanBan against player's BanLuck
                let multiplier = 3;
                tempt_totalBetAmount += players[`${player}`].bets.currentBet * multiplier;
                outcome.push({
                    [key]: {
                        betAmount: players[`${player}`].bets.currentBet,
                        playerBalance: (parseInt(players[`${player}`].bets.playerBalance) - parseInt(players[`${player}`].bets.currentBet * multiplier))
                    }
                });
            } else if (banker.cardValue === "BanLuck" && players[`${player}`].value[0] === "BanBan") {
                // Player wins with BanBan against banker's BanLuck
                let multiplier = 3;
                tempt_totalBetAmount -= players[`${player}`].bets.currentBet * multiplier;
                outcome.push({
                    [`${player}`]: {
                        betAmount: players[`${player}`].bets.currentBet,
                        playerBalance: (parseInt(players[`${player}`].bets.playerBalance) + parseInt(players[`${player}`].bets.currentBet * multiplier))
                    }
                });
            } else {
                // Both player and banker have the same special hands, it's a tie
                outcome.push({
                    [`${player}`]: {
                        betAmount: players[`${player}`].bets.currentBet,
                        playerBalance: players[`${player}`].bets.playerBalance
                    }
                });
            }
        } else {
            // Player wins with a special hand
            let multiplier = players[`${player}`].value[0] === "BanLuck" ? 2 : 3;
            tempt_totalBetAmount -= players[`${player}`].bets.currentBet * multiplier;
            outcome.push({
                [`${player}`]: {
                    betAmount: players[`${player}`].bets.currentBet,
                    playerBalance: (parseInt(players[`${player}`].bets.playerBalance) + parseInt(players[`${player}`].bets.currentBet * multiplier))
                }
            });
        }
      } else if (banker.cardValue === "BanLuck" || banker.cardValue === "BanBan") {
        // Banker wins with a special hand
        let multiplier = banker.cardValue === "BanLuck" ? 2 : 3;
        tempt_totalBetAmount += players[`${player}`].bets.currentBet * multiplier;
        outcome.push({
            [`${player}`]: {
                betAmount: players[`${player}`].bets.currentBet,
                playerBalance: (parseInt(players[`${player}`].bets.playerBalance) - parseInt(players[`${player}`].bets.currentBet * multiplier))
            }
        });
      } else if (players[`${player}`].value[0] > 21) {
        if (banker.cardValue > 21) {
            tempt_totalBetAmount += 0;
            outcome.push({
                [`${player}`]: {
                    betAmount: players[`${player}`].bets.currentBet,
                    playerBalance: players[`${player}`].bets.playerBalance
                }
            });
        } else {
            tempt_totalBetAmount += players[`${player}`].bets.currentBet;
            outcome.push({
                [`${player}`]: {
                    betAmount: players[`${player}`].bets.currentBet,
                    playerBalance: (parseInt(players[`${player}`].bets.playerBalance) - parseInt(players[`${player}`].bets.currentBet))
                }
            });
        }
      } else if (banker.cardValue > 21 || (players[`${player}`].value[0] <= 21 && players[`${player}`].value[0] > banker.cardValue)) {
        tempt_totalBetAmount -= players[`${player}`].bets.currentBet;
        outcome.push({
            [`${player}`]: {
                betAmount: players[`${player}`].bets.currentBet,
                playerBalance: (parseInt(players[`${player}`].bets.playerBalance) + parseInt(players[`${player}`].bets.currentBet))
            }
        });
      } else if (players[`${player}`].value[0] < banker.cardValue) {
        tempt_totalBetAmount += players[`${player}`].bets.currentBet;
        outcome.push({
            [`${player}`]: {
                betAmount: players[`${player}`].bets.currentBet,
                playerBalance: (parseInt(players[`${player}`].bets.playerBalance) - parseInt(players[`${player}`].bets.currentBet))
            }
        });
      } else {
        tempt_totalBetAmount += 0;
        outcome.push({
            [`${player}`]: {
                betAmount: players[`${player}`].bets.currentBet,
                playerBalance: players[`${player}`].bets.playerBalance
            }
        });
      }
    }
    
    outcome.push({
      [banker.bankerId] : {
        playerBalance: (parseInt(banker.bankerBalance) + parseInt(tempt_totalBetAmount)),
        betAmount: "playerIsBanker"
        
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
  
  function writeOutcome(sessionId, outcome){
    const db = getDatabase()

    outcome.forEach((item) => {
      const key = Object.keys(item)[0];
      const value = item[key]; 

      const dbRef = ref(db,`/project-bunluck/sessions/${sessionId}/players/${key}/bets/playerBalance`)
      set(dbRef, value.playerBalance)
    })
  }

  async function gameEndResetDB(sessionId){
    const db = getDatabase()
    const sessionRef = ref(db,`/project-bunluck/sessions/${sessionId}`)
    try{
      const snapshot = await get(sessionRef)
      const players = snapshot.val().players  

      const updates = {}

      updates["deck"] = "gameEnd"
      updates["gameState/Bets/resetTimerBoolean"] = "True"

      if (players) {
        for (const playerId in players){
          updates[`players/${playerId}/bets/currentBet`] = 0; // [IMPT] suppose to be "gameEnd", but if user does not place bet, will result in error as gameEnd is NaN
          updates[`players/${playerId}/currentHand`] = 'undefined'; // [IMPT] suppose to be "gameEnd", but if user does not place bet, will result in error as gameEnd is NaN
          updates[`players/${playerId}/value`] = 'undefined'; // [IMPT] suppose to be "gameEnd", but if user does not place bet, will result in error as gameEnd is NaN
        }
      }
      await update(sessionRef, updates);


    } catch (e){
      console.log('[gameEndResetDB] Error: ', e)
    }

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
  
      socket.removeAllListeners('playerBets');
      socket.on('playerBets', (dataObj) => {
        writePlayerBets(dataObj['sessionId'], dataObj['playerId'], dataObj['betAmount'])
      })
  
    })
  }
  
  async function configuringOrder(sessionId){
    async function setOrderOfPlayers(sessionId){
      // function will overwrite previous orders
      orderObj = {}
      const db = getDatabase()
      try {
          // get all current players
        currentPlayers = await getPlayersId(sessionId) // returns an array of playerIds
        currentPlayers.push(currentPlayers.shift()); // set the banker to be the last (move first element to last position)


        

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

    // set the current order of players and set the first player to be first turn.
    await setOrderOfPlayers(sessionId)
    await setCurrentOrder(sessionId, 0)
  }
  
  async function assignPlayerTurn(socket, sessionId) {
    async function handleCurrentTurn() {
      const fullOrder = await getFullOrder(sessionId);
      infiniteLoop: while (true) {
        // get currentPlayer's turn
        let currentOrderIndex = await getCurrentOrder(sessionId)
        let currentOrder = fullOrder[currentOrderIndex];

        // socket broadcast current client's turn
        io.to(sessionId).emit('assignPlayerTurn', currentOrder);
  
        // Remove existing listeners BEFORE adding new ones
        socket.removeAllListeners('playerHit');
        socket.removeAllListeners('playerStand');
        socket.removeAllListeners('endGameOpenSingle');

        // [CAB]
        // 1) server open listener for EGOS
        // 2) only partyLeader can emit EGOS 
        // 3) Game loops but after comprisonLogic for EGOS 
        // 3.1) check if there are any players left. if yes 'continue' , else break out
        // 4) create new db heirachh for outcome
        // 4.1) include each player -> status : done
        // 4.2) include bet amount
        // 4.3) basically only the heirachy of outcome to be sent (similar to loadExistingSession)
        
        // NEW
        const [event, currentSessionId, playerId, targetPlayerId] = await new Promise((resolve) => {
          socket.on('playerHit', (sessionId, playerId) => resolve(['playerHit', sessionId, playerId], null));
          socket.on('playerStand', (sessionId, playerId) => resolve(['playerStand', sessionId, playerId, null]));
          socket.on('endGameOpenSingle', (sessionId, playerId, targetPlayerId) => resolve(['endGameOpenSingle', sessionId, playerId, targetPlayerId]))
        });
          
        if (event === 'playerHit') {
          // query currentOrderIndex for latest updates as multiple instances of this function will run concurrently
          currentOrderIndex = await getCurrentOrder(sessionId)
          if (playerId === fullOrder[currentOrderIndex]) {
            // get current player's hand
            let playerHand = (await getHand(sessionId, playerId)).split(',');
  
            // check card amount (card amount cannot > 5)
            if (playerHand.length >= 5) {
              socket.emit('error_card_length_5');
            } else {
              await playerHit(sessionId, playerId);
              let sessionData = await loadExistingSession(sessionId);
              io.to(sessionId).emit('loadExistingSession', sessionData);
            }
          } else {
            socket.emit('error', 'This is not your turn');
          }

        } else if (event === 'playerStand') {
          // query currentOrderIndex for latest updates as multiple instances of this function will run concurrently
          currentOrderIndex = await getCurrentOrder(sessionId)

          if (playerId === fullOrder[currentOrderIndex]){
            // check if currentPlayer is last in order:
            if (currentOrderIndex === fullOrder.length - 1) {
              const outcome = await endGameOpenAll(sessionId);  
              gameEndResetDB(sessionId);
              changeGameStatus(sessionId, 'completed');
              io.to(sessionId).emit('gameEnd', outcome);
              break;
            } else {
              // Change order to next person
              setCurrentOrder(sessionId, currentOrderIndex + 1);
            }
          } else {
            socket.emit('error', 'This is not your turn');
          }
        } else if (event == 'endGameOpenSingle'){
          // [CAB]
          // loadExistingSession should have sent [getCompetedWithBankerStatus]. Client should hide/display elements as shown there but here i will do simple check
          const result = await endGameOpenSingle(sessionId, targetPlayerId)
          // change competedWithBankerStatus
          changeCompetedWithBankerStatus(sessionId, targetPlayerId)


          // [CAB]
          // Make another socket.on function at client to handle this info
          // socket.emit('endGameBankerSingle')

          const competedWithBankerStatus = await getAllCompetedWithBankerStatus
          for (let playerId in competedWithBankerStatus) {
            if (competedWithBankerStatus[playerId].competedWithBanker === true) {
                console.log(`Player ${playerId} has competed with the banker. Exiting loop.`);
                break infiniteLoop; // Exit the loop immediately
            }
        }





        }
        else{
          console.error('something went wrong')
        }
      }

    }
    handleCurrentTurn();
  }
 
  function waitForGameInitialization(sessionId) {
    return new Promise((resolve) => {
      const statusRef = ref(db, `/project-bunluck/sessions/${sessionId}/gameState/gameInitializationStatus`);
      
      const unsubscribe = onValue(statusRef, (snapshot) => {
        const status = snapshot.val();
        if (status === "COMPLETED") {
          unsubscribe(); // Stop listening
          resolve();
        }
      });
    });
  }
    
  
  // CONNECTION LOGIC:
  // Handle 'connect' event
  io.on('connection', (socket) => {
  // socket.on('sessionId', async (sessionId, playerId) => {
  //     const current_sessionId = sessionId
  //     const current_playerId = playerId
  
  //     // check if session already exist: 
  //     let sessionCheck = await checkExistingSession(sessionId)
  //     if (!sessionCheck){
  //       console.log("[ DO SOMETHING ]")
  //       // should not run for now!!!
  //     }
  //     else{
  //       // create socket rooms for all clients in same session
  //       socket.join(sessionId)
          
  //       const currentPlayers = await getPlayersId(sessionId)
  //       const currentGameStatus = await getGameStatus(sessionId) // to remove (FOR GAME LOOP)

  //       //  CURRENTLY currentGameStatus = completed in the if statement produces the following error: 
  //       // Error: set failed: value argument contains NaN in property 'project-bunluck.sessions.-OHqI-1qInhkYSL2oXmA.players.-OHqI-1qInhkYSL2oXmB.value.0'

  //       //  as when user refresh the browser, it is triggering a new gmae, but no function is doing it.


  //       // if (currentGameStatus == 'new' || currentGameStatus == 'completed') { 
  //       if (currentGameStatus == 'new') { 
  //         await bettingPhase(socket, sessionId);

  //         const bankerId = await getPartyLeader(sessionId)
  //         if (playerId == bankerId){
  //           // [START OF GAME LOGIC] 
  //           await configuringOrder(sessionId)
  //           // startGame (initialize deck) -> [using gameStatus as checkflag so startGame ONLY runs once]
  //           await startGame(socket, sessionId, currentPlayers, playerId)
  
  //           changeGameStatus(sessionId, 'inProgress')
  //           assignPlayerTurn(socket, sessionId) 
  //         }
  //         else{
  //           let gameInitializationStatus = await GetgameInitializationStatus(sessionId)
  //           console.log("gameInitializationStatus: ", gameInitializationStatus)
  //           if (gameInitializationStatus != "COMPLETED"){
  //             await waitForGameInitialization(sessionId);
  //             assignPlayerTurn(socket, sessionId) 
  //             console.log('[Client-Connection 1] : non-partyLeader client able to load thru flag (race condition)')
  //           }
  //           else{
  //             assignPlayerTurn(socket, sessionId) 
  //             console.log('[Client-Connection 2] : non-partyLeader client able to load as per normal (lost race condition)')
  //           }
  //         }

  //       }
  //       else{
  //         // console.log("[ Load Existing Session ]")
  //         let sessionData = await loadExistingSession(sessionId)
  //         socket.emit('loadExistingSession', sessionData)
  //         assignPlayerTurn(socket, sessionId)
  //       }
  //       // else{
  //       //   console.log("[ Load Existing Session || refreshedBrowser]")
  //       //   let sessionData = await loadExistingSession(sessionId)
  //       //   socket.emit('loadExistingSession', sessionData)
  //       //   assignPlayerTurn(socket, sessionId)
  //       // }
  //     }  
  // })
  


  socket.on('sessionId', async (sessionId, playerId) => {
    // check if session already exist: 
    let sessionCheck = await checkExistingSession(sessionId)
    if (!sessionCheck){
      console.log("[ DO SOMETHING ]")
      // should not run for now!!!
    }
    else{
      // create socket rooms for all clients in same session
      socket.join(sessionId)
        
      const currentPlayers = await getPlayersId(sessionId)
      const currentGameStatus = await getGameStatus(sessionId) 

      // if (currentGameStatus == 'new' || currentGameStatus == 'completed') { 
      if (currentGameStatus == 'new') { 
        const partyLeader = await getPartyLeader(sessionId)
        if (playerId == partyLeader){
          runGameCyclePartyLeader(socket, sessionId, currentPlayers, playerId)
        }
        else{
          runGameCycleClient(socket, sessionId)
        }

      }
      else{
        // console.log("[ Load Existing Session ]")
        let sessionData = await loadExistingSession(sessionId)
        socket.emit('loadExistingSession', sessionData)
        assignPlayerTurn(socket, sessionId)
      }
    }  
  })

  socket.on('restartGame', async(sessionId, playerId) => {
    // check if player is partyLeader
    const partyLeader = await getPartyLeader(sessionId)
    const currentPlayers = await getPlayersId(sessionId)
    if (playerId == partyLeader){
      runGameCyclePartyLeader(socket, sessionId, currentPlayers, playerId)
    }
    else{
      runGameCycleClient(socket, sessionId)
    }
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
  
  
  socket.once('restartGame', async (sessionId, playerId) => {
      restartGame(sessionId) //erase all relevant data from db
  })
  
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
  
  

  async function runGameCyclePartyLeader(socket, sessionId, currentPlayers, playerId){
    await bettingPhase(socket, sessionId);
    await configuringOrder(sessionId)
    // startGame (initialize deck) -> [using gameStatus as checkflag so startGame ONLY runs once]
    await startGame(socket, sessionId, currentPlayers, playerId)
    changeGameStatus(sessionId, 'inProgress')
    assignPlayerTurn(socket, sessionId)
  }

  async function runGameCycleClient(socket, sessionId){
    await bettingPhase(socket, sessionId);
    let gameInitializationStatus = await GetgameInitializationStatus(sessionId)

    if (gameInitializationStatus != "COMPLETED"){
      await waitForGameInitialization(sessionId);
      assignPlayerTurn(socket, sessionId) 

      // console.log('[Client-Connection 1] : non-partyLeader client able to load thru flag (race condition)')
    }
    else{
      assignPlayerTurn(socket, sessionId) 
      // console.log('[Client-Connection 2] : non-partyLeader client able to load as per normal (No race condition)')
    }

  }

  



























  // Start the server
  const PORT = process.env.PORT || 8888;
  server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
  });
  
  
// [IMPT Function to check active listeners 
// Usage:
// countListenersForAllEvents()

// function countListenersForAllEvents() {
//   const eventCounts = new Map(); // Store event counts

//   io.sockets.sockets.forEach(socket => {
//     socket.eventNames().forEach(event => {
//         eventCounts.set(event, (eventCounts.get(event) || 0) + socket.listeners(event).length);
//     });
//   });

//   console.log()
//   console.log("Total listeners for all events:");
//   console.log('---------------------------------')
//   eventCounts.forEach((count, event) => {
//       console.log(`${event}: ${count} listener${count > 1 ? "s" : ""}`);
//   });
//   console.log('---------------------------------')
//   }
//   countListenersForAllEvents();
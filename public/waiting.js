const sessionId = localStorage.getItem('sessionId')
const clientPlayerId = localStorage.getItem('playerId')
const username = localStorage.getItem('username')
const socket = io(); // Connect to the server


socket.on('connect', () => {

    socket.emit('waiting', sessionId)

    socket.on('waiting', (playerData) => {
        console.log(playerData)
    })
});


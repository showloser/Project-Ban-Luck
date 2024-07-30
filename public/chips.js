let balance = localStorage.getItem('balance')

let totalBet = 0;
let stackHeight = 0;

const chipImages = {
  1: 'images/chips/chip_black_flat_large.png',
  5: 'images/chips/chip_green_flat_large.png',
  25: 'images/chips/chip_lightblue_flat_large.png',
  50: 'images/chips/chip_purple_flat_large.png',
  100: 'images/chips/chip_red_flat_large.png',
  500: 'images/chips/chip_white_flat_large.png'
};


document.querySelectorAll('.chip').forEach(chip => {
  // default blur-ing of chips
  blurChips(balance,0)

  chip.addEventListener('click', (event) => {    
    const value = parseInt(chip.dataset.value, 10);

    if (value > balance || value > (balance - totalBet)){
      return
    }
    else{
      totalBet += value;
      document.getElementById('total-bet').innerText = totalBet;
  
      // Get chip's bounding box to calculate its position
      const chipRect = chip.getBoundingClientRect();
      const bettingAreaRect = document.querySelector('.betting-area').getBoundingClientRect();
      const startX = chipRect.left + window.scrollX;
      const startY = chipRect.top + window.scrollY;
      const endX = bettingAreaRect.left + window.scrollX + bettingAreaRect.width / 2 - chipRect.width / 2;
      const endY = bettingAreaRect.top + window.scrollY + bettingAreaRect.height / 2 - chipRect.height / 2;
  
      // Clone the chip to animate it
      const chipClone = chip.cloneNode(true);
      document.body.appendChild(chipClone);
      chipClone.classList.add('animate-chip');
  
      // Set the initial position
      chipClone.style.left = startX + 'px';
      chipClone.style.top = startY + 'px';
  
      // Force reflow to apply initial position
      chipClone.offsetHeight;
  
      // Set the target position using transform
      chipClone.style.setProperty('--start-x', '0px');
      chipClone.style.setProperty('--start-y', '0px');
      chipClone.style.setProperty('--end-x', `${endX - startX}px`);
      chipClone.style.setProperty('--end-y', `${endY - startY}px`);
  
      // Remove the chip after animation
      chipClone.addEventListener('animationend', () => {
        chipClone.remove();
  
        var denomination = getChipDenominations(totalBet)
        addChipToStack(denomination);
  
        // re-blur chips
        blurChips(balance, totalBet)
  
      });
    }
  });
});

function addChipToStack(chipCounts) {
  const stackedChips = document.getElementById('stacked-chips');
  stackedChips.innerHTML = ''; // Clear the current stacked chips
  let stackHeight = 0;

  // Iterate through the chipCounts object in descending order of denominations
  const denominations = [500, 100, 50, 25, 5, 1];
  denominations.forEach(denomination => {
    const count = chipCounts[denomination];
    for (let i = 0; i < count; i++) {
      const chipImage = chipImages[denomination];
      const chipElement = document.createElement('img');
      chipElement.src = chipImage;
      chipElement.className = 'stacked-chip';
      chipElement.style.bottom = `${stackHeight}px`;
      stackedChips.appendChild(chipElement);
      stackHeight += 5; // Adjust the stack height for the next chip
    }
  });
}

function getChipDenominations(value) { // get biggest possible denomination
  const denominations = [500, 100, 50, 25, 5, 1];
  const result = {};

  denominations.forEach(denomination => {
    result[denomination] = Math.floor(value / denomination);
    value %= denomination;
  });

  return result;
}

function resetBet() {
  totalBet = 0;
  stackHeight = 0;
  document.getElementById('total-bet').innerText = totalBet;
  document.getElementById('stacked-chips').innerHTML = '';
  blurChips(balance, 0)
}


function blurChips(balance, totalBet){
  denomination = [500, 100, 50, 25, 5, 1]
  for (let i = 0; i < denomination.length; i++){
    let chip = document.getElementsByClassName(`denomination${denomination[i]}`)
    chip[0].classList.remove('blur')
    if (balance < denomination[i] || (balance - totalBet) < denomination[i]){
        chip[0].classList.add('blur')
    }
  }
}



function runTimer(endTimeEpoch) {
  const FULL_DASH_ARRAY = 2 * Math.PI * 52;
  const MAX_TIME = 30; // Max time is 30 seconds
  const timerElement = document.getElementById('timer');
  const progressCircle = document.querySelector('.progress-ring__circle');
  const bettingInterface = document.getElementById('bettingOverlay');

  function calculateOffset(timeLeft) {
    return FULL_DASH_ARRAY - (timeLeft / MAX_TIME) * FULL_DASH_ARRAY;
  }

  function updateTimer() {
    const now = Date.now();
    let timeLeft = Math.max(0, (endTimeEpoch - now) / 1000); // Convert milliseconds to seconds
    if (timeLeft > MAX_TIME) {
      timeLeft = MAX_TIME;
    }

    if (timeLeft > 0) {
      timerElement.textContent = Math.ceil(timeLeft);
      progressCircle.style.strokeDashoffset = calculateOffset(timeLeft);
      setTimeout(updateTimer, 1000);
    } else {
      timerElement.textContent = 0;
      progressCircle.style.strokeDashoffset = calculateOffset(0);
      setTimeout(() => {
        fadeOutBettingInterface();
      }, 300); // Delay for smooth transition

      // Send bet amount to server
      socket.emit('playerBets', {
        'sessionId': sessionId,
        'playerId': clientPlayerId,
        'betAmount': totalBet
      });
    }
  }

  function fadeOutBettingInterface() {
    bettingInterface.classList.remove('show');
  }

  progressCircle.style.strokeDasharray = FULL_DASH_ARRAY;
  progressCircle.style.strokeDashoffset = calculateOffset(MAX_TIME);

  updateTimer();
}




socket.on('bettingPhase' , (bettingTimerEnd) => {

  // Show Betting Interface + Animation
  const bettingInterface = document.getElementById('bettingOverlay');
  setTimeout(() => {
    bettingInterface.classList.add('show');
  }, 300); // Delay for 300ms for smooth transisition.

  runTimer(bettingTimerEnd)
})



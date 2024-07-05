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
  chip.addEventListener('click', (event) => {
    const value = parseInt(chip.dataset.value, 10);
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
      addChipToStack(value);
    });
  });
});



function addChipToStack(value) {
  const stackedChips = document.getElementById('stacked-chips');
  const chipImage = chipImages[value];
  const chipElement = document.createElement('img');
  chipElement.src = chipImage;
  chipElement.className = 'stacked-chip';
  chipElement.style.bottom = `${stackHeight}px`;
  stackedChips.appendChild(chipElement);
  stackHeight += 5; 
}

function resetBet() {
  totalBet = 0;
  stackHeight = 0;
  document.getElementById('total-bet').innerText = totalBet;
  document.getElementById('stacked-chips').innerHTML = '';
}

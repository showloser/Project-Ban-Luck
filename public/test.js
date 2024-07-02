let totalBet = 0;

document.querySelectorAll('.chip').forEach(chip => {
  chip.addEventListener('click', () => {
    const value = parseInt(chip.dataset.value, 10);
    totalBet += value;
    document.getElementById('total-bet').innerText = totalBet;
  });
});

document.getElementById('confirm-bet').addEventListener('click', () => {
  if (totalBet > 0) {
    fetch('/place-bet', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ amount: totalBet })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        alert('Bet placed successfully!');
        totalBet = 0;
        document.getElementById('total-bet').innerText = totalBet;
      } else {
        alert('Failed to place bet.');
      }
    });
  } else {
    alert('Please place a bet.');
  }
});

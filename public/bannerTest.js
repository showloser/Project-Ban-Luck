
const clientPlayerId = localStorage.getItem('playerId')

function showBanner(outcome) {
    const banner = document.querySelector('.banner');

    outcome.forEach((data) => {
        const key = Object.keys(data)[0]; // Get the key of the object
        if (key == clientPlayerId){
            balanceElement.innerText = data[key].playerBalance

            if (data[key].playerBalance  > 1000){
                banner.className = 'banner win';
                banner.querySelector('h2').textContent = `VICTORY! You Have Won ${data[key].betAmount}`;
            }
            else{
                banner.className = 'banner lose';
                banner.querySelector('h2').textContent = `Nice Try! You Have Lost ${data[key].betAmount}`;

            }

        }
    })
}
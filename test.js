playerHand = [ 'ace_of_diamonds', 'queen_of_spades' ]
playerHand1 = [ '5_of_spades', '8_of_diamonds' ]
playerHand2 = [ 'ace_of_spades', '5_of_diamonds', 'queen_of_spades', 'queen_of_spades']



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
            return ['bust']
        }
        else{
            return result
        }
    }
}


x = CalculateValue(playerHand2)
console.log(x)
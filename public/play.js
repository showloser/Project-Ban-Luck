document.addEventListener('DOMContentLoaded', () => {
    const chatWindow = document.getElementById('chat-window');
    let timeout;

    // Function to set the chat window's opacity to 0.1
    const dimChatWindow = () => {
        chatWindow.style.opacity = '0.3';
    };

    // Set a timeout to dim the chat window after a period of inactivity
    const resetTimeout = () => {
        clearTimeout(timeout);
        timeout = setTimeout(dimChatWindow, 5000);
    };

    // Ensure the chat window is fully visible when the user hovers over it
    chatWindow.addEventListener('mouseenter', () => {
        chatWindow.style.opacity = '0.8';
        resetTimeout(); // Reset the timeout to dim the chat window again after interaction
    });



    // Initialize the timeout
    resetTimeout();
});

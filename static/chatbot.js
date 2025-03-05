let listening = false;
let speechSynthesisActive = false; // Track if speech synthesis is active
let currentLanguage = 'en'; // Default language

// Function to toggle chatbot visibility
function toggleChatbot() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.style.display = chatContainer.style.display === 'none' ? 'flex' : 'none';
}

// Function to close chatbot and stop voice interaction
function closeChatbot() {
    const chatContainer = document.getElementById('chat-container');
    chatContainer.style.display = 'none';
    stopVoiceInteraction(); // Stop voice interaction when closing chatbot
}

// Function to stop voice interaction and reset mic icon
function stopVoiceInteraction() {
    if (speechSynthesisActive) {
        window.speechSynthesis.cancel(); // Stop ongoing speech synthesis
        speechSynthesisActive = false;
    }
    if (listening) {
        recognition.stop(); // Stop ongoing voice recognition
        listening = false;
        document.getElementById('voice-icon').src = 'mic_icon.png'; // Reset mic icon
    }
}

// Function to append messages to chat
function appendMessage(content, sender, language = 'en') {
    const messageDiv = document.createElement('div');
    messageDiv.classList.add('message', sender);
    messageDiv.innerText = content;
    document.getElementById('chat-body').appendChild(messageDiv);
    document.getElementById('chat-body').scrollTop = document.getElementById('chat-body').scrollHeight;

    // Voice Assistant - Speak the bot's response
    if (sender === 'bot') {
        speak(content, language);
    }
}

// Function to send user messages
function sendMessage() {
    const userInput = document.getElementById('user-input').value.trim();
    if (!userInput) return;
    appendMessage(userInput, 'user');
    document.getElementById('user-input').value = '';
    document.getElementById('user-input').focus();

    fetch('/chatbot', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: userInput }),
    })
    .then(response => response.json())
    .then(data => {
        if (data.answer) {
            appendMessage(data.answer, 'bot');
            if (data.audio_url) {
                const audio = new Audio(data.audio_url);
                audio.play();
            }
        } else if (data.error) {
            appendMessage("Sorry, something went wrong.", 'bot');
        }
    })
    .catch(error => {
        console.error('Error:', error);
        appendMessage("Sorry, something went wrong.", 'bot');
    });
}

// Function to handle text-to-speech
function speak(text, lang) {
    if (speechSynthesisActive) {
        window.speechSynthesis.cancel(); // Stop any ongoing speech synthesis
    }
    const speech = new SpeechSynthesisUtterance();
    speech.text = text;
    speech.lang = lang;
    speechSynthesisActive = true;
    speech.onend = () => {
        speechSynthesisActive = false;
    };
    window.speechSynthesis.speak(speech);
}

// Voice Recognition Functionality
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = 'en'; // Default language
recognition.interimResults = false;
recognition.continuous = false;

recognition.onresult = function(event) {
    const last = event.results.length - 1;
    const transcript = event.results[last][0].transcript.trim();
    document.getElementById('user-input').value = transcript;
    sendMessage();
};

recognition.onspeechend = function() {
    if (listening) {
        recognition.stop();
        listening = false;
        document.getElementById('voice-icon').src = 'mic_icon.png'; // Reset mic icon
    }
};

recognition.onerror = function(event) {
    console.error('Speech recognition error detected: ' + event.error);
    listening = false;
    document.getElementById('voice-icon').src = 'mic_icon.png'; // Reset mic icon
    appendMessage("Sorry, something went wrong.", 'bot');
};

// Handle voice icon click for starting/stopping speech recognition
document.getElementById('voice-icon').addEventListener('click', function() {
    if (listening) {
        recognition.stop();
        listening = false;
        document.getElementById('voice-icon').src = 'mic_icon.png'; // Reset mic icon
    } else {
        if (speechSynthesisActive) {
            window.speechSynthesis.cancel(); // Stop ongoing speech if any
        }
        appendMessage("Hearing...", 'bot'); // Display hearing message
        recognition.start();
        listening = true;
        document.getElementById('voice-icon').src = 'mic_icon_active.png'; // Change mic icon
    }
});

// Handle Enter key in textarea for sending messages
document.getElementById('user-input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        if (e.shiftKey) {
            e.preventDefault();
            const textarea = e.target;
            const cursorPosition = textarea.selectionStart;
            const textBefore = textarea.value.substring(0, cursorPosition);
            const textAfter = textarea.value.substring(cursorPosition);
            textarea.value = textBefore + '\n' + textAfter;
            textarea.selectionStart = textarea.selectionEnd = cursorPosition + 1;
        } else {
            e.preventDefault();
            sendMessage();
        }
    }
});

// Focus on user input when the page loads
window.onload = function() {
    document.getElementById('user-input').focus();
};

let scene, camera, renderer, globe, controls, globeContainer, belowImageContainer;
let isGlobeInitialized = false;
let lastScrollTop = 0;
let isImageVisible = false;

const initialCameraZ = 15; // Initial distance of the camera
const minCameraZ = 3; // Decrease this value to increase maximum zoom level (closer to the globe)
const zoomFactorRate = 0.0010; // Adjust this value to control zoom speed

function init() {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

    // Set the initial camera position to focus on the globe
    camera.position.set(0, 0, initialCameraZ); // Position the camera
    camera.lookAt(new THREE.Vector3(0, 0, 0)); // Ensure it looks at the center of the globe

    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setClearColor(0x000000, 0); // Set clear color to transparent
    globeContainer = document.getElementById('globe-container');
    globeContainer.appendChild(renderer.domElement);

    const textureLoader = new THREE.TextureLoader();
    const globeGeometry = new THREE.SphereGeometry(5, 32, 32);
    const globeMaterial = new THREE.MeshStandardMaterial({
        map: textureLoader.load('/static/Earth color.png'),
        transparent: true,
    });

    globe = new THREE.Mesh(globeGeometry, globeMaterial);
    scene.add(globe);

    globe.rotation.y = Math.PI / 0.95;
    globe.rotation.x = Math.PI / 0.475;

    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    const pointLight = new THREE.PointLight(0xffffff, 1);
    pointLight.position.set(10, 10, 10);
    scene.add(pointLight);

    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableZoom = false; // Disable zoom control

    window.addEventListener('resize', handleResize, false);

    animate();
}

function handleResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    renderer.setSize(width, height);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

function handleScroll() {
    const scrollTop = window.scrollY;
    const maxScroll = 200; // Adjust this value based on how far you want to scroll before full zoom

    const navbar = document.querySelector('.navbar');
    const welcomeContainer = document.querySelector('.welcome-container');
    const detailedData = document.querySelector('.detailed-data');
    belowImageContainer = document.getElementById('below-image-container');

    if (scrollTop > lastScrollTop) {
        // Scrolling down
        navbar.classList.add('hidden');
    } else {
        // Scrolling up
        navbar.classList.remove('hidden');
    }

    if (scrollTop > maxScroll) {
        welcomeContainer.classList.add('shrink');
        detailedData.classList.add('show');

        if (!isGlobeInitialized) {
            init(); // Initialize the globe only once
            isGlobeInitialized = true;
        }

        globeContainer.classList.add('show'); // Smoothly show the globe

        // Zoom in the globe smoothly
        let zoomFactor = Math.max(0, Math.min(1, (scrollTop - maxScroll) * zoomFactorRate));
        camera.position.z = initialCameraZ - (initialCameraZ - minCameraZ) * zoomFactor;

        if (zoomFactor >= 1) {
            if (!isImageVisible) {
                belowImageContainer.style.visibility = 'visible'; // Show the image
                belowImageContainer.style.opacity = '1'; // Fade in the image
                isImageVisible = true;
            }
        } else {
            if (isImageVisible) {
                belowImageContainer.style.visibility = 'hidden'; // Hide the image
                belowImageContainer.style.opacity = '0'; // Fade out the image
                isImageVisible = false;
            }
        }
    } else {
        welcomeContainer.classList.remove('shrink');
        detailedData.classList.remove('show');
        globeContainer.classList.remove('show'); // Smoothly hide the globe

        // Reset zoom
        camera.position.z = initialCameraZ;

        if (isImageVisible) {
            belowImageContainer.style.visibility = 'hidden'; // Hide the image
            belowImageContainer.style.opacity = '0'; // Fade out the image
            isImageVisible = false;
        }
    }

    lastScrollTop = scrollTop <= 0 ? 0 : scrollTop;
}

window.addEventListener('scroll', handleScroll);

// Chatbot and Speech Recognition Code

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
        document.getElementById('voice-icon').src = '/static/mic_icon.png'; // Reset mic icon
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
        document.getElementById('voice-icon').src = '/static/mic_icon.png'; // Reset mic icon
    }
};

recognition.onerror = function(event) {
    console.error('Speech recognition error detected: ' + event.error);
    listening = false;
    document.getElementById('voice-icon').src = '/static/mic_icon.png'; // Reset mic icon
    appendMessage("Sorry, something went wrong.", 'bot');
};

// Handle voice icon click for starting/stopping speech recognition
document.getElementById('voice-icon').addEventListener('click', function() {
    if (listening) {
        recognition.stop();
        listening = false;
        document.getElementById('voice-icon').src = '/static/mic_icon.png'; // Reset mic icon
    } else {
        if (speechSynthesisActive) {
            window.speechSynthesis.cancel(); // Stop ongoing speech if any
        }
        appendMessage("Hearing...", 'bot'); // Display hearing message
        recognition.start();
        listening = true;
        document.getElementById('voice-icon').src = '/static/mic_icon_active.png'; // Change mic icon
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

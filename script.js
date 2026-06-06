// ===== PRINCE AI - MAIN SCRIPT =====
// NEVER put your API key here! Use backend only.

const CONFIG = {
    API_URL: 'https://your-backend-server.com/api/chat', // Replace with your backend URL
    WELCOME_MESSAGE: "Greetings, noble user! I am Prince AI, your royal assistant. How may I serve you today? 👑"
};

// DOM Elements
const welcomeScreen = document.getElementById('welcome-screen');
const chatInterface = document.getElementById('chat-interface');
const messagesContainer = document.getElementById('messages');
const chatContainer = document.getElementById('chat-container');
const userInput = document.getElementById('user-input');
const sendBtn = document.getElementById('send-btn');
const micBtn = document.getElementById('mic-btn');
const typingIndicator = document.getElementById('typing-indicator');
const themeToggle = document.getElementById('theme-toggle');
const clearChatBtn = document.getElementById('clear-chat');

// State
let isDarkMode = true;
let isRecording = false;
let recognition = null;

// ===== INITIALIZATION =====
document.addEventListener('DOMContentLoaded', () => {
    initSpeechRecognition();
    setupEventListeners();
    loadTheme();
});

function startChat() {
    welcomeScreen.classList.add('hidden');
    chatInterface.classList.remove('hidden');
    setTimeout(() => chatInterface.classList.add('active'), 100);
    userInput.focus();
}

function setupEventListeners() {
    sendBtn.addEventListener('click', handleSend);
    userInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    });
    
    micBtn.addEventListener('click', toggleVoiceInput);
    themeToggle.addEventListener('click', toggleTheme);
    clearChatBtn.addEventListener('click', clearChat);
    
    // Auto-resize input
    userInput.addEventListener('input', () => {
        userInput.style.height = 'auto';
        userInput.style.height = Math.min(userInput.scrollHeight, 120) + 'px';
    });
}

// ===== THEME SYSTEM =====
function toggleTheme() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('light-mode');
    themeToggle.textContent = isDarkMode ? '🌙' : '☀️';
    localStorage.setItem('prince-ai-theme', isDarkMode ? 'dark' : 'light');
}

function loadTheme() {
    const saved = localStorage.getItem('prince-ai-theme');
    if (saved === 'light') {
        isDarkMode = false;
        document.body.classList.add('light-mode');
        themeToggle.textContent = '☀️';
    }
}

// ===== CHAT FUNCTIONS =====
function handleSend() {
    const text = userInput.value.trim();
    if (!text) return;
    
    addUserMessage(text);
    userInput.value = '';
    userInput.style.height = 'auto';
    
    showTyping();
    sendToAI(text);
}

function addUserMessage(text) {
    const msg = createMessage('user', text);
    messagesContainer.appendChild(msg);
    scrollToBottom();
}

function addAIMessage(text) {
    hideTyping();
    const msg = createMessage('ai', text);
    messagesContainer.appendChild(msg);
    scrollToBottom();
    speakText(text);
}

function createMessage(type, text) {
    const div = document.createElement('div');
    div.className = `message ${type}-message`;
    
    const avatar = document.createElement('div');
    avatar.className = 'avatar';
    avatar.textContent = type === 'ai' ? '🤴' : '👤';
    
    const bubble = document.createElement('div');
    bubble.className = 'bubble';
    
    const p = document.createElement('p');
    p.textContent = text;
    
    const time = document.createElement('span');
    time.className = 'timestamp';
    time.textContent = getTimeString();
    
    bubble.appendChild(p);
    bubble.appendChild(time);
    div.appendChild(avatar);
    div.appendChild(bubble);
    
    return div;
}

function showTyping() {
    typingIndicator.classList.remove('hidden');
    scrollToBottom();
}

function hideTyping() {
    typingIndicator.classList.add('hidden');
}

function scrollToBottom() {
    setTimeout(() => {
        chatContainer.scrollTop = chatContainer.scrollHeight;
    }, 100);
}

function getTimeString() {
    const now = new Date();
    return now.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
    });
}

function clearChat() {
    if (!confirm('Clear all messages?')) return;
    messagesContainer.innerHTML = '';
    addAIMessage(CONFIG.WELCOME_MESSAGE);
}
// ===== AI BACKEND CONNECTION =====
// Your API key is NEVER exposed to frontend - it stays on your server!

async function sendToAI(userMessage) {
    try {
        // Method 1: Using your backend server (RECOMMENDED - Secure)
        const response = await fetch(CONFIG.API_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: userMessage })
        });
        
        if (!response.ok) throw new Error('Server error');
        const data = await response.json();
        addAIMessage(data.reply);
        
    } catch (error) {
        console.error('Error:', error);
        // Fallback: Show error message
        addAIMessage("I apologize, my lord. The royal connection seems disturbed. Please ensure your backend server is running. 🛡️");
    }
}

// ===== VOICE INPUT (Speech-to-Text) =====
function initSpeechRecognition() {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
        
        recognition.onstart = () => {
            isRecording = true;
            micBtn.classList.add('recording');
            micBtn.title = 'Listening...';
        };
        
        recognition.onresult = (event) => {
            let transcript = '';
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            userInput.value = transcript;
        };
        
        recognition.onerror = (event) => {
            console.error('Speech error:', event.error);
            stopRecording();
        };
        
        recognition.onend = () => {
            stopRecording();
            // Auto-send if text was captured
            if (userInput.value.trim()) {
                setTimeout(handleSend, 500);
            }
        };
    } else {
        micBtn.style.display = 'none';
        console.log('Speech recognition not supported');
    }
}

function toggleVoiceInput() {
    if (!recognition) {
        alert('Voice input not supported in this browser. Try Chrome or Edge.');
        return;
    }
    
    if (isRecording) {
        recognition.stop();
    } else {
        recognition.start();
    }
}

function stopRecording() {
    isRecording = false;
    micBtn.classList.remove('recording');
    micBtn.title = 'Voice Input';
}

// ===== VOICE OUTPUT (Text-to-Speech) =====
let currentSpeech = null;

function speakText(text) {
    if ('speechSynthesis' in window) {
        // Stop any current speech
        if (currentSpeech) {
            window.speechSynthesis.cancel();
        }
        
        currentSpeech = new SpeechSynthesisUtterance(text);
        currentSpeech.rate = 1;
        currentSpeech.pitch = 1;
        currentSpeech.volume = 1;
        
        // Try to find a good voice
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(v => 
            v.name.includes('Google') || 
            v.name.includes('Samantha') || 
            v.name.includes('Daniel')
        );
        if (preferredVoice) currentSpeech.voice = preferredVoice;
        
        window.speechSynthesis.speak(currentSpeech);
    }
}

// Load voices when available
if ('speechSynthesis' in window) {
    window.speechSynthesis.onvoiceschanged = () => {
        window.speechSynthesis.getVoices();
    };
}

// ===== UTILITY =====
// Prevent accidental page refresh with active chat
window.addEventListener('beforeunload', (e) => {
    if (messagesContainer.children.length > 1) {
        e.preventDefault();
        e.returnValue = '';
    }
});

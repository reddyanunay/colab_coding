// Make this a module
export {};

// Configuration
const API_BASE_URL: string = 'http://localhost:8000';
const WS_BASE_URL: string = 'ws://localhost:8000';

// Get room ID and language from URL parameters
const urlParams: URLSearchParams = new URLSearchParams(window.location.search);
const roomId: string | null = urlParams.get('room');
const language: string = urlParams.get('lang') || 'python';

// Redirect if no room ID
if (!roomId) {
    window.location.href = 'landing.html';
}

// Interfaces
interface WebSocketMessage {
    type: string;
    code?: string;
    count?: number;
    position?: number;
    language?: string;
    message?: string;
}

interface RoomData {
    roomId: string;
    code: string;
    language: string;
}

interface AutocompleteRequest {
    code: string;
    cursorPosition: number;
    language: string;
}

interface AutocompleteResponse {
    suggestion: string;
    confidence: number;
}

// State
let websocket: WebSocket | null = null;
let isConnected: boolean = false;
let reconnectAttempts: number = 0;
const MAX_RECONNECT_ATTEMPTS: number = 5;
let autocompleteTimeout: number | null = null;
let currentSuggestion: string = '';
let isAcceptingSuggestion: boolean = false;

// DOM Elements
const codeEditor = document.getElementById('codeEditor') as HTMLTextAreaElement;
const ghostTextContainer = document.getElementById('ghostTextContainer') as HTMLDivElement;
const ghostHint = document.getElementById('ghostHint') as HTMLDivElement;
const roomIdDisplay = document.getElementById('roomIdDisplay') as HTMLSpanElement;
const languageBadge = document.getElementById('languageBadge') as HTMLDivElement;
const statusDot = document.getElementById('statusDot') as HTMLDivElement;
const statusText = document.getElementById('statusText') as HTMLSpanElement;
const userCountNum = document.getElementById('userCountNum') as HTMLSpanElement;
const leaveRoomBtn = document.getElementById('leaveRoomBtn') as HTMLButtonElement;
const copyRoomIdBtn = document.getElementById('copyRoomIdBtn') as HTMLButtonElement;
const autocompleteSuggestion = document.getElementById('autocompleteSuggestion') as HTMLDivElement;
const lastUpdate = document.getElementById('lastUpdate') as HTMLSpanElement;
const notification = document.getElementById('notification') as HTMLDivElement;

// Initialize UI
roomIdDisplay.textContent = roomId!;
languageBadge.textContent = language.toUpperCase();

// Utility Functions
function showNotification(message: string, type: 'success' | 'error' = 'success'): void {
    notification.textContent = message;
    notification.className = `notification ${type} show`;
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

function updateStatus(connected: boolean): void {
    isConnected = connected;
    if (connected) {
        statusDot.classList.remove('disconnected');
        statusText.textContent = 'Connected';
    } else {
        statusDot.classList.add('disconnected');
        statusText.textContent = 'Disconnected';
    }
}

function updateLastUpdateTime(): void {
    const now: Date = new Date();
    lastUpdate.textContent = now.toLocaleTimeString();
}

// Ghost Text Functions
function updateGhostText(): void {
    const cursorPos: number = codeEditor.selectionStart;
    const beforeCursor: string = codeEditor.value.substring(0, cursorPos);
    const afterCursor: string = codeEditor.value.substring(cursorPos);
    
    if (currentSuggestion) {
        ghostTextContainer.innerHTML = 
            `<span class="ghost-text">${escapeHtml(beforeCursor)}</span>` +
            `<span class="ghost-suggestion">${escapeHtml(currentSuggestion)}</span>` +
            `<span class="ghost-text">${escapeHtml(afterCursor)}</span>`;
        
        ghostHint.classList.add('show');
    } else {
        ghostTextContainer.innerHTML = '';
        ghostHint.classList.remove('show');
    }
}

function clearGhostText(): void {
    currentSuggestion = '';
    updateGhostText();
}

function acceptSuggestion(): void {
    if (!currentSuggestion) return;
    
    isAcceptingSuggestion = true;
    const cursorPos: number = codeEditor.selectionStart;
    const before: string = codeEditor.value.substring(0, cursorPos);
    const after: string = codeEditor.value.substring(cursorPos);
    
    codeEditor.value = before + currentSuggestion + after;
    codeEditor.selectionStart = codeEditor.selectionEnd = cursorPos + currentSuggestion.length;
    
    clearGhostText();
    sendCodeUpdate();
    
    setTimeout(() => {
        isAcceptingSuggestion = false;
    }, 50);
}

function escapeHtml(text: string): string {
    const div: HTMLDivElement = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// WebSocket Connection
function connectWebSocket(): void {
    if (websocket && websocket.readyState === WebSocket.OPEN) {
        return;
    }
    
    console.log(`Connecting to WebSocket for room: ${roomId}`);
    updateStatus(false);
    statusText.textContent = 'Connecting...';
    
    websocket = new WebSocket(`${WS_BASE_URL}/ws/${roomId}`);
    
    websocket.onopen = (): void => {
        console.log('WebSocket connected');
        updateStatus(true);
        reconnectAttempts = 0;
        showNotification('Connected to room!', 'success');
    };
    
    websocket.onmessage = (event: MessageEvent): void => {
        try {
            const message: WebSocketMessage = JSON.parse(event.data);
            handleWebSocketMessage(message);
        } catch (error) {
            console.error('Error parsing WebSocket message:', error);
        }
    };
    
    websocket.onerror = (error: Event): void => {
        console.error('WebSocket error:', error);
        updateStatus(false);
    };
    
    websocket.onclose = (event: CloseEvent): void => {
        console.log('WebSocket closed:', event.code, event.reason);
        updateStatus(false);
        websocket = null;
        
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            statusText.textContent = `Reconnecting... (${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`;
            setTimeout(() => {
                connectWebSocket();
            }, 2000 * reconnectAttempts);
        } else {
            statusText.textContent = 'Connection failed';
            showNotification('Connection lost. Please refresh the page.', 'error');
        }
    };
}

// Handle WebSocket Messages
function handleWebSocketMessage(message: WebSocketMessage): void {
    console.log('Received message:', message.type);
    
    switch (message.type) {
        case 'init':
            codeEditor.value = message.code || '';
            updateLastUpdateTime();
            break;
            
        case 'user_count_update':
            userCountNum.textContent = message.count?.toString() || '1';
            break;
            
        case 'user_joined':
            userCountNum.textContent = message.count?.toString() || '1';
            showNotification('A user joined the room', 'success');
            break;
            
        case 'user_left':
            userCountNum.textContent = message.count?.toString() || '1';
            showNotification('A user left the room', 'error');
            break;
            
        case 'code_update':
            const cursorPosition: number = codeEditor.selectionStart;
            const scrollPosition: number = codeEditor.scrollTop;
            
            if (codeEditor.value !== message.code) {
                codeEditor.value = message.code || '';
                codeEditor.setSelectionRange(cursorPosition, cursorPosition);
                codeEditor.scrollTop = scrollPosition;
                clearGhostText();
                updateLastUpdateTime();
            }
            break;
            
        case 'cursor_update':
            console.log('Remote cursor at:', message.position);
            break;
            
        case 'error':
            showNotification(message.message || 'An error occurred', 'error');
            break;
            
        default:
            console.log('Unknown message type:', message.type);
    }
}

// Send Code Update
function sendCodeUpdate(): void {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        return;
    }
    
    const message: WebSocketMessage = {
        type: 'code_update',
        code: codeEditor.value,
        language: language
    };
    
    websocket.send(JSON.stringify(message));
    updateLastUpdateTime();
}

// Send Cursor Update
function sendCursorUpdate(): void {
    if (!websocket || websocket.readyState !== WebSocket.OPEN) {
        return;
    }
    
    const message: WebSocketMessage = {
        type: 'cursor_update',
        position: codeEditor.selectionStart
    };
    
    websocket.send(JSON.stringify(message));
}

// Autocomplete
async function getAutocompleteSuggestion(): Promise<void> {
    const cursorPos: number = codeEditor.selectionStart;
    const code: string = codeEditor.value;
    
    if (!code.trim() || cursorPos < code.length) {
        clearGhostText();
        autocompleteSuggestion.textContent = 'Type to get suggestions...';
        autocompleteSuggestion.classList.add('empty');
        return;
    }
    
    try {
        const requestBody: AutocompleteRequest = {
            code: code,
            cursorPosition: cursorPos,
            language: language
        };
        
        const response = await fetch(`${API_BASE_URL}/autocomplete`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody)
        });
        
        if (response.ok) {
            const data: AutocompleteResponse = await response.json();
            if (data.suggestion && data.suggestion.trim()) {
                currentSuggestion = data.suggestion;
                updateGhostText();
                
                autocompleteSuggestion.textContent = data.suggestion;
                autocompleteSuggestion.classList.remove('empty');
            } else {
                clearGhostText();
                autocompleteSuggestion.textContent = 'No suggestions';
                autocompleteSuggestion.classList.add('empty');
            }
        }
    } catch (error) {
        console.error('Autocomplete error:', error);
        clearGhostText();
    }
}

// Event Listeners
codeEditor.addEventListener('input', (e: Event): void => {
    if (isAcceptingSuggestion) return;
    
    clearGhostText();
    sendCodeUpdate();
    
    if (autocompleteTimeout !== null) {
        clearTimeout(autocompleteTimeout);
    }
    autocompleteTimeout = window.setTimeout(() => {
        getAutocompleteSuggestion();
    }, 400);
});

codeEditor.addEventListener('keydown', (e: KeyboardEvent): void => {
    if (e.key === 'Tab' && currentSuggestion) {
        e.preventDefault();
        acceptSuggestion();
        return;
    }
    
    if (e.key === 'Escape' && currentSuggestion) {
        e.preventDefault();
        clearGhostText();
        return;
    }
    
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        clearGhostText();
    }
});

codeEditor.addEventListener('click', (): void => {
    clearGhostText();
    sendCursorUpdate();
});

codeEditor.addEventListener('keyup', (e: KeyboardEvent): void => {
    if (['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(e.key)) {
        sendCursorUpdate();
    }
});

codeEditor.addEventListener('scroll', (): void => {
    ghostTextContainer.scrollTop = codeEditor.scrollTop;
    ghostTextContainer.scrollLeft = codeEditor.scrollLeft;
});

// Copy Room ID
copyRoomIdBtn.addEventListener('click', (): void => {
    navigator.clipboard.writeText(roomId!).then(() => {
        showNotification('Room ID copied to clipboard!', 'success');
    }).catch(() => {
        showNotification('Failed to copy Room ID', 'error');
    });
});

// Leave Room
leaveRoomBtn.addEventListener('click', (): void => {
    if (confirm('Are you sure you want to leave this room?')) {
        if (websocket) {
            websocket.close();
        }
        window.location.href = 'landing.html';
    }
});

// Load initial room data
async function loadRoomData(): Promise<void> {
    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`);
        if (response.ok) {
            const data: RoomData = await response.json();
            codeEditor.value = data.code || '';
            updateLastUpdateTime();
        }
    } catch (error) {
        console.error('Error loading room data:', error);
        showNotification('Failed to load room data', 'error');
    }
}

// Initialize
async function init(): Promise<void> {
    await loadRoomData();
    connectWebSocket();
}

// Start the app
init();

// Cleanup on page unload
window.addEventListener('beforeunload', (): void => {
    if (websocket) {
        websocket.close();
    }
});

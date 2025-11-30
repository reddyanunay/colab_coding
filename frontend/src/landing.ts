// Make this a module
export {};

// Configuration
const API_BASE_URL: string = 'http://localhost:8000';

// Get room parameters from URL
const urlParams: URLSearchParams = new URLSearchParams(window.location.search);
const roomId: string | null = urlParams.get('room');
const language: string = urlParams.get('lang') || 'python';

// Redirect if no room ID
if (!roomId) {
    window.location.href = 'landing.html';
}

// State interfaces
interface RoomData {
    roomId: string;
    code: string;
    language: string;
}

// DOM Elements
const createRoomBtn = document.getElementById('createRoomBtn') as HTMLButtonElement;
const joinRoomBtn = document.getElementById('joinRoomBtn') as HTMLButtonElement;
const createLanguage = document.getElementById('createLanguage') as HTMLSelectElement;
const roomIdInput = document.getElementById('roomIdInput') as HTMLInputElement;

const createError = document.getElementById('createError') as HTMLDivElement;
const joinError = document.getElementById('joinError') as HTMLDivElement;
const createLoading = document.getElementById('createLoading') as HTMLDivElement;
const joinLoading = document.getElementById('joinLoading') as HTMLDivElement;

// Utility Functions
function showError(element: HTMLDivElement, message: string): void {
    element.textContent = message;
    element.classList.add('show');
    setTimeout(() => element.classList.remove('show'), 5000);
}

function showLoading(element: HTMLDivElement, show: boolean): void {
    if (show) {
        element.classList.add('show');
    } else {
        element.classList.remove('show');
    }
}

// Create Room
createRoomBtn.addEventListener('click', async (): Promise<void> => {
    createError.classList.remove('show');
    showLoading(createLoading, true);
    createRoomBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/rooms`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: createLanguage.value
            })
        });
        
        if (!response.ok) {
            throw new Error(`Failed to create room: ${response.status}`);
        }
        
        const data: RoomData = await response.json();
        
        // Redirect to editor with room ID and language
        window.location.href = `editor.html?room=${data.roomId}&lang=${data.language}`;
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        showError(createError, errorMessage);
        showLoading(createLoading, false);
        createRoomBtn.disabled = false;
    }
});

// Join Room
joinRoomBtn.addEventListener('click', async (): Promise<void> => {
    const roomId: string = roomIdInput.value.trim();
    
    if (!roomId) {
        showError(joinError, 'Please enter a room ID');
        return;
    }
    
    joinError.classList.remove('show');
    showLoading(joinLoading, true);
    joinRoomBtn.disabled = true;
    
    try {
        const response = await fetch(`${API_BASE_URL}/rooms/${roomId}`);
        
        if (!response.ok) {
            throw new Error('Room not found. Please check the room ID.');
        }
        
        const data: RoomData = await response.json();
        
        // Redirect to editor with room ID and language
        window.location.href = `editor.html?room=${data.roomId}&lang=${data.language}`;
        
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        showError(joinError, errorMessage);
        showLoading(joinLoading, false);
        joinRoomBtn.disabled = false;
    }
});

// Allow Enter key to join room
roomIdInput.addEventListener('keypress', (e: KeyboardEvent): void => {
    if (e.key === 'Enter') {
        joinRoomBtn.click();
    }
});

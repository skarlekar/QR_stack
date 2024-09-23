// Get DOM elements
const fileInput = document.getElementById('fileInput');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const messageElement = document.getElementById('message');
const progressBar = document.querySelector('.progress');
const speedSlider = document.getElementById('speedSlider');
const speedValue = document.getElementById('speedValue');
const chunkSizeSlider = document.getElementById('chunkSizeSlider');
const chunkSizeValue = document.getElementById('chunkSizeValue');

// Global variables
let chunks = []; // Array to store file chunks
let currentChunkIndex = 0; // Current chunk being displayed
let intervalId = null; // Interval ID for QR code display
let chunkSize = 60; // Default chunk size in bytes
let displayInterval = 250; // Default display interval in milliseconds

// Event listeners
fileInput.addEventListener('change', handleFileSelect);
startBtn.addEventListener('click', startDisplay);
stopBtn.addEventListener('click', stopDisplay);
resetBtn.addEventListener('click', resetDisplay);
speedSlider.addEventListener('input', updateSpeed);
chunkSizeSlider.addEventListener('input', updateChunkSize);

// Handle file selection
async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        // Read file as ArrayBuffer
        const arrayBuffer = await readFile(file);
        // Split file into chunks
        chunks = splitIntoChunks(arrayBuffer, chunkSize);
        // Enable start and reset buttons
        startBtn.disabled = false;
        resetBtn.disabled = false;
        // Display file info
        messageElement.textContent = `File loaded: ${chunks.length} chunks`;

        // Generate and display initial QR code with file info
        const fileInfo = {
            filename: file.name,
            chunks: chunks.length.toString()
        };
        const fileInfoJson = JSON.stringify(fileInfo);
        const fileInfoQRCode = generateQRCode(fileInfoJson);
        
        // Create and display QR code image
        const qrCodeImage = document.createElement('img');
        qrCodeImage.src = fileInfoQRCode;
        
        // Create and display info text
        const infoText = document.createElement('p');
        infoText.textContent = 'File Information QR Code';
        infoText.style.textAlign = 'center';
        infoText.style.fontWeight = 'bold';

        // Clear container and append new elements
        qrCodeContainer.innerHTML = '';
        qrCodeContainer.appendChild(qrCodeImage);
        qrCodeContainer.appendChild(infoText);

    } catch (error) {
        console.error('Error reading file:', error);
        messageElement.textContent = 'Error reading file. Please try again.';
    }
}

// Read file as ArrayBuffer
function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}

// Split ArrayBuffer into chunks
function splitIntoChunks(arrayBuffer, chunkSize) {
    const uint8Array = new Uint8Array(arrayBuffer);
    const chunks = [];
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
        chunks.push(uint8Array.slice(i, i + chunkSize));
    }
    return chunks;
}

// Generate QR code
function generateQRCode(data) {
    const qr = qrcode(0, 'L');
    qr.addData(data);
    qr.make();
    return qr.createDataURL(10);
}

// Display QR codes sequentially
function displayQRCodes() {
    if (currentChunkIndex >= chunks.length) {
        stopDisplay();
        messageElement.textContent = 'Done!';
        return;
    }

    // Get current chunk and convert to base64
    const chunkData = chunks[currentChunkIndex];
    const base64Data = btoa(String.fromCharCode.apply(null, chunkData));
    
    // Create JSON data for QR code
    const qrCodeData = JSON.stringify({
        chunk: (currentChunkIndex + 1).toString(),
        total_chunks: chunks.length.toString(),
        data: base64Data
    });

    // Generate and display QR code
    const qrCodeImage = document.createElement('img');
    qrCodeImage.src = generateQRCode(qrCodeData);
    
    // Display chunk info
    const chunkInfo = document.createElement('p');
    chunkInfo.textContent = `${currentChunkIndex + 1}/${chunks.length}`;
    chunkInfo.style.textAlign = 'center';
    chunkInfo.style.marginTop = '10px';
    chunkInfo.style.fontWeight = 'bold';

    // Update QR code container
    qrCodeContainer.innerHTML = '';
    qrCodeContainer.appendChild(qrCodeImage);
    qrCodeContainer.appendChild(chunkInfo);

    // Move to next chunk and update progress
    currentChunkIndex++;
    updateProgressBar();
}

// Start displaying QR codes
function startDisplay() {
    if (intervalId) return;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    intervalId = setInterval(displayQRCodes, displayInterval);
}

// Stop displaying QR codes
function stopDisplay() {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

// Reset display to initial state
function resetDisplay() {
    stopDisplay();
    currentChunkIndex = 0;
    qrCodeContainer.innerHTML = '';
    messageElement.textContent = '';
    updateProgressBar();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    resetBtn.disabled = false;

    // Regenerate and display the initial QR code with file info
    if (chunks.length > 0) {
        const file = fileInput.files[0];
        const fileInfo = {
            filename: file.name,
            chunks: chunks.length.toString()
        };
        const fileInfoJson = JSON.stringify(fileInfo);
        const fileInfoQRCode = generateQRCode(fileInfoJson);
        
        // Create and display QR code image
        const qrCodeImage = document.createElement('img');
        qrCodeImage.src = fileInfoQRCode;
        
        // Create and display info text
        const infoText = document.createElement('p');
        infoText.textContent = 'File Information QR Code';
        infoText.style.textAlign = 'center';
        infoText.style.fontWeight = 'bold';

        // Append new elements to the container
        qrCodeContainer.appendChild(qrCodeImage);
        qrCodeContainer.appendChild(infoText);

        // Update message
        messageElement.textContent = `File loaded: ${chunks.length} chunks`;
    }
}

// Update display speed based on slider value
function updateSpeed() {
    const speed = parseInt(speedSlider.value);
    let speedText = 'Normal';
    
    if (speed < 0) {
        displayInterval = 250 * (1 + Math.abs(speed) * 0.5);
        speedText = `Slower (${Math.round(displayInterval)}ms)`;
    } else if (speed > 0) {
        displayInterval = 250 / (1 + speed * 0.5);
        speedText = `Faster (${Math.round(displayInterval)}ms)`;
    } else {
        displayInterval = 250;
    }

    speedValue.textContent = speedText;

    // Restart display if currently running
    if (intervalId) {
        stopDisplay();
        startDisplay();
    }
}

// Update chunk size based on slider value
function updateChunkSize() {
    chunkSize = parseInt(chunkSizeSlider.value);
    chunkSizeValue.textContent = `${chunkSize} bytes`;

    // Re-process file if one is loaded
    if (fileInput.files.length > 0) {
        handleFileSelect({ target: fileInput });
    }
}

// Update progress bar
function updateProgressBar() {
    const progress = (currentChunkIndex / chunks.length) * 100;
    progressBar.style.width = `${progress}%`;
}
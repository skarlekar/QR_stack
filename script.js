const fileInput = document.getElementById('fileInput');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const resetBtn = document.getElementById('resetBtn');
const qrCodeContainer = document.getElementById('qrCodeContainer');
const messageElement = document.getElementById('message');
const progressBar = document.querySelector('.progress');

let chunks = [];
let currentChunkIndex = 0;
let intervalId = null;
const chunkSize = 60;
const displayInterval = 250;

fileInput.addEventListener('change', handleFileSelect);
startBtn.addEventListener('click', startDisplay);
stopBtn.addEventListener('click', stopDisplay);
resetBtn.addEventListener('click', resetDisplay);

async function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    try {
        const arrayBuffer = await readFile(file);
        chunks = splitIntoChunks(arrayBuffer, chunkSize);
        startBtn.disabled = false;
        resetBtn.disabled = false;
        messageElement.textContent = `File loaded: ${chunks.length} chunks`;
    } catch (error) {
        console.error('Error reading file:', error);
        messageElement.textContent = 'Error reading file. Please try again.';
    }
}

function readFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (event) => resolve(event.target.result);
        reader.onerror = (error) => reject(error);
        reader.readAsArrayBuffer(file);
    });
}

function splitIntoChunks(arrayBuffer, chunkSize) {
    const uint8Array = new Uint8Array(arrayBuffer);
    const chunks = [];
    for (let i = 0; i < uint8Array.length; i += chunkSize) {
        chunks.push(uint8Array.slice(i, i + chunkSize));
    }
    return chunks;
}

function generateQRCode(data) {
    const qr = qrcode(0, 'L');
    qr.addData(btoa(String.fromCharCode.apply(null, data)));
    qr.make();
    return qr.createDataURL(10);
}

function displayQRCodes() {
    if (currentChunkIndex >= chunks.length) {
        stopDisplay();
        messageElement.textContent = 'Done!';
        return;
    }

    const qrCodeData = generateQRCode(chunks[currentChunkIndex]);
    const qrCodeImage = document.createElement('img');
    qrCodeImage.src = qrCodeData;
    qrCodeContainer.innerHTML = '';
    qrCodeContainer.appendChild(qrCodeImage);

    currentChunkIndex++;
    updateProgressBar();
}

function startDisplay() {
    if (intervalId) return;
    startBtn.disabled = true;
    stopBtn.disabled = false;
    intervalId = setInterval(displayQRCodes, displayInterval);
}

function stopDisplay() {
    if (!intervalId) return;
    clearInterval(intervalId);
    intervalId = null;
    startBtn.disabled = false;
    stopBtn.disabled = true;
}

function resetDisplay() {
    stopDisplay();
    currentChunkIndex = 0;
    qrCodeContainer.innerHTML = '';
    messageElement.textContent = '';
    updateProgressBar();
    startBtn.disabled = false;
    stopBtn.disabled = true;
    resetBtn.disabled = true;
}

function updateProgressBar() {
    const progress = (currentChunkIndex / chunks.length) * 100;
    progressBar.style.width = `${progress}%`;
}
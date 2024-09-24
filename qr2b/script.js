// DOM elements
const video = document.getElementById('video');
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');
const startBtn = document.getElementById('startBtn');
const stopBtn = document.getElementById('stopBtn');
const progressBar = document.getElementById('progressBar');
const progressText = document.getElementById('progressText');
const statusMessage = document.getElementById('statusMessage');
const errorMessage = document.getElementById('errorMessage');
const missingChunks = document.getElementById('missingChunks');
const downloadLink = document.getElementById('downloadLink');
const segmentedProgressBar = document.getElementById('segmentedProgressBar');

// Global variables
let scanning = false;
let fileInfo = null;
let chunks = {};
let totalChunks = 0;
let lastReadTime = null;
let readTimes = [];
const MAX_READ_TIMES = 10; // Number of recent read times to consider for average

// Event listeners
startBtn.addEventListener('click', startScanning);
stopBtn.addEventListener('click', stopScanning);

// Start camera and QR code scanning
async function startScanning() {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        video.setAttribute("playsinline", true);
        video.play();
        scanning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        statusMessage.textContent = "Scanning...";
        requestAnimationFrame(scan);
    } catch (err) {
        console.error("Error accessing the camera:", err);
        errorMessage.textContent = "Error accessing the camera. Please make sure you've granted camera permissions.";
    }
}

// Stop scanning
function stopScanning() {
    scanning = false;
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop());
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusMessage.textContent = "Scanning stopped.";
}

// Scan for QR codes
function scan() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code) {
            processQRCode(code.data);
        }
    }
    if (scanning) {
        requestAnimationFrame(scan);
    }
}

// Process scanned QR code data
function processQRCode(data) {
    try {
        const jsonData = JSON.parse(data);
        if (jsonData.filename && jsonData.chunks) {
            // File info QR code
            fileInfo = jsonData;
            totalChunks = parseInt(fileInfo.chunks);
            statusMessage.textContent = `File: ${fileInfo.filename}, Total chunks: ${totalChunks}`;
            createSegmentedProgressBar(totalChunks);
            updateProgress();
            lastReadTime = Date.now(); // Initialize lastReadTime
        } else if (jsonData.chunk && jsonData.total_chunks && jsonData.data) {
            // Data chunk QR code
            const chunkIndex = parseInt(jsonData.chunk);
            if (!chunks[chunkIndex]) {
                chunks[chunkIndex] = jsonData.data;
                updateProgress();
                updateSegmentedProgressBar(chunkIndex);
                
                // Calculate and update read time
                const currentTime = Date.now();
                if (lastReadTime) {
                    const readTime = currentTime - lastReadTime;
                    readTimes.push(readTime);
                    if (readTimes.length > MAX_READ_TIMES) {
                        readTimes.shift(); // Remove oldest read time
                    }
                }
                lastReadTime = currentTime;
                
                // Estimate remaining time
                const remainingTime = estimateRemainingTime();
                
                // Display current chunk, total chunks, and estimated time
                statusMessage.textContent = `File: ${fileInfo ? fileInfo.filename : 'Unknown'}, Chunk: ${chunkIndex}/${totalChunks}, Estimated time: ${remainingTime}`;
                
                if (Object.keys(chunks).length === totalChunks) {
                    assembleFile();
                }
            }
        }
    } catch (err) {
        console.error("Error processing QR code:", err);
        errorMessage.textContent = "Invalid QR code data.";
    }
}

// Create segmented progress bar
function createSegmentedProgressBar(totalSegments) {
    segmentedProgressBar.innerHTML = '';
    if (totalSegments > MAX_VISIBLE_SEGMENTS) {
        segmentSize = Math.ceil(totalSegments / MAX_VISIBLE_SEGMENTS);
        totalSegments = MAX_VISIBLE_SEGMENTS;
    } else {
        segmentSize = 1;
    }
    
    for (let i = 0; i < totalSegments; i++) {
        const segment = document.createElement('div');
        segment.className = 'segment';
        segmentedProgressBar.appendChild(segment);
    }
}

// Update segmented progress bar
function updateSegmentedProgressBar(chunkIndex) {
    const segmentIndex = Math.floor((chunkIndex - 1) / segmentSize);
    const segments = segmentedProgressBar.children;
    if (segments[segmentIndex]) {
        // Check if all chunks in this segment are present
        const startChunk = segmentIndex * segmentSize + 1;
        const endChunk = Math.min((segmentIndex + 1) * segmentSize, totalChunks);
        let allPresent = true;
        for (let i = startChunk; i <= endChunk; i++) {
            if (!chunks[i]) {
                allPresent = false;
                break;
            }
        }
        if (allPresent) {
            segments[segmentIndex].classList.add('read');
            segments[segmentIndex].classList.remove('missing');
        } else {
            segments[segmentIndex].classList.remove('read');
            segments[segmentIndex].classList.add('missing');
        }
    }
}

// Update progress bar and text
function updateProgress() {
    const progress = (Object.keys(chunks).length / totalChunks) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${Object.keys(chunks).length} / ${totalChunks} chunks`;
}

// Assemble file from chunks
function assembleFile() {
    const missingChunkIndices = [];
    for (let i = 1; i <= totalChunks; i++) {
        if (!chunks[i]) {
            missingChunkIndices.push(i);
        }
    }

    if (missingChunkIndices.length > 0) {
        errorMessage.textContent = "Some chunks are missing. Please rescan the missing QR codes.";
        missingChunks.textContent = `Missing chunks: ${missingChunkIndices.join(', ')}`;
        // Update progress bar to reflect missing chunks
        for (let i = 1; i <= totalChunks; i++) {
            updateSegmentedProgressBar(i);
        }
    } else {
        const base64Data = Object.values(chunks).join('');
        const binaryData = atob(base64Data);
        const uint8Array = new Uint8Array(binaryData.length);
        for (let i = 0; i < binaryData.length; i++) {
            uint8Array[i] = binaryData.charCodeAt(i);
        }
        const blob = new Blob([uint8Array]);
        const url = URL.createObjectURL(blob);
        downloadLink.href = url;
        downloadLink.download = fileInfo.filename;
        downloadLink.style.display = 'block';
        statusMessage.textContent = "File assembly complete. Click the download link to save the file.";
        stopScanning();
    }
}

const MAX_VISIBLE_SEGMENTS = 100; // Maximum number of visible segments in the progress bar
let segmentSize = 1; // Number of chunks represented by each segment

// Add this new function to estimate remaining time
function estimateRemainingTime() {
    if (readTimes.length === 0) return "Calculating...";
    
    const averageReadTime = readTimes.reduce((a, b) => a + b, 0) / readTimes.length;
    const remainingChunks = totalChunks - Object.keys(chunks).length;
    const estimatedSeconds = (remainingChunks * averageReadTime) / 1000;
    
    if (estimatedSeconds < 60) {
        return `${Math.round(estimatedSeconds)} seconds`;
    } else if (estimatedSeconds < 3600) {
        return `${Math.round(estimatedSeconds / 60)} minutes`;
    } else {
        return `${Math.round(estimatedSeconds / 3600)} hours`;
    }
}
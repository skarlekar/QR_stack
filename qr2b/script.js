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
let scanning = false; // Flag to indicate if scanning is in progress
let fileInfo = null; // Stores information about the file being reconstructed
let chunks = {}; // Object to store scanned chunks
let totalChunks = 0; // Total number of chunks expected
let lastReadTime = null; // Timestamp of the last successful chunk read
let readTimes = []; // Array to store recent chunk read times
const MAX_READ_TIMES = 10; // Number of recent read times to consider for average
let fileAssembled = false; // Flag to indicate if file has been assembled

// Event listeners for start and stop buttons
startBtn.addEventListener('click', startScanning);
stopBtn.addEventListener('click', stopScanning);

// Function to start camera and QR code scanning
async function startScanning() {
    try {
        // Reset state
        fileAssembled = false;
        chunks = {};
        fileInfo = null;
        totalChunks = 0;
        lastReadTime = null;
        readTimes = [];
        errorMessage.textContent = '';
        missingChunks.textContent = '';
        downloadLink.style.display = 'none';
        
        // Request camera access
        const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
        video.srcObject = stream;
        video.setAttribute("playsinline", true); // Important for iOS devices
        video.play();
        scanning = true;
        startBtn.disabled = true;
        stopBtn.disabled = false;
        statusMessage.textContent = "Scanning...";
        requestAnimationFrame(scan); // Start the scanning loop
    } catch (err) {
        console.error("Error accessing the camera:", err);
        errorMessage.textContent = "Error accessing the camera. Please make sure you've granted camera permissions.";
    }
}

// Function to stop scanning
function stopScanning() {
    scanning = false;
    const stream = video.srcObject;
    const tracks = stream.getTracks();
    tracks.forEach(track => track.stop()); // Stop all video tracks
    startBtn.disabled = false;
    stopBtn.disabled = true;
    statusMessage.textContent = "Scanning stopped.";
}

// Function to scan for QR codes
function scan() {
    if (video.readyState === video.HAVE_ENOUGH_DATA) {
        canvas.height = video.videoHeight;
        canvas.width = video.videoWidth;
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        // Attempt to find a QR code in the image
        const code = jsQR(imageData.data, imageData.width, imageData.height, {
            inversionAttempts: "dontInvert",
        });

        if (code && !fileAssembled) {
            processQRCode(code.data); // Process the QR code if found and file not assembled
        }
    }
    if (scanning && !fileAssembled) {
        requestAnimationFrame(scan); // Continue scanning if not stopped and file not assembled
    }
}

// Function to process scanned QR code data
function processQRCode(data) {
    try {
        // Don't process if file is already assembled
        if (fileAssembled) {
            return;
        }
        
        const jsonData = JSON.parse(data);
        if (jsonData.filename && jsonData.chunks) {
            // This is the file info QR code
            fileInfo = jsonData;
            totalChunks = parseInt(fileInfo.chunks);
            statusMessage.textContent = `File: ${fileInfo.filename}, Total chunks: ${totalChunks}`;
            createSegmentedProgressBar(totalChunks);
            updateProgress();
            lastReadTime = Date.now(); // Initialize lastReadTime
        } else if (jsonData.chunk && jsonData.total_chunks && jsonData.data) {
            // This is a data chunk QR code
            const chunkIndex = parseInt(jsonData.chunk);
            if (!chunks[chunkIndex]) {
                chunks[chunkIndex] = jsonData.data;
                console.log(`Received chunk ${chunkIndex}/${totalChunks}, data length: ${jsonData.data.length}`);
                console.log(`Chunk ${chunkIndex} first 50 chars:`, jsonData.data.substring(0, 50));
                updateProgress();
                updateSegmentedProgressBar(chunkIndex);
            } else {
                console.log(`Duplicate chunk ${chunkIndex} received, ignoring`);
            }
            
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
                console.log("All chunks received, assembling file...");
                console.log("Chunks:", Object.keys(chunks).sort((a, b) => parseInt(a) - parseInt(b)));
                assembleFile(); // All chunks received, assemble the file
            }
        }
    } catch (err) {
        console.error("Error processing QR code:", err);
        // Only show error if file is not assembled
        if (!fileAssembled) {
            errorMessage.textContent = "Invalid QR code data.";
        }
    }
}

// Function to create segmented progress bar
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

// Function to update segmented progress bar
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

// Function to update progress bar and text
function updateProgress() {
    const progress = (Object.keys(chunks).length / totalChunks) * 100;
    progressBar.style.width = `${progress}%`;
    progressText.textContent = `${Object.keys(chunks).length} / ${totalChunks} chunks`;
}

// Function to assemble file from chunks
function assembleFile() {
    // Prevent multiple assembly attempts
    if (fileAssembled) {
        return;
    }
    
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
        // All chunks are present, assemble the file
        try {
            console.log("Assembling file with", Object.keys(chunks).length, "chunks");
            
            // Assemble chunks by reconstructing binary data directly
            const availableKeys = Object.keys(chunks).map(k => parseInt(k)).sort((a, b) => a - b);
            console.log("Available chunk keys:", availableKeys);
            console.log("Expected chunks: 1 to", totalChunks);
            
            // Since each chunk was base64 encoded separately, we need to decode each chunk
            // back to binary data, then combine the binary data
            const binaryChunks = [];
            let totalBinaryLength = 0;
            
            for (let i = 1; i <= totalChunks; i++) {
                if (chunks[i]) {
                    try {
                        // Decode each chunk's base64 back to binary
                        const chunkBase64 = chunks[i];
                        const chunkBinary = atob(chunkBase64);
                        binaryChunks.push(chunkBinary);
                        totalBinaryLength += chunkBinary.length;
                        
                        console.log(`Chunk ${i}:`, {
                            base64Length: chunkBase64.length,
                            binaryLength: chunkBinary.length,
                            preview: chunkBinary.substring(0, Math.min(20, chunkBinary.length)).split('').map(c => c.charCodeAt(0))
                        });
                    } catch (chunkDecodeError) {
                        console.error(`Error decoding chunk ${i}:`, chunkDecodeError);
                        throw new Error(`Failed to decode chunk ${i}`);
                    }
                } else {
                    throw new Error(`Missing chunk ${i}`);
                }
            }
            
            console.log("Total binary length:", totalBinaryLength);
            
            // Combine all binary chunks into one Uint8Array
            const uint8Array = new Uint8Array(totalBinaryLength);
            let offset = 0;
            
            for (let i = 0; i < binaryChunks.length; i++) {
                const chunkBinary = binaryChunks[i];
                for (let j = 0; j < chunkBinary.length; j++) {
                    uint8Array[offset + j] = chunkBinary.charCodeAt(j);
                }
                offset += chunkBinary.length;
            }
            
            // Convert back to text to verify
            const decoder = new TextDecoder('utf-8');
            const decodedText = decoder.decode(uint8Array.slice(0, Math.min(200, uint8Array.length)));
            console.log("Decoded text preview:", decodedText);
            console.log("First 20 bytes as numbers:", Array.from(uint8Array.slice(0, 20)));
            const blob = new Blob([uint8Array]);
            const url = URL.createObjectURL(blob);
            downloadLink.href = url;
            downloadLink.download = fileInfo.filename;
            downloadLink.style.display = 'block';
            statusMessage.textContent = "File assembly complete. Click the download link to save the file.";
            fileAssembled = true; // Mark file as assembled
            console.log("File assembled successfully:", fileInfo.filename);
            stopScanning();
        } catch (error) {
            console.error("Error assembling file:", error);
            errorMessage.textContent = `Error assembling file: ${error.message}. Please try scanning again.`;
        }
    }
}

const MAX_VISIBLE_SEGMENTS = 100; // Maximum number of visible segments in the progress bar
let segmentSize = 1; // Number of chunks represented by each segment

// Function to estimate remaining time
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
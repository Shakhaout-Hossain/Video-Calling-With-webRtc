// Get DOM elements
const startBtn = document.getElementById("startBtn");
const stopBtn = document.getElementById("stopBtn");
const preview = document.getElementById("screenPreview");

let mediaStream = null;

// Request screen capture
async function startScreenSharing() {
  try {
    mediaStream = await navigator.mediaDevices.getDisplayMedia({
      video: true,
      audio: true, // Optional: include system audio
    });

    // Display the screen stream in video element
    preview.srcObject = mediaStream;

    // Enable stop button
    startBtn.disabled = true;
    stopBtn.disabled = false;

    // Handle when user stops sharing via browser UI
    mediaStream.getVideoTracks()[0].onended = () => {
      stopScreenSharing();
    };
  } catch (error) {
    console.error("Error accessing screen:", error);
  }
}

// Stop screen sharing
function stopScreenSharing() {
  if (mediaStream) {
    mediaStream.getTracks().forEach((track) => track.stop());
    preview.srcObject = null;
    startBtn.disabled = false;
    stopBtn.disabled = true;
  }
}

// Event listeners
startBtn.addEventListener("click", startScreenSharing);
stopBtn.addEventListener("click", stopScreenSharing);

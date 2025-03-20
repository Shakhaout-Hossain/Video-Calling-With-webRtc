let localStream;
let peerConnection;
const socket = new WebSocket("wss://webrtctest.ergov.com/ws");
// const socket = new WebSocket("ws://localhost:8844/ws");
// const socket = new WebSocket("ws://localhost:8080");
const constraints = {
  video: true,
  audio: {
    echoCancellation: true,
    noiseSuppression: true,
    autoGainControl: true,
  },
};

// DOM Elements
const localVideo = document.getElementById("localVideo");
const remoteVideo = document.getElementById("remoteVideo");
const callBtn = document.getElementById("callBtn");
const hangupBtn = document.getElementById("hangupBtn");

// WebSocket handlers
socket.onmessage = async (event) => {
  const data = JSON.parse(event.data);

  if (data.type === "offer") {
    await handleOffer(data.offer);
  } else if (data.type === "answer") {
    await peerConnection.setRemoteDescription(data.answer);
  } else if (data.type === "ice-candidate") {
    peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
  }
};

// Initialize local stream
async function initLocalStream() {
  try {
    localStream = await navigator.mediaDevices.getUserMedia(constraints);
    localVideo.srcObject = localStream;
    callBtn.disabled = false;
  } catch (error) {
    console.error("Error accessing media:", error);
  }
}

// Create peer connection
function createPeerConnection() {
  const config = {
    iceServers: [
      { urls: "stun:stun.l.google.com:19302" },
      // Add TURN server here if needed
    ],
  };

  peerConnection = new RTCPeerConnection(config);

  // Add local tracks
  localStream.getTracks().forEach((track) => {
    peerConnection.addTrack(track, localStream);
  });

  // ICE Candidate handling
  peerConnection.onicecandidate = (event) => {
    if (event.candidate) {
      socket.send(
        JSON.stringify({
          type: "ice-candidate",
          candidate: event.candidate,
        })
      );
    }
  };

  // Remote stream handling
  peerConnection.ontrack = (event) => {
    remoteVideo.srcObject = event.streams[0];
    hangupBtn.disabled = false;
  };
}

// Handle incoming offer
async function handleOffer(offer) {
  await createPeerConnection();
  await peerConnection.setRemoteDescription(offer);
  const answer = await peerConnection.createAnswer();
  await peerConnection.setLocalDescription(answer);
  socket.send(JSON.stringify({ type: "answer", answer }));
}

// Start call
async function startCall() {
  await createPeerConnection();
  const offer = await peerConnection.createOffer();
  await peerConnection.setLocalDescription(offer);
  socket.send(JSON.stringify({ type: "offer", offer }));
}

// Hang up
function hangUp() {
  peerConnection.close();
  peerConnection = null;
  remoteVideo.srcObject = null;
  hangupBtn.disabled = true;
  callBtn.disabled = false;
}

// Join room
function joinRoom() {
  const roomId = document.getElementById("roomId").value;
  socket.send(JSON.stringify({ type: "join", roomId }));
}

// Initialize
initLocalStream();

const WebSocket = require("ws");
const { v4: uuidv4 } = require("uuid");
const server = new WebSocket.Server({ port: 8080 });
const rooms = new Map(); // Room ID → Set of clients

server.on("connection", (socket) => {
  socket.id = uuidv4();
  console.log(`Client connected: ${socket.id}`);

  socket.on("message", (message) => {
    const data = JSON.parse(message);

    if (data.type === "join") {
      const roomId = data.roomId || uuidv4();
      if (!rooms.has(roomId)) rooms.set(roomId, new Set());
      rooms.get(roomId).add(socket);
      socket.roomId = roomId;
      socket.send(JSON.stringify({ type: "room", roomId }));
    }

    // Relay messages to other peers in the room
    const room = rooms.get(socket.roomId);
    if (room) {
      room.forEach((client) => {
        if (client !== socket && client.readyState === WebSocket.OPEN) {
          client.send(JSON.stringify({ ...data, sender: socket.id }));
        }
      });
    }
  });

  socket.on("close", () => {
    if (socket.roomId) {
      const room = rooms.get(socket.roomId);
      room.delete(socket);
      if (room.size === 0) rooms.delete(socket.roomId);
    }
  });
});

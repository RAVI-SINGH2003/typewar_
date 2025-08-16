const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const mongoose = require('mongoose');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Middleware
app.use(cors());
app.use(express.json());

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/typingrace', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Models
const Room = require('./models/Room');
const Player = require('./models/Player');

// In-memory storage for active rooms and players
const activeRooms = new Map();
const activePlayers = new Map();

// Sample paragraphs for typing
const SAMPLE_PARAGRAPHS = [
  "The quick brown fox jumps over the lazy dog while the sun sets behind the mountains. Birds chirp melodiously as evening approaches, creating a peaceful atmosphere that calms the mind and soothes the soul.",
  "Technology has revolutionized the way we communicate and interact with each other. From smartphones to social media platforms, digital innovation continues to shape our daily lives in unprecedented ways.",
  "Reading books expands our knowledge and imagination while improving our vocabulary and critical thinking skills. Literature transports us to different worlds and helps us understand diverse perspectives and cultures.",
  "Cooking is both an art and a science that brings people together around shared meals. The combination of fresh ingredients, proper techniques, and creativity results in delicious dishes that nourish body and soul.",
  "Exercise and physical activity are essential for maintaining good health and mental wellbeing. Regular movement strengthens muscles, improves cardiovascular function, and releases endorphins that boost mood and energy levels."
];

// Generate random room code
function generateRoomCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// WebSocket connection handling
wss.on('connection', (ws) => {
  console.log('New client connected');

  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      await handleMessage(ws, data);
    } catch (error) {
      console.error('Error handling message:', error);
      ws.send(JSON.stringify({ type: 'error', message: 'Invalid message format' }));
    }
  });

  ws.on('close', () => {
    handleDisconnection(ws);
  });
});

async function handleMessage(ws, data) {
  const { type, payload } = data;

  switch (type) {
    case 'createRoom':
      await createRoom(ws, payload);
      break;
    case 'joinRoom':
      await joinRoom(ws, payload);
      break;
    case 'leaveRoom':
      await leaveRoom(ws, payload);
      break;
    case 'startGame':
      await startGame(ws, payload);
      break;
    case 'updateProgress':
      await updateProgress(ws, payload);
      break;
    case 'getPublicRooms':
      await getPublicRooms(ws);
      break;
    default:
      ws.send(JSON.stringify({ type: 'error', message: 'Unknown message type' }));
  }
}

async function createRoom(ws, payload) {
  const { roomName, isPrivate, playerName } = payload;

  try {
    const roomCode = generateRoomCode();
    const playerId = uuidv4();

    // Create room in database
    const room = new Room({
      name: roomName,
      code: roomCode,
      isPrivate: isPrivate,
      ownerId: playerId,
      players: [],
      gameState: 'waiting',
      currentText: '',
      createdAt: new Date()
    });

    await room.save();

    // Create player
    const player = new Player({
      id: playerId,
      name: playerName,
      roomCode: roomCode,
      isOwner: true,
      wpm: 0,
      progress: 0,
      isReady: false
    });

    await player.save();

    // Store in memory
    activeRooms.set(roomCode, {
      ...room.toObject(),
      players: [player.toObject()],
      connections: new Map([[playerId, ws]])
    });

    activePlayers.set(playerId, {
      ...player.toObject(),
      ws: ws
    });

    ws.playerId = playerId;
    ws.roomCode = roomCode;

    ws.send(JSON.stringify({
      type: 'roomCreated',
      payload: {
        room: activeRooms.get(roomCode),
        playerId: playerId
      }
    }));

    // Broadcast to all clients if public room
    if (!isPrivate) {
      broadcastPublicRooms();
    }

  } catch (error) {
    console.error('Error creating room:', error);
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to create room' }));
  }
}

async function joinRoom(ws, payload) {
  const { roomCode, playerName } = payload;

  try {
    // Check if room exists
    let room = activeRooms.get(roomCode);
    if (!room) {
      // Try to load from database
      const dbRoom = await Room.findOne({ code: roomCode });
      if (!dbRoom) {
        ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
        return;
      }

      // Load players from database
      const players = await Player.find({ roomCode: roomCode });
      room = {
        ...dbRoom.toObject(),
        players: players,
        connections: new Map()
      };
      activeRooms.set(roomCode, room);
    }

    // Check if game is in progress
    if (room.gameState === 'playing') {
      ws.send(JSON.stringify({ type: 'error', message: 'Game is already in progress' }));
      return;
    }

    // Check if player name already exists in room
    if (room.players.some(p => p.name === playerName)) {
      ws.send(JSON.stringify({ type: 'error', message: 'Player name already exists in this room' }));
      return;
    }

    const playerId = uuidv4();

    // Create player
    const player = new Player({
      id: playerId,
      name: playerName,
      roomCode: roomCode,
      isOwner: false,
      wpm: 0,
      progress: 0,
      isReady: false
    });

    await player.save();

    // Add player to room
    room.players.push(player.toObject());
    room.connections.set(playerId, ws);

    activePlayers.set(playerId, {
      ...player.toObject(),
      ws: ws
    });

    ws.playerId = playerId;
    ws.roomCode = roomCode;

    // Update room in database
    await Room.findOneAndUpdate(
      { code: roomCode },
      { $push: { players: playerId } }
    );

    // Notify all players in room
    broadcastToRoom(roomCode, {
      type: 'playerJoined',
      payload: {
        room: room,
        newPlayer: player.toObject()
      }
    });

    ws.send(JSON.stringify({
      type: 'roomJoined',
      payload: {
        room: room,
        playerId: playerId
      }
    }));

    // Update public rooms if room is public
    if (!room.isPrivate) {
      broadcastPublicRooms();
    }

  } catch (error) {
    console.error('Error joining room:', error);
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to join room' }));
  }
}

async function leaveRoom(ws, payload) {
  const playerId = ws.playerId;
  const roomCode = ws.roomCode;

  if (!playerId || !roomCode) {
    return;
  }

  try {
    const room = activeRooms.get(roomCode);
    if (!room) {
      return;
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return;
    }

    // If owner leaves, destroy the room
    if (player.isOwner) {
      await destroyRoom(roomCode);
      return;
    }

    // Remove player from room
    room.players = room.players.filter(p => p.id !== playerId);
    room.connections.delete(playerId);
    activePlayers.delete(playerId);

    // Remove from database
    await Player.deleteOne({ id: playerId });
    await Room.findOneAndUpdate(
      { code: roomCode },
      { $pull: { players: playerId } }
    );

    // Notify remaining players
    broadcastToRoom(roomCode, {
      type: 'playerLeft',
      payload: {
        room: room,
        leftPlayerId: playerId
      }
    });

    // Update public rooms if room is public
    if (!room.isPrivate) {
      broadcastPublicRooms();
    }

  } catch (error) {
    console.error('Error leaving room:', error);
  }
}

async function startGame(ws, payload) {
  const playerId = ws.playerId;
  const roomCode = ws.roomCode;

  try {
    const room = activeRooms.get(roomCode);
    if (!room) {
      ws.send(JSON.stringify({ type: 'error', message: 'Room not found' }));
      return;
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player || !player.isOwner) {
      ws.send(JSON.stringify({ type: 'error', message: 'Only room owner can start the game' }));
      return;
    }

    if (room.players.length < 2) {
      ws.send(JSON.stringify({ type: 'error', message: 'Need at least 2 players to start' }));
      return;
    }

    // Select random paragraph
    const randomParagraph = SAMPLE_PARAGRAPHS[Math.floor(Math.random() * SAMPLE_PARAGRAPHS.length)];

    // Update room state
    room.gameState = 'playing';
    room.currentText = randomParagraph;
    room.gameStartTime = new Date();

    // Reset all players progress
    room.players.forEach(p => {
      p.wpm = 0;
      p.progress = 0;
      p.isFinished = false;
      p.finishTime = null;
    });

    // Update database
    await Room.findOneAndUpdate(
      { code: roomCode },
      {
        gameState: 'playing',
        currentText: randomParagraph,
        gameStartTime: new Date()
      }
    );

    // Broadcast game start to all players
    broadcastToRoom(roomCode, {
      type: 'gameStarted',
      payload: {
        room: room,
        text: randomParagraph,
        startTime: room.gameStartTime
      }
    });

    // Set game timer (60 seconds)
    setTimeout(async () => {
      await endGame(roomCode);
    }, 60000);

    // Update public rooms
    if (!room.isPrivate) {
      broadcastPublicRooms();
    }

  } catch (error) {
    console.error('Error starting game:', error);
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to start game' }));
  }
}

async function updateProgress(ws, payload) {
  const playerId = ws.playerId;
  const roomCode = ws.roomCode;
  const { typedText, wpm, progress } = payload;

  try {
    const room = activeRooms.get(roomCode);
    if (!room || room.gameState !== 'playing') {
      return;
    }

    const player = room.players.find(p => p.id === playerId);
    if (!player) {
      return;
    }

    // Update player progress
    player.wpm = wpm;
    player.progress = progress;

    // Check if player finished
    if (progress >= 100 && !player.isFinished) {
      player.isFinished = true;
      player.finishTime = new Date();

      // Check if all players finished
      const allFinished = room.players.every(p => p.isFinished);
      if (allFinished) {
        await endGame(roomCode);
        return;
      }
    }

    // Broadcast progress to all players in room
    broadcastToRoom(roomCode, {
      type: 'progressUpdate',
      payload: {
        playerId: playerId,
        wpm: wpm,
        progress: progress,
        players: room.players
      }
    });

  } catch (error) {
    console.error('Error updating progress:', error);
  }
}

async function endGame(roomCode) {
  try {
    const room = activeRooms.get(roomCode);
    if (!room) {
      return;
    }

    room.gameState = 'finished';

    // Calculate rankings
    const rankings = room.players
      .filter(p => p.isFinished)
      .sort((a, b) => new Date(a.finishTime) - new Date(b.finishTime))
      .map((player, index) => ({
        ...player,
        rank: index + 1
      }));

    // Add unfinished players
    const unfinishedPlayers = room.players
      .filter(p => !p.isFinished)
      .map(player => ({
        ...player,
        rank: rankings.length + 1
      }));

    const finalRankings = [...rankings, ...unfinishedPlayers];

    // Update database
    await Room.findOneAndUpdate(
      { code: roomCode },
      { gameState: 'finished' }
    );

    // Broadcast game end
    broadcastToRoom(roomCode, {
      type: 'gameEnded',
      payload: {
        room: room,
        rankings: finalRankings
      }
    });

    // Update public rooms
    if (!room.isPrivate) {
      broadcastPublicRooms();
    }

  } catch (error) {
    console.error('Error ending game:', error);
  }
}

async function destroyRoom(roomCode) {
  try {
    const room = activeRooms.get(roomCode);
    if (!room) {
      return;
    }

    // Notify all players
    broadcastToRoom(roomCode, {
      type: 'roomDestroyed',
      payload: {
        message: 'Room owner left. Room has been destroyed.'
      }
    });

    // Clean up database
    await Room.deleteOne({ code: roomCode });
    await Player.deleteMany({ roomCode: roomCode });

    // Clean up memory
    room.players.forEach(player => {
      activePlayers.delete(player.id);
    });
    activeRooms.delete(roomCode);

    // Update public rooms
    if (!room.isPrivate) {
      broadcastPublicRooms();
    }

  } catch (error) {
    console.error('Error destroying room:', error);
  }
}

async function getPublicRooms(ws) {
  try {
    const publicRooms = Array.from(activeRooms.values())
      .filter(room => !room.isPrivate && room.gameState !== 'playing')
      .map(room => ({
        code: room.code,
        name: room.name,
        playerCount: room.players.length,
        gameState: room.gameState
      }));

    ws.send(JSON.stringify({
      type: 'publicRooms',
      payload: publicRooms
    }));

  } catch (error) {
    console.error('Error getting public rooms:', error);
    ws.send(JSON.stringify({ type: 'error', message: 'Failed to get public rooms' }));
  }
}

function broadcastToRoom(roomCode, message) {
  const room = activeRooms.get(roomCode);
  if (!room) {
    return;
  }

  room.connections.forEach((ws, playerId) => {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  });
}

function broadcastPublicRooms() {
  const publicRooms = Array.from(activeRooms.values())
    .filter(room => !room.isPrivate && room.gameState !== 'playing')
    .map(room => ({
      code: room.code,
      name: room.name,
      playerCount: room.players.length,
      gameState: room.gameState
    }));

  // Broadcast to all connected clients
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify({
        type: 'publicRooms',
        payload: publicRooms
      }));
    }
  });
}

function handleDisconnection(ws) {
  if (ws.playerId && ws.roomCode) {
    leaveRoom(ws, {});
  }
  console.log('Client disconnected');
}

// REST API Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.get('/api/rooms/public', async (req, res) => {
  try {
    const publicRooms = Array.from(activeRooms.values())
      .filter(room => !room.isPrivate && room.gameState !== 'playing')
      .map(room => ({
        code: room.code,
        name: room.name,
        playerCount: room.players.length,
        gameState: room.gameState
      }));

    res.json(publicRooms);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get public rooms' });
  }
});

const PORT = process.env.PORT || 3001;

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
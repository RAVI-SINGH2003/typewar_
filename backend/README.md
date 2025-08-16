# Typing Race Backend

Backend server for the multiplayer typing competition game.

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file and configure MongoDB URI:
```bash
cp .env.example .env
# Edit .env file with your MongoDB Atlas connection string
```

3. Run the server:
```bash
# Development
npm run dev

# Production
npm start
```

## API Endpoints

- `GET /api/health` - Server health check
- `GET /api/rooms/public` - Get list of public rooms

## WebSocket Events

### Client to Server:
- `createRoom` - Create a new room
- `joinRoom` - Join an existing room
- `leaveRoom` - Leave current room
- `startGame` - Start the game (owner only)
- `updateProgress` - Update typing progress
- `getPublicRooms` - Get list of public rooms

### Server to Client:
- `roomCreated` - Room creation confirmation
- `roomJoined` - Room join confirmation
- `playerJoined` - New player joined room
- `playerLeft` - Player left room
- `gameStarted` - Game has started
- `progressUpdate` - Player progress update
- `gameEnded` - Game finished with results
- `roomDestroyed` - Room was destroyed
- `publicRooms` - List of public rooms
- `error` - Error message

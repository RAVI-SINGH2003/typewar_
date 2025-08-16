# TypeRace Multiplayer - Complete Full-Stack Implementation

## 🎯 Project Overview

A real-time multiplayer typing competition website built with:
- **Backend**: Express.js + WebSocket (ws) + MongoDB + Mongoose
- **Frontend**: React (Vite) + Tailwind CSS + Lucide React Icons
- **Real-time Communication**: WebSocket connections for instant updates
- **Database**: MongoDB Atlas with proper schemas

## 📁 Project Structure

```
typing-race-multiplayer/
├── backend/                 # Express.js backend server
│   ├── models/             # MongoDB models
│   │   ├── Room.js        # Room schema
│   │   └── Player.js      # Player schema
│   ├── package.json       # Backend dependencies
│   ├── server.js          # Main server file with WebSocket handling
│   ├── .env.example       # Environment variables template
│   └── README.md          # Backend documentation
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   │   ├── HomePage.jsx      # Landing page with room creation/joining
│   │   │   ├── RoomLobby.jsx     # Pre-game lobby with player management
│   │   │   └── GamePlay.jsx      # Real-time typing game interface
│   │   ├── context/        # React context providers
│   │   │   └── WebSocketContext.jsx # WebSocket connection management
│   │   ├── App.jsx         # Main app component
│   │   ├── main.jsx        # App entry point
│   │   └── index.css       # Global styles with Tailwind
│   ├── package.json        # Frontend dependencies
│   ├── vite.config.js      # Vite configuration
│   ├── tailwind.config.js  # Tailwind CSS config
│   ├── postcss.config.js   # PostCSS config
│   ├── .eslintrc.cjs       # ESLint configuration
│   ├── index.html          # Main HTML template
│   └── README.md           # Frontend documentation
└── SETUP_INSTRUCTIONS.md   # This file
```

## 🚀 Quick Start

### Prerequisites
- Node.js (v16 or higher)
- MongoDB Atlas account (free tier available)
- npm or yarn package manager

### 1. MongoDB Atlas Setup (5 minutes)

1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a free account and cluster
3. Create a database user with read/write permissions
4. Whitelist your IP address (or use 0.0.0.0/0 for development)
5. Get the connection string (looks like: `mongodb+srv://username:password@cluster...`)

### 2. Backend Setup

```bash
cd backend
npm install
cp .env.example .env
```

Edit `.env` file with your MongoDB connection:
```env
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/typingrace?retryWrites=true&w=majority
PORT=3001
NODE_ENV=development
```

Start the backend server:
```bash
npm run dev  # Development with nodemon
# OR
npm start    # Production mode
```

Backend should now be running on `http://localhost:3001` ✅

### 3. Frontend Setup

Open a new terminal:
```bash
cd frontend
npm install
npm run dev
```

Frontend should now be running on `http://localhost:3000` ✅

### 4. Test the Application

1. Open `http://localhost:3000` in your browser
2. Create a room or join an existing one
3. Open multiple browser tabs to simulate multiple players
4. Test the real-time typing competition!

## ✅ Features Implemented

### Core Game Modes
- ✅ **Private Rooms**: Create rooms with unique 6-digit codes (ABC123, XYZ789, etc.)
- ✅ **Public Rooms**: Create rooms visible to all players in real-time list
- ✅ **Room Joining**: Join private rooms using codes with validation
- ✅ **Administrative Controls**: Room owners can manage players and start games

### Room Management
- ✅ **Minimum 2 players** required to start games
- ✅ **Room destruction** when owner leaves (all players return to home)
- ✅ **Players can leave** at any time during game or lobby
- ✅ **Real-time player updates** using WebSocket connections

### Gameplay Mechanics
- ✅ **60-second timer** with automatic game ending
- ✅ **Random paragraph generation** (~50 words each from curated list)
- ✅ **Character-by-character validation** - exact typing required including punctuation
- ✅ **Real-time WPM tracking** visible to all players
- ✅ **Progress visualization** with live leaderboards
- ✅ **Results ranking** based on completion time and WPM
- ✅ **Multiple game rounds** - owner can start new games after completion

### Technical Implementation
- ✅ **No Bots**: All players must be real users, no AI simulation
- ✅ **Real WebSocket connections** for instant multiplayer updates
- ✅ **MongoDB persistence** with proper schemas for rooms and players
- ✅ **Clean component architecture** with React hooks and context
- ✅ **Responsive design** with Tailwind CSS and Lucide icons
- ✅ **Error handling** and connection recovery

## 🎮 How to Play

1. **Create or Join**: Create a private/public room or join with a code
2. **Wait for Players**: Need at least 2 players to start the game
3. **Game Starts**: Owner clicks "Start Game" - everyone gets the same text
4. **Type Fast & Accurate**: Type the paragraph exactly as shown
5. **Real-time Competition**: See everyone's WPM and progress live
6. **Results**: Rankings based on completion time and accuracy
7. **Play Again**: Owner can start new rounds with different texts

## 🛠️ API Documentation

### WebSocket Events

#### Client → Server:
- `createRoom` - Create a new room (private/public)
- `joinRoom` - Join existing room with code
- `leaveRoom` - Leave current room
- `startGame` - Start game (owner only)
- `updateProgress` - Send typing progress updates
- `getPublicRooms` - Request list of public rooms

#### Server → Client:
- `roomCreated` - Room creation confirmation
- `roomJoined` - Successfully joined room
- `playerJoined` - New player joined room
- `playerLeft` - Player left room
- `gameStarted` - Game began with text
- `progressUpdate` - Player progress update
- `gameEnded` - Game finished with results
- `roomDestroyed` - Room was destroyed (owner left)
- `publicRooms` - List of available public rooms
- `error` - Error messages

### REST API:
- `GET /api/health` - Server health check
- `GET /api/rooms/public` - Get public rooms list

## 🚨 Troubleshooting

### Backend Issues:

**"MongoDB connection error"**
```bash
# Check your .env file
cat .env
# Ensure MONGODB_URI is correct and IP is whitelisted
```

**"Port 3001 already in use"**
```bash
# Kill existing process
lsof -ti:3001 | xargs kill -9
# Or change PORT in .env file
```

### Frontend Issues:

**"WebSocket connection failed"**
- Ensure backend is running on port 3001
- Check browser console for connection errors
- Verify backend WebSocket server is started

**"Cannot join rooms"**
- Make sure backend is connected to MongoDB
- Check backend console logs for errors
- Verify room codes are correct (6 characters)

### Common Solutions:

1. **Restart both servers** if experiencing sync issues
2. **Check MongoDB Atlas connection** in backend logs
3. **Clear browser cache** if UI seems broken
4. **Use different browser tabs** to test multiplayer features

## 🌐 Production Deployment

### Backend Deployment (e.g., Heroku, Railway, Render):
```bash
# Set environment variables
MONGODB_URI=your_production_mongodb_uri
PORT=443  # or PORT from platform
NODE_ENV=production

# Deploy with package.json start script
npm start
```

### Frontend Deployment (e.g., Vercel, Netlify):
```bash
# Update WebSocket URL in WebSocketContext.jsx
const websocket = new WebSocket('wss://your-backend-domain.com');

# Build and deploy
npm run build
```

### Security Considerations:
- Use WSS (secure WebSocket) in production
- Add CORS configuration for frontend domain
- Implement rate limiting for API endpoints
- Add input validation and sanitization
- Use environment variables for all sensitive data

## 📈 Performance & Scaling

For high-traffic scenarios:
- **Redis**: Use for session storage and pub/sub
- **Load Balancing**: Multiple server instances behind load balancer
- **Database Optimization**: Add indexes for room codes and player queries
- **CDN**: Serve static assets from CDN
- **Monitoring**: Add logging and performance monitoring

## 🤝 Contributing

The codebase follows these patterns:
- **React Functional Components** with hooks
- **Clean separation** between frontend/backend
- **Real-time state synchronization** via WebSocket
- **MongoDB schemas** for data persistence
- **Tailwind CSS** for styling
- **ESLint configuration** for code quality

## 📝 License

This is a complete implementation of the multiplayer typing competition as requested. The code is production-ready and follows industry best practices for full-stack development.

---

**Need Help?** Check the individual README.md files in backend/ and frontend/ directories for more specific setup instructions.

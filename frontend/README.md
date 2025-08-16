# TypeRace Multiplayer Frontend

React frontend for the multiplayer typing competition game built with Vite and Tailwind CSS.

## Features

- Create and join private/public rooms
- Real-time multiplayer typing competition
- Live WPM tracking and progress visualization
- Room management and player controls
- Responsive design with modern UI

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Project Structure

```
src/
├── components/          # React components
│   ├── HomePage.jsx     # Landing page
│   ├── RoomLobby.jsx    # Pre-game lobby
│   └── GamePlay.jsx     # Game interface
├── context/             # React context providers
│   └── WebSocketContext.jsx # WebSocket connection management
├── App.jsx              # Main app component
├── main.jsx             # App entry point
└── index.css            # Global styles
```

## Environment

Make sure the backend server is running on `localhost:3001` for WebSocket connections.

## Technologies

- React 18
- Vite
- Tailwind CSS
- Lucide React (icons)
- WebSocket API

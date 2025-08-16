import React, { useState, useEffect } from 'react';
import HomePage from './components/HomePage';
import RoomLobby from './components/RoomLobby';
import GamePlay from './components/GamePlay';
import { WebSocketProvider } from './context/WebSocketContext';

function App() {
  const [currentView, setCurrentView] = useState('home');
  const [roomData, setRoomData] = useState(null);
  const [playerData, setPlayerData] = useState(null);

  const handleViewChange = (view, data = null) => {
    setCurrentView(view);
    if (data) {
      if (data.room) setRoomData(data.room);
      if (data.player) setPlayerData(data.player);
    }
  };

  const handleLeaveRoom = () => {
    setCurrentView('home');
    setRoomData(null);
    setPlayerData(null);
  };

  return (
    <WebSocketProvider>
      <div className="min-h-screen bg-gray-50">
        {currentView === 'home' && (
          <HomePage onViewChange={handleViewChange} />
        )}
        {currentView === 'lobby' && (
          <RoomLobby 
            roomData={roomData}
            playerData={playerData}
            onViewChange={handleViewChange}
            onLeaveRoom={handleLeaveRoom}
          />
        )}
        {currentView === 'game' && (
          <GamePlay 
            roomData={roomData}
            playerData={playerData}
            onViewChange={handleViewChange}
            onLeaveRoom={handleLeaveRoom}
          />
        )}
      </div>
    </WebSocketProvider>
  );
}

export default App;
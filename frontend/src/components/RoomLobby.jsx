import React, { useState, useEffect } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { Crown, Users, Copy, Play, LogOut } from 'lucide-react';

const RoomLobby = ({ roomData, playerData, onViewChange, onLeaveRoom }) => {
  const { sendMessage, lastMessage } = useWebSocket();
  const [room, setRoom] = useState(roomData);
  const [currentPlayer, setCurrentPlayer] = useState(playerData);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!lastMessage) return;

    const { type, payload } = lastMessage;

    switch (type) {
      case 'playerJoined':
        setRoom(payload.room);
        break;

      case 'playerLeft':
        setRoom(payload.room);
        break;

      case 'gameStarted':
        onViewChange('game', { room: payload.room });
        break;

      case 'roomDestroyed':
        alert(payload.message);
        onLeaveRoom();
        break;

      case 'error':
        alert(payload.message);
        break;
    }
  }, [lastMessage, onViewChange, onLeaveRoom]);

  const handleStartGame = () => {
    if (room.players.length < 2) {
      alert('Need at least 2 players to start the game');
      return;
    }

    sendMessage({
      type: 'startGame',
      payload: {}
    });
  };

  const handleLeaveRoom = () => {
    sendMessage({
      type: 'leaveRoom',
      payload: {}
    });
    onLeaveRoom();
  };

  const copyRoomCode = () => {
    if (room.isPrivate) {
      navigator.clipboard.writeText(room.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const isOwner = currentPlayer && room.players.find(p => p.id === currentPlayer.id)?.isOwner;

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="card mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
              <p className="text-gray-600">
                {room.isPrivate ? 'Private Room' : 'Public Room'}
              </p>
            </div>
            <button
              onClick={handleLeaveRoom}
              className="btn-danger flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Leave Room
            </button>
          </div>

          {/* Room Code */}
          {room.isPrivate && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-blue-900">Room Code</p>
                  <p className="text-2xl font-bold text-blue-600 font-mono">{room.code}</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Share this code with friends to join
                  </p>
                </div>
                <button
                  onClick={copyRoomCode}
                  className="btn-primary flex items-center gap-2"
                >
                  <Copy className="w-4 h-4" />
                  {copied ? 'Copied!' : 'Copy'}
                </button>
              </div>
            </div>
          )}

          {/* Game Status */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-gray-600">
              <Users className="w-5 h-5" />
              <span>{room.players.length} player{room.players.length !== 1 ? 's' : ''}</span>
            </div>

            {isOwner && (
              <button
                onClick={handleStartGame}
                disabled={room.players.length < 2}
                className={`flex items-center gap-2 ${
                  room.players.length < 2 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'btn-primary'
                }`}
              >
                <Play className="w-4 h-4" />
                Start Game
                {room.players.length < 2 && ' (Need 2+ players)'}
              </button>
            )}
          </div>
        </div>

        {/* Players List */}
        <div className="card">
          <h2 className="text-xl font-semibold mb-4">Players</h2>
          <div className="space-y-3">
            {room.players.map((player) => (
              <div
                key={player.id}
                className={`flex items-center justify-between p-4 border rounded-lg ${
                  player.id === currentPlayer?.id 
                    ? 'border-blue-500 bg-blue-50' 
                    : 'border-gray-200'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-semibold ${
                    player.isOwner ? 'bg-yellow-500' : 'bg-blue-500'
                  }`}>
                    {player.isOwner ? <Crown className="w-5 h-5" /> : player.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <p className="font-medium">
                      {player.name}
                      {player.id === currentPlayer?.id && ' (You)'}
                    </p>
                    <p className="text-sm text-gray-600">
                      {player.isOwner ? 'Room Owner' : 'Player'}
                    </p>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-sm text-gray-600">Ready to race!</p>
                </div>
              </div>
            ))}
          </div>

          {/* Waiting Message */}
          {room.players.length < 2 && (
            <div className="text-center py-8 text-gray-600">
              <Users className="w-16 h-16 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium">Waiting for more players...</p>
              <p>Need at least 2 players to start the game</p>
              {room.isPrivate && (
                <p className="mt-2">Share the room code with friends to invite them!</p>
              )}
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="card mt-6">
          <h3 className="text-lg font-semibold mb-3">How to Play</h3>
          <div className="space-y-2 text-gray-600">
            <p>• Type the displayed text as accurately and quickly as possible</p>
            <p>• You have 60 seconds to complete the paragraph</p>
            <p>• Your WPM (Words Per Minute) will be tracked in real-time</p>
            <p>• The player with the highest WPM wins!</p>
            <p>• If you make a mistake, correct it before continuing</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoomLobby;
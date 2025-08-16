import React, { useState, useEffect } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { Users, Lock, Globe } from "lucide-react";

const HomePage = ({ onViewChange }) => {
  const { isConnected, lastMessage, sendMessage } = useWebSocket();
  const [showCreateRoom, setShowCreateRoom] = useState(false);
  const [showJoinRoom, setShowJoinRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [playerName, setPlayerName] = useState("");
  const [roomCode, setRoomCode] = useState("");
  // const [publicRooms, setPublicRooms] = useState([]);
  const [error, setError] = useState("");

  console.log({ playerName });

  useEffect(() => {
    if (!lastMessage) return;

    const { type, payload } = lastMessage;

    // console.log({ lastMessage });

    switch (type) {
      case "roomCreated":
        onViewChange("lobby", {
          room: payload.room,
          player: { id: payload.playerId, name: playerName },
        });
        break;

      case "roomJoined":
        onViewChange("lobby", {
          room: payload.room,
          player: { id: payload.playerId, name: playerName },
        });
        break;

      // case "publicRooms":
      //   setPublicRooms(payload);
      //   break;

      case "error":
        setError(lastMessage?.message);
        setShowJoinRoom(false);
        break;
    }
  }, [lastMessage, playerName]);

  const handleCreateRoom = (isPrivate) => {
    if (!roomName.trim() || !playerName.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setError("");
    sendMessage({
      type: "createRoom",
      payload: {
        roomName: roomName.trim(),
        isPrivate,
        playerName: playerName.trim(),
      },
    });
  };

  const handleJoinRoom = (code = roomCode) => {
    if (!code.trim() || !playerName.trim()) {
      setError("Please fill in all fields");
      return;
    }

    setError("");
    sendMessage({
      type: "joinRoom",
      payload: {
        roomCode: code.trim().toUpperCase(),
        playerName: playerName.trim(),
      },
    });
  };

  const resetForms = () => {
    setRoomName("");
    setPlayerName("");
    setRoomCode("");
    setError("");
    setShowCreateRoom(false);
    setShowJoinRoom(false);
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Connecting to server...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            TypeWar - A Multiplayer Typing Race Platform
          </h1>
          <p className="text-lg text-gray-600">
            Compete with friends in real-time typing competitions
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {/* Main Actions */}
        <div className="grid md:grid-cols-2 gap-6 mb-12">
          {/* Create Private Room */}
          <div className="card text-center">
            <Lock className="w-12 h-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Create a Room</h3>
            <p className="text-gray-600 mb-4">
              Create a room and invite friends with a code
            </p>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="btn-primary w-full"
            >
              Create a Room
            </button>
          </div>

          {/* Create Public Room */}
          {/* <div className="card text-center">
            <Globe className="w-12 h-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Create Public Room</h3>
            <p className="text-gray-600 mb-4">
              Create a public room that anyone can join
            </p>
            <button
              onClick={() => setShowCreateRoom(true)}
              className="btn-primary w-full bg-green-600 hover:bg-green-700"
            >
              Create Public Room
            </button>
          </div> */}

          {/* Join Private Room */}
          <div className="card text-center">
            <Users className="w-12 h-12 text-purple-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Join a Room</h3>
            <p className="text-gray-600 mb-4">
              Join a room using a 6-digit code
            </p>
            <button
              onClick={() => setShowJoinRoom(true)}
              className="btn-primary w-full bg-purple-600 hover:bg-purple-700"
            >
              Join with Code
            </button>
          </div>
        </div>

        {/* Public Rooms */}
        {/* <div className="card">
          <h3 className="text-xl font-semibold mb-4">Public Rooms</h3>
          {publicRooms.length === 0 ? (
            <p className="text-gray-600 text-center py-8">
              No public rooms available. Create one to get started!
            </p>
          ) : (
            <div className="space-y-3">
              {publicRooms.map((room) => (
                <div
                  key={room.code}
                  className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50"
                >
                  <div>
                    <h4 className="font-medium">{room.name}</h4>
                    <p className="text-sm text-gray-600">
                      {room.playerCount} player{room.playerCount !== 1 ? 's' : ''} • {room.gameState}
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (!playerName.trim()) {
                        setError('Please enter your name first');
                        return;
                      }
                      handleJoinRoom(room.code);
                    }}
                    className="btn-primary"
                    disabled={room.gameState === 'playing'}
                  >
                    {room.gameState === 'playing' ? 'In Progress' : 'Join'}
                  </button>
                </div>
              ))}
            </div>
          )}
        </div> */}

        {/* Create Room Modal */}
        {showCreateRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Create Room</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="input-field"
                    placeholder="Enter your name"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Name
                  </label>
                  <input
                    type="text"
                    value={roomName}
                    onChange={(e) => setRoomName(e.target.value)}
                    className="input-field"
                    placeholder="Enter room name"
                    maxLength={30}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleCreateRoom(true)}
                  className="btn-primary flex-1"
                >
                  Create
                </button>
                {/* <button
                  onClick={() => handleCreateRoom(false)}
                  className="btn-primary flex-1 bg-green-600 hover:bg-green-700"
                >
                  Create Public
                </button> */}
              </div>

              <button
                onClick={resetForms}
                className="btn-secondary w-full mt-3"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Join Room Modal */}
        {showJoinRoom && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold mb-4">Join Private Room</h3>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <input
                    type="text"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    className="input-field"
                    placeholder="Enter your name"
                    maxLength={20}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Room Code
                  </label>
                  <input
                    type="text"
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    className="input-field"
                    placeholder="Enter 6-digit code"
                    maxLength={6}
                  />
                </div>
              </div>

              <div className="flex gap-3 mt-6">
                <button
                  onClick={() => handleJoinRoom()}
                  className="btn-primary flex-1"
                >
                  Join Room
                </button>
                <button onClick={resetForms} className="btn-secondary flex-1">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default HomePage;

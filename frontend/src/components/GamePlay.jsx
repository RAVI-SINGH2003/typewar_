import React, { useState, useEffect, useRef } from 'react';
import { useWebSocket } from '../context/WebSocketContext';
import { Clock, Trophy, Users, LogOut } from 'lucide-react';

const GamePlay = ({ roomData, playerData, onViewChange, onLeaveRoom }) => {
  const { sendMessage, lastMessage } = useWebSocket();
  const [room, setRoom] = useState(roomData);
  const [currentPlayer, setCurrentPlayer] = useState(playerData);
  const [gameText, setGameText] = useState('');
  const [typedText, setTypedText] = useState('');
  const [currentCharIndex, setCurrentCharIndex] = useState(0);
  const [wpm, setWpm] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [gameStartTime, setGameStartTime] = useState(null);
  const [isFinished, setIsFinished] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [rankings, setRankings] = useState([]);

  const textInputRef = useRef(null);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!lastMessage) return;

    const { type, payload } = lastMessage;

    switch (type) {
      case 'gameStarted':
        setGameText(payload.text);
        setGameStartTime(new Date(payload.startTime));
        startGameTimer();
        break;

      case 'progressUpdate':
        setRoom(prevRoom => ({
          ...prevRoom,
          players: payload.players
        }));
        break;

      case 'gameEnded':
        setShowResults(true);
        setRankings(payload.rankings);
        clearInterval(timerRef.current);
        break;

      case 'roomDestroyed':
        alert(payload.message);
        onLeaveRoom();
        break;

      case 'error':
        alert(payload.message);
        break;
    }
  }, [lastMessage, onLeaveRoom]);

  useEffect(() => {
    // Focus on input when component mounts
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  }, []);

  useEffect(() => {
    // Calculate WPM and progress
    if (gameStartTime && typedText.length > 0) {
      const now = new Date();
      const timeElapsed = (now - gameStartTime) / 1000 / 60; // minutes
      const charactersTyped = currentCharIndex;
      const wordsTyped = charactersTyped / 5; // Standard: 5 characters = 1 word
      const currentWpm = Math.round(wordsTyped / timeElapsed) || 0;
      const progress = Math.round((currentCharIndex / gameText.length) * 100);

      setWpm(currentWpm);

      // Send progress update
      sendMessage({
        type: 'updateProgress',
        payload: {
          typedText,
          wpm: currentWpm,
          progress
        }
      });

      // Check if finished
      if (currentCharIndex >= gameText.length && !isFinished) {
        setIsFinished(true);
      }
    }
  }, [typedText, currentCharIndex, gameStartTime, gameText, isFinished, sendMessage]);

  const startGameTimer = () => {
  // ensure we don't have a lingering interval (prevents double-decrement)
  if (timerRef.current) {
    clearInterval(timerRef.current);
  }

  timerRef.current = setInterval(() => {
    setTimeLeft(prev => {
      if (prev <= 1) {
        clearInterval(timerRef.current);
        return 0;
      }
      return prev - 1;
    });
  }, 1000);
};

// cleanup interval on unmount to avoid duplicate timers
useEffect(() => {
  return () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
    }
  };
}, []);


  const handleTextChange = (e) => {
    if (isFinished || timeLeft === 0) return;

    const value = e.target.value;
    const correctText = gameText.substring(0, value.length);

    // Only allow correct typing
    if (value === correctText) {
      setTypedText(value);
      setCurrentCharIndex(value.length);
    }
  };

  const handleKeyDown = (e) => {
    // Prevent paste
    if (e.ctrlKey && e.key === 'v') {
      e.preventDefault();
    }
  };

  const renderGameText = () => {
    return gameText.split('').map((char, index) => {
      let className = 'text-gray-400';

      if (index < currentCharIndex) {
        className = 'text-green-600 bg-green-100';
      } else if (index === currentCharIndex) {
        className = 'text-black bg-blue-200 animate-pulse';
      }

      return (
        <span key={index} className={className}>
          {char}
        </span>
      );
    });
  };

  const handleLeaveRoom = () => {
    clearInterval(timerRef.current);
    sendMessage({
      type: 'leaveRoom',
      payload: {}
    });
    onLeaveRoom();
  };

  const handleNewGame = () => {
    setShowResults(false);
    setTypedText('');
    setCurrentCharIndex(0);
    setWpm(0);
    setTimeLeft(60);
    setIsFinished(false);
    setRankings([]);
    onViewChange('lobby', { room, player: currentPlayer });
  };

  if (showResults) {
    return (
      <div className="min-h-screen py-8 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="card text-center mb-6">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4" />
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Game Results</h1>
            <p className="text-gray-600">Great job everyone!</p>
          </div>

          <div className="card mb-6">
            <h2 className="text-xl font-semibold mb-4">Final Rankings</h2>
            <div className="space-y-3">
              {rankings.map((player, index) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    player.id === currentPlayer?.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                      index === 0 ? 'bg-yellow-500' :
                      index === 1 ? 'bg-gray-400' :
                      index === 2 ? 'bg-amber-600' : 'bg-blue-500'
                    }`}>
                      {index + 1}
                    </div>
                    <div>
                      <p className="font-medium">
                        {player.name}
                        {player.id === currentPlayer?.id && ' (You)'}
                      </p>
                      <p className="text-sm text-gray-600">
                        {player.isFinished ? 'Completed' : 'Did not finish'}
                      </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-semibold text-lg">{player.wpm} WPM</p>
                    <p className="text-sm text-gray-600">{player.progress}% complete</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-4 justify-center">
            <button
              onClick={handleLeaveRoom}
              className="btn-secondary flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Leave Room
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{room.name}</h1>
            <p className="text-gray-600">Type the text below as accurately and quickly as possible</p>
          </div>
          <button
            onClick={handleLeaveRoom}
            className="btn-danger flex items-center gap-2"
          >
            <LogOut className="w-4 h-4" />
            Leave
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Game Area */}
          <div className="lg:col-span-2 space-y-6">
            {/* Timer and Stats */}
            <div className="grid grid-cols-3 gap-4">
              <div className="card text-center">
                <Clock className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <p className="text-2xl font-bold text-gray-900">{timeLeft}s</p>
                <p className="text-sm text-gray-600">Time Left</p>
              </div>

              <div className="card text-center">
                <div className="text-2xl font-bold text-green-600 mb-2">{wpm}</div>
                <p className="text-sm text-gray-600">WPM</p>
              </div>

              <div className="card text-center">
                <div className="text-2xl font-bold text-blue-600 mb-2">
                  {Math.round((currentCharIndex / gameText.length) * 100)}%
                </div>
                <p className="text-sm text-gray-600">Progress</p>
              </div>
            </div>

            {/* Text Display */}
            <div className="card">
              <div className="text-lg leading-relaxed font-mono p-4 border border-gray-200 rounded-lg bg-gray-50 min-h-[200px]">
                {gameText ? renderGameText() : 'Waiting for game to start...'}
              </div>
            </div>

            {/* Text Input */}
            <div className="card">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Type here:
              </label>
              <textarea
                ref={textInputRef}
                value={typedText}
                onChange={handleTextChange}
                onKeyDown={handleKeyDown}
                disabled={isFinished || timeLeft === 0}
                className="w-full h-32 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono resize-none"
                placeholder={gameText ? "Start typing the text above..." : "Waiting for game to start..."}
              />
              <div className="mt-2 text-sm text-gray-600">
                Characters: {currentCharIndex} / {gameText.length}
              </div>
            </div>
          </div>

          {/* Players Sidebar */}
          <div className="card">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-semibold">Live Progress</h2>
            </div>

            <div className="space-y-3">
              {room.players.map((player) => (
                <div
                  key={player.id}
                  className={`p-3 border rounded-lg ${
                    player.id === currentPlayer?.id 
                      ? 'border-blue-500 bg-blue-50' 
                      : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium">
                      {player.name}
                      {player.id === currentPlayer?.id && ' (You)'}
                    </p>
                    <p className="text-sm font-semibold text-blue-600">
                      {player.wpm || 0} WPM
                    </p>
                  </div>

                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${player.progress || 0}%` }}
                    ></div>
                  </div>

                  <p className="text-xs text-gray-600 mt-1">
                    {player.progress || 0}% complete
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GamePlay;
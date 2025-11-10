import React, { useState, useEffect } from 'react';
import { useSocket } from '../context/SocketContext';

function LoginPage({ onLoginSuccess }) {
  const [nameInput, setNameInput] = useState("");
  const [error, setError] = useState(null);
  const socket = useSocket();

  useEffect(() => {
    const handleServerMessage = (message) => {
      console.log(message);
      onLoginSuccess(nameInput); // บอก App.jsx ว่า login สำเร็จ
    };

    const handleJoinError = (errorMessage) => {
      setError(errorMessage); // "Username is already taken."
    };

    socket.on("server_message", handleServerMessage);
    socket.on("join_error", handleJoinError);

    return () => {
      socket.off("server_message", handleServerMessage);
      socket.off("join_error", handleJoinError);
    };
  }, [socket, onLoginSuccess, nameInput]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    if (nameInput.trim()) {
      socket.emit("join", nameInput.trim());
    }
  };

  const loginStyle = {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
    gap: '10px'
  }

  return (
    <div style={loginStyle}>
      <h2>Welcome to Web Chat</h2>
      <form onSubmit={handleSubmit} style={{display: 'flex', gap: '5px'}}>
        <input
          type="text"
          placeholder="Enter your name"
          value={nameInput}
          onChange={(e) => setNameInput(e.target.value)}
        />
        <button type="submit">Join</button>
      </form>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </div>
  );
}

export default LoginPage;
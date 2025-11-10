// ...existing code...

import React, { useState, useEffect, useRef } from 'react';
import { useSocket } from '../context/SocketContext';

const GLOBAL_FONT = 'Poppins, sans-serif';

const UI_CONFIG = {
  // Colors (ใช้เป็น Fallback ถ้า CSS Variables ไม่ได้กำหนด)
  CARD_BG: '#1e1e3f',
  PAGE_BG: '#111122',
  PRIMARY_BLUE: '#4C6EF5',
  TEXT_COLOR: '#E0E0FF',
  INPUT_BG: '#e5e5ecff',
  SUCCESS_COLOR: '#6AA84F',
  ERROR_COLOR: '#FF6347',
  TAGLINE_COLOR: '#A0A0FF',

  // Aesthetics
  BORDER_RADIUS: '12px',
  BOX_SHADOW: '0 8px 30px rgba(0, 0, 0, 0.5)',

  // Avatar Colors Array
  AVATAR_COLORS: [
    '#4C6EF5', '#9C36B5', '#D6336C', '#F76707', '#FCC419', '#E03131',
    '#7950F2', '#20C997', '#FF922B', '#E64980', '#5C7CFA', '#18BA5D',
  ],
};

// 💡 Styles Object: ใช้ CSS Variables (var(--...)) ที่คุณกำหนดใน index.css
const styles = {
  appContainer: {
    minHeight: '100vh',
    backgroundColor: 'var(--page-bg, ' + UI_CONFIG.PAGE_BG + ')',
    color: 'var(--text-color, ' + UI_CONFIG.TEXT_COLOR + ')',
    fontFamily: 'Poppins, sans-serif',
  },

  loginPage: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    width: '100%',
    background: 'linear-gradient(135deg, #0F0C29 0%, #302B63 100%)',
  },

  loginCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px',
    backgroundColor: 'var(--sidebar-bg, ' + UI_CONFIG.CARD_BG + ')',
    borderRadius: UI_CONFIG.BORDER_RADIUS,
    boxShadow: UI_CONFIG.BOX_SHADOW,
    width: '380px',
    maxWidth: '90%',
    color: 'var(--text-color, ' + UI_CONFIG.TEXT_COLOR + ')',
    gap: '20px',
  },

  header: {
    fontSize: '40px',
    fontWeight: '700',
    color: 'var(--text-color, ' + UI_CONFIG.TEXT_COLOR + ')',
    marginBottom: '0',
  },

  tagline: {
    fontSize: '20px',
    color: UI_CONFIG.TAGLINE_COLOR,
    marginTop: '5px',
    marginBottom: '10px',
  },

  formGroup: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },

  label: {
    fontSize: '14px',
    fontWeight: '500',
  },

  input: {
    padding: '12px 15px',
    borderRadius: '8px',
    border: '1px solid var(--border-color, #FFFFFF)',
    backgroundColor: 'var(--input-bg, ' + UI_CONFIG.INPUT_BG + ')',
    color: '#111122',
    fontSize: '16px',
    width: '100%',
    boxSizing: 'border-box',
    outline: 'none',
  },

  button: {
    padding: '14px 25px',
    borderRadius: '8px',
    border: 'none',
    backgroundColor: 'var(--accent-color, ' + UI_CONFIG.PRIMARY_BLUE + ')',
    color: 'white',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    width: '100%',
    transition: 'background-color 0.2s, transform 0.1s',
    fontFamily: GLOBAL_FONT,
  },

  error: {
    color: UI_CONFIG.ERROR_COLOR,
    marginTop: '10px',
  },

  status: {
    fontSize: '12px',
    marginTop: '15px',
    color: UI_CONFIG.SUCCESS_COLOR,
  },
};

const ColorPicker = ({ selectedColor, onSelect }) => (
  <div
    style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(6, 1fr)',
      gap: '8px',
      width: '100%',
    }}
  >
    {UI_CONFIG.AVATAR_COLORS.map((color) => (
      <div
        key={color}
        onClick={() => onSelect(color)}
        style={{
          backgroundColor: color,
          width: '100%',
          height: '32px',
          borderRadius: '6px',
          cursor: 'pointer',
          border: color === selectedColor ? `3px solid ${UI_CONFIG.TEXT_COLOR}` : 'none',
          boxShadow: color === selectedColor ? '0 0 0 1px #fff' : 'none',
          transition: 'transform 0.1s',
        }}
      />
    ))}
  </div>
);

// ...existing code...

function LoginPage({ onLoginSuccess }) {
  const [nameInput, setNameInput] = useState('');
  const [avatarColor, setAvatarColor] = useState(UI_CONFIG.AVATAR_COLORS[0]);
  const [error, setError] = useState(null);
  const socket = useSocket();

  // เก็บชื่อที่เพิ่งส่ง ไว้ใช้เมื่อ server ตอบกลับ
  const pendingNameRef = useRef('');

  useEffect(() => {
    const handleServerMessage = (message) => {
      console.log('server_message', message);
      onLoginSuccess && onLoginSuccess(pendingNameRef.current);
    };

    const handleJoinError = (errorMessage) => {
      setError(errorMessage);
    };

    socket.on('server_message', handleServerMessage);
    socket.on('join_error', handleJoinError);

    return () => {
      socket.off('server_message', handleServerMessage);
      socket.off('join_error', handleJoinError);
    };
  }, [socket, onLoginSuccess]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setError(null);
    const trimmed = nameInput.trim();
    if (trimmed) {
      pendingNameRef.current = trimmed;
      socket.emit('join', trimmed, { avatarColor });
    }
  };

  return (
    <div style={styles.loginPage}>
      <div style={styles.loginCard}>
        <div
          style={{
            marginBottom: '10px',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <div
            style={{
              backgroundColor: UI_CONFIG.PRIMARY_BLUE,
              padding: '12px',
              borderRadius: '12px',
              marginBottom: '10px',
            }}
          >
            <span style={{ fontSize: '32px', lineHeight: '1' }}>💬</span>
          </div>

          <h2 style={styles.header}>SocketChat</h2>
          <p style={styles.tagline}>✨ Connect and communicate in real-time</p>
        </div>

        <form onSubmit={handleSubmit} style={styles.formGroup}>
          <label htmlFor="username" style={styles.label}>
            Username
          </label>

          <input
            id="username"
            type="text"
            placeholder="Enter your username"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            style={styles.input}
            required
            maxLength={20}
          />

          <div style={{ marginTop: '8px' }}>
            <label style={styles.label}>Choose Avatar Color</label>
            <div style={{ marginTop: '6px' }}>
              <ColorPicker selectedColor={avatarColor} onSelect={setAvatarColor} />
            </div>
          </div>

          <button type="submit" style={{ ...styles.button, marginTop: '12px' }}>
            Join SocketChat
          </button>
        </form>

        {error && <p style={styles.error}>{error}</p>}
      </div>
    </div>
  );
}

export default LoginPage;

import React from 'react';
import { useAppContext } from '../App';

function ThemeToggle() {
  const { theme, toggleTheme } = useAppContext();

  return (
    <button onClick={toggleTheme}>
      {theme === 'light' ? '🌙 Dark' : '☀️ Light'}
    </button>
  );
}

export default ThemeToggle;
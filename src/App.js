import './reset.css';
import React, { useState } from 'react';
import './App.css';
import Chat from './components/Chat/Chat';
import AuthPage from './components/Auth/AuthPage';

function App() {
  const [user, setUser] = useState(null);

  const handleLogin = (userData) => {
    console.log('User logged in:', userData);
    setUser(userData); // Обновляем состояние пользователя
  };

  const handleRegister = (userData) => {
    console.log('User registered:', userData);
    setUser(userData); // Обновляем состояние пользователя после регистрации
  };

  return (
    <div className="App">
      {user ? (
        <Chat userId={user.id} /> // Передаем userId в компонент Chat
      ) : (
        <AuthPage onLogin={handleLogin} onRegister={handleRegister} />
      )}
    </div>
  );
}

export default App;
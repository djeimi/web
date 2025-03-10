import React, { useState } from 'react';
import styles from './AuthPage.module.css';
import axios from 'axios';

const AuthPage = ({ onLogin, onRegister }) => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');

    const checkFulling = () => {
        if (!username || !password) {
            alert('Please fill in all fields');
            return;
        }
    };

    const handleLogin = async () => {
        checkFulling();

        const checkUserResponse = await axios.get(`http://localhost:5000/check-username?username=${username}`);
            if (!checkUserResponse.data.exists) {
                alert("Username doesn't exist");
                return;
            }

        try {
            const response = await axios.post('http://localhost:5000/login', { username, password });
            onLogin(response.data);
        } catch (error) {
            console.error('Login failed', error);
        }
    };

    const handleRegister = async () => {
        checkFulling();

        try {
            const checkUserResponse = await axios.get(`http://localhost:5000/check-username?username=${username}`);
            if (checkUserResponse.data.exists) {
                alert('Username already exists');
                return;
            }

            const response = await axios.post('http://localhost:5000/register', {
                username,
                password,
            });

            onRegister(response.data);
        } catch (error) {
          console.error('Registration failed:', error.response?.data || error.message);
        }
      };

    

    return (
        <div className={styles.authBlock}>
            <h2>Login</h2>
            <input
                type="text"
                placeholder="Username"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
            />
            <input
                type="password"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
            />
            <div className={styles.buttonBlock}>
                <button onClick={handleLogin}>Login</button>
                <button onClick={handleRegister}>Register</button>
            </div>
        </div>
    );
}

export default AuthPage;

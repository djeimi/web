const express = require('express');
const router = express.Router();
const db = require('../utils/database');

router.post('/register', (req, res) => {
  const { username, password } = req.body;
  db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, password], function(err) {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    res.json({ id: this.lastID });
  });
});

router.get('/check-username', (req, res) => {
  const { username } = req.query;

  db.get('SELECT * FROM users WHERE username = ?', [username], (err, row) => {
    if (err) {
      return res.status(500).json({ error: err.message });
    }
    res.json({ exists: !!row });
  });
});

router.post('/login', (req, res) => {
  const { username, password } = req.body;
  db.get('SELECT * FROM users WHERE username = ? AND password = ?', [username, password], (err, row) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (row) {
      res.json({ id: row.id, username: row.username });
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

module.exports = router;
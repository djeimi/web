const express = require('express');
const router = express.Router();
const db = require('../utils/database');
const bcrypt = require('bcrypt');

const saltRounds = 10;

router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    db.run('INSERT INTO users (username, password) VALUES (?, ?)', [username, hashedPassword], function(err) {
      if (err) {
        return res.status(400).json({ error: err.message });
      }
      res.json({ id: this.lastID });
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
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

  db.get('SELECT * FROM users WHERE username = ?', [username], async (err, row) => {
    if (err) {
      return res.status(400).json({ error: err.message });
    }
    if (row) {
      try {
        const match = await bcrypt.compare(password, row.password);
        if (match) {
          res.json({ id: row.id, username: row.username });
        } else {
          res.status(401).json({ error: 'Invalid credentials' });
        }
      } catch (err) {
        res.status(500).json({ error: err.message });
      }
    } else {
      res.status(401).json({ error: 'Invalid credentials' });
    }
  });
});

module.exports = router;

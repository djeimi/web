require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const messageController = require('./controllers/messageController');

const app = express();
const port = 5000;

app.use(cors());
app.use(bodyParser.json());

app.use(authRoutes);
app.post('/process-message', messageController.processMessage);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
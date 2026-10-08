const express = require('express');
const http = require('http');
const cors = require('cors');
const { Server } = require('socket.io');
require('dotenv').config();

const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const adminRoutes = require('./routes/adminRoutes');
const verifyRoutes = require('./routes/verifyRoutes');
const chatSocket = require('./sockets/chat');

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST', 'DELETE'] },
});

app.use(cors());
app.use(express.json({ limit: '20mb' }));

app.get('/', (req, res) =>
  res.json({ status: 'ok', service: "Oslo's Concierge API" })
);

app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/verify', verifyRoutes);

chatSocket(io);

const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  server.listen(PORT, () => console.log('Server running on port ' + PORT));
});

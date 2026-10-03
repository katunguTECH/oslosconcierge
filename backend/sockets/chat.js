const Message = require('../models/Message');

module.exports = (io) => {
  io.on('connection', (socket) => {
    console.log('Socket connected:', socket.id);

    socket.on('join_room', (room) => {
      socket.join(room);
    });

    socket.on('send_message', async (data) => {
      try {
        const { room, sender, receiver, text, image } = data;
        const saved = await Message.create({ room, sender, receiver, text, image });
        io.to(room).emit('receive_message', saved);
      } catch (err) {
        socket.emit('error_message', { message: err.message });
      }
    });

    socket.on('typing', ({ room, name }) => {
      socket.to(room).emit('user_typing', { name });
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
    });
  });
};

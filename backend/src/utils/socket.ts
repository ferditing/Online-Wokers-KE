// backend/src/utils/socket.ts
import { Server } from 'socket.io';

let ioInstance: Server | null = null;

export function initSocket(io: Server) {
  ioInstance = io;

  io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });
}

export function getIo(): Server | null {
  return ioInstance;
}

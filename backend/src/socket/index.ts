import { Server as HttpServer } from 'http';
import { Server, Socket } from 'socket.io';
import { config } from '../config';
import { logger } from '../utils/logger';
import { GPSSimulator } from './gpsSimulator';

let io: Server;
let gpsSimulator: GPSSimulator;

export const initSocketIO = (server: HttpServer): Server => {
  io = new Server(server, {
    cors: {
      origin: config.cors.origin,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    transports: ['websocket', 'polling'],
  });

  gpsSimulator = new GPSSimulator(io);

  io.on('connection', (socket: Socket) => {
    logger.info(`🔌 Client connected: ${socket.id}`);

    // Join rooms based on role
    socket.on('join:dashboard', () => {
      socket.join('dashboard');
      logger.debug(`Socket ${socket.id} joined dashboard room`);
    });

    socket.on('join:tracking', () => {
      socket.join('tracking');
      logger.debug(`Socket ${socket.id} joined tracking room`);
    });

    socket.on('join:notifications', (userId: string) => {
      socket.join(`user:${userId}`);
      logger.debug(`Socket ${socket.id} joined user:${userId} room`);
    });

    socket.on('disconnect', () => {
      logger.info(`🔌 Client disconnected: ${socket.id}`);
    });
  });

  // Start GPS simulation
  gpsSimulator.start();

  logger.info('🔌 Socket.IO initialized');
  return io;
};

export const getIO = (): Server => {
  if (!io) throw new Error('Socket.IO not initialized');
  return io;
};

export const getGPSSimulator = (): GPSSimulator => {
  if (!gpsSimulator) throw new Error('GPS Simulator not initialized');
  return gpsSimulator;
};

import http from 'http';
import app from './app';
import { config } from './config';
import { logger } from './utils/logger';
import { initSocketIO } from './socket';
import prisma from './config/database';

const server = http.createServer(app);

// Initialize Socket.IO
initSocketIO(server);

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('✅ Database connected successfully');

    server.listen(config.port, '0.0.0.0', () => {
      logger.info(`🚀 Server running on port ${config.port} in ${config.env} mode`);
      logger.info(`📡 API: http://localhost:${config.port}/api`);
      logger.info(`🔌 Socket.IO: http://localhost:${config.port}`);
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
const shutdown = async () => {
  logger.info('🛑 Shutting down gracefully...');
  await prisma.$disconnect();
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
process.on('unhandledRejection', (reason) => {
  logger.error('Unhandled Rejection:', reason);
});
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  shutdown();
});

startServer();

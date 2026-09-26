// @ts-check
import http from 'node:http';
import { getEnv } from './config/env.js';
import { logger } from './lib/logger.js';
import { createApp } from './app.js';
import { disconnectPrisma } from '@campus/database';
import { disconnectRedis } from './lib/redis.js';

const env = getEnv();
const app = createApp({ env, logger });

// A plain http.Server (not app.listen()) so Socket.IO has somewhere to
// attach in Phase 8 without restructuring this file:
//   const io = new SocketIOServer(server, { ... })
const server = http.createServer(app);

server.listen(env.PORT, () => {
  logger.info({ port: env.PORT, env: env.NODE_ENV }, 'Server listening');
});

let shuttingDown = false;

/**
 * @param {string} signal
 */
function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  logger.info({ signal }, 'Shutting down gracefully');

  const forceExitTimer = setTimeout(() => {
    logger.error('Graceful shutdown timed out after 10s; forcing exit');
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  server.close(async (closeErr) => {
    if (closeErr) {
      logger.error({ err: closeErr }, 'Error while closing HTTP server');
    }
    try {
      await disconnectPrisma();
      await disconnectRedis();
    } catch (disconnectErr) {
      logger.error({ err: disconnectErr }, 'Error while closing DB/Redis connections');
    } finally {
      clearTimeout(forceExitTimer);
      process.exit(closeErr ? 1 : 0);
    }
  });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection');
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception');
  shutdown('uncaughtException');
});

export { app, server };

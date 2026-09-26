// @ts-check
import { Worker } from 'bullmq';
import { getEnv } from './config/env.js';
import { logger } from './lib/logger.js';
import { createMailTransport, sendOtpEmail } from './lib/mailer.js';
import { disconnectQueueConnection, queueConnection } from './lib/queueConnection.js';
import { EMAIL_QUEUE_NAME, EMAIL_SEND_JOB } from './queues/email.queue.js';

/**
 * The BullMQ worker process — a separate entry point from `server.js`
 * (`pnpm --filter @campus/server run worker`), per docs/architecture.md
 * §5 "a single deployable unit" / §28 P3 "BullMQ introduced here ... plus
 * `worker.js`". Slow jobs (email today; media/moderation/push in later
 * phases) run here so they never block an HTTP request.
 */

const env = getEnv();
const mailTransport = createMailTransport(env);

const worker = new Worker(
  EMAIL_QUEUE_NAME,
  async (job) => {
    if (job.name === EMAIL_SEND_JOB) {
      const { to, code } = /** @type {{ to: string, code: string }} */ (job.data);
      await sendOtpEmail(mailTransport, { to, from: env.SMTP_FROM, code });
      return;
    }
    // Never happens today (this queue only ever receives EMAIL_SEND_JOB),
    // but an unrecognized job name should fail loudly, not silently no-op.
    throw new Error(`Unknown job name on the "${EMAIL_QUEUE_NAME}" queue: ${job.name}`);
  },
  { connection: queueConnection },
);

worker.on('completed', (job) => {
  // Never logs job.data — it's the OTP email payload (§11.2 "never logged").
  logger.info({ jobId: job.id, jobName: job.name }, 'Job completed');
});

worker.on('failed', (job, err) => {
  logger.error({ err, jobId: job?.id, jobName: job?.name }, 'Job failed');
});

logger.info({ queue: EMAIL_QUEUE_NAME }, 'Worker started, listening for jobs');

let shuttingDown = false;

/** @param {string} signal */
function shutdown(signal) {
  if (shuttingDown) {
    return;
  }
  shuttingDown = true;
  logger.info({ signal }, 'Worker shutting down gracefully');

  const forceExitTimer = setTimeout(() => {
    logger.error('Worker graceful shutdown timed out after 10s; forcing exit');
    process.exit(1);
  }, 10_000);
  forceExitTimer.unref();

  worker
    .close()
    .catch((err) => logger.error({ err }, 'Error while closing worker'))
    .finally(async () => {
      try {
        await disconnectQueueConnection();
      } catch (err) {
        logger.error({ err }, 'Error while closing the queue connection');
      } finally {
        clearTimeout(forceExitTimer);
        process.exit(0);
      }
    });
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.error({ err: reason }, 'Unhandled promise rejection in worker');
});
process.on('uncaughtException', (err) => {
  logger.error({ err }, 'Uncaught exception in worker');
  shutdown('uncaughtException');
});

export { worker };

// @ts-check
import { Queue } from 'bullmq';
import { queueConnection } from '../lib/queueConnection.js';

export const EMAIL_QUEUE_NAME = 'email';
export const EMAIL_SEND_JOB = 'email.send';

/** @type {Queue | undefined} */
let queue;

function getEmailQueue() {
  if (!queue) {
    queue = new Queue(EMAIL_QUEUE_NAME, { connection: queueConnection });
  }
  return queue;
}

/**
 * Enqueues the OTP email job. The code is enqueued in plaintext (it has
 * to be, to reach the mail body) and exists nowhere else — the service
 * only ever stores its hash (docs/architecture.md §11.2). Both
 * `removeOnComplete` and `removeOnFail` are set so the plaintext code
 * never lingers in Redis regardless of outcome, matching "removed on
 * completion, never logged" — a failed send is diagnosed from the
 * worker's error log (which never includes the payload), not from the
 * dead job.
 * @param {{ to: string, code: string }} payload
 */
export async function enqueueOtpEmail(payload) {
  await getEmailQueue().add(EMAIL_SEND_JOB, payload, {
    removeOnComplete: true,
    removeOnFail: true,
    attempts: 3,
    backoff: { type: 'exponential', delay: 5_000 },
  });
}

/** Test/shutdown helper — clears the cached queue instance. */
export function resetEmailQueue() {
  queue = undefined;
}

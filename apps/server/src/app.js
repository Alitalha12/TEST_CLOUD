// @ts-check
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import pinoHttp from 'pino-http';
import { requestId } from './middleware/requestId.js';
import { errorHandler } from './middleware/errorHandler.js';
import { notFound } from './middleware/notFound.js';
import { createRouter } from './routes.js';

/**
 * Builds the Express app. A factory (not a module-level singleton) so
 * tests can construct one against a specific env without booting a real
 * HTTP listener — see docs/architecture.md §7.3 "Layer responsibilities &
 * request path" for the middleware order this implements:
 *
 *   [helmet, CORS, body-size limit, requestId]
 *     → routes → notFound → errorHandler
 *
 * @param {{ env: import('./config/env.js').Env; logger: import('pino').Logger }} deps
 */
export function createApp({ env, logger }) {
  const app = express();

  // Express sees the real client IP (for rate-limit keys and ip hashing
  // later) when it's proxied — safe to enable unconditionally since
  // "trust nothing" behind a bare TCP listener just means req.ip falls
  // back to the socket address anyway.
  app.set('trust proxy', 1);
  app.disable('x-powered-by');

  app.use(helmet());
  app.use(
    cors({
      origin: buildCorsOriginHandler(env.corsAllowedOrigins),
    }),
  );
  app.use(express.json({ limit: '100kb' }));
  app.use(requestId(logger));
  app.use(
    pinoHttp({
      logger,
      // We already attach a per-request child logger with requestId on
      // res.locals (see requestId.js) — reuse it so every log line
      // (ours and pino-http's own request/response summary) carries the
      // same requestId, and skip pino-http's own id generation.
      genReqId: (req, res) => /** @type {string} */ (res.locals.requestId),
      customLogLevel: (req, res, err) => {
        if (err || res.statusCode >= 500) return 'error';
        if (res.statusCode >= 400) return 'warn';
        return 'info';
      },
    }),
  );

  app.use(createRouter(env));

  app.use(notFound);
  app.use(errorHandler(env));

  return app;
}

/**
 * Never `*` — an explicit allow-list, even if empty. See
 * docs/architecture.md §20 "API hardening".
 * @param {string[]} allowedOrigins
 * @returns {import('cors').CorsOptions['origin']}
 */
function buildCorsOriginHandler(allowedOrigins) {
  return (origin, callback) => {
    // No Origin header at all (native mobile requests, curl, server-to-
    // server, and Supertest in tests) is not a CORS-governed request —
    // always allow it through; CORS only applies to browser XHR/fetch.
    if (!origin) {
      callback(null, true);
      return;
    }
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
      return;
    }
    callback(new Error(`Origin "${origin}" is not allowed by CORS.`));
  };
}

import { createApp } from './app.js';
import { ConfigError, loadConfig } from './config/env.js';
import { createLogger } from './observability/logger.js';
import { errorMessage } from './shared/errors.js';

async function main(): Promise<void> {
  let config;
  try {
    config = loadConfig();
  } catch (err) {
    // Validation messages only (never values): safe to print.
    process.stderr.write(`${err instanceof ConfigError ? err.message : errorMessage(err)}\n`);
    process.exit(1);
  }
  const logger = createLogger({ level: config.logLevel, appEnv: config.appEnv });
  const app = await createApp({ config, logger });

  let shuttingDown = false;
  const shutdown = (reason: string, exitCode: number) => {
    if (shuttingDown) {
      logger.warn({ event: 'app.force_exit', reason }, 'second signal received, forcing exit');
      process.exit(1);
    }
    shuttingDown = true;
    const hardTimer = setTimeout(() => {
      logger.error({ event: 'app.shutdown_timeout' }, 'graceful shutdown timed out, exiting');
      process.exit(1);
    }, config.worker.shutdownTimeoutMs + 10_000);
    hardTimer.unref();
    app
      .stop(reason)
      .then(() => process.exit(exitCode))
      .catch((err: unknown) => {
        logger.error({ event: 'app.shutdown_failed', err: { message: errorMessage(err) } }, 'shutdown failed');
        process.exit(1);
      });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM', 0));
  process.on('SIGINT', () => shutdown('SIGINT', 0));
  process.on('uncaughtException', (err) => {
    logger.fatal({ event: 'process.uncaught_exception', err: { message: err.message, stack: err.stack } }, 'uncaught exception');
    shutdown('uncaughtException', 1);
  });
  process.on('unhandledRejection', (reason) => {
    logger.fatal({ event: 'process.unhandled_rejection', err: { message: errorMessage(reason) } }, 'unhandled rejection');
    shutdown('unhandledRejection', 1);
  });

  await app.start();
}

void main();

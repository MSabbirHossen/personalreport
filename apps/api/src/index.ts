import { Server } from 'node:http';
import { app } from './app.js';
import { config } from './config/index.js';
import { connectToDatabase, closeDatabase } from './db/mongo.js';

let server: Server | null = null;
let isShuttingDown = false;

async function gracefulShutdown(signal: string) {
  if (isShuttingDown) return;
  isShuttingDown = true;

  console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);

  // Force exit after 10s timeout to prevent zombie processes
  const forceExitTimeout = setTimeout(() => {
    console.error('⚠️ Graceful shutdown timed out after 10s. Forcing exit.');
    process.exit(1);
  }, 10000);
  if (forceExitTimeout.unref) {
    forceExitTimeout.unref();
  }

  try {
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => (err ? reject(err) : resolve()));
      });
      console.log('✅ HTTP server closed to new connections.');
    }

    await closeDatabase();
    console.log('✅ MongoDB connection pool closed cleanly.');

    clearTimeout(forceExitTimeout);
    console.log('👋 ReportBD API shutdown complete.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error during graceful shutdown:', error);
    process.exit(1);
  }
}

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

process.on('unhandledRejection', (reason: any) => {
  console.error('⚠️ Unhandled Promise Rejection:', reason?.message || reason);
});

process.on('uncaughtException', (error: Error) => {
  console.error('💥 Uncaught Exception:', error.message);
  gracefulShutdown('uncaughtException');
});

async function startServer() {
  try {
    // In production, database readiness is required at startup
    if (config.isProduction) {
      console.log('🔄 Connecting to MongoDB database...');
      await connectToDatabase();
    } else {
      // In development/test, attempt connection non-blockingly
      connectToDatabase().catch((err) => {
        console.warn('⚠️ MongoDB connection deferred or not ready:', err.message);
      });
    }

    server = app.listen(config.port, () => {
      console.log(`🚀 ReportBD API server running on http://localhost:${config.port}`);
      console.log(`📡 Health endpoint: http://localhost:${config.port}/health`);
      console.log(`📡 Readiness endpoint: http://localhost:${config.port}/health/ready`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

startServer();

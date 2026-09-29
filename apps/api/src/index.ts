import { app } from './app.js';
import { config } from './config/index.js';
import { connectToDatabase } from './db/mongo.js';

async function startServer() {
  try {
    // Attempt database connection (gracefully non-blocking for local dev if db not online yet)
    connectToDatabase().catch((err) => {
      console.warn('⚠️ MongoDB connection deferred or not ready:', err.message);
    });

    app.listen(config.port, () => {
      console.log(`🚀 ReportBD API server running on http://localhost:${config.port}`);
      console.log(`📡 Health endpoint: http://localhost:${config.port}/health`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
}

startServer();

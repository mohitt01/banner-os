const path = require('path');
const SQLiteAdapter = require('./db/sqlite');
const ValkeyAdapter = require('./db/valkey');

// Database configuration
const DB_URL = process.env.BANNEROS_DB_URL;
const DB_PATH = process.env.BANNEROS_DB_PATH || path.join(__dirname, '..', 'banneros.db');

let dbAdapter = null;

function getDbAdapter() {
  if (!dbAdapter) {
    if (DB_URL) {
      // Use Valkey if DB_URL is provided
      console.log(`🔗 Using Valkey database: ${DB_URL}`);
      dbAdapter = new ValkeyAdapter(DB_URL);
    } else {
      // Default to SQLite for local development
      console.log(`💾 Using SQLite database: ${DB_PATH}`);
      dbAdapter = new SQLiteAdapter(DB_PATH);
    }
  }
  return dbAdapter;
}

// Legacy compatibility - returns the adapter directly
function getDb() {
  return getDbAdapter();
}

// Graceful shutdown
async function closeDb() {
  if (dbAdapter) {
    await dbAdapter.close();
    dbAdapter = null;
  }
}

// Handle process shutdown gracefully
process.on('SIGINT', async () => {
  await closeDb();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  await closeDb();
  process.exit(0);
});

module.exports = { getDb, getDbAdapter, closeDb };

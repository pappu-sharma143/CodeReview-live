// server/redis.js
// Redis is optional — app works perfectly without it
// When Redis is available it caches session data for faster joins
// When unavailable it falls back to PostgreSQL silently

let redis = null;

try {
  const Redis = require('ioredis');

  const client = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    lazyConnect: true,    // don't connect immediately on require
    enableOfflineQueue: false, // don't queue commands when offline
    retryStrategy: (times) => {
      if (times > 2) return null; // stop retrying after 2 attempts
      return Math.min(times * 200, 500);
    }
  });

  client.on('connect', () => {
    console.log('✅ Redis connected — caching enabled');
    redis = client;
  });

  client.on('error', () => {
    // Silently fail — no spam in console
    redis = null;
  });

  client.on('close', () => {
    redis = null;
  });

  // Try to connect — if it fails, redis stays null
  client.connect().catch(() => {
    console.log('⚠️  Redis unavailable — using DB only (no caching)');
  });

} catch (err) {
  console.log('⚠️  ioredis not found — using DB only');
}

// ── Safe wrapper ─────────────────────────────────────────
// All methods check if redis is available before calling
// If not available — returns null/false silently
// roomHandlers.js already handles null returns gracefully
const safeRedis = {
  get: async (key) => {
    if (!redis) return null;
    try { return await redis.get(key); }
    catch { return null; }
  },

  setex: async (key, ttl, value) => {
    if (!redis) return null;
    try { return await redis.setex(key, ttl, value); }
    catch { return null; }
  },

  del: async (key) => {
    if (!redis) return null;
    try { return await redis.del(key); }
    catch { return null; }
  },

  on: () => {}, // no-op — events handled above
};

module.exports = safeRedis;
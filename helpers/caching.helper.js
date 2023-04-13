require("dotenv").config();
const Redis = require("ioredis");

let redis;

// Create a Redis instance
(async () => {
  redis = new Redis();
  redis.on("error", (err) => {
    console.log(err);
  });
})();

// Get key data from Redis cache
async function getCache(key) {
  try {
    const cacheData = await redis.get(key);
    return cacheData;
  } catch (err) {
    return null;
  }
}

// Set Redis cache Key with a given expiry
function setCache(key, data, ttl = process.env.DEFAULT_EXPIRATION) {
  try {
    redis.set(key, JSON.stringify(data), "EX", ttl);
  } catch (err) {
    return null;
  }
}

// Remove given Redis cache key
function removeCache(key) {
  try {
    redis.del(key);
  } catch (err) {
    return null;
  }
}

// Remove given Redis cache key with regex
function removeCacheRegex(key) {
  redis.keys(key, function (err, keys) {
    if (err) throw err;
    keys.forEach(function (key) {
      redis.del(key, function (err, result) {
        if (err) throw err;
      });
    });
  });
}

module.exports = { getCache, setCache, removeCache, removeCacheRegex };

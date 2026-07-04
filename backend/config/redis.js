import { createClient } from 'redis';

let redisClient = null;
let redisConnected = false;

export const initializeRedis = async () => {
  try {
    redisClient = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: (retries) => {
          // Stop retrying after 10 attempts
          if (retries > 10) {
            console.warn('⚠️  Giving up on Redis connection after 10 retries');
            return new Error('Redis max retries exceeded');
          }
          return Math.min(retries * 100, 3000);
        },
        connectTimeout: 5000,
      },
    });

    redisClient.on('error', (err) => {
      if (redisConnected) {
        console.error('Redis Client Error:', err.message);
      }
    });

    redisClient.on('connect', () => {
      redisConnected = true;
      console.log('✓ Connected to Redis');
    });

    redisClient.on('ready', () => {
      console.log('✓ Redis is ready');
    });

    redisClient.on('end', () => {
      redisConnected = false;
      console.warn('⚠️  Redis connection closed');
    });

    await Promise.race([
      redisClient.connect(),
      new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Redis connection timeout')), 6000)
      ),
    ]);
    
    redisConnected = true;
    return redisClient;
  } catch (error) {
    console.warn('⚠️  Redis unavailable - continuing without caching:', error.message);
    redisConnected = false;
    return null;
  }
};

export const getRedisClient = () => {
  if (!redisConnected || !redisClient) {
    return null;
  }
  return redisClient;
};

export const isRedisConnected = () => {
  return redisConnected;
};

export default redisClient;

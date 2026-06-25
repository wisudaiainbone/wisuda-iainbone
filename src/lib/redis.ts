import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

const redisUrl = process.env.UPSTASH_REDIS_REST_URL || '';
const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN || '';

// Buat instance Redis — singleton, digunakan di seluruh aplikasi
export const redis = new Redis({
  url: redisUrl,
  token: redisToken,
});

// Rate limiter login — dibuat sekali di module-level agar efisien
export const loginRateLimit = new Ratelimit({
  redis,
  limiter: Ratelimit.slidingWindow(5, '1 m'),
  analytics: true,
});

/**
 * Menghapus SEMUA varian cache dashboard stats (all + per periode).
 * Gunakan ini sebagai pengganti redis.del('dashboard:stats:all') di setiap mutasi.
 */
export async function invalidateAllDashboardCache() {
  try {
    // Hapus key global
    await redis.del('dashboard:stats:all');

    // Scan dan hapus semua key dashboard:stats:[periode]
    let cursor = 0;
    do {
      const [nextCursor, keys] = await redis.scan(cursor, {
        match: 'dashboard:stats:*',
        count: 100,
      });
      cursor = Number(nextCursor);
      if (keys.length > 0) {
        const pipeline = redis.pipeline();
        keys.forEach((k) => pipeline.del(k));
        await pipeline.exec();
      }
    } while (cursor !== 0);
  } catch (err) {
    console.error('Redis invalidateAllDashboardCache error:', err);
  }
}

/**
 * Menghapus SELURUH cache di Redis (Flush DB).
 * Gunakan dengan hati-hati.
 */
export async function clearAllCache() {
  try {
    await redis.flushdb();
    return true;
  } catch (err) {
    console.error('Redis flushdb error:', err);
    return false;
  }
}

/**
 * cacheService.js
 * Lightweight in-memory cache for API responses.
 * Reduces redundant network calls and improves perceived performance.
 * 
 * Usage:
 *   import cacheService from './cacheService';
 *   const cached = cacheService.get('materials');
 *   if (cached) return cached;
 *   const data = await materialService.getAll();
 *   cacheService.set('materials', data, 60); // cache for 60 seconds
 */

const cache = new Map();

const cacheService = {
    /**
     * Get a cached value. Returns null if not found or expired.
     */
    get(key) {
        const entry = cache.get(key);
        if (!entry) return null;
        if (Date.now() > entry.expiresAt) {
            cache.delete(key);
            return null;
        }
        return entry.data;
    },

    /**
     * Set a value in the cache.
     * @param {string} key - Cache key
     * @param {*} data - Data to cache
     * @param {number} ttlSeconds - Time to live in seconds (default: 60)
     */
    set(key, data, ttlSeconds = 60) {
        cache.set(key, {
            data,
            expiresAt: Date.now() + ttlSeconds * 1000,
        });
    },

    /**
     * Manually invalidate (delete) a cache key.
     * Call this after any mutation (create/update/delete) on that resource.
     */
    invalidate(key) {
        cache.delete(key);
    },

    /**
     * Invalidate multiple keys at once.
     */
    invalidateMany(...keys) {
        keys.forEach(key => cache.delete(key));
    },

    /**
     * Clear the entire cache.
     */
    clear() {
        cache.clear();
    },
};

export default cacheService;

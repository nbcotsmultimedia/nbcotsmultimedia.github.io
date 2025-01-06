// cache.js
import CONFIG from "./config.js";

export const CacheManager = {
  zipCache: new Map(),
  hexagonCache: new Map(),

  setZipResult(zipCode, result) {
    this.zipCache.set(zipCode, {
      result,
      timestamp: Date.now(),
    });
  },

  getZipResult(zipCode) {
    const cached = this.zipCache.get(zipCode);
    if (cached && Date.now() - cached.timestamp < CONFIG.cache.maxAge) {
      return cached.result;
    }
    return null;
  },

  cleanup() {
    const oneHourAgo = Date.now() - CONFIG.cache.maxAge;
    for (const [key, value] of this.zipCache.entries()) {
      if (value.timestamp < oneHourAgo) {
        this.zipCache.delete(key);
      }
    }
  },
};

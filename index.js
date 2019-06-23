module.exports = asyncCacheify;

const crypto = require('crypto');
const paramToString = require('param-to-string');

function asyncCacheify (promise, ttl) {
    const CACHE = {};

    async function cacheified (...params) {
        const cache = _getCache(params);

        if (cache.loading) {
            return await new Promise((resolve, reject) => {
                cache.waiting.push({ resolve, reject });
            });
        }

        if (hasResult(cache.resultAt, ttl)) {
            return cache.result;
        }

        try {
            cache.loading = true;
            const result = await promise(...params);
            cache.result = result;
            cache.resultAt = Date.now();
            cache.loading = false;

            setTimeout(function resolveAll() {
                while (cache.waiting.length > 0) {
                    cache.waiting.shift().resolve(result);
                }
            }, 0);

            return cache.result;
        } catch (e) {
            cache.resultAt = undefined;
            cache.loading = false;

            setTimeout(function rejectAll() {
                while (cache.waiting.length > 0) {
                    cache.waiting.shift().reject(e);
                }
            }, 0);

            throw e;
        }
    }

    function _getCache (params) {
        const hash = md5(params);

        if (!CACHE[hash]) {
            CACHE[hash] = {
                waiting: [],
                loading: false,
                result: undefined,
                resultAt: undefined
            };
        }

        return CACHE[hash];
    }

    function flush (...params) {
        delete CACHE[md5(params)];
    }

    function flushAll () {
        const keys = Object.keys(CACHE);
        while (keys.length > 0) {
            delete CACHE[keys.shift()];
        }
    }

    cacheified.flush = flush;
    cacheified.flushAll = flushAll;

    return cacheified;
}

function md5 (params) {
    return crypto.createHash('md5').update(paramToString(params)).digest('hex');
}

function hasResult (resultAt, ttl) {
    if (!resultAt) return false;
    if (typeof ttl === 'number' && (resultAt + ttl) < Date.now()) return false;
    return true;
}

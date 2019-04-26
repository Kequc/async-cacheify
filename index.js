module.exports = asyncCacheify;

const crypto = require('crypto');
const paramToString = require('param-to-string');

function asyncCacheify (promise, ms) {
    const CACHE = {};

    async function cached (...params) {
        const hash = md5(params);

        if (!CACHE[hash]) {
            CACHE[hash] = {
                waiting: [],
                loading: false,
                result: undefined,
                resultAt: undefined
            };
        }

        const cache = CACHE[hash];

        if (cache.loading) {
            return await new Promise((resolve, reject) => {
                cache.waiting.push({ resolve, reject });
            });
        }

        if (hasCache(cache.resultAt, ms)) {
            return cache.result;
        }

        try {
            cache.loading = true;
            const _result = await promise(...params);
            cache.result = _result;
            cache.resultAt = Date.now();
            cache.loading = false;

            setTimeout(function resolveAll() {
                while (cache.waiting.length > 0) {
                    cache.waiting.shift().resolve(_result);
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

    async function force (...params) {
        delete CACHE[md5(params)];
        return await cached(...params);
    }

    function clear () {
        const keys = Object.keys(CACHE);
        while (keys.length > 0) {
            delete CACHE[keys.shift()];
        }
    }

    cached.force = force;
    cached.clear = clear;

    return cached;
}

function md5 (params) {
    return crypto.createHash('md5').update(paramToString(params)).digest('hex');
}

function hasCache (resultAt, ms) {
    if (!resultAt) return false;
    if (typeof ms === 'number' && (resultAt + ms) < Date.now()) return false;
    return true;
}

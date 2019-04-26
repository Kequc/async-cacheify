module.exports = asyncCacheify;

function asyncCacheify (promise, ms) {
    let waiting = [];
    let loading = false;
    let result;
    let resultAt;

    return cached;

    async function cached (force = false) {
        if (loading) {
            return await new Promise((resolve, reject) => {
                waiting.push({ resolve, reject });
            });
        }

        if (force) {
            resultAt = undefined;
        }

        if (hasCache()) {
            return result;
        }

        try {
            loading = true;
            const _result = await promise();
            result = _result;
            resultAt = Date.now();
            loading = false;

            setTimeout(function resolveAll() {
                while (waiting.length > 0) {
                    waiting.shift().resolve(_result);
                }
            }, 0);

            return result;
        } catch (e) {
            resultAt = undefined;
            loading = false;

            setTimeout(function rejectAll() {
                while (waiting.length > 0) {
                    waiting.shift().reject(e);
                }
            }, 0);

            throw e;
        }
    }

    function hasCache() {
        if (!resultAt) return false;
        if (typeof ms === 'number' && (resultAt + ms) < Date.now()) return false;
        return true;
    }
}

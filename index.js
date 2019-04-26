module.exports = asyncCacheify;

function asyncCacheify (promise, ms) {
    let waiting = [];
    let loading = false;
    let result;
    let resultAt;

    return cached;

    async function cached (force = false) {
        if (loading) {
            await new Promise((resolve, reject) => {
                waiting.push({ resolve, reject });
            });
            return result;
        }

        if (force) {
            resultAt = undefined;
        }

        if (hasCache()) {
            return result;
        }

        try {
            loading = true;
            result = await promise();
            resultAt = Date.now();
            loading = false;

            setTimeout(resolveAll, 0);

            return result;
        } catch (e) {
            resultAt = undefined;
            loading = false;

            setTimeout(rejectAll, 0);

            throw e;
        }
    }

    function resolveAll() {
        while (waiting.length > 0) {
            waiting.shift().resolve();
        }
    }

    function rejectAll() {
        const error = new Error('Async operation failed.');
        error.name = 'async_error';
        while (waiting.length > 0) {
            waiting.shift().reject(error);
        }
    }

    function hasCache() {
        if (!resultAt) return false;
        if (typeof ms === 'number' && (resultAt + ms) < Date.now()) return false;
        return true;
    }
}

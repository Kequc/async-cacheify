const assert = require('assert');
const asyncCacheify = require('./index.js');

async function it (description, cb) {
    try {
        await cb();
        process.stdout.write(description + ' \x1b[32m\u2713\x1b[0m\n');
    } catch (err) {
        process.stdout.write(description + ' \x1b[31m\u2717\x1b[0m\n');
        throw err;
    }
}

async function wait (ms) {
    await new Promise(resolve => { setTimeout(resolve, ms); });
}

it('is function', () => {
    const cacheified = asyncCacheify();
    assert.strict.equal(typeof cacheified, 'function');
});

it('returns result', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        return `fake-result-${count}`;
    });
    const result = await cacheified();
    assert.strict.equal(count, 1);
    assert.strict.equal(result, 'fake-result-1');
});

it('returns cached result', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        return `fake-result-${count}`;
    });
    const [result1, result2] = await Promise.all([cacheified(), cacheified()]);
    assert.strict.equal(count, 1);
    assert.strict.equal(result1, 'fake-result-1');
    assert.strict.equal(result2, 'fake-result-1');
});

it('returns cached result when timeout supplied', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        return `fake-result-${count}`;
    }, 1);
    const [result1, result2] = await Promise.all([cacheified(), cacheified()]);
    assert.strict.equal(count, 1);
    assert.strict.equal(result1, 'fake-result-1');
    assert.strict.equal(result2, 'fake-result-1');
});

it('returns uncached result after timeout', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        return `fake-result-${count}`;
    }, 1);
    const [result1, result2] = await Promise.all([cacheified(), cacheified()]);
    assert.strict.equal(count, 1);
    assert.strict.equal(result1, 'fake-result-1');
    assert.strict.equal(result2, 'fake-result-1');
    await wait(2);
    const [result3, result4] = await Promise.all([cacheified(), cacheified()]);
    assert.strict.equal(count, 2);
    assert.strict.equal(result3, 'fake-result-2');
    assert.strict.equal(result4, 'fake-result-2');
});

it('forces the cache to reset when flush is used', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        return `fake-result-${count}`;
    });
    const result1 = await cacheified();
    assert.strict.equal(count, 1);
    assert.strict.equal(result1, 'fake-result-1');
    cacheified.flush();
    const result2 = await cacheified();
    assert.strict.equal(count, 2);
    assert.strict.equal(result2, 'fake-result-2');
});

it('forces the cache to reset when flush is used with params', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        return `fake-result-${count}`;
    });
    const [result1, result2] = await Promise.all([cacheified(11, 21), cacheified(11)]);
    assert.strict.equal(count, 2);
    assert.strict.equal(result1, 'fake-result-1');
    assert.strict.equal(result2, 'fake-result-2');
    cacheified.flush(11, 21);
    const [result3, result4] = await Promise.all([cacheified(11, 21), cacheified(11)]);
    assert.strict.equal(count, 3);
    assert.strict.equal(result3, 'fake-result-3');
    assert.strict.equal(result4, 'fake-result-2');
});

it('still resolves originals when flush is used', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        const _count = count;
        await wait(1);
        return `fake-result-${_count}`;
    });
    const promise = Promise.all([cacheified(), cacheified()]);
    cacheified.flush();
    const result3 = await cacheified();
    const [result1, result2] = await promise;
    assert.strict.equal(count, 2);
    assert.strict.equal(result1, 'fake-result-1');
    assert.strict.equal(result2, 'fake-result-1');
    assert.strict.equal(result3, 'fake-result-2');
});

it('clears the cache when flushAll is used', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        return `fake-result-${count}`;
    });
    const result1 = await cacheified();
    assert.strict.equal(count, 1);
    assert.strict.equal(result1, 'fake-result-1');
    cacheified.flushAll();
    const result2 = await cacheified();
    assert.strict.equal(count, 2);
    assert.strict.equal(result2, 'fake-result-2');
});

it('still resolves originals when flushAll is used', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        const _count = count;
        await wait(1);
        return `fake-result-${_count}`;
    });
    const promise = Promise.all([cacheified(), cacheified()]);
    cacheified.flushAll();
    const [result1, result2] = await promise;
    assert.strict.equal(count, 1);
    assert.strict.equal(result1, 'fake-result-1');
    assert.strict.equal(result2, 'fake-result-1');
});

it('returns cached result when results were queued', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        await wait(1);
        return `fake-result-${count}`;
    });
    const [result1, result2, result3, result4] = await Promise.all([cacheified(), cacheified(), cacheified(), cacheified()]);
    assert.strict.equal(count, 1);
    assert.strict.equal(result1, 'fake-result-1');
    assert.strict.equal(result2, 'fake-result-1');
    assert.strict.equal(result3, 'fake-result-1');
    assert.strict.equal(result4, 'fake-result-1');
});

it('throws when there is an error', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        throw new Error(`fake-error-${count}`);
    });
    try {
        await cacheified();
        assert.strict.equal(true, false);
    } catch (e) {
        assert.strict.equal(count, 1);
        assert.strict.equal(e.message, 'fake-error-1');
    }
});

it('tries again after thrown error', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        throw new Error(`fake-error-${count}`);
    });
    try {
        await cacheified();
        assert.strict.equal(true, false);
    } catch (e) {
        assert.strict.equal(count, 1);
        assert.strict.equal(e.message, 'fake-error-1');
    }
    try {
        await cacheified();
        assert.strict.equal(true, false);
    } catch (e) {
        assert.strict.equal(count, 2);
        assert.strict.equal(e.message, 'fake-error-2');
    }
});

it('throws all when results were queued', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        await wait(1);
        throw new Error(`fake-error-${count}`);
    });
    const results = [];
    function add (e) {
        results.push(e);
    }
    await Promise.all([cacheified().catch(add), cacheified().catch(add), cacheified().catch(add), cacheified().catch(add)]);
    assert.strict.equal(count, 1);
    assert.strict.equal(results.length, 4);
    assert.strict.equal(results.filter(result => result.message === 'fake-error-1').length, 4);
});

it('returns result when params provided', async () => {
    let count = 0;
    const params = [];
    const cacheified = asyncCacheify(async function (..._params) {
        count++;
        params.push(_params);
        return `fake-result-${count}`;
    });
    const [result1, result2] = await Promise.all([cacheified(11, 21), cacheified(11, 21)]);
    assert.strict.equal(count, 1);
    assert.deepEqual(params, [[11, 21]]);
    assert.strict.equal(result1, 'fake-result-1');
    assert.strict.equal(result2, 'fake-result-1');
});

it('returns uncached result when unmatched params provided', async () => {
    let count = 0;
    const params = [];
    const cacheified = asyncCacheify(async function (..._params) {
        count++;
        params.push(_params);
        return `fake-result-${count}`;
    });
    const [result1, result2] = await Promise.all([cacheified(11, 21), cacheified(11, 20)]);
    assert.strict.equal(count, 2);
    assert.deepEqual(params, [[11, 21], [11, 20]]);
    assert.strict.equal(result1, 'fake-result-1');
    assert.strict.equal(result2, 'fake-result-2');
});

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
        return 'fake-result';
    });
    const result = await cacheified();
    assert.strict.equal(count, 1);
    assert.strict.equal(result, 'fake-result');
});

it('returns cached result', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        return 'fake-result';
    });
    const [result1, result2] = await Promise.all([cacheified(), cacheified()]);
    assert.strict.equal(count, 1);
    assert.strict.equal(result1, 'fake-result');
    assert.strict.equal(result2, 'fake-result');
});

it('returns cached result when timeout supplied', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        return 'fake-result';
    }, 1);
    const [result1, result2] = await Promise.all([cacheified(), cacheified()]);
    assert.strict.equal(count, 1);
    assert.strict.equal(result1, 'fake-result');
    assert.strict.equal(result2, 'fake-result');
});

it('returns uncached result after timeout', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        return 'fake-result';
    }, 1);
    const [result1, result2] = await Promise.all([cacheified(), cacheified()]);
    assert.strict.equal(count, 1);
    assert.strict.equal(result1, 'fake-result');
    assert.strict.equal(result2, 'fake-result');
    await wait(2);
    const [result3, result4] = await Promise.all([cacheified(), cacheified()]);
    assert.strict.equal(count, 2);
    assert.strict.equal(result3, 'fake-result');
    assert.strict.equal(result4, 'fake-result');
});

it('forces the cache to reset when flush is used', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        return 'fake-result';
    });
    const result1 = await cacheified.flush();
    assert.strict.equal(count, 1);
    assert.strict.equal(result1, 'fake-result');
    const result2 = await cacheified.flush();
    assert.strict.equal(count, 2);
    assert.strict.equal(result2, 'fake-result');
});

it('clears the cache when clear is used', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        return 'fake-result';
    });
    const result1 = await cacheified();
    assert.strict.equal(count, 1);
    assert.strict.equal(result1, 'fake-result');
    cacheified.clear();
    const result2 = await cacheified();
    assert.strict.equal(count, 2);
    assert.strict.equal(result2, 'fake-result');
});

it('returns cached result when results were queued', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        await wait(1);
        return 'fake-result';
    });
    const [result1, result2, result3, result4] = await Promise.all([cacheified(), cacheified(), cacheified(), cacheified()]);
    assert.strict.equal(count, 1);
    assert.strict.equal(result1, 'fake-result');
    assert.strict.equal(result2, 'fake-result');
    assert.strict.equal(result3, 'fake-result');
    assert.strict.equal(result4, 'fake-result');
});

it('throws when there is an error', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        throw new Error('fake-error');
    });
    try {
        await cacheified();
        assert.strict.equal(true, false);
    } catch (e) {
        assert.strict.equal(count, 1);
        assert.strict.equal(e.message, 'fake-error');
    }
});

it('tries again after thrown error', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        throw new Error('fake-error');
    });
    try {
        await cacheified();
        assert.strict.equal(true, false);
    } catch (e) {
        assert.strict.equal(count, 1);
        assert.strict.equal(e.message, 'fake-error');
    }
    try {
        await cacheified();
        assert.strict.equal(true, false);
    } catch (e) {
        assert.strict.equal(count, 2);
        assert.strict.equal(e.message, 'fake-error');
    }
});

it('throws all when results were queued', async () => {
    let count = 0;
    const cacheified = asyncCacheify(async function () {
        count++;
        await wait(1);
        throw new Error('fake-error');
    });
    const results = [];
    function add (e) {
        results.push(e);
    }
    await Promise.all([cacheified().catch(add), cacheified().catch(add), cacheified().catch(add), cacheified().catch(add)]);
    assert.strict.equal(count, 1);
    assert.strict.equal(results.length, 4);
    assert.strict.equal(results.filter(result => result.message === 'fake-error').length, 4);
});

it('returns result when params provided', async () => {
    let count = 0;
    const params = [];
    const cacheified = asyncCacheify(async function (..._params) {
        count++;
        params.push(_params);
        return 'fake-result';
    });
    const [result1, result2] = await Promise.all([cacheified(11, 21), cacheified(11, 21)]);
    assert.strict.equal(count, 1);
    assert.deepEqual(params, [[11, 21]]);
    assert.strict.equal(result1, 'fake-result');
    assert.strict.equal(result2, 'fake-result');
});

it('returns uncached result when unmatched params provided', async () => {
    let count = 0;
    const params = [];
    const cacheified = asyncCacheify(async function (..._params) {
        count++;
        params.push(_params);
        return 'fake-result';
    });
    const [result1, result2] = await Promise.all([cacheified(11, 21), cacheified(11, 20)]);
    assert.strict.equal(count, 2);
    assert.deepEqual(params, [[11, 21], [11, 20]]);
    assert.strict.equal(result1, 'fake-result');
    assert.strict.equal(result2, 'fake-result');
});

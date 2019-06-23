# async-cacheify

Wrapper for async functions.

## Usage

We can expect `expensiveFunction` is something we don't want to run very often. So we wrap it with this library, for the lifetime of the application it will only run the first time.

```javascript
const cacheify = require('async-cacheify');

async function expensiveFunction () {
    return await expensiveThing('x', 'y', 'z');
}

const cheapFunction = cacheify(expensiveFunction);

const results = await Promise.all([
    cheapFunction(),
    cheapFunction(),
    cheapFunction(),
    cheapFunction(),
    cheapFunction(),
    cheapFunction(),
    cheapFunction()
]);
```

We are able to run `cheapFunction` a lot for free.

## Parameters

You can use parameters as you would expect.

Any parameters you pass create a new cache only relevant for when those specific parameters are used again. In the following example the function will run twice, one time with `'x', 'y'` and then with `'q', 'y'`.

```javascript
const cacheify = require('async-cacheify');

async function expensiveFunction (x, y) {
    return await expensiveThing(x, y, 'z');
}

const cheapFunction = cacheify(expensiveFunction);

const result1 = await cheapFunction('x', 'y');
const result2 = await cheapFunction('q', 'y');
const result3 = await cheapFunction('q', 'y');
const result4 = await cheapFunction('x', 'y');
```

## Expiry

It is possible to set a cache expiry so that the function will execute again whenever the data gets old. The following example demonstrates a 1000ms cooldown.

```javascript
const cacheify = require('async-cacheify');

async function expensiveFunction (x, y) {
    return await expensiveThing(x, y, 'z');
}

const cheapFunction = cacheify(expensiveFunction, 1000);
```

## Parallel function calls

By setting the cache expiry to `0` you will not have the benefit of a long running cache. However if the function is run more than once before the first invocation finishes they will still share the result without it running multiple times.

```javascript
const cacheify = require('async-cacheify');

async function expensiveFunction (x, y) {
    return await expensiveThing(x, y, 'z');
}

const cheapFunction = cacheify(expensiveFunction, 0);

const [result1, result2] = await Promise.all([
    cheapFunction('x', 'y'),
    cheapFunction('x', 'y')
]);
```

## Flush

It is possible to force the function to run by using `flush`.

The example below flushes the cache twice and runs the function three times. If there is already an invocation running that invocation will finish in the background and complete as normal but new invocations will wait for the new one.

```javascript
const cacheify = require('async-cacheify');

async function expensiveFunction (x, y) {
    return await expensiveThing(x, y, 'z');
}

const cheapFunction = cacheify(expensiveFunction);

const result1 = await cheapFunction('x', 'y');
cheapFunction.flush('x', 'y');
const result2 = await cheapFunction('x', 'y');
const result3 = await cheapFunction('x', 'y');
cheapFunction.flush('x', 'y')
const result4 = await cheapFunction('x', 'y');
```

## Flush all

You can clear the cache for the entire function and not just specific parameters by using `flushAll`.

```javascript
const cacheify = require('async-cacheify');

async function expensiveFunction (x, y) {
    return await expensiveThing(x, y, 'z');
}

const cheapFunction = cacheify(expensiveFunction);

const result1 = await cheapFunction('x', 'y');
const result2 = await cheapFunction('x', 'y');
cheapFunction.flushAll();
const result3 = await cheapFunction('x', 'y');
const result4 = await cheapFunction('q', 'y');
cheapFunction.flushAll();
```

## Errors

Any error thrown does not store a cache. Therefore further invocations will keep trying to get it to work until there is a cache again.

```javascript
const cacheify = require('async-cacheify');

async function expensiveFunction () {
    throw new Error('Kabooooooom!');
}

const cheapFunction = cacheify(expensiveFunction);

try {
    await Promise.all([cheapFunction(), cheapFunction()]);
} catch (e) {
    console.log(e.message); // Kabooooooom!
}
try {
    await cheapFunction();
} catch (e) {
    console.log(e.message); // Kabooooooom!
}
```

## Contribute

Sure!

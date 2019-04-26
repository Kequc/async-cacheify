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

## Cache expiry

It is possible to set a cache expiry so that the function will execute again, the example below uses a 1000 ms cooldown.

```javascript
const cacheify = require('async-cacheify');

async function expensiveFunction () {
    return await expensiveThing('x', 'y', 'z');
}
const cheapFunction = cacheify(expensiveFunction, 1000);
```

## Parallel function calls

By setting the cache expiry to `0` you will not have the benefit of a long running cache. However if the function is run more than once before the first invocation finishes they will still share the result without it running multiple times.

```javascript
const cacheify = require('async-cacheify');

async function expensiveFunction () {
    return await expensiveThing('x', 'y', 'z');
}
const cheapFunction = cacheify(expensiveFunction, 0);

const [result1, result2] = await Promise.all([cheapFunction(), cheapFunction()]);
```

## Cache breaking

It is possible to force the function to run by passing `true` as the first argument, the example below breaks the cache twice. If there is already an invocation running that invocation takes precidence and will share the result.

```javascript
const cacheify = require('async-cacheify');

async function expensiveFunction () {
    return await expensiveThing('x', 'y', 'z');
}
const cheapFunction = cacheify(expensiveFunction);

const result1 = await cheapFunction();
const result2 = await cheapFunction(true);
const result3 = await cheapFunction();
const result4 = await cheapFunction(true);
```

## Errors

Any error thrown throws for all, and then the cache is cleared. Therefore further invocations will keep trying to get it to work until there is a cache again.

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

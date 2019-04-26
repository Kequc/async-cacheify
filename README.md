# async-cacheify

Used for cacheing the result of an async function so that you only run it once.

## Usage

In the following implementation we can expect `expensiveFunction` is something we don't want to run very often. So we wrap it with this library, for the lifetime of the application it will only run the first time.

```javascript
const cacheify = require('async-cacheify');

const cheapFunction = cacheify(async function expensiveFunction () {
    return await expensiveThing('x', 'y', 'z');
});

(async function myApplication () {
    const results = await Promise.all([
        cheapFunction(),
        cheapFunction(),
        cheapFunction(),
        cheapFunction(),
        cheapFunction(),
        cheapFunction(),
        cheapFunction()
    ]);
})();
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

(async function myApplication () {
    const [
        result1,
        result2
    ] = await Promise.all([
        cheapFunction(),
        cheapFunction()
    ]);
})();
```

## Cache breaking

It is possible to force the function to run by passing `true` as the first argument, the example below breaks the cache twice. If there is already an invocation running that invocation takes precidence and will share the result.

```javascript
const cacheify = require('async-cacheify');

const cheapFunction = cacheify(async function expensiveFunction () {
    return await expensiveThing('x', 'y', 'z');
});

(async function myApplication () {
    const result1 = await cheapFunction();
    const result2 = await cheapFunction(true);
    const result3 = await cheapFunction();
    const result4 = await cheapFunction(true);
})();
```

## Errors

Errors occur as you would expect, except the actual error thrown only occurs if the function is invoked. The rest are rejected with `'async_error'`. I consider this a best practice as throwing the same error multiple times feels incorrect.

If an error is thrown the cache is cleared.

## Contribute

Sure!

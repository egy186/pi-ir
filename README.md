# pi-ir

listen/send ir codes

## Prerequisites

- Raspberry Pi
- https://www.npmjs.com/package/pigpio#installation

## Send a code

```js
const { send } = require('@egy186/pi-ir');

const gpio = 17;
const code = [3500, 1750, /* ... */];

send(code, { gpio })
  .then(() => {
    console.log('success to send a code');
  })
  .catch(err => {
    console.error(err);
  });
```

## Listen a code

```js
const { listen } = require('@egy186/pi-ir');

const gpio = 18;
const listener = listen(gpio)

listener.on('data', code => {
  console.log(code);
});
```

## CLI

```
Usage: pi-ir [options] [command]

Options:
  -V, --version              output the version number
  -h, --help                 display help for command

Commands:
  record|r [options] <path>  record ir code
  send|s [options] <path>    send ir code
  help [command]             display help for command
```

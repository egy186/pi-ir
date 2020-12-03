'use strict';

const pigpio = require('pigpio');
const { EventEmitter } = require('events');

const { Gpio } = pigpio;

const Listener = class extends EventEmitter { };

const options = {
  maxWidth: 15, // Milliseconds
  minWidth: 0.1 // Milliseconds
};

/**
 * Listen ir codes.
 *
 * @param {number} gpio - The GPIO number.
 * @param {object} options - Options.
 * @param {number} [options.maxWidth] - Acceptable maximum pulse/space width in milliseconds.
 * @param {number} [options.minWidth] - Acceptable minimum pulse/space width in milliseconds.
 * @returns {Listener} Ir code listener.
 * @throws {Error}
 */
const listen = (gpio, {
  minWidth = options.minWidth,
  maxWidth = options.maxWidth
} = options) => {
  if (gpio < Gpio.MIN_GPIO || gpio > Gpio.MAX_GPIO) {
    throw new TypeError('Invalid GPIO number');
  }

  const glitchUs = minWidth * 1000;
  const listener = new Listener();
  const maxWidthUs = maxWidth * 1000;

  listener.once('newListener', () => {
    const input = new Gpio(gpio, {
      alert: true,
      mode: Gpio.INPUT
    });

    input.glitchFilter(glitchUs);

    listener.on('removeListener', () => {
      if (listener.listenerCount('data') === 0) {
        input.disableAlert();
      }
    });

    let code = [];
    let lastTick = 0xffffffff;
    // eslint-disable-next-line init-declarations
    let timeoutId;

    input.on('alert', (level, tick) => {
      const edge = pigpio.tickDiff(lastTick, tick);
      lastTick = tick;
      // Clear timeout
      clearTimeout(timeoutId);
      if (edge > 0 && edge <= maxWidthUs) { // In a code
        code.push(edge);
        // Emit a code on silence after the code
        timeoutId = setTimeout(() => {
          listener.emit('data', code);
          code = [];
        }, maxWidth);
      }
    });
  });

  return listener;
};

module.exports = listen;

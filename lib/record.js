/* eslint-disable max-statements, no-console */

'use strict';

const listen = require('./listen');
const { Gpio } = require('pigpio');
const { on } = require('events');
const average = require('./average');

const options = {
  confirm: 3,
  minLength: 16
};

/**
 * Record ir codes.
 *
 * @param {number} gpio - The GPIO number.
 * @param {object} options - Options object.
 * @param {object} [options.averageOptions] - Aberage options.
 * @param {number} [options.confirm] - Repeat the code in confirm times to verify.
 * @param {object} [options.listenOptions] - Options passed to the `listen` function.
 * @param {number} [options.minLength] - Acceptable minimal code length.
 * @returns {Promise<number[]>} Ir code.
 * @throws {Error}
 */
const record = async (gpio, {
  averageOptions,
  confirm = options.confirm,
  listenOptions,
  minLength = options.minLength
} = options) => {
  if (gpio < Gpio.MIN_GPIO || gpio > Gpio.MAX_GPIO) {
    throw new TypeError('Invalid GPIO number');
  }

  const listener = listen(gpio, listenOptions);
  const codes = [];

  console.log(`Waiting for a code (${codes.length + 1}/${confirm})...`);

  for await (const [nextCode] of on(listener, 'data')) {
    if (nextCode.length > minLength) {
      try {
        average([nextCode, ...codes]);
        codes.push(nextCode);
      } catch (err) {
        console.warn(err.message);
      }
    } else {
      console.warn('Too short code');
    }
    if (codes.length === confirm) {
      break;
    } else {
      console.log(`Confirm (${codes.length + 1}/${confirm})...`);
    }
  }

  const code = average(codes, averageOptions);

  return code;
};

module.exports = record;

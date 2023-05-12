'use strict';

const pigpio = require('pigpio');
const { range } = require('lodash');
const { promisify } = require('util');

const sleep = promisify(setTimeout);
const { Gpio } = pigpio;

/**
 * Create pause between pulses.
 *
 * @param {number} us - Space length in microseconds.
 * @returns {pigpio.GenericWaveStep[]} Spaces.
 */
const createSpace = us => [
  {
    gpioOff: 0,
    gpioOn: 0,
    usDelay: us
  }
];

/**
 * Create a pair of pulse and pause.
 *
 * @param {number} us - Pulse length in microseconds.
 * @param {object} options - Options object.
 * @param {number} options.gpio - The GPIO number.
 * @param {number} options.frequency - Sub-carrier frequency in kHz.
 * @returns {pigpio.GenericWaveStep[]} Pulses.
 */
const createPulse = (us, { gpio, frequency }) => {
  const cycle = 1000 / frequency; // Us
  const cycles = range(Math.round(us / cycle));
  const on = Math.round(cycle / 2);

  let offset = 0;
  const subCarrier = cycles.map(cycleIndex => {
    const target = Math.round((cycleIndex + 1) * cycle);
    offset += on;
    const off = target - offset;
    offset += off;
    return [
      {
        gpioOff: 0,
        gpioOn: gpio,
        usDelay: on
      },
      {
        gpioOff: gpio,
        gpioOn: 0,
        usDelay: off
      }
    ];
  });

  return subCarrier.flat(1);
};

/**
 * Send a code.
 *
 * @param {number} gpio - The GPIO number.
 * @param {number[]} code - Code to send.
 * @param {object} options - Options object.
 * @param {number} options.frequency - Sub-carrier frequency in kHz.
 * @throws {Error}
 */
// eslint-disable-next-line max-statements, require-await
const sendCode = async (gpio, code, { frequency }) => {
  if (code.length % 2 === 0) {
    throw new Error('Code length must be odd');
  }

  const output = new Gpio(gpio, { mode: Gpio.OUTPUT });
  output.digitalWrite(0);
  pigpio.waveClear();

  // Key: us, value: wave id
  const spaces = new Map();
  const pulses = new Map();

  const wave = code.map((usDelay, index) => {
    if (index % 2 === 1) {
      // Space
      if (!spaces.has(usDelay)) {
        pigpio.waveAddGeneric(createSpace(usDelay));
        spaces.set(usDelay, pigpio.waveCreate());
      }
      return spaces.get(usDelay);
    }
    // Pulse
    if (!pulses.has(usDelay)) {
      pigpio.waveAddGeneric(createPulse(usDelay, {
        frequency,
        gpio
      }));
      pulses.set(usDelay, pigpio.waveCreate());
    }
    return pulses.get(usDelay);
  });

  pigpio.waveChain(wave);
  // eslint-disable-next-line no-empty
  while (pigpio.waveTxBusy()) { }

  spaces.forEach(w => {
    pigpio.waveDelete(w);
  });
  pulses.forEach(w => {
    pigpio.waveDelete(w);
  });
};

const options = {
  frequency: 38, // KHz
  interval: 130 // Milliseconds
};

/**
 * Send ir codes.
 *
 * @param {number} gpio - The GPIO number.
 * @param {number[] | number[][]} codeOrCodes - Code to send.
 * @param {object} options - Options object.
 * @param {number} [options.frequency] - Sub-carrier frequency in kHz.
 * @param {number} [options.interval] - Interval time in milliseconds before sending a next code.
 * @throws {Error}
 */
const send = async (gpio, codeOrCodes, {
  frequency = options.frequency,
  interval = options.interval
} = options) => {
  if (!Array.isArray(codeOrCodes)) {
    throw new TypeError('Second argument must be an array');
  }
  if (gpio < Gpio.MIN_GPIO || gpio > Gpio.MAX_GPIO) {
    throw new TypeError('Invalid GPIO number');
  }

  if (typeof codeOrCodes[0] === 'number') {
    const code = codeOrCodes;
    await sendCode(gpio, code, { frequency });
  } else {
    const codes = codeOrCodes;
    await Promise.all(codes.map(async code => {
      const start = Date.now();
      await sendCode(gpio, code, { frequency });
      const end = Date.now();
      const delay = interval - (end - start);
      if (delay > 0) {
        await sleep(delay);
      }
    }));
  }
};

module.exports = send;

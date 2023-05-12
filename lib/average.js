'use strict';

const { sum, zip, isEqual } = require('lodash');

const isInRange = (list, unit, tolerance) => list.every(item => {
  const ratio = item / unit;
  return Math.abs(ratio - Math.round(ratio)) < tolerance;
});

const isSame = list => {
  const [item, ...restItems] = list;
  return restItems.every(restItem => isEqual(item, restItem));
};

const options = { tolerance: 0.15 };

/**
 * Average ir codes.
 *
 * @param {number[][]} codes - Ir codes.
 * @param {object} options - Options object.
 * @param {number} [options.tolerance] - Acceptable pulses tolerance.
 * @returns {number[]} Ir code.
 * @throws {Error}
 */
const average = (codes, { tolerance = options.tolerance } = options) => {
  const normalize = code => {
    const minPulse = Math.min(...code);
    const similarPulses = code.filter(c => ((c / minPulse) - 1) < (tolerance * 2));
    const similarPulsesAverage = sum(similarPulses) / similarPulses.length;
    const unit = Math.round(sum(code) / sum(code.map(c => Math.round(c / similarPulsesAverage))));
    if (!isInRange(code, unit, tolerance)) {
      throw new Error('Exceeds tolerance');
    }
    const normalizedCode = code.map(c => Math.round(c / unit));

    return [normalizedCode, unit];
  };

  const [normalizedCodes, units] = zip(...codes.map(normalize));

  if (!isSame(normalizedCodes)) {
    throw new Error('Not same');
  }

  const unit = sum(units) / units.length;
  if (!isInRange(units, unit, tolerance)) {
    throw new Error('Exceeds tolerance');
  }

  return normalizedCodes[0].map(c => c * unit);
};

module.exports = average;

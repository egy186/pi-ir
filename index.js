'use strict';

const average = require('./lib/average');
const listen = require('./lib/listen');
const record = require('./lib/record');
const send = require('./lib/send');

const piIr = {
  average,
  listen,
  record,
  send
};

module.exports = piIr;

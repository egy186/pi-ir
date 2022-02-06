#!/usr/bin/env node

/* eslint-disable no-console */

'use strict';

const { mkdir, open, readFile } = require('fs/promises');
const { record, send } = require('..');
const { Command, Option } = require('commander');
const { version } = require('../package.json');
const { dirname } = require('path');

const program = new Command();
const gpioOption = new Option('-g, --gpio <gpio>', 'GPIO number')
  .argParser(Number.parseInt)
  .makeOptionMandatory();

program
  .command('record')
  .alias('r')
  .description('record ir code')
  .argument('<path>', 'file path to output recoded code')
  .addOption(gpioOption)
  .option('-c, --confirm <confirm>', 'repeat the code in confirm times to verify', Number.parseInt, 3)
  .option('-t, --tolerance <tolerance>', 'acceptable pulses tolerance percentage', Number.parseInt, 15)
  .option('-l, --min-length <min-length>', 'acceptable minimal code length', Number.parseInt, 16)
  .option('-M, --max-width <max-width>', 'acceptable maximum pulse/space width in milliseconds', Number.parseFloat, 15)
  .option('-m, --min-width <min-width>', 'acceptable minimum pulse/space width in milliseconds', Number.parseFloat, 0.1)
  .action(async (path, { confirm, gpio, maxWidth, minLength, minWidth, tolerance }) => {
    try {
      await mkdir(dirname(path), { recursive: true });
      const fd = await open(path, 'wx');
      const code = await record(gpio, {
        averageOptions: { tolerance: tolerance / 100 },
        confirm,
        listenOptions: {
          maxWidth,
          minWidth
        },
        minLength
      });
      await fd.write(JSON.stringify(code));
    } catch (err) {
      console.error(err);
    }
  });

program
  .command('send')
  .alias('s')
  .description('send ir code')
  .argument('<path>', 'file path to send')
  .addOption(gpioOption)
  .option('-f, --frequency <frequency>', 'sub-carrier frequency in kHz', Number.parseFloat, 38)
  .option('-i, --interval <interval>', 'interval time in milliseconds before sending a next code', Number.parseInt, 130)
  .action(async (path, { frequency, gpio, interval }) => {
    try {
      const code = JSON.parse(await readFile(path, 'utf-8'));
      await send(gpio, code, {
        frequency,
        interval
      });
    } catch (err) {
      console.error(err);
    }
  });

program
  .version(version)
  .parse(process.argv);

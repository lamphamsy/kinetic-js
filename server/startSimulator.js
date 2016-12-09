'use strict';

const util = require('util');

const server = require('./Server.js');

const simulator = new server.Simulator('8123');
simulator.start();
console.log(util.inspect(simulator, {showHidden: false, depth: null}));

#!/usr/bin/env node
var argv = require('yargs/yargs')(process.argv.slice(2))
    .demandCommand(2)
    .argv;
console.dir(argv._[0]);
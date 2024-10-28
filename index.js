#!/usr/bin/env node
const yargs = require("yargs");
const {hideBin} = require("yargs/helpers");

yargs(hideBin(process.argv))
    .commandDir('commands')
    .usage("Use flotiq-setup to authenticate your local project using Global Read-Only key")
    .help()
    .alias("help", "h")
    .parse();

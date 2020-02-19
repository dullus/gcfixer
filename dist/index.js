"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const Process_1 = require("./Process");
const options = yargs_1.default
    .usage('Usage: -i <infile> [-o <outfile>]')
    .option('i', { alias: 'input', describe: 'Input file', type: 'string', demandOption: true })
    .option('o', {
    alias: 'output',
    demandOption: false,
    describe: 'Output file',
    type: 'string'
})
    .option('s', { alias: 'stdout', describe: 'pipe result to stdout', type: 'boolean', demandOption: false }).argv;
const process = new Process_1.Process(options.input, options.stdout, options.output);
//# sourceMappingURL=index.js.map
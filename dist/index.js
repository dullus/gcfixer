"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const yargs_1 = __importDefault(require("yargs"));
const chalk_1 = __importDefault(require("chalk"));
const Process_1 = require("./Process");
const options = yargs_1.default
    .usage('Usage: -i <infile> [-o <outfile>]')
    .option('i', { alias: 'input', describe: 'Input file', type: 'string', demandOption: true })
    .option('o', { alias: 'output', demandOption: false, describe: 'Output file', type: 'string' })
    .option('h', { alias: 'html', demandOption: false, describe: 'strip html', type: 'boolean' })
    .option('s', { alias: 'stdout', describe: 'pipe result to stdout', type: 'boolean', demandOption: false }).argv;
const params = {
    stdout: options.stdout,
    stripHtml: options.html
};
const process = new Process_1.Process(options.input, params, options.output);
process.run().then((caches) => {
    if (!options.stdout) {
        console.log(chalk_1.default.green(`✅ Done. ${caches} caches processed.`));
    }
}, () => {
    return;
});
//# sourceMappingURL=index.js.map
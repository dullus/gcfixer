import yargs from 'yargs';
import chalk from 'chalk';
import { Process } from './Process';

const options = yargs
  .usage('Usage: -i <infile> [-o <outfile>]')
  .option('i', { alias: 'input', describe: 'Input file', type: 'string', demandOption: true })
  .option('o', {
    alias: 'output',
    demandOption: false,
    describe: 'Output file',
    type: 'string'
  })
  .option('s', { alias: 'stdout', describe: 'pipe result to stdout', type: 'boolean', demandOption: false }).argv;

const process = new Process(options.input as string, options.stdout as boolean, options.output as string);

process.run().then(
  (caches: number) => {
    if (!options.stdout) {
      console.log(chalk.green(`✅ Done. ${caches} caches processed.`));
    }
  },
  () => {
    return;
  }
);

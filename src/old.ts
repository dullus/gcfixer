// #region "imports"
import * as I from './interfaces';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import fs from 'fs';
import Parser from 'node-xml-stream';
import process from 'process';
import yargs from 'yargs';
import * as utils from './utils';
import { spinner } from './spinner';
// tslint:disable-next-line: no-var-requires
const version = require('../package.json').version;
// #endregion

const options = yargs
  .usage('Usage: -i <infile> [-o <outfile>]')
  .option('i', { alias: 'input', describe: 'Input file', type: 'string', demandOption: true })
  .option('o', {
    alias: 'output',
    demandOption: false,
    describe: 'Output file',
    type: 'string'
  })
  .option('s', { alias: 'stdout', describe: 'pipe result to stdout', type: 'boolean', demandOption: false })
  .argv;

const parser = new Parser() as I.ParserStream;
const filename: string = options.input as string;
const filenameOut: string =
  (options.output as string) ||
  (filename.includes('.gpx') ? filename.replace('.gpx', '.out.gpx') : `${filename}.out.gpx`);
const flag: I.Flag = {
  desc: false,
  removeUrl: false,
  text: false
}

let bar: cliProgress.SingleBar;
let fw: fs.WriteStream;
let geocaches = 0;
let lastParent = '';
let level = -1;
let tags = 0;
let totalCaches = 0;

if (!options.stdout) {
  console.log(`${chalk.cyan('🌍 GCFixer')} ${chalk.whiteBright(version)}`);
  console.log(`parsing: ${filename}`);
  bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
}

// #region "parser handlers"
parser.on('opentag', (name: string, attrs: I.Attrs) => {
  flag.desc = false;
  flag.text = false;
  flag.removeUrl = false;
  switch (name) {
    case 'groundspeak:cache':
      geocaches++;
      if (!options.stdout) {
        bar.increment();
      }
      break;
    case 'groundspeak:short_description':
    case 'groundspeak:long_description':
      flag.desc = true;
      break;
    case 'desc':
    case 'urlname':
    case 'groundspeak:name':
      flag.text = true;
      break;
    case 'groundspeak:text':
      flag.text = true;
      flag.removeUrl = true;
      break;
    default:
      break;
  }
  level++;
  lastParent = name;
  putTag(name, attrs);
});

parser.on('closetag', (name: string) => {
  level--;
  putTag(name, undefined, true);
});

parser.on('text', (text: string) => {
  putText(utils.processText(text, flag));
});

parser.on('instruction', (name: string, attrs: I.Attrs) => {
  const header = `<?xml version="1.0" encoding="utf-8"?>`;
  if (options.stdout) {
    process.stdout.write(header);
  } else {
    bar.start(totalCaches, 0);
    fw.write(header);
  }
});

parser.on('error', (err: any) => {
  errorHandler({ message: 'XML parsing error !' });
});

parser.on('finish', () => {
  if (!options.stdout) {
    bar.stop();
    console.log(chalk.green(`✅ Done. ${geocaches} caches processed.`));
    fw.close();
  }
});
// #endregion

function putText(txt: string) {
  if (options.stdout) {
    process.stdout.write(txt);
  } else {
    fw.write(txt);
  }
}

function putTag(name: string, attrs: I.Attrs | undefined, closing = false) {
  const {levelMinus, tag} = utils.createTag({
    attrs,
    closing,
    lastParent,
    level,
    name
  })

  if (levelMinus) {
    level--;
  }

  if (options.stdout) {
    process.stdout.write(tag);
  } else {
    fw.write(tag);
  }
}

function errorHandler(err: any) {
  console.log(chalk.red(`⚠️  Error: ${err.message}`));
}

// read from GPX file, pipe to parser and write new file
function main(): void {
  const stream = fs.createReadStream(filename);
  stream.on('error', errorHandler);
  if (!options.stdout) {
    fw = fs.createWriteStream(filenameOut, { encoding: 'utf8' });
  }
  stream.pipe(parser);
}

// determine number of chaches and run main() then
if (!options.stdout) {
  const checker = new Parser() as I.ParserStream;

  checker.on('instruction', (name: string, attrs: I.Attrs) => {
    spinner.start();
  });

  checker.on('opentag', (name: string, attrs: I.Attrs) => {
    tags++;
    if (tags % 5 === 0) {
      spinner.rotate();
    }
    if (name === 'groundspeak:cache') {
      totalCaches++;
    }
  });

  checker.on('finish', () => {
    spinner.stop();
    if (totalCaches) {
      main();
    } else {
      console.log(chalk.yellow('⚠️  Sorry, no caches found.'));
    }
  });

  const stream = fs.createReadStream(filename);
  stream.on('error', errorHandler);
  stream.pipe(checker);
} else {
  main();
}

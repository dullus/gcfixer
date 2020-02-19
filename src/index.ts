import chalk from 'chalk';
import cleaner from 'clean-html';
import cliProgress from 'cli-progress';
import fs from 'fs';
import he from 'he';
import htmlToText from 'html-to-text';
import Parser from 'node-xml-stream';
import unidecode from 'unidecode-plus';
import yargs from 'yargs';
import process from 'process';
import rdl from 'readline';

const version = require('../package.json').version;

import * as utils from './utils';

interface IAttrs {
  [key: string]: string;
}
interface IParserStream extends NodeJS.EventEmitter, NodeJS.WritableStream {}

const VERSION = version;

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
  .option('d', { alias: 'debug', describe: 'debug mode', type: 'boolean', demandOption: false }).argv;

const DEBUG: boolean = options.debug && !options.stdout;
const parser = new Parser() as IParserStream;
const filename: string = options.input as string;
const filenameOut: string =
  (options.output as string) ||
  (filename.includes('.gpx') ? filename.replace('.gpx', '.out.gpx') : `${filename}.out.gpx`);

let bar: cliProgress.SingleBar;
let totalCaches = 0;
let geocaches = 0;
let flagDesc = false;
let flagRemoveUrl = false;
let flagText = false;
let fw: fs.WriteStream;
let level = -1;
let lastParent = '';

if (!options.stdout) {
  console.log(`${chalk.cyan('🌍 GPX Fixer')} ${chalk.whiteBright(VERSION)}`);
  console.log(`parsing: ${filename}`);
  bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
}

parser.on('opentag', (name: string, attrs: IAttrs) => {
  flagDesc = false;
  flagText = false;
  flagRemoveUrl = false;
  switch (name) {
    case 'groundspeak:cache':
      geocaches++;
      if (!options.stdout) {
        bar.increment();
      }
      break;
    case 'groundspeak:short_description':
    case 'groundspeak:long_description':
      flagDesc = true;
      break;
    case 'desc':
    case 'urlname':
    case 'groundspeak:name':
      flagText = true;
      break;
    case 'groundspeak:text':
      flagText = true;
      flagRemoveUrl = true;
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
  let out = text;
  if (flagDesc) {
    out = utils.unescape(out);
    debug('unescape', out);

    cleaner.clean(out, (html) => {
      out = html;
    });
    debug('clean', out);
    out = htmlToText.fromString(out, {
      decodeOptions: { strict: false },
      ignoreHref: true,
      ignoreImage: true,
      uppercaseHeadings: false
    });
    debug('totext', out);

    out = he.decode(out);
    debug('he', out);

    out = unidecode(out, { skipRanges: [[0xb0, 0xb0]] });
    debug('unidecode', out);

    out = utils.escape(out);
    debug('escape', out);
  }
  if (flagText) {
    out = unidecode(out, { skipRanges: [[0xb0, 0xb0]] });
    out = utils.escape(out);
  }
  if (flagRemoveUrl) {
    out = utils.removeUrl(out);
  }
  puts(out);
});

parser.on('instruction', (name: string, attrs: IAttrs) => {
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

function puts(txt: string) {
  if (options.stdout) {
    process.stdout.write(txt);
  } else {
    fw.write(txt);
  }
}

function putTag(name: string, attrs?: IAttrs, closing = false) {
  const howManyTabs = closing && name === lastParent ? 0 : level;
  let tabs = '';
  let tag = '';
  let singleTag = false;

  for (let i = 0; i < howManyTabs; i++) {
    tabs = `${tabs}  `;
  }

  if (closing) {
    tag = name === lastParent ? '</' : `\n${tabs}  </`;
  } else {
    tag = `\n${tabs}<`;
  }

  tag = tag + name;
  if (attrs) {
    Object.keys(attrs).forEach((attr) => {
      let val = attrs[attr];
      if (val.substr(-2) === ' /') {
        singleTag = true;
        val = val.substr(0, val.length - 2);
      }
      tag = `${tag} ${attr}="${val}"`;
    });
  }
  if (name.includes('/') || singleTag) {
    level--;
  }
  tag = `${tag}${singleTag ? ' />' : '>'}`;
  if (options.stdout) {
    process.stdout.write(tag);
  } else {
    fw.write(tag);
  }
}

function debug(label: string, out: string): void {
  if (DEBUG) {
    console.log(chalk.red(`--${label}--`));
    console.log(out);
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
  const checker = new Parser() as IParserStream;
  const shapes = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let pos = 0;

  checker.on('instruction', (name: string, attrs: IAttrs) => {
    process.stdout.write('\x1B[?25l'); // hide TTY cursor
  });

  checker.on('opentag', (name: string, attrs: IAttrs) => {
    if (name === 'groundspeak:cache') {
      totalCaches++;
      if (totalCaches % 5 === 0) {
        rdl.cursorTo(process.stdout, 0);
        process.stdout.write(shapes[pos++]);
        if (pos > shapes.length) {
          pos = 0;
        }
      }
    }
  });

  checker.on('finish', () => {
    rdl.cursorTo(process.stdout, 0);
    process.stdout.write('\x1B[?25h'); // show TTY cursor
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

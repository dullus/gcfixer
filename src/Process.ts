// #region "imports"
import * as I from './interfaces';
import chalk from 'chalk';
import cliProgress from 'cli-progress';
import fs from 'fs';
import Parser from 'node-xml-stream';
import process from 'process';
import * as utils from './utils';
import { spinner } from './spinner';
// tslint:disable-next-line: no-var-requires
const version = require('../package.json').version;
// #endregion

export class Process {
  private bar?: cliProgress.SingleBar;
  private filename: string;
  private filenameOut: string;
  private flag: I.Flag;
  private fw?: fs.WriteStream;
  private geocaches: number;
  private lastParent: string;
  private level: number;
  private parser: I.ParserStream;
  private stdout: boolean;
  private totalCaches: number;

  constructor(filename: string, params: I.Params, filenameOut?: string) {
    this.filename = filename;
    this.filenameOut =
      filenameOut || (filename.includes('.gpx') ? filename.replace('.gpx', '.out.gpx') : `${filename}.out.gpx`);
    this.geocaches = 0;
    this.lastParent = '';
    this.level = -1;
    this.totalCaches = 0;
    this.flag = {
      desc: false,
      removeUrl: false,
      stripHtml: params.stripHtml,
      text: false
    };
    this.stdout = params.stdout;
    this.parser = new Parser() as I.ParserStream;
  }

  public run(): Promise<number> {
    return new Promise<number>((resolved, rejected) => {
      if (this.stdout) {
        this.process()
          .then(() => resolved())
          .catch((txt: string) => {
            this.errorHandler(txt);
            rejected();
          });
      } else {
        console.log(`${chalk.cyan('🌍 GCFixer')} ${chalk.whiteBright(version)}`);
        console.log(`parsing: ${this.filename}`);
        this.checkCaches()
          .then(() => {
            this.bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
            this.fw = fs.createWriteStream(this.filenameOut, { encoding: 'utf8' });
          })
          .then(() => this.process())
          .then(() => resolved(this.geocaches))
          .catch((txt: string) => {
            this.errorHandler(txt);
            rejected();
          });
      }
    });
  }

  private process(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      const stream = fs.createReadStream(this.filename);
      // bind handlers
      this.parser.on('instruction', this.onInstruction.bind(this));
      this.parser.on('opentag', this.onOpenTag.bind(this));
      this.parser.on('closetag', this.onCloseTag.bind(this));
      this.parser.on('text', this.onText.bind(this));
      this.parser.on('error', () => {
        reject('XML parsing error !');
      });
      this.parser.on('finish', () => {
        this.onFinish();
        resolve();
      });
      stream.on('error', (err: Error) => {
        reject(err.message);
      });
      // start stream
      stream.pipe(this.parser);
    });
  }

  private checkCaches(): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let tags = 0;

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
          this.totalCaches++;
        }
      });
      checker.on('finish', () => {
        spinner.stop();
        if (this.totalCaches) {
          resolve();
        } else {
          reject('Sorry, no caches found.');
        }
      });

      const stream = fs.createReadStream(this.filename);
      stream.on('error', (err: Error) => {
        reject(err.message);
      });
      stream.pipe(checker);
    });
  }

  private putText(txt: string): void {
    if (this.fw) {
      this.fw.write(txt);
    } else {
      process.stdout.write(txt);
    }
  }

  private putTag(name: string, attrs: I.Attrs | undefined, closing = false): void {
    const { levelMinus, tag } = utils.createTag({
      attrs,
      closing,
      lastParent: this.lastParent,
      level: this.level,
      name
    });

    if (levelMinus) {
      this.level--;
    }

    this.putText(tag);
  }

  private errorHandler(err: string): void {
    console.error(chalk.red(`⚠️  Error: ${err}`));
  }

  // #region "handlers"
  private onOpenTag(name: string, attrs: I.Attrs): void {
    this.flag.desc = false;
    this.flag.text = false;
    this.flag.removeUrl = false;

    switch (name) {
      case 'groundspeak:cache':
        this.geocaches++;
        this.bar?.increment();
        break;
      case 'groundspeak:short_description':
      case 'groundspeak:long_description':
        this.flag.desc = true;
        break;
      case 'desc':
      case 'urlname':
      case 'groundspeak:name':
        this.flag.text = true;
        break;
      case 'groundspeak:text':
        this.flag.text = true;
        this.flag.removeUrl = true;
        break;
      default:
        break;
    }
    this.level++;
    this.lastParent = name;
    this.putTag(name, attrs);
  }

  private onCloseTag(name: string): void {
    this.level--;
    this.putTag(name, undefined, true);
  }

  private onText(text: string) {
    this.putText(utils.processText(text, this.flag));
  }

  private onInstruction(name: string, attrs: I.Attrs): void {
    this.bar?.start(this.totalCaches, 0);
    this.putText(`<?xml version="1.0" encoding="utf-8"?>`);
  }

  private onFinish(): void {
    this.bar?.stop();
    this.fw?.close();
  }
  // #endregion
}

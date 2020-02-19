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
  private fw?: fs.WriteStream;
  private parser: I.ParserStream;
  public filename: string;
  public filenameOut: string;
  public flag: I.Flag;
  public geocaches: number;
  public lastParent: string;
  public level: number;
  public totalCaches: number;

  constructor(filename: string, stdout = false, filenameOut?: string) {
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
      text: false
    };

    this.parser = new Parser() as I.ParserStream;
    this.initParser();

    if (stdout) {
      this.process();
    } else {
      console.log(`${chalk.cyan('🌍 GCFixer')} ${chalk.whiteBright(version)}`);
      console.log(`parsing: ${filename}`);
      this.checkCaches().then(
        (resolved) => {
          this.bar = new cliProgress.SingleBar({}, cliProgress.Presets.shades_classic);
          this.fw = fs.createWriteStream(this.filenameOut, { encoding: 'utf8' });
          this.process();
        },
        (rejected) => console.log(chalk.yellow('⚠️  Sorry, no caches found.'))
      );
    }
  }

  public process(): void {
    const stream = fs.createReadStream(this.filename);
    stream.on('error', this.errorHandler);
    stream.pipe(this.parser);
  }

  public checkCaches() {
    return new Promise<void>((resolve, reject) => {
      const checker = new Parser() as I.ParserStream;
      let tags = 0;

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
          reject();
        }
      });

      const stream = fs.createReadStream(this.filename);
      stream.on('error', this.errorHandler);
      stream.pipe(checker);
    });
  }

  public putText(txt: string): void {
    if (this.fw) {
      this.fw.write(txt);
    } else {
      process.stdout.write(txt);
    }
  }

  public putTag(name: string, attrs: I.Attrs | undefined, closing = false): void {
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

  public errorHandler(err: Error): void {
    console.error(chalk.red(`⚠️  Error: ${err.message}`));
  }

  private initParser(): void {
    this.parser.on('instruction', this.onInstruction.bind(this));
    this.parser.on('opentag', this.onOpenTag.bind(this));
    this.parser.on('closetag', this.onCloseTag.bind(this));
    this.parser.on('text', this.onText.bind(this));
    this.parser.on('error', this.onError.bind(this));
    this.parser.on('finish', this.onFinish.bind(this));
  }

  // #region "handlers"
  private onOpenTag(name: string, attrs: I.Attrs): void {
    this.flag.desc = false;
    this.flag.text = false;
    this.flag.removeUrl = false;

    switch (name) {
      case 'groundspeak:cache':
        this.geocaches++;
        if (this.bar) {
          this.bar.increment();
        }
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
    if (this.bar) {
      this.bar.start(this.totalCaches, 0);
    }
    this.putText(`<?xml version="1.0" encoding="utf-8"?>`);
  }

  private onError(err: Error): void {
    this.errorHandler(new Error('XML parsing error !'));
  }

  private onFinish(): void {
    if (this.bar && this.fw) {
      this.bar.stop();
      console.log(chalk.green(`✅ Done. ${this.geocaches} caches processed.`));
      this.fw.close();
    }
  }
  // #endregion
}

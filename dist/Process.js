"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const chalk_1 = __importDefault(require("chalk"));
const cli_progress_1 = __importDefault(require("cli-progress"));
const fs_1 = __importDefault(require("fs"));
const node_xml_stream_1 = __importDefault(require("node-xml-stream"));
const process_1 = __importDefault(require("process"));
const utils = __importStar(require("./utils"));
const spinner_1 = require("./spinner");
// tslint:disable-next-line: no-var-requires
const version = require('../package.json').version;
// #endregion
class Process {
    constructor(filename, stdout = false, filenameOut) {
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
        this.parser = new node_xml_stream_1.default();
        this.initParser();
        if (stdout) {
            this.process();
        }
        else {
            console.log(`${chalk_1.default.cyan('🌍 GCFixer')} ${chalk_1.default.whiteBright(version)}`);
            console.log(`parsing: ${filename}`);
            this.checkCaches().then((resolved) => {
                this.bar = new cli_progress_1.default.SingleBar({}, cli_progress_1.default.Presets.shades_classic);
                this.fw = fs_1.default.createWriteStream(this.filenameOut, { encoding: 'utf8' });
                this.process();
            }, (rejected) => console.log(chalk_1.default.yellow('⚠️  Sorry, no caches found.')));
        }
    }
    process() {
        const stream = fs_1.default.createReadStream(this.filename);
        stream.on('error', this.errorHandler);
        stream.pipe(this.parser);
    }
    checkCaches() {
        return new Promise((resolve, reject) => {
            const checker = new node_xml_stream_1.default();
            let tags = 0;
            checker.on('instruction', (name, attrs) => {
                spinner_1.spinner.start();
            });
            checker.on('opentag', (name, attrs) => {
                tags++;
                if (tags % 5 === 0) {
                    spinner_1.spinner.rotate();
                }
                if (name === 'groundspeak:cache') {
                    this.totalCaches++;
                }
            });
            checker.on('finish', () => {
                spinner_1.spinner.stop();
                if (this.totalCaches) {
                    resolve();
                }
                else {
                    reject();
                }
            });
            const stream = fs_1.default.createReadStream(this.filename);
            stream.on('error', this.errorHandler);
            stream.pipe(checker);
        });
    }
    putText(txt) {
        if (this.fw) {
            this.fw.write(txt);
        }
        else {
            process_1.default.stdout.write(txt);
        }
    }
    putTag(name, attrs, closing = false) {
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
    errorHandler(err) {
        console.error(chalk_1.default.red(`⚠️  Error: ${err.message}`));
    }
    initParser() {
        this.parser.on('instruction', this.onInstruction.bind(this));
        this.parser.on('opentag', this.onOpenTag.bind(this));
        this.parser.on('closetag', this.onCloseTag.bind(this));
        this.parser.on('text', this.onText.bind(this));
        this.parser.on('error', this.onError.bind(this));
        this.parser.on('finish', this.onFinish.bind(this));
    }
    // #region "handlers"
    onOpenTag(name, attrs) {
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
    onCloseTag(name) {
        this.level--;
        this.putTag(name, undefined, true);
    }
    onText(text) {
        this.putText(utils.processText(text, this.flag));
    }
    onInstruction(name, attrs) {
        if (this.bar) {
            this.bar.start(this.totalCaches, 0);
        }
        this.putText(`<?xml version="1.0" encoding="utf-8"?>`);
    }
    onError(err) {
        this.errorHandler(new Error('XML parsing error !'));
    }
    onFinish() {
        if (this.bar && this.fw) {
            this.bar.stop();
            console.log(chalk_1.default.green(`✅ Done. ${this.geocaches} caches processed.`));
            this.fw.close();
        }
    }
}
exports.Process = Process;
//# sourceMappingURL=Process.js.map
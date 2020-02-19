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
        this.stdout = stdout;
        this.parser = new node_xml_stream_1.default();
    }
    run() {
        return new Promise((resolved, rejected) => {
            if (this.stdout) {
                this.process()
                    .then(() => resolved())
                    .catch((txt) => {
                    this.errorHandler(txt);
                    rejected();
                });
            }
            else {
                console.log(`${chalk_1.default.cyan('🌍 GCFixer')} ${chalk_1.default.whiteBright(version)}`);
                console.log(`parsing: ${this.filename}`);
                this.checkCaches()
                    .then(() => {
                    this.bar = new cli_progress_1.default.SingleBar({}, cli_progress_1.default.Presets.shades_classic);
                    this.fw = fs_1.default.createWriteStream(this.filenameOut, { encoding: 'utf8' });
                })
                    .then(() => this.process())
                    .then(() => resolved(this.geocaches))
                    .catch((txt) => {
                    this.errorHandler(txt);
                    rejected();
                });
            }
        });
    }
    process() {
        return new Promise((resolve, reject) => {
            const stream = fs_1.default.createReadStream(this.filename);
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
            stream.on('error', (err) => {
                reject(err.message);
            });
            // start stream
            stream.pipe(this.parser);
        });
    }
    checkCaches() {
        return new Promise((resolve, reject) => {
            let tags = 0;
            const checker = new node_xml_stream_1.default();
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
                    reject('Sorry, no caches found.');
                }
            });
            const stream = fs_1.default.createReadStream(this.filename);
            stream.on('error', (err) => {
                reject(err.message);
            });
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
        console.error(chalk_1.default.red(`⚠️  Error: ${err}`));
    }
    // #region "handlers"
    onOpenTag(name, attrs) {
        var _a;
        this.flag.desc = false;
        this.flag.text = false;
        this.flag.removeUrl = false;
        switch (name) {
            case 'groundspeak:cache':
                this.geocaches++;
                (_a = this.bar) === null || _a === void 0 ? void 0 : _a.increment();
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
        var _a;
        (_a = this.bar) === null || _a === void 0 ? void 0 : _a.start(this.totalCaches, 0);
        this.putText(`<?xml version="1.0" encoding="utf-8"?>`);
    }
    onFinish() {
        var _a, _b;
        (_a = this.bar) === null || _a === void 0 ? void 0 : _a.stop();
        (_b = this.fw) === null || _b === void 0 ? void 0 : _b.close();
    }
}
exports.Process = Process;
//# sourceMappingURL=Process.js.map
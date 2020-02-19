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
const clean_html_1 = __importDefault(require("clean-html"));
const cli_progress_1 = __importDefault(require("cli-progress"));
const fs_1 = __importDefault(require("fs"));
const he_1 = __importDefault(require("he"));
const html_to_text_1 = __importDefault(require("html-to-text"));
const node_xml_stream_1 = __importDefault(require("node-xml-stream"));
const unidecode_plus_1 = __importDefault(require("unidecode-plus"));
const yargs_1 = __importDefault(require("yargs"));
const process_1 = __importDefault(require("process"));
const readline_1 = __importDefault(require("readline"));
const version = require('../package.json').version;
const utils = __importStar(require("./utils"));
const VERSION = version;
const options = yargs_1.default
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
const DEBUG = options.debug && !options.stdout;
const parser = new node_xml_stream_1.default();
const filename = options.input;
const filenameOut = options.output ||
    (filename.includes('.gpx') ? filename.replace('.gpx', '.out.gpx') : `${filename}.out.gpx`);
let bar;
let totalCaches = 0;
let geocaches = 0;
let flagDesc = false;
let flagRemoveUrl = false;
let flagText = false;
let fw;
let level = -1;
let lastParent = '';
if (!options.stdout) {
    console.log(`${chalk_1.default.cyan('🌍 GPX Fixer')} ${chalk_1.default.whiteBright(VERSION)}`);
    console.log(`parsing: ${filename}`);
    bar = new cli_progress_1.default.SingleBar({}, cli_progress_1.default.Presets.shades_classic);
}
parser.on('opentag', (name, attrs) => {
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
parser.on('closetag', (name) => {
    level--;
    putTag(name, undefined, true);
});
parser.on('text', (text) => {
    let out = text;
    if (flagDesc) {
        out = utils.unescape(out);
        debug('unescape', out);
        clean_html_1.default.clean(out, (html) => {
            out = html;
        });
        debug('clean', out);
        out = html_to_text_1.default.fromString(out, {
            decodeOptions: { strict: false },
            ignoreHref: true,
            ignoreImage: true,
            uppercaseHeadings: false
        });
        debug('totext', out);
        out = he_1.default.decode(out);
        debug('he', out);
        out = unidecode_plus_1.default(out, { skipRanges: [[0xb0, 0xb0]] });
        debug('unidecode', out);
        out = utils.escape(out);
        debug('escape', out);
    }
    if (flagText) {
        out = unidecode_plus_1.default(out, { skipRanges: [[0xb0, 0xb0]] });
        out = utils.escape(out);
    }
    if (flagRemoveUrl) {
        out = utils.removeUrl(out);
    }
    puts(out);
});
parser.on('instruction', (name, attrs) => {
    const header = `<?xml version="1.0" encoding="utf-8"?>`;
    if (options.stdout) {
        process_1.default.stdout.write(header);
    }
    else {
        bar.start(totalCaches, 0);
        fw.write(header);
    }
});
parser.on('error', (err) => {
    errorHandler({ message: 'XML parsing error !' });
});
parser.on('finish', () => {
    if (!options.stdout) {
        bar.stop();
        console.log(chalk_1.default.green(`✅ Done. ${geocaches} caches processed.`));
        fw.close();
    }
});
function puts(txt) {
    if (options.stdout) {
        process_1.default.stdout.write(txt);
    }
    else {
        fw.write(txt);
    }
}
function putTag(name, attrs, closing = false) {
    const howManyTabs = closing && name === lastParent ? 0 : level;
    let tabs = '';
    let tag = '';
    let singleTag = false;
    for (let i = 0; i < howManyTabs; i++) {
        tabs = `${tabs}  `;
    }
    if (closing) {
        tag = name === lastParent ? '</' : `\n${tabs}  </`;
    }
    else {
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
        process_1.default.stdout.write(tag);
    }
    else {
        fw.write(tag);
    }
}
function debug(label, out) {
    if (DEBUG) {
        console.log(chalk_1.default.red(`--${label}--`));
        console.log(out);
    }
}
function errorHandler(err) {
    console.log(chalk_1.default.red(`⚠️  Error: ${err.message}`));
}
// read from GPX file, pipe to parser and write new file
function main() {
    const stream = fs_1.default.createReadStream(filename);
    stream.on('error', errorHandler);
    if (!options.stdout) {
        fw = fs_1.default.createWriteStream(filenameOut, { encoding: 'utf8' });
    }
    stream.pipe(parser);
}
// determine number of chaches and run main() then
if (!options.stdout) {
    const checker = new node_xml_stream_1.default();
    const shapes = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let pos = 0;
    checker.on('instruction', (name, attrs) => {
        process_1.default.stdout.write('\x1B[?25l'); // hide TTY cursor
    });
    checker.on('opentag', (name, attrs) => {
        if (name === 'groundspeak:cache') {
            totalCaches++;
            if (totalCaches % 5 === 0) {
                readline_1.default.cursorTo(process_1.default.stdout, 0);
                process_1.default.stdout.write(shapes[pos++]);
                if (pos > shapes.length) {
                    pos = 0;
                }
            }
        }
    });
    checker.on('finish', () => {
        readline_1.default.cursorTo(process_1.default.stdout, 0);
        process_1.default.stdout.write('\x1B[?25h'); // show TTY cursor
        if (totalCaches) {
            main();
        }
        else {
            console.log(chalk_1.default.yellow('⚠️  Sorry, no caches found.'));
        }
    });
    const stream = fs_1.default.createReadStream(filename);
    stream.on('error', errorHandler);
    stream.pipe(checker);
}
else {
    main();
}
//# sourceMappingURL=index.js.map
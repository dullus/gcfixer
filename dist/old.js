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
const yargs_1 = __importDefault(require("yargs"));
const utils = __importStar(require("./utils"));
const spinner_1 = require("./spinner");
// tslint:disable-next-line: no-var-requires
const version = require('../package.json').version;
// #endregion
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
    .argv;
const parser = new node_xml_stream_1.default();
const filename = options.input;
const filenameOut = options.output ||
    (filename.includes('.gpx') ? filename.replace('.gpx', '.out.gpx') : `${filename}.out.gpx`);
const flag = {
    desc: false,
    removeUrl: false,
    text: false
};
let bar;
let fw;
let geocaches = 0;
let lastParent = '';
let level = -1;
let tags = 0;
let totalCaches = 0;
if (!options.stdout) {
    console.log(`${chalk_1.default.cyan('🌍 GCFixer')} ${chalk_1.default.whiteBright(version)}`);
    console.log(`parsing: ${filename}`);
    bar = new cli_progress_1.default.SingleBar({}, cli_progress_1.default.Presets.shades_classic);
}
// #region "parser handlers"
parser.on('opentag', (name, attrs) => {
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
parser.on('closetag', (name) => {
    level--;
    putTag(name, undefined, true);
});
parser.on('text', (text) => {
    putText(utils.processText(text, flag));
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
// #endregion
function putText(txt) {
    if (options.stdout) {
        process_1.default.stdout.write(txt);
    }
    else {
        fw.write(txt);
    }
}
function putTag(name, attrs, closing = false) {
    const { levelMinus, tag } = utils.createTag({
        attrs,
        closing,
        lastParent,
        level,
        name
    });
    if (levelMinus) {
        level--;
    }
    if (options.stdout) {
        process_1.default.stdout.write(tag);
    }
    else {
        fw.write(tag);
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
    checker.on('instruction', (name, attrs) => {
        spinner_1.spinner.start();
    });
    checker.on('opentag', (name, attrs) => {
        tags++;
        if (tags % 5 === 0) {
            spinner_1.spinner.rotate();
        }
        if (name === 'groundspeak:cache') {
            totalCaches++;
        }
    });
    checker.on('finish', () => {
        spinner_1.spinner.stop();
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
//# sourceMappingURL=old.js.map
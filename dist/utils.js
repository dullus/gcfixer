"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clean_html_1 = __importDefault(require("clean-html"));
const he_1 = __importDefault(require("he"));
const unidecode_plus_1 = __importDefault(require("unidecode-plus"));
const html_to_text_1 = __importDefault(require("html-to-text"));
function unescape(txt) {
    let out = txt;
    out = out.replace(/&lt;/g, '<');
    out = out.replace(/&gt;/g, '>');
    out = out.replace(/&amp;deg;/g, '°');
    out = out.replace(/&amp;amp;/g, '#@AMP@#');
    out = out.replace(/& /g, '#@AMP@##');
    out = out.replace(/&amp; /g, '#@AMP@##');
    out = out.replace(/ ,,/g, ' "');
    out = out.replace(/„/g, '"');
    out = out.replace(/“/g, '"');
    return out;
}
exports.unescape = unescape;
function escape(txt) {
    let out = txt;
    out = out.replace(/&/g, '&amp;');
    out = out.replace(/#@AMP@##/g, '&amp; ');
    out = out.replace(/#@AMP@#/g, '&amp;');
    out = out.replace(/&amp;amp;/g, '&amp;');
    out = out.replace(/ ,,/g, '"');
    out = out.replace(/</g, '-=');
    out = out.replace(/>/g, '=-');
    out = out.replace(/&amp;lt;/g, '-=');
    out = out.replace(/&amp;gt;/g, '=-');
    return out;
}
exports.escape = escape;
function removeUrl(txt) {
    return txt.replace(/\(https?:\/\/(.*)\)/gi, '');
}
exports.removeUrl = removeUrl;
function processText(text, flag) {
    let out = text;
    if (flag.desc) {
        out = unescape(out);
        clean_html_1.default.clean(out, (html) => {
            out = html;
        });
        out = html_to_text_1.default.fromString(out, {
            decodeOptions: { strict: false },
            ignoreHref: true,
            ignoreImage: true,
            uppercaseHeadings: false
        });
        out = he_1.default.decode(out);
        out = unidecode_plus_1.default(out, { skipRanges: [[0xb0, 0xb0]] });
        out = escape(out);
    }
    if (flag.text) {
        out = unidecode_plus_1.default(out, { skipRanges: [[0xb0, 0xb0]] });
        out = escape(out);
    }
    if (flag.removeUrl) {
        out = removeUrl(out);
    }
    return out;
}
exports.processText = processText;
function createTag(options) {
    const howManyTabs = options.closing && options.name === options.lastParent ? 0 : options.level;
    let levelMinus = false;
    let singleTag = false;
    let tabs = '';
    let tag = '';
    for (let i = 0; i < howManyTabs; i++) {
        tabs = `${tabs}  `;
    }
    if (options.closing) {
        tag = options.name === options.lastParent ? '</' : `\n${tabs}  </`;
    }
    else {
        tag = `\n${tabs}<`;
    }
    tag = tag + options.name;
    if (options.attrs !== undefined) {
        Object.keys(options.attrs).forEach((attr) => {
            let val = options.attrs[attr];
            if (val.substr(-2) === ' /') {
                singleTag = true;
                val = val.substr(0, val.length - 2);
            }
            tag = `${tag} ${attr}="${val}"`;
        });
    }
    if (options.name.includes('/') || singleTag) {
        levelMinus = true;
    }
    tag = `${tag}${singleTag ? ' />' : '>'}`;
    return {
        levelMinus,
        tag
    };
}
exports.createTag = createTag;
//# sourceMappingURL=utils.js.map
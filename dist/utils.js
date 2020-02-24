"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const clean_html_1 = __importDefault(require("clean-html"));
const he_1 = __importDefault(require("he"));
const unidecode_plus_1 = __importDefault(require("unidecode-plus"));
const html_to_text_1 = __importDefault(require("html-to-text"));
const HTML_CLEAN = {
    'add-break-around-tags': ['b', 'i', 'strong', 'em'],
    'add-remove-attributes': ['style', 'class'],
    'add-remove-tags': ['img', 'picture', 'a'],
    'remove-comments': true,
    'remove-empty-tags': ['p', 'div']
};
// chars < and > outside of tags can screw Garmin html parser, so we replace them with
// visually similar from ASCII range. Possible are also unicode triangles &#9665; &#9655;
const FAKE_LT = '&#171;'; // «
const FAKE_GT = '&#187;'; // »
/**
 * Helps he.decode to process some oddities
 */
function unescape(txt) {
    let out = txt;
    out = out.replace(/&amp;lt;/g, '#@AMP@LT@#');
    out = out.replace(/&amp;gt;/g, '#@AMP@GT@#');
    out = out.replace(/&amp;/g, '&');
    out = out.replace(/ ,,/g, ' "');
    out = out.replace(/„/g, '"');
    out = out.replace(/“/g, '"');
    return out;
}
exports.unescape = unescape;
function escape(txt, escapeTags = false) {
    let out = txt;
    out = out.replace(/&/g, '&amp;');
    out = out.replace(/#@AMP@LT@#/g, FAKE_LT);
    out = out.replace(/#@AMP@GT@#/g, FAKE_GT);
    out = out.replace(/ ,,/g, '"');
    if (escapeTags) {
        out = out.replace(/</g, '&lt;');
        out = out.replace(/>/g, '&gt;');
        out = out.replace(/°/g, '&#176;');
    }
    return out;
}
exports.escape = escape;
function untag(txt) {
    let out = txt;
    out = out.replace(/</g, FAKE_LT);
    out = out.replace(/>/g, FAKE_GT);
    out = out.replace(/&amp;lt;/g, FAKE_LT);
    out = out.replace(/&amp;gt;/g, FAKE_GT);
    out = out.replace(/#@AMP@LT@#/g, FAKE_LT);
    out = out.replace(/#@AMP@GT@#/g, FAKE_GT);
    return out;
}
exports.untag = untag;
function removeUrl(txt) {
    return txt.replace(/\(https?:\/\/(.*)\)/gi, '');
}
exports.removeUrl = removeUrl;
function processText(text, flag) {
    let out = text;
    if (flag.desc) {
        // clean wrong html entities
        out = unescape(out);
        // replace html entities
        out = he_1.default.decode(out);
        // sanitize html
        clean_html_1.default.clean(out, HTML_CLEAN, (html) => {
            out = html;
        });
        // remove html if needed
        if (flag.stripHtml) {
            out = html_to_text_1.default.fromString(out, {
                decodeOptions: { strict: false },
                ignoreHref: true,
                ignoreImage: true,
                uppercaseHeadings: false
            });
        }
        // utf8 to ascii
        out = unidecode_plus_1.default(out, { skipRanges: [[0xb0, 0xb0]] });
        // escape
        out = escape(out, !flag.stripHtml);
        if (flag.stripHtml) {
            out = untag(out);
        }
    }
    if (flag.text) {
        out = unidecode_plus_1.default(out, { skipRanges: [[0xb0, 0xb0]] });
        out = escape(out);
        out = untag(out);
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
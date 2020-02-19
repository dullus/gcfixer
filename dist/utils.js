"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    return txt.replace(/\(https?:\/\/(.*)\)/g, '');
}
exports.removeUrl = removeUrl;
//# sourceMappingURL=utils.js.map
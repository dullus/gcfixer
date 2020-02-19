import * as I from './interfaces';
import cleaner from 'clean-html';
import he from 'he';
import unidecode from 'unidecode-plus';
import htmlToText from 'html-to-text';

export function unescape(txt: string): string {
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

export function escape(txt: string): string {
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

export function removeUrl(txt: string): string {
  return txt.replace(/\(https?:\/\/(.*)\)/gi, '');
}

export function processText(text: string, flag: I.Flag) {
  let out = text;

  if (flag.desc) {
    out = unescape(out);
    cleaner.clean(out, (html) => {
      out = html;
    });
    out = htmlToText.fromString(out, {
      decodeOptions: { strict: false },
      ignoreHref: true,
      ignoreImage: true,
      uppercaseHeadings: false
    });
    out = he.decode(out);
    out = unidecode(out, { skipRanges: [[0xb0, 0xb0]] });
    out = escape(out);
  }

  if (flag.text) {
    out = unidecode(out, { skipRanges: [[0xb0, 0xb0]] });
    out = escape(out);
  }

  if (flag.removeUrl) {
    out = removeUrl(out);
  }

  return out;
}

export function createTag(options: I.TagOptions) {
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
  } else {
    tag = `\n${tabs}<`;
  }

  tag = tag + options.name;

  if (options.attrs !== undefined) {
    Object.keys(options.attrs).forEach((attr) => {
      let val: string = options.attrs![attr];
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

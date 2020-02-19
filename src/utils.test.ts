/* tslint:disable:object-literal-sort-keys */
import * as utils from './utils';

describe('unescape', () => {
  it('gotta catch them all', () => {
    const data = '&lt;-&amp;deg;-&amp;amp;-& -&amp; - ,,-„-“-&gt;';
    const expected = '<-°-#@AMP@#-#@AMP@##-#@AMP@##- "-"-"->';
    const result = utils.unescape(data);
    expect(result).toEqual(expected);
  });
});

describe('escape', () => {
  it('gotta catch them all', () => {
    const data = '<&lt;-#@AMP@##-#@AMP@#-&amp;- ,,&gt;>';
    const expected = '-=-=-&amp; -&amp;-&amp;-"=-=-';
    const result = utils.escape(data);
    expect(result).toEqual(expected);
  });
});

describe('removeUrl', () => {
  it('http', () => {
    const data = 'some text (http://some.url/here) and text';
    const expected = 'some text  and text';
    const result = utils.removeUrl(data);
    expect(result).toEqual(expected);
  });

  it('https', () => {
    const data = 'some text (https://some.url) and text';
    const expected = 'some text  and text';
    const result = utils.removeUrl(data);
    expect(result).toEqual(expected);
  });
});

describe('processText', () => {
  it('desc', () => {
    const flag = { desc: true, text: false, removeUrl: false };
    const data = '&lt;p&gt; ľščťžýáí 40°  &lt;/p&gt; &lt;img src="foo.jpg" /&gt;';
    const expected = 'lsctzyai 40°';
    const result = utils.processText(data, flag);
    expect(result).toEqual(expected);
  });

  it('text', () => {
    const flag = { desc: false, text: true, removeUrl: false };
    const data = '&lt; ľščťžýáí 40° &gt;';
    const expected = '-= lsctzyai 40° =-';
    const result = utils.processText(data, flag);
    expect(result).toEqual(expected);
  });

  it('desc and url', () => {
    const flag = { desc: true, text: false, removeUrl: true };
    const data = '&lt;p&gt;ľščťžýáí 40&deg;&lt;/p&gt; &lt;a href=&quot;http://foo.com&quot;&gt;link&lt;/a&gt;';
    const expected = 'lsctzyai 40°\n\nlink';
    const result = utils.processText(data, flag);
    expect(result).toEqual(expected);
  });
});

describe('tag creating', () => {
  it('opening tag <single />', () => {
    const result = utils.createTag({
      attrs: {},
      closing: false,
      lastParent: 'groundspeak:travelbugs /',
      level: 3,
      name: 'groundspeak:travelbugs /'
    });
    const expected = '<groundspeak:travelbugs />';
    expect(result.levelMinus).toBeTruthy();
    expect(result.tag.trim()).toEqual(expected);
  });

  it('opening tag <single with="attr" />', () => {
    const result = utils.createTag({
      attrs: {
        minlat: '48.728433',
        minlon: '21.241983',
        maxlat: '48.728617',
        maxlon: '21.242033 /'
      },
      closing: false,
      lastParent: 'bounds',
      level: 1,
      name: 'bounds'
    });
    const expected = '<bounds minlat="48.728433" minlon="21.241983" maxlat="48.728617" maxlon="21.242033" />';
    expect(result.levelMinus).toBeTruthy();
    expect(result.tag.trim()).toEqual(expected);
  });

  it('opening tag <paired>', () => {
    const result = utils.createTag({
      attrs: {},
      closing: false,
      lastParent: 'keywords',
      level: 1,
      name: 'keywords'
    });
    const expected = '<keywords>';
    expect(result.levelMinus).toBeFalsy();
    expect(result.tag.trim()).toEqual(expected);
  });

  it('opening tag <paired with="attr">', () => {
    const result = utils.createTag({
      attrs: { id: '1234567' },
      closing: false,
      lastParent: 'groundspeak:owner',
      level: 3,
      name: 'groundspeak:owner'
    });
    const expected = '<groundspeak:owner id="1234567">';
    expect(result.levelMinus).toBeFalsy();
    expect(result.tag.trim()).toEqual(expected);
  });

  it('closing tag </paired>', () => {
    const result = utils.createTag({
      attrs: undefined,
      closing: true,
      lastParent: 'keywords',
      level: 0,
      name: 'keywords'
    });
    const expected = '</keywords>';
    expect(result.levelMinus).toBeFalsy();
    expect(result.tag.trim()).toEqual(expected);
  });

  it('closing tag </paired> diff parent', () => {
    const result = utils.createTag({
      attrs: undefined,
      closing: true,
      lastParent: 'groundspeak:attribute',
      level: 2,
      name: 'groundspeak:attributes'
    });
    const expected = '</groundspeak:attributes>';
    expect(result.levelMinus).toBeFalsy();
    expect(result.tag.trim()).toEqual(expected);
  });
});

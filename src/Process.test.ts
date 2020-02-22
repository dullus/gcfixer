import process from 'process';
import fs from 'fs';
import { Process } from './Process';
import { spinner } from './spinner';
// @ts-ignore
import { out as cachePlain } from '../test/mock/cache.plain';
import { out as cacheHtml } from '../test/mock/cache.html';
// @ts-ignore
import { out as pqPlain } from '../test/mock/pq.plain';
import { out as pqHtml } from '../test/mock/pq.html';

function normCRLF(data: string): string {
  return data.replace(/\r\n/g, '\n');
}

describe('Process', () => {
  const konzole: { [key: string]: jest.SpyInstance<Console> } = {};
  let spyBuffer: string[] = [];
  let mockStdout: jest.SpyInstance;
  let mockFS: jest.SpyInstance;

  beforeAll(() => {
    mockStdout = jest.spyOn(process.stdout, 'write').mockImplementation((txt: string | Uint8Array) => {
      spyBuffer.push(txt as string);
      return true;
    });

    // @ts-ignore
    mockFS = jest.spyOn(fs, 'createWriteStream').mockImplementation((path: any) => {
      return {
        close: () => {
          return;
        },
        write: (txt: string) => {
          spyBuffer.push(txt as string);
          return true;
        }
      };
    });

    konzole.log = jest.spyOn<Console, any>(global.console, 'log').mockImplementation();
    konzole.warn = jest.spyOn<Console, any>(global.console, 'warn').mockImplementation();
    konzole.error = jest.spyOn<Console, any>(global.console, 'error').mockImplementation((txt: any) => {
      spyBuffer.push(txt as string);
    });

    jest.spyOn(spinner, 'start').mockImplementation();
    jest.spyOn(spinner, 'stop').mockImplementation();
    jest.spyOn(spinner, 'rotate').mockImplementation();
  });

  beforeEach(() => {
    spyBuffer = [];
  });

  it('unknown file', (done) => {
    const proc = new Process('nonexistent.xml', { stdout: true, stripHtml: true });
    const expected = [`\u001b[31m⚠️  Error: ENOENT: no such file or directory, open 'nonexistent.xml'\u001b[39m`];
    proc.run().then(
      () => {
        throw new Error('Promise should not be resolved');
      },
      () => {
        expect(spyBuffer).toEqual(expected);
        done();
      }
    );
  });

  it('bad file', (done) => {
    const proc = new Process('test/mock/bad.gpx', { stdout: false, stripHtml: true });
    const expected = ['\u001b[31m⚠️  Error: Sorry, no caches found.\u001b[39m'];
    proc.run().then(
      () => {
        throw new Error('Promise should not be resolved');
      },
      () => {
        expect(spyBuffer).toEqual(expected);
        done();
      }
    );
  });

  it('no caches file', (done) => {
    const proc = new Process('test/mock/nocache.gpx', { stdout: false, stripHtml: true });
    const expected = ['\u001b[31m⚠️  Error: Sorry, no caches found.\u001b[39m'];
    proc.run().then(
      () => {
        throw new Error('Promise should not be resolved');
      },
      () => {
        expect(spyBuffer).toEqual(expected);
        done();
      }
    );
  });

  it('single cache file, stdout no html', (done) => {
    const proc = new Process('test/mock/cache.gpx', { stdout: true, stripHtml: true });
    proc.run().then(
      () => {
        const data = normCRLF(spyBuffer.join(''));
        expect(data).toEqual(cachePlain);
        done();
      },
      () => {
        throw new Error('Promise should not be rejected');
      }
    );
  });

  it('single cache file, stdout with html', (done) => {
    const proc = new Process('test/mock/cache.gpx', { stdout: true, stripHtml: false });
    proc.run().then(
      () => {
        const data = normCRLF(spyBuffer.join(''));
        expect(data).toEqual(cacheHtml);
        done();
      },
      () => {
        throw new Error('Promise should not be rejected');
      }
    );
  });


  it('multiple caches - stdout - plain', (done) => {
    const proc = new Process('test/mock/pq.gpx', { stdout: true, stripHtml: true });
    proc.run().then(
      () => {
        const data = normCRLF(spyBuffer.join(''));
        expect(data).toEqual(pqPlain);
        done();
      },
      () => {
        throw new Error('Promise should not be rejected');
      }
    );
  });

  it('multiple caches - file - plain', (done) => {
    const proc = new Process('test/mock/pq.gpx', { stdout: false, stripHtml: true });
    proc.run().then(
      () => {
        const data = normCRLF(spyBuffer.join(''));
        expect(data).toEqual(pqPlain);
        done();
      },
      () => {
        throw new Error('Promise should not be rejected');
      }
    );
  });

  it('multiple caches - stdout - html', (done) => {
    const proc = new Process('test/mock/pq.gpx', { stdout: true, stripHtml: false });
    proc.run().then(
      () => {
        const data = normCRLF(spyBuffer.join(''));
        expect(data).toEqual(pqHtml);
        done();
      },
      () => {
        throw new Error('Promise should not be rejected');
      }
    );
  });

  it('multiple caches - file - html', (done) => {
    const proc = new Process('test/mock/pq.gpx', { stdout: false, stripHtml: false });
    proc.run().then(
      () => {
        const data = normCRLF(spyBuffer.join(''));
        expect(data).toEqual(pqHtml);
        done();
      },
      () => {
        throw new Error('Promise should not be rejected');
      }
    );
  });

  afterAll(() => {
    jest.clearAllMocks();
  });
});

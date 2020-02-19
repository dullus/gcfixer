import process from 'process';
import fs from 'fs';
import { Process } from './Process';
import { spinner } from './spinner';
// @ts-ignore
import { out as cacheOut } from '../test/mock/cache.out';
// @ts-ignore
import { out as pqOut } from '../test/mock/pq.out';

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
    const proc = new Process('nonexistent.xml', true);
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
    const proc = new Process('test/mock/bad.gpx', false);
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
    const proc = new Process('test/mock/nocache.gpx', false);
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

  it('single cache file, stdout', (done) => {
    const proc = new Process('test/mock/cache.gpx', true);
    proc.run().then(
      () => {
        const data = normCRLF(spyBuffer.join(''));
        expect(data).toEqual(cacheOut);
        done();
      },
      () => {
        throw new Error('Promise should not be rejected');
      }
    );
  });

  it('multiple caches file, stdout', (done) => {
    const proc = new Process('test/mock/pq.gpx', true);
    proc.run().then(
      () => {
        const data = normCRLF(spyBuffer.join(''));
        expect(data).toEqual(pqOut);
        done();
      },
      () => {
        throw new Error('Promise should not be rejected');
      }
    );
  });

  it('multiple caches file', (done) => {
    const proc = new Process('test/mock/pq.gpx');
    proc.run().then(
      () => {
        const data = normCRLF(spyBuffer.join(''));
        expect(data).toEqual(pqOut);
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

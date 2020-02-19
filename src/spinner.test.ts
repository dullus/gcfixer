import process from 'process';
import rdl from 'readline';
import { spinner } from './spinner';

describe('spinner', () => {
  let spyBuffer = '';
  let spyCursor = -1;
  let mockStdout: jest.SpyInstance;
  let mockCursorTo: jest.SpyInstance;

  beforeAll(() => {
    mockStdout = jest.spyOn(process.stdout, 'write').mockImplementation((txt: string | Uint8Array) => {
      spyBuffer = txt as string;
      return true;
    });

    mockCursorTo = jest.spyOn(rdl, 'cursorTo').mockImplementation((stream: any, x: number, y?: any, callback?: any) => {
      spyCursor = x;
      return true;
    });
  });

  it('start', () => {
    spinner.start();
    expect(spyBuffer).toEqual('\x1B[?25l');
  });

  it('rotate', () => {
    const shapes = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    let pos = 0;
    for (let i = 0; i < 11; i++) {
      spinner.rotate();
      expect(spyBuffer).toEqual(shapes[i]);
      expect(spyCursor).toBe(0);
      pos++;
      if (pos > shapes.length) {
        pos = 0;
      }
    }
  });

  it('stop', () => {
    spinner.stop();
    expect(spyBuffer).toEqual('\x1B[?25h');
  });

  afterAll(() => {
    jest.clearAllMocks();
  });
});

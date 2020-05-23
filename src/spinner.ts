import process from 'process';
import rdl from 'readline';

class Spinner {
  private pos: number;
  private shapes: string[];

  constructor(shapes?: string[]) {
    this.shapes = shapes || ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
    this.pos = 0;
  }

  public rotate(): void {
    rdl.cursorTo(process.stdout, 0);
    process.stdout.write(this.shapes[this.pos]);
    this.pos++;
    if (this.pos >= this.shapes.length) {
      this.pos = 0;
    }
  }

  public start(): void {
    this.pos = 0;
    // Show TTY cursor
    process.stdout.write('\x1B[?25l');
  }

  public stop(): void {
    rdl.cursorTo(process.stdout, 0);
    // Remove TTY cursor
    process.stdout.write('\x1B[?25h');
  }
}

export const spinner = new Spinner();

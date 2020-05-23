"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const process_1 = __importDefault(require("process"));
const readline_1 = __importDefault(require("readline"));
class Spinner {
    constructor(shapes) {
        this.shapes = shapes || ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
        this.pos = 0;
    }
    rotate() {
        readline_1.default.cursorTo(process_1.default.stdout, 0);
        process_1.default.stdout.write(this.shapes[this.pos]);
        this.pos++;
        if (this.pos >= this.shapes.length) {
            this.pos = 0;
        }
    }
    start() {
        this.pos = 0;
        // Show TTY cursor
        process_1.default.stdout.write('\x1B[?25l');
    }
    stop() {
        readline_1.default.cursorTo(process_1.default.stdout, 0);
        // Remove TTY cursor
        process_1.default.stdout.write('\x1B[?25h');
    }
}
exports.spinner = new Spinner();
//# sourceMappingURL=spinner.js.map
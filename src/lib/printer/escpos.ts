/**
 * ESC/POS Command Generation Utility
 * Supports standard thermal receipt printers (Epson, Xprinter, Bixolon, Star, etc.)
 * Configurable for 58mm (~32 columns) and 80mm (~48 columns).
 */

export const ESC = "\x1B";
export const GS = "\x1D";

export const COMMANDS = {
  INIT: `${ESC}@`,
  ALIGN_LEFT: `${ESC}a\x00`,
  ALIGN_CENTER: `${ESC}a\x01`,
  ALIGN_RIGHT: `${ESC}a\x02`,
  BOLD_ON: `${ESC}E\x01`,
  BOLD_OFF: `${ESC}E\x00`,
  DOUBLE_HEIGHT_ON: `${ESC}!\x10`,
  DOUBLE_WIDTH_ON: `${ESC}!\x20`,
  DOUBLE_SIZE_ON: `${ESC}!\x30`,
  NORMAL_SIZE: `${ESC}!\x00`,
  FEED_LINES: (n: number) => `${ESC}d${String.fromCharCode(n)}`,
  PAPER_CUT_FULL: `${GS}V\x00`,
  PAPER_CUT_PARTIAL: `${GS}V\x01`,
  PAPER_CUT_FEED: `${GS}VA\x03`, // Feed 3 lines then partial cut
};

export interface EscPosBuilderOptions {
  widthMm?: number; // 58 or 80
}

export class EscPosBuilder {
  private buffer: string = "";
  private readonly maxChars: number;

  constructor(options?: EscPosBuilderOptions) {
    const width = options?.widthMm ?? 80;
    this.maxChars = width <= 58 ? 32 : 48;
    this.buffer += COMMANDS.INIT;
  }

  alignCenter(): this {
    this.buffer += COMMANDS.ALIGN_CENTER;
    return this;
  }

  alignLeft(): this {
    this.buffer += COMMANDS.ALIGN_LEFT;
    return this;
  }

  alignRight(): this {
    this.buffer += COMMANDS.ALIGN_RIGHT;
    return this;
  }

  bold(enable: boolean = true): this {
    this.buffer += enable ? COMMANDS.BOLD_ON : COMMANDS.BOLD_OFF;
    return this;
  }

  doubleSize(): this {
    this.buffer += COMMANDS.DOUBLE_SIZE_ON;
    return this;
  }

  normalSize(): this {
    this.buffer += COMMANDS.NORMAL_SIZE;
    return this;
  }

  text(str: string): this {
    this.buffer += str;
    return this;
  }

  line(str: string = ""): this {
    this.buffer += str + "\n";
    return this;
  }

  separator(char: string = "-"): this {
    this.buffer += char.repeat(this.maxChars) + "\n";
    return this;
  }

  doubleSeparator(): this {
    return this.separator("=");
  }

  twoColumnRow(left: string, right: string): this {
    const spaceLeft = this.maxChars - right.length;
    if (spaceLeft <= 0) {
      this.buffer += left + " " + right + "\n";
      return this;
    }
    const truncatedLeft = left.slice(0, Math.max(0, spaceLeft - 1));
    const pad = " ".repeat(Math.max(1, this.maxChars - truncatedLeft.length - right.length));
    this.buffer += truncatedLeft + pad + right + "\n";
    return this;
  }

  feed(lines: number = 2): this {
    this.buffer += COMMANDS.FEED_LINES(lines);
    return this;
  }

  cut(): this {
    this.buffer += COMMANDS.PAPER_CUT_FEED;
    return this;
  }

  build(): string {
    return this.buffer;
  }

  buildBytes(): Uint8Array {
    const raw = this.build();
    const bytes = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) {
      bytes[i] = raw.charCodeAt(i) & 0xff;
    }
    return bytes;
  }
}

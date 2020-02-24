export interface Attrs {
  [key: string]: string;
}

export interface ParserStream extends NodeJS.EventEmitter, NodeJS.WritableStream {}

export interface Flag {
  desc: boolean;
  removeUrl: boolean;
  stripHtml: boolean;
  text: boolean;
}

export interface TagOptions {
  attrs: Attrs | undefined;
  closing: boolean;
  lastParent: string;
  level: number;
  name: string;
}

export interface Params {
  stdout: boolean;
  stripHtml: boolean;
}

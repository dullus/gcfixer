declare module 'clean-html' {
  function clean(out: string, callback: (html: string) => void): void;
  function clean(out: string, params: { [key: string]: any }, callback: (html: string) => void): void;
}

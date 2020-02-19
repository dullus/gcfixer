declare module 'clean-html' {
  function clean(out: string, callback: (html: string) => void): void;
}

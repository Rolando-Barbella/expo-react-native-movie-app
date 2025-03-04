global.console = {
  log: (...args) => globalThis.console.log(...args),
  warn: (...args) => globalThis.console.warn(...args),
  error: (...args) => globalThis.console.error(...args),
  info: (...args) => globalThis.console.info(...args),
  debug: (...args) => globalThis.console.debug(...args),
};
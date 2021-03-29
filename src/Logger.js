class Logger {
  constructor(service, logLevel = 'DEBUG') {
    this.service = service;
    this.LOG_LEVEL = logLevel;
  }

  log(...args) {
    if (this.LOG_LEVEL === 'DEBUG') {
      console.log(this.getTime(), `${this.service}:`, ...args);
    }
  }

  getTime() {
    return new Date().toISOString().slice(11, 22);
  }
}

export default Logger;

class Logger {
  constructor(service) {
    this.service = service;
  }

  log(...args) {
    console.log(this.getTime(), `${this.service}:`, ...args);
  }

  getTime() {
    return new Date().toISOString().slice(11, 22);
  }
}

export default Logger;

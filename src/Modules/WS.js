export default class WS {

  constructor({url, timeout} = {}) {
    this.url = url;
    this.timeout = timeout || 5000;

    this.websocket = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.websocket = new WebSocket(this.url);
      this.websocket.onopen = resolve;
      this.websocket.onclose = e => {
        reject(e);
        this.reconnect(e);
      };
    });
  }

  send(message, {answer, key} = {}) {
    return new Promise((resolve, reject) => {
      if (typeof message === 'object') {
        message = JSON.stringify(message);
      }
      this.websocket.send(message);
      if (answer) {
        return this.use(resolve, {answer, key});
      }
      resolve();
    })
  }

  use(f, {answer, key, disposable = false} = {}) {
    let func = ({data}) => {
      try {
        data = JSON.parse(data);
      } catch {
        //
      }

      if (typeof data === answer) {
        if (answer === 'object') {
          if (typeof key === 'string' && data[key]) {
            if (disposable) {
              this.unuse(func);
            }
            return f(data);
          }
          if (Array.isArray(key) && Object.keys(data).some(el => key.includes(el))) {
            if (disposable) {
              this.unuse(func);
            }
            return f(data);
          }
        }
      }
    };
    this.websocket.addEventListener('message', func);
    return func;
  }

  unuse(func) {
    this.websocket.removeEventListener('message', func);
  }

  reconnect(e) {
    this.fini();
    setTimeout(() => {
      this.init();
    }, typeof this.timeout === 'function'
      ? this.timeout()
      : this.timeout);
  }

  fini() {
    this.websocket.close();
    this.websocket = null;
  }

}

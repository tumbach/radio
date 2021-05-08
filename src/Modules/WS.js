import EventEmitter from 'eventemitter3';

export default class WS extends EventEmitter {

  #websocket = null;
  #connectionTries = 0;

  constructor({url, timeout} = {}) {
    super();

    this.url = url;
    this.timeout = timeout || 5000;

    this.#websocket = null;
  }

  async init() {
    return new Promise((resolve, reject) => {
      this.emit('init');
      this.#websocket = new WebSocket(this.url);
      this.#websocket.onopen = () => {
        this.#connectionTries = 0;
        resolve();
        this.emit('open');
      };
      this.#websocket.onclose = e => {
        reject(e);
        this.emit('close', e);
        if (e.code !== 1006) {
          return;
        }
        this.reconnect(e);
      };
      this.#websocket.addEventListener('message', ({data}) => {
        try {
          data = JSON.parse(data);
        } catch {
          //
        }
        this.emit('message', data);
      });
    });
  }

  send(message, {answer, key} = {}) {
    return new Promise((resolve, reject) => {
      if (typeof message === 'object') {
        message = JSON.stringify(message);
      }
      this.#websocket.send(message);
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
    this.#websocket.addEventListener('message', func);
    return func;
  }

  unuse(func) {
    this.#websocket.removeEventListener('message', func);
  }

  reconnect() {
    this.fini();

    let timeout = typeof this.timeout === 'function'
      ? this.timeout(++this.#connectionTries)
      : this.timeout;
    this.emit('reconnect', timeout, this.#connectionTries);

    setTimeout(() => this.init(), timeout);
  }

  fini() {
    this.#websocket.close();
    this.#websocket = null;
  }

}

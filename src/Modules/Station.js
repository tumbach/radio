export default class Station {

  constructor({id, url, name, sources} = {}) {
    this.id = id;
    this.url = url;
    this.name = name;
    this.sources = sources || [];

    this.DOM = null;
    this.Song = null;
    this.minuteTimer = null; // минута... пошла!
  }

  getSong() {
    if (!this.Song?.artist && !this.Song?.title) {
      return '';
    }
    if (this.Song.artist && this.Song.title) {
      return `${this.Song.artist} – ${this.Song.title}`;
    }
    if (!this.Song.title) {
      return this.Song.artist;
    }
    return this.Song.title;
  }

  getTime(now = Math.floor(+new Date()/1000)) {
    if (!this.Song) {
      return 'no connection';
    }
    if (!this.Song.duration) {
      if (!this.Song.date) {
        return '--:--';
      }
      if (now - this.Song.date < 0) {
        now = this.Song.now;
      }
      let m = Math.floor((now - this.Song.date) / 60);
      return m
        ? m + ' мин назад'
        : 'менее минуты назад';
    }
  }

  getLastUpdate(now = Math.floor(+new Date()/1000)) {
    if (!this.Song) {
      return 0;
    }
    return Math.floor(now - this.Song.date);
  }

  setSong(song = {}) {
    this.Song = {
      artist: song.artist || '',
      title: song.title || '',
      date: song.date,
      now: song.now
    };
    this.updateDOM();
  }

  getContentTypes() {
    let types = this.sources.map(src => src.type);
    return [...new Set(types)];
  }

  setDOM(DOM) {
    this.DOM = DOM;
    this.updateDOM();
  }

  updateDOM() {
    clearInterval(this.minuteTimer);
    clearTimeout(this.minuteTimer);

    this.DOM.innerHTML = '';

    let name = document.createElement('div');
    name.className = 'name';
    name.innerText = this.name;

    let title = document.createElement('div');
    title.className = 'title';
    title.innerText = this.getSong();

    let time = document.createElement('div');
    time.className = 'time';
    this.updateMinuteTimer(time);

    let lastUpdate = this.getLastUpdate();
    if (lastUpdate !== 0) {  // > 0, is already on air, wait for xx:00
      let ms = (60 - (lastUpdate % 60)) * 1e3;
      this.minuteTimer = setTimeout(() => {
        this.updateMinuteTimer(time);
        this.setMinuteTimer(time);
      }, ms);
    } else { // is xx:00, set interval
      this.setMinuteTimer(time);
    }

    this.DOM.append(name, title, time);
  }

  setMinuteTimer(DOMElement) {
    this.minuteTimer = setInterval(() => {
      this.updateMinuteTimer(DOMElement);
    }, 60 * 1e3);
  }

  updateMinuteTimer(DOMElement) {
    DOMElement.innerText = this.getTime();
  }
}

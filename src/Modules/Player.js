export default class Player {

  #currentStation = null;
  #durationTimer = null;
  #audio = null;
  
  volume = globalThis.localStorage.getItem('volume') ?? 1;

  constructor({ StationList, DOM, PlayerDOM } = {}) {
    this.StationList = StationList;
    this.PlayerDOM = PlayerDOM;
    this.DOM = DOM;
  }

  initPlayer() {
    window.addEventListener('unload', () => {
      this.pause();
    });
  }

  chooseSource(type) {
    let station = this.getStation(this.#currentStation);
    let sources = station.sources;
    if (navigator.userAgent.includes('Chrom')) {
      console.info('Due to Chrome bug, we are forced to disable OPUS format');
      type = station.getContentTypes().filter(src => src !== 'OPUS')[0];
      this.PlayerDOM.typeSelect.value = type;
    }
    return sources.filter(src => src.type === type)[0];
  }

  play() {
    if (this.#audio && this.#audio.src !== null) {
      this.pause();
    }
    let station = this.getStation(this.#currentStation);
    let source = this.chooseSource(this.PlayerDOM.typeSelect.value);
    if (!source) {
      return;
    }
    this.#audio = new Audio();
    this.#audio.src = source.url;
    this.#audio.crossOrigin = "anonymous";
    this.#audio.volume = this.volume;
    this.#audio.addEventListener("canplay", this.#audio.play.bind(this.#audio));

    if (station.Song && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = "playing";
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.Song.title,
        artist: station.Song.artist
      });
    }
  }

  pause() {
    if (!this.#audio) {
      return;
    }
    this.#audio.pause();
    this.#audio.currentTime = 0;
    this.#audio.src = "";
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = "paused";
    }
    this.#audio = null;
  }

  restart() {
    this.pause();
    this.play();
  }

  isPlaying() {
    return this.#audio && !this.#audio.paused;
  }

  changeVolume(value = 1) {
    if (value < 0) {
      value = 0;
    }
    if (value > 100) {
      value = 1;
    }
    if (value > 1 && value <= 100) {
      value /= 100;
    }
    if (this.#audio) {
      this.#audio.volume = value;
    }
    this.volume = value;
    globalThis.localStorage.setItem('volume', value);
  }

  initStationList() {
    for (let Station of this.StationList) {
      let entry = document.createElement('div');
      entry.classList.add('entry', 'clickable');
      entry.id = Station.id;
      entry.addEventListener('click', e => {
        if (!getSelection().isCollapsed) return;
        if (this.#currentStation === e.currentTarget.id) {
          return e.preventDefault();
        }
        let station = this.getStation(e.currentTarget.id);
        this.setStation(station);
        this.#fillSongDOM(station);
        if (this.isPlaying()) {
          this.restart();
        }
        e.preventDefault();
      }, true);

      Station.setDOM(entry);
      this.PlayerDOM.stationList.appendChild(entry);
    }
  }

  getStation(id) {
    let station = this.StationList.filter(st => st.id === id)[0];
    if (!station) {
      throw new Error(`No station with id "${id}"`);
    }
    return station;
  }

  getStations() {
    return this.StationList.map(st => st.id);
  }

  setStation(Station) {
    if (typeof Station === 'string') {
      try {
        Station = this.getStation(Station);
      } catch (e) {
        // if currentStation is excluded from list, reset it to defaults
        Station = this.getStation(this.StationList[0].id);
      }
    }
    for (let { DOM } of this.StationList) {
      DOM.classList.remove("selected");
    }

    this.#currentStation = Station.id;
    globalThis.localStorage.setItem('station', Station.id);
    this.DOM.setStationName(Station.name);
    Station.DOM.classList.add('selected');

    let types = Station.getContentTypes();
    this.#fillTypeDOM(types);
  }

  updateStationSong(Station) {
    if (this.#currentStation === Station.id) {
      this.#fillSongDOM(Station);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: Station.Song.title,
          artist: Station.Song.artist
        });
      }
    }
  }


  #fillSongDOM(Station) {
    let { Song, name } = Station;
    if (!Song) {
      Song = {
        artist: '<нет данных>',
        title: '<нет данных>',
        date: +new Date()/1000
      };
    }
    let { artist, title, date } = Song;
    this.DOM.setStationName(name);
    this.DOM.setArtist(artist);
    this.DOM.setTitle(title);
    this.#setSongTimer(date);
  }

  #fillTypeDOM(types) {
    let parent = this.PlayerDOM.typeSelect;
    parent.innerHTML = '';
    let optgroup = document.createElement('optgroup');
    optgroup.label = 'Stream type';

    for (let type of types) {
      let option = document.createElement('option');
      option.className = 'name';
      option.innerText = type;
      optgroup.appendChild(option);
    }
    parent.appendChild(optgroup);
  }

  #setSongTimer(date) {
    clearInterval(this.#durationTimer);
    this.DOM.setDuration(date);
    this.#durationTimer = setInterval(() => this.DOM.setDuration(date), 1e3);
  }

}

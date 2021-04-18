export default class Player {

  constructor({ StationList, PlayerDOM } = {}) {
    this.StationList = StationList;
    this.PlayerDOM = PlayerDOM;

    this.currentStation = null;
    this.durationTimer = null;
    this.audio = null;
    this.volume = 1;
  }

  initPlayer() {
    this.PlayerDOM.button.classList.add('clickable', 'play');
    this.PlayerDOM.button.addEventListener('click', () => this.clickButton());

    this.PlayerDOM.volume.addEventListener('input', this.changeVolume.bind(this));
    this.PlayerDOM.volume.addEventListener('wheel', e => {
      if (navigator.userAgent.includes('Firefox')) {
        return this.PlayerDOM.volume.focus();
      }
      let step = 5 * Math.sign(-e.deltaY);
      this.PlayerDOM.volume.value = +this.PlayerDOM.volume.value + step;
      this.changeVolume(e);
    });
    this.volume = this.PlayerDOM.volume.value / 100;

    this.PlayerDOM.typeSelect.addEventListener('change', e  => {
      this.chooseSource(e.target.value);
      if (this.isPlaying()) {
        this.restart();
      }
    });

    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', this.clickButton.bind(this, true));
      navigator.mediaSession.setActionHandler('pause', this.clickButton.bind(this, false));
      navigator.mediaSession.setActionHandler('stop', this.clickButton.bind(this, false));
    }

    window.addEventListener('unload', () => {
      this.pause();
    });
  }

  clickButton(play) {
    play = play || this.isPlaying();
    this.PlayerDOM.button.classList.toggle('play', play);
    this.PlayerDOM.button.classList.toggle('pause', !play);
    return play
      ? this.pause()
      : this.play();
  }

  chooseSource(type) {
    let station = this.getStation(this.currentStation);
    let sources = station.sources;
    if (navigator.userAgent.includes('Chrom')) {
      console.info('Due to Chrome bug, we are forced to disable OPUS format');
      type = station.getContentTypes().filter(src => src !== 'OPUS')[0];
      this.PlayerDOM.typeSelect.value = type;
    }
    return sources.filter(src => src.type === type)[0];
  }

  play() {
    if (this.audio && this.audio.src !== null) {
      this.pause();
    }
    let station = this.getStation(this.currentStation);
    let source = this.chooseSource(this.PlayerDOM.typeSelect.value);
    if (!source) {
      return;
    }
    this.audio = new Audio();
    this.audio.src = source.url;
    this.audio.crossOrigin = "anonymous";
    this.audio.volume = this.volume;
    this.audio.addEventListener("canplay", this.audio.play.bind(this.audio));

    if (station.Song && 'mediaSession' in navigator) {
      navigator.mediaSession.playbackState = "playing";
      navigator.mediaSession.metadata = new MediaMetadata({
        title: station.Song.title,
        artist: station.Song.artist
      });
    }
  }

  pause() {
    if (!this.audio) {
      return;
    }
    this.audio.pause();
    this.audio.currentTime = 0;
    this.audio.src = "";
    navigator.mediaSession.playbackState = "paused";
    this.audio = null;
  }

  restart() {
    this.pause();
    this.play();
  }

  isPlaying() {
    return this.audio && !this.audio.paused;
  }

  changeVolume(e) {
    let { value } = e.target;
    value /= 100;
    if (this.audio) {
      this.audio.volume = value;
    }
    this.volume = value;
  }

  initStationList() {
    for (let Station of this.StationList) {
      let entry = document.createElement('div');
      entry.classList.add('entry', 'clickable');
      entry.id = Station.id;
      entry.addEventListener('click', e => {
        if (this.currentStation === e.currentTarget.id) {
          return e.preventDefault();
        }
        this.setStation(this.getStation(e.currentTarget.id));
        this._fillSongDOM();
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
    return this.StationList.filter(st => st.id === id)[0];
  }

  getStations() {
    return this.StationList.map(st => st.id);
  }

  setStation(Station) {
    for (let { DOM } of this.StationList) {
      DOM.classList.remove("selected");
    }

    this.currentStation = Station.id;
    this.PlayerDOM.station.innerText = Station.name;
    Station.DOM.classList.add('selected');

    let types = Station.getContentTypes();
    this._fillTypeDOM(types);
  }

  updateStationSong(Station) {
    if (this.currentStation === Station.id) {
      this._fillSongDOM(Station);
      if ('mediaSession' in navigator) {
        navigator.mediaSession.metadata = new MediaMetadata({
          title: Station.Song.title,
          artist: Station.Song.artist
        });
      }
    }
  }


  _fillSongDOM(Station) {
    if (!Station) {
      Station = this.getStation(this.currentStation);
    }
    let { Song } = Station;
    if (!Song) {
      Song = {
        artist: '<нет данных>',
        title: '<нет данных>',
        date: +new Date()/1000
      };
    }
    let { artist, title, date } = Song;
    this.PlayerDOM.artist.innerText = artist;
    this.PlayerDOM.title.innerText = title;
    this._setSongTimer(date);
  }

  _fillTypeDOM(types) {
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

  _setSongTimer(date) {
    clearInterval(this.durationTimer);
    if (!date) {
      return this.PlayerDOM.time.innerText = '--:--';
    }
    this._setDuration(date);
    this.durationTimer = setInterval(() => this._setDuration(date), 1e3);
  }

  _setDuration(date, now = +new Date()/1000) {
    if (date > now) {
      now = date;
    }
    let m = '' + Math.floor((now - date) / 60);
    let s = '' + Math.floor((now - date) % 60);
    this.PlayerDOM.time.innerText =  m.padStart(2, '0') + ':' + s.padStart(2, '0');
  }

}

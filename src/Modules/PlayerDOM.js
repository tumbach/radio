export default class PlayerDOM {

  #dom = null;
  #inited = false;

  constructor(dom) {
    this.#dom = dom;
  }
  
  init(Player) {
    if (this.#inited) {
      return;
    }
    this.#setListeners(Player);

    this.setTheme(null);

    this.#dom.foldButton.classList.add('clickable');
    this.#dom.button.classList.add('clickable', 'play');
    this.#dom.volume.value = Player.volume * 100;
  }

  //
  // getters
  //

  getDOM() {
    return this.#dom;
  }

  //
  // setters
  //

  #setListeners(Player) {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.setActionHandler('play', () => this.clickButton(true));
      //navigator.mediaSession.setActionHandler('pause', () => this.clickButton(false));
      navigator.mediaSession.setActionHandler('stop', () => this.clickButton(false));
    }
    this.#dom.button.addEventListener('click', () => this.clickButton(null, Player));
    this.#dom.volume.addEventListener('input', e => Player.changeVolume(+e.currentTarget.value));
    this.#dom.volume.addEventListener('wheel', e => {
      if (navigator.userAgent.includes('Firefox')) {
        return e.currentTarget.focus();
      }
      let step = 5 * Math.sign(-e.deltaY);
      let volume = +e.currentTarget.value;
      e.currentTarget.value = volume + step;
      Player.changeVolume(volume);
    });

    this.#dom.foldButton.addEventListener('click', () => this.foldStationList());
    this.#dom.typeSelect.addEventListener('change', e  => this.setSource(e, Player));
    this.#dom.themeSelect.addEventListener('change', e => this.setTheme(e.currentTarget.value));
  }

  setArtist(artist) {
    this.#dom.artist.innerText = artist;
  }

  setTitle(title) {
    this.#dom.title.innerText = title;
  }

  setStationName(stationName) {
    this.#dom.station.innerText = stationName;
  }

  setDuration(date, now = +new Date()/1000) {
    if (!date) {
      return this.#dom.time.innerText = '--:--';
    }
    if (date > now) {
      now = date;
    }
    let m = '' + Math.floor((now - date) / 60);
    let s = '' + Math.floor((now - date) % 60);
    this.#dom.time.innerText =  m.padStart(2, '0') + ':' + s.padStart(2, '0');
  }

  setVolume() {

  }

  incrVolume() {

  }

  notifyAboutWSInit() {
    this.setArtist('Подключение...');
    this.setTitle('');
  }

  notifyAboutWSSend() {
    this.setArtist('Запрашиваем список треков...');
    this.setTitle('');
  }

  notifyAboutWSReconnect(timeout, tries) {
    this.setArtist(`Переподключение через ${Math.floor(timeout / 1000)} с... (попытка ${tries})`);
    this.setTitle('');
  }

  //
  // listeners
  //

  foldStationList() {
    let folded = this.#dom.stationList.classList.toggle('folded');
    this.#dom.foldButton.innerText = folded ? 'Раскрыть' : 'Свернуть';
  }

  setTheme(theme) {
    theme ??= globalThis.localStorage.getItem('theme') ?? this.#dom.themeSelect.value;
    this.#dom.colorCss.href = `assets/colors/${theme}.css`;
    this.#dom.themeSelect.value = theme;
    globalThis.localStorage.setItem('theme', theme);
  }

  setSource(e, Player) {
    Player.chooseSource(e.target.value);
    if (Player.isPlaying()) {
      Player.restart();
    }
  }

  clickButton(isPlaying, Player) {
    isPlaying = isPlaying ?? Player.isPlaying();
    this.#dom.button.classList.toggle('play', isPlaying);
    this.#dom.button.classList.toggle('pause', !isPlaying);
    return isPlaying
      ? Player.pause()
      : Player.play();
  }

};

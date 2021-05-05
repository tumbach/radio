export default class PlayerDOM {

  #dom = {
    // head
    colorCss: document.querySelector('#colorCss'),

    // player
    button: document.querySelector('#hex-button'),
    station: document.querySelector('.player .description .title'),
    artist: document.querySelector('.player .wrapper .artist'),
    title: document.querySelector('.player .wrapper .title'),
    time: document.querySelector('.player .description .time'),
    volume: document.querySelector('.player #volume'),

    // stations
    stationList: document.querySelector('.stationList'),

    // footer
    foldButton: document.querySelector('.fold'),
    typeSelect: document.querySelector('#typeSelect'),
    themeSelect: document.querySelector('#themeSelect'),
  };
  #inited = false;

  init() {
    if (this.#inited) {
      return;
    }
    this.#setListeners();

    this.setTheme(null);

    this.#dom.foldButton.classList.add('clickable');
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

  #setListeners() {
    this.#dom.themeSelect.addEventListener('change', e => this.setTheme(e.currentTarget.value));
    this.#dom.foldButton.addEventListener('click', () => this.foldStationList());
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

  setArtist(artist) {
    this.#dom.artist.innerText = artist;
  }

  setTitle(title) {
    this.#dom.title.innerText = title;
  }

  setStationName(stationName) {
    this.#dom.station.innerText = stationName;
  }

};

if (process.env.NODE_ENV === 'development') {
  require('./index.html')
}

import './index.css';
import './Partials/progress.css';
import './Partials/input.css';
import './Styles/modern.css';

import WS from  './Modules/WS';
import Player from './Modules/Player';
import Station from './Modules/Station';
import PlayerDOM from './Modules/PlayerDOM';

(async () => {
  let DOM = new PlayerDOM({
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
  });

  try {
    let stations = await (await fetch('./assets/stations.json')).json();
    const StationList = stations.map(station => new Station(station));

    let player = new Player({
      DOM,
      PlayerDOM: DOM.getDOM(),
      StationList
    });
    DOM.init(player);

    player.initPlayer();
    player.initStationList();
    player.setStation(globalThis.localStorage.getItem('station') ?? StationList[0]);

    let ws = new WS({
      url: 'wss://titleturtle.tumba.ch/ws/',
      timeout: i => Math.min(i * 5e3, 30e3)
    });

    ws.on('init', () => DOM.notifyAboutWSInit());
    ws.on('open', () => requestSongs());
    ws.on('reconnect', (timeout, tries) => DOM.notifyAboutWSReconnect(timeout, tries));
    await ws.init();

    async function requestSongs() {
      DOM.notifyAboutWSSend();
      for await (let station of player.getStations()) {
        await ws.send('SUB ' + station);
      }
      ws.use(data => {
        if (data) {
          for (let stationId of Object.keys(data)) {
            let station = player.getStation(stationId);
            station.setSong(data[stationId]);
            player.updateStationSong(station);
          }
        }
      }, {
        answer: 'object',
        key: player.getStations()
      });
    }

  } catch (e) {
    console.error(e);
    DOM.setStationName(e.name || "Error!");
    DOM.setTitle(e.message || "[Nothing is explained]");
    DOM.setArtist(e.stack || "[We don't know what it means]");
    // https://hereticsmusic.bandcamp.com/track/blood-tears
  }
})();

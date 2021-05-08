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
  let DOM = new PlayerDOM();

  try {
    DOM.init();

    let ws = new WS({
      url: 'wss://titleturtle.tumba.ch/ws/'
    });
    try {
      await ws.init();
    } catch (e) {
      throw new Error('[Нет подключения к серверу тегов!]');
    }

    let stations = await (await fetch('./assets/stations.json')).json();

    const StationList = stations.map(station => new Station(station));

    let player = new Player({
      DOM,
      PlayerDOM: DOM.getDOM(),
      StationList
    });
    player.initPlayer();
    player.initStationList();
    player.setStation(StationList[0]);

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
  } catch (e) {
    console.error(e);
    DOM.setStationName(e.name || "Error!");
    DOM.setTitle(e.message || "[Nothing is explained]");
    DOM.setArtist(e.stack || "[We don't know what it means]");
    // https://hereticsmusic.bandcamp.com/track/blood-tears
  }
})();

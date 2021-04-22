if (process.env.NODE_ENV === 'development') {
  require('./index.html')
}

import './index.css';
import './Partials/progress.css';
import './Partials/input.css';
import './Styles/modern.css';

import WS from  './Modules/WS';
import Player from "./Modules/Player";
import Station from "./Modules/Station";

(async () => {
  let colorCss = document.querySelector('#colorCss');
  let themeSelect = document.querySelector('#themeSelect');
  themeSelect.addEventListener('change', setTheme);
  function setTheme() {
    colorCss.href = 'assets/colors/' + themeSelect.value + '.css';
  }
  setTheme();

  let PlayerDOM = {
    stationList: document.querySelector('.stationList'),
    station: document.querySelector('.player .description .title'),
    button: document.querySelector('.player .hex'),
    volume: document.querySelector('.player #volume'),
    artist: document.querySelector('.player .wrapper .artist'),
    title: document.querySelector('.player .wrapper .title'),
    time: document.querySelector('.player .description .time'),
    typeSelect: document.querySelector('#typeSelect')
  };

  let ws = new WS({
    url: 'wss://radio.tumba.ch/ws'
  });
  try {
    await ws.init();
  } catch (e) {
    PlayerDOM.title.innerText = '[Нет подключения к серверу тегов!]';
  }

  let stations = require('./assets/stations.json');

  const StationList = stations.map(station => new Station(station));

  let player = new Player({
    PlayerDOM,
    StationList
  });
  player.initPlayer();
  player.initStationList();
  player.setStation(StationList[0]);

  for await (let station of player.getStations()) {
    await ws.send('SUB '+ station);
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

  let foldButton = document.querySelector('.fold');
  foldButton.classList.add('clickable');
  foldButton.addEventListener('click', e => {
    let folded = PlayerDOM.stationList.classList.toggle('folded');
    foldButton.innerText = folded ? 'Раскрыть' : 'Свернуть';
  });
})();

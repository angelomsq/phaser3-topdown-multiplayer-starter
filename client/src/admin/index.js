import io from 'socket.io-client';
import axios from 'axios'
import moment from 'moment'
var socket = io.connect('http://localhost:3000', { transports: ['websocket'] });

socket.on('connect', () => {
  console.log("You're connected")
});

socket.on('reconnect_attempt', () => {
  socket.io.opts.transports = ['polling', 'websocket']
});

const setInnerHTML = (id, text) => {
  let el = document.getElementById(id);
  if (el) el.innerHTML = text.toString();
};

const getNewServerStats = async () => {
  try {
    let res = await axios.get('http://localhost:3000/stats');
    if (!res || !res.data) throw new Error();
    
    const stats  = res.data;
    console.log(stats);
    const { time, players, enemies, items } = stats;
    setInnerHTML('players', `Players: <b>${Object.keys(players).length}</b>`)
    setInnerHTML('enemies', `Enemies: <b>${Object.keys(enemies).length}</b>`)
    setInnerHTML('items', `Items: <b>${Object.keys(items).length}</b>`)
    setInnerHTML('time', `Server started <b>${moment(time).fromNow()}</b>`)
  } catch (error) {
    console.error(error.message)
  }
};

setInterval(getNewServerStats, 2000);
getNewServerStats();
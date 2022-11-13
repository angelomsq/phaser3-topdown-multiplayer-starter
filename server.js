const server = require('express')();
const http = require('http').createServer(server);
const io = require('socket.io')(http);
const cors = require('cors');

let time = new Date();
let players = {};
let enemies = {};
// let coins = [];
let items = {};
let dropTypes = ['empty', 'fire', 'heart', 'coin'];

io.on('connection', function (socket) {
  console.log('A user connected: ' + socket.id);
  let newPlayer;
  socket.on('NewPlayerConnection', function(scene, attributes) {
    var {w, h, x, y, image, health, speed, direction, maxBullets, fireRate, bullets, maxHealth, score} = attributes;
    // console.log(scene,attributes.bullets);
    socket.join(scene);
    socket.scene = scene;
    newPlayer = {
      id: socket.id,
      scene: scene,
      image: image,
      w: w,
      h: h,
      x: x,
      y: y,
      health: health,
      maxHealth: maxHealth,
      bullets: bullets,
      maxBullets: maxBullets,
      speed: speed,
      direction: direction,
      fireRate: fireRate,
      lastFired: 0,
      score: score
    };
    // players.push(newPlayer);
    players[socket.id] = newPlayer;
    // console.log('Players:');
    console.log(players);
    
    // const allScenePlayers = players.filter(player => player.scene === scene);
    // console.log('Players on '+scene+':');
    // console.log(allScenePlayers);

    socket.emit('AllPlayers', players);
    socket.broadcast.to(scene).emit('NewPlayer', newPlayer);

    // const allSceneCoins = coins.filter(coin => coin.scene === socket.scene);
    socket.emit('AllItems', items);

    // const allSceneEnemies = enemies.filter(enemy => enemy.scene === socket.scene);
    socket.emit('AllEnemies', enemies);

  });

  socket.on('PlayerMove', (direction, x, y, speedX, speedY) => {
    newPlayer.x = x;
    newPlayer.y = y;
    newPlayer.direction = direction;
    // console.log(newPlayer);
    socket.broadcast.to(socket.scene).emit('PlayerMove', newPlayer, speedX, speedY);
  });

  socket.on('PlayerStop', (position) => {
    newPlayer.x = position.x;
    newPlayer.y = position.y;
    socket.broadcast.to(socket.scene).emit('PlayerStop', newPlayer);
  });

  socket.on('PlayerFire', (time, direction, position) => {
    newPlayer.lastFired = time + newPlayer.fireRate;
    socket.broadcast.to(socket.scene).emit('PlayerFire', newPlayer, time);
  });

  socket.on('PlayerHit', (playerId) => {
    players[playerId].health--;
    socket.broadcast.to(socket.scene).emit('PlayerHit', playerId);
  });

  socket.on('NewItem', (newItem) => {
    // items.push(newItem);
    items[newItem.id] = newItem;
    // console.log(items);
    
    socket.broadcast.to(socket.scene).emit('AddItem', newItem);
  });

  socket.on('CollectItem', (itemID, playerID) => {
    console.log('COLLECT ITEM: ', itemID);
    switch (items[itemID].itemType) {
      case 'Coin':
        players[playerID].score += items[itemID].score; 
        break;
      case 'Heart':
        if(players[playerID].health+1 > players[playerID].maxHealth) players[playerID].health = players[playerID].maxHealth;
        else players[playerID].health++;
        break;
      case 'Fire':
        players[playerID].maxBullets++;
        break;
      default:
        break;
    }
    delete items[itemID];
    socket.broadcast.to(socket.scene).emit('RemoveItem', itemID);

  });

  socket.on('NewEnemy', (newEnemy) => {

    // let uid = Math.floor(new Date().valueOf() * Math.random());
    // let newEnemy = {
    //   id: `${type}-${uid}`,
    //   x: position.x,
    //   y: position.y,
    //   type: type,
    //   health: Math.floor(Math.random()*3)+1,
    //   damage: 1,
    //   score: Math.floor(Math.random()*30)+1,
    //   drops: dropTypes[Math.floor(Math.random() * dropTypes.length)],
    //   scene: socket.scene
    // };
    // enemies.push(newEnemy);
    enemies[newEnemy.id] = newEnemy;
    // console.log(coins);
    
    socket.broadcast.to(socket.scene).emit('AddEnemy', newEnemy);
  });

  socket.on('enemyKill', (enemyID, playerID) => {

    // enemies = enemies.filter(item => item.id != enemyID);
    delete enemies[enemyID];
    //TODO: update player score for kill enemy and register numKills
    socket.broadcast.to(socket.scene).emit('RemoveEnemy', enemyID);
  });

  socket.on('bulletAdd', (bulletID) => {
    newPlayer.maxBullets++;
    socket.broadcast.to(socket.scene).emit('AddBullet', bulletID, newPlayer.id);
  });

  socket.on('bulletKill', (bulletID) => {
    socket.broadcast.to(socket.scene).emit('RemoveBullet', bulletID);
  });

  socket.on('playerReset', (map, playerObj) => {
    //Reset player and emit Player Reset
    newPlayer.health = playerObj.health;
    newPlayer.maxHealth = playerObj.maxHealth;
    newPlayer.bullets = playerObj.bullets;
    newPlayer.maxBullets = playerObj.maxBullets;
    newPlayer.speed = playerObj.speed;
    newPlayer.direction = playerObj.direction;
    newPlayer.x = playerObj.x;
    newPlayer.y = playerObj.y;
    socket.broadcast.to(socket.scene).emit('ResetPlayer', newPlayer.id, {x:newPlayer.x, y:newPlayer.y},newPlayer.bullets);
  });
  
  

  socket.on('disconnect', function () {
      console.log('A user disconnected: ' + socket.id);
      // players = players.filter(player => player.id != socket.id);
      delete players[socket.id];
      console.log(players);
      //emit delete to client
      socket.broadcast.to(socket.scene).emit('RemovePlayer', socket.id);
  });

  socket.on('getAllData', function () {
  });
});


server.use(cors());

server.get('/players', function(req, res) {
  res.send(players);
});

server.get('/enemies', function(req, res) {
  res.send(enemies);
});

server.get('/items', function(req, res) {
  res.send(items);
});

server.get('/stats', function(req, res) {
  let stats = {
    players: players,
    enemies: enemies,
    items: items,
    time: time
  }
  res.send(stats);
});

http.listen(3000, function () {
    console.log('Server started!');
});
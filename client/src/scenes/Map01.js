import { Scene } from 'phaser';
import constants from "../constants/config";
// import { NEW_PLAYER, ALL_PLAYERS, CHAT, KEY_PRESS, MOVE, STOP, REMOVE } from '../../shared/constants/player';
import PlayerAtlas from '../assets/sprites/boy/sprites.png';
import PlayerAtlasJSON from '../assets/sprites/boy/sprites.json';
import Player2Atlas from '../assets/sprites/boy2/sprites.png';
import Player2AtlasJSON from '../assets/sprites/boy2/sprites.json';

import BatAtlas from '../assets/sprites/bat/sprites.png';
import BatAtlasJSON from '../assets/sprites/bat/sprites.json';

import CoinAtlas from '../assets/sprites/coin/sprites.png';
import CoinAtlasJSON from '../assets/sprites/coin/sprites.json';
import HeartAtlas from '../assets/sprites/heart/sprites.png';
import HeartAtlasJSON from '../assets/sprites/heart/sprites.json';

import FireAtlas from '../assets/sprites/fire/sprites.png';
import FireAtlasJSON from '../assets/sprites/fire/sprites.json';

import MapTiled from '../assets/maps/dungeon/dungeon_tiles_extruded.png';
import MapTiledJSON from '../assets/maps/dungeon/dungeonMap.json';

import BlackBars from '../assets/sprites/hud/black_bars.png';
import HeartWhite from '../assets/sprites/hud/heart-white.png';
import HeartGray from '../assets/sprites/hud/heart-gray.png';
import HeartRed from '../assets/sprites/hud/heart-red.png';

// import ArcadeFont from '../assets/fonts/bitmap/arcade.png';
// import ArcadeFontXML from '../assets/fonts/bitmap/arcade.xml';

import PS2PFont from '../assets/fonts/bitmap/PressStart2P.png';
import PS2PFontXML from '../assets/fonts/bitmap/PressStart2P.xml';

import Player from '../models/Player-bkp';

import io from 'socket.io-client';

export default class Map01 extends Scene {
  constructor() {
    super({ key: 'Map01' });
    this.key = 'Map01';
    this.mapWidth = 640;
    this.mapHeight = 640;
    this.players = {};
    this.coins = {};
    this.hearts = {};
    this.socket = io('http://localhost:3000');
  }

  preload() {

    this.load.atlas('player', PlayerAtlas, PlayerAtlasJSON);
    this.load.atlas('player2', Player2Atlas, Player2AtlasJSON);

    this.load.atlas('bat', BatAtlas, BatAtlasJSON);
    // this.socket.emit("NewPlayerConnect", this, playerConfig);
    // this.load.image('player', 'assets/player/horns_side.png');
    // this.load.spritesheet('player','assets/horns/horns_side.png',{ frameWidth: 16, frameHeight: 16 });
    // this.load.bitmapFont('arcadeFont', ArcadeFont, ArcadeFontXML);
    this.load.bitmapFont('PS2PFont', PS2PFont, PS2PFontXML);

    this.load.atlas('coin', CoinAtlas, CoinAtlasJSON);
    this.load.atlas('bullet', FireAtlas, FireAtlasJSON);
    this.load.image('tiles', MapTiled);
    this.load.tilemapTiledJSON('map',MapTiledJSON);

    this.load.image('hudBar', BlackBars);
    this.load.image('heartWhite', HeartWhite);
    this.load.image('heartGray', HeartGray);
    this.load.image('heartRed', HeartRed);


    this.socket.on('connect', function () {
      console.log('Connected!');
    });

  }

  create() {
    this.loadAnimations();
    // this.cursors = this.input.keyboard.createCursorKeys();

    //create new player (current player)
    let playerConfig = {
      scene: this.key,
      x: Math.floor(Math.random() * (this.mapWidth - 16) + 16),
      y: Math.floor(Math.random() * (this.mapHeight - 16) + 16),
      type: 1,
      health: 5,
      speed: 120,
      direction: 'idle',
      id: this.socket.id
    };
    //set new player to this scene
    this.player = new Player(this, playerConfig);
    this.players[this.socket.id] = this.player;
    //send new player information to server
    this.socket.emit("NewPlayerConnection", playerConfig);

    //receive broadcast from another new player
    this.socket.on("NewPlayer", (data) => {
      //set user type 2 for another player
      data.type = 2;
      this.players[data.id] = new Player(this, data);
      this.players[data.id].create();

    });

    //receive allPlayers
    this.socket.on("AllPlayers", (data) => {
      data.map(player => {
        if(player.id != this.socket.id){
          player.playerType = 2;
          this.players[player.id] = new Player(this, player);
          this.players[player.id].create();
        }
      });

      this.socket.on('PlayerMove', (data) => {
        this.players[data.id].x = data.x;
        this.players[data.id].y = data.y;
        this.players[data.id].direction = data.direction;
        this.players[data.id].anims.play(data.direction, true);
        // console.log('otherX: '+this.players[data.id].x);
        // console.log('otherY: '+this.players[data.id].y);
        // console.log('otherDir: '+data.direction);
      });

      this.socket.on('PlayerStop', (data) => {
        this.players[data.id].x = data.x;
        this.players[data.id].y = data.y;
        this.players[data.id].anims.stop();
        // console.log('otherX: '+this.players[data.id].x);
        // console.log('otherY: '+this.players[data.id].y);
        // console.log('otherDir: Stop');
      });

      this.socket.on('RemovePlayer', (id) => {
        this.players[id].destroy();
        delete this.players[id];
      });

      this.socket.emit("NewCoin", safePosition(this));

      this.socket.on("AllCoins", (data) => {
        data.map(coin => addCoin(this, coin));
      });

      this.socket.on("AddCoin", (data) => {
        addCoin(this, data);
      });

      this.socket.on("RemoveCoin", (id) => {
        console.log(id);
        this.coins[id].destroy();
        delete this.coins[id];
      });
    });


    // console.log('create: '+this.socket.id);
    // console.log(this.players[this.socket.id]);
    //  Set the camera and physics bounds to be the size of 4x4 bg images
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

    let map = this.add.tilemap('map');
    let tileset = map.addTilesetImage('dungeon_tiles','tiles', 16, 16, 1, 2);
    //layers
    let bgLayer = map.createStaticLayer('bg', [tileset], 0, 0).setDepth(-1);
    let floorLayer = map.createStaticLayer('floor', [tileset], 0, 0).setDepth(0);
    let decorationLayer = map.createStaticLayer('decoration', [tileset], 0, 0).setDepth(0);

    this.coinGroup = this.physics.add.group();


    this.collisionsLayer = map.createFromObjects('collisions', 12, { key: 'collisions' });
    this.collisionsLayer.forEach(wall => {
      wall.width = wall.width * wall._scaleX;
      wall.height = wall.height * wall._scaleY;
      // wall.setOrigin(0);
      this.physics.world.enable(wall);
      wall.body.immovable = true;
      wall.visible = false;
      // console.log(wall);
    });
    floorLayer.setCollisionByProperty({ collides: true });
    decorationLayer.setCollisionByProperty({ collides: true });

    // this.physics.add.collider(this.player, wallsLayer);
    // this.physics.add.collider(this.player, holesLayer);

    this.playerGroup = this.physics.add.group();
    this.enemyGroup = this.physics.add.group();

    this.player.create();
    this.playerGroup.add(this.player);
    this.playerGroup.setDepth(0);

    this.bat = this.physics.add.sprite(150, 250, 'bat','boy_01.png');
    this.bat.anims.play('bat-move');
    this.enemyGroup.add(this.bat);

    this.physics.add.collider(this.playerGroup, this.collisionsLayer);
    this.physics.add.overlap(this.playerGroup, this.coinGroup, collectCoin, null, this);
    this.physics.add.overlap(this.playerGroup, this.enemyGroup, playerHit, null, this);
    this.physics.add.overlap(this.player.bullets, this.enemyGroup, enemyHit, null, this);

    this.hudGroup = this.add.group();
    gameHUD(this);
    this.hudGroup.setDepth(1);
    // const debugGraphics = this.add.graphics().setAlpha(0.75);
    // wallLayer.renderDebug(debugGraphics, {
    //   tileColor: null, // Color of non-colliding tiles
    //   collidingTileColor: new Phaser.Display.Color(243, 134, 48, 255), // Color of colliding tiles
    //   faceColor: new Phaser.Display.Color(40, 39, 37, 255) // Color of colliding face edges
    // });

    //stop player when arrows are not pressed
    this.input.keyboard.on('keyup', (event) => {
      if (event.keyCode >= 37 && event.keyCode <= 40) {
          this.player.stop();
      }
    });

    // this.scale.startFullscreen();

  }

  update(time, delta) {
    this.player.update(time, delta);
  }

  loadAnimations() {
    /**
     * PLAYER ANIMATIONs
     */
    this.anims.create({
      key: 'idle',
      frameRate: 8,
      frames: this.anims.generateFrameNames('player', {
        prefix: 'boy_',
        suffix: '.png',
        start: 1,
        end: 1,
        zeroPad: 2
      }),
    });

    this.anims.create({
      key: 'left',
      frameRate: 8,
      frames: this.anims.generateFrameNames('player', {
        prefix: 'boy_',
        suffix: '.png',
        start: 4,
        end: 6,
        zeroPad: 2
      }),
    });
    this.anims.create({
      key: 'right',
      frameRate: 8,
      frames: this.anims.generateFrameNames('player', {
        prefix: 'boy_',
        suffix: '.png',
        start: 7,
        end: 9,
        zeroPad: 2
      }),
    });
    this.anims.create({
      key: 'up',
      frameRate: 8,
      frames: this.anims.generateFrameNames('player', {
        prefix: 'boy_',
        suffix: '.png',
        start: 10,
        end: 12,
        zeroPad: 2
      })
    });
    this.anims.create({
      key: 'down',
      frameRate: 8,
      frames: this.anims.generateFrameNames('player',{
        prefix: 'boy_',
        suffix: '.png',
        start: 1,
        end: 3,
        zeroPad: 2
      })
    });

    this.anims.create({
      key: 'dead-up',
      frameRate: 8,
      frames: this.anims.generateFrameNames('player',{
        prefix: 'boy_',
        suffix: '.png',
        start: 13,
        end: 13,
        zeroPad: 2
      })
    });

    this.anims.create({
      key: 'dead-down',
      frameRate: 8,
      frames: this.anims.generateFrameNames('player',{
        prefix: 'boy_',
        suffix: '.png',
        start: 14,
        end: 14,
        zeroPad: 2
      })
    });

    /**
     * COIN ANIMATION
     */

    this.anims.create({
      key: 'glow',
      repeat: -1,
      frameRate: 8,
      frames: this.anims.generateFrameNames('coin', {
        suffix: '.png',
        start: 1,
        end: 12
      }),
    });

    this.anims.create({
      key: 'spin',
      repeat: -1,
      frameRate: 8,
      frames: this.anims.generateFrameNames('coin', {
        suffix: '.png',
        start: 9,
        end: 12
      }),
    });

    /**
     * ENEMIES ANIMATIONS
     */

    this.anims.create({
      key: 'bat-move',
      frameRate: 4,
      repeat: -1,
      yoyo: true,
      frames: this.anims.generateFrameNames('bat', {
        prefix: 'bat_',
        suffix: '.png',
        start: 1,
        end: 12,
        zeroPad: 2
      }),
    });


    /**
     * POWER ANIMATIONS
     */

    this.anims.create({
      key: 'go',
      frameRate: 4,
      repeat: -1,
      yoyo: true,
      frames: this.anims.generateFrameNames('bullet', {
        prefix: 'fire_',
        suffix: '.png',
        start: 1,
        end: 3,
        zeroPad: 2
      }),
    });
  }

  addEnemy(type, anim) {
    let enemyPos = safePosition(this);
    let newEnemy = this.physics.add.sprite(enemyPos.x, enemyPos.y, type);
    newEnemy.anims.play(anim);
    this.enemyGroup.add(newEnemy);
  }
}

function safePosition(scene) {
  let coinPos = {
    x: Math.floor(Math.random() * (scene.mapWidth - 16) + 16),
    y: Math.floor(Math.random() * (scene.mapHeight - 16) + 16)
  }
  let overlap = scene.physics.overlapRect(coinPos.x, coinPos.y, 8, 8, true, true);
  if(overlap.length!=0){
    return safePosition(scene);
  }else{
    return coinPos;
  }
}

function addCoin(scene, data) {
  scene.coins[data.id] = scene.add.sprite(data.x,data.y,'coin');
  scene.coins[data.id].score = data.score;
  scene.coins[data.id].id = data.id;
  // var tile = ropeLayer.getTileAtWorldXY(monkey.x, monkey.y);
  // console.log(coin);
  scene.coins[data.id].play('glow');
  scene.coinGroup.add(scene.coins[data.id]);
  console.log(scene.coins);
}

function collectCoin(player, coin) {

  player.score = player.score+coin.score; // increment the score
  player.addBullet();
  this.socket.emit("CollectCoin", coin.id, player.id, player.score);
  delete this.coins[coin.id];
  coin.destroy(); // remove the tile/coin
  let scorePlus = this.add.bitmapText(coin.x, coin.y, 'PS2PFont', `+${coin.score}`).setDepth(10);
  this.tweens.add({
    targets: scorePlus,
    y: coin.y-16,
    duration: 1000,
    ease: 'Back',
    alpha: { from: 1, to: 0 },
    onComplete: function () {
      scorePlus.destroy();
    },
  });
  this.textHUD.setText(player.getScore()); // set the text to show the current score
  this.socket.emit("NewCoin", safePosition(this));
  // addCoin(this);
  return false;
}

function gameHUD(scene) {
  // let bar = scene.add.graphics();
  // bar.fillStyle('0x302C2E', 1);
  // bar.fillRect(0, 0, 100, 20);
  // bar.setScrollFactor(0);
  // scene.barHUD = scene.add.sprite(32, 26, 'hudBar').setScale(2).setScrollFactor(0);
  scene.healthBar = [];
  scene.player.getHealthBar();

  // let heart1 = scene.add.sprite(12, 14, 'heartRed').setScrollFactor(0);
  // let heart2 = scene.add.sprite(22, 14, 'heartRed').setScrollFactor(0);
  // let heart3 = scene.add.sprite(32, 14, 'heartGray').setScrollFactor(0);
  // scene.coinHUD = scene.add.sprite(16, 16, 'coin').setDisplaySize(16, 16);
  scene.textHUD = scene.add.bitmapText(8, 20, 'PS2PFont', scene.players[scene.socket.id].getScore()).setScrollFactor(0);
  scene.textHUD2 = scene.add.bitmapText(8, 30, 'PS2PFont', `player: ${scene.socket.id}`).setOrigin(0, 0).setScrollFactor(0);
  // scene.textHUD2 = scene.add.text(20, 30, `player: ${scene.socket.id}`, {
  //   fontFamily: 'm3x6',
  //   fontSize: '10px',
  //   fill: '#ffffff'
  // });

  // scene.hudGroup.add(heart1, heart2, heart3);
}



function playerHit(player, enemy) {
  enemy.destroy();
  player.health--;
  player.getHealthBar();

  this.addEnemy('bat', 'bat-move');
  // let enemyPos = safePosition(this);
  // let newEnemy = this.physics.add.sprite(enemyPos.x, enemyPos.y, 'bat');
  // newEnemy.anims.play('bat-move');
  // this.enemyGroup.add(newEnemy);

  if(player.health<=0) {
    player.anims.play('dead-down');
  }

}

function enemyHit(bullet, enemy) {
  enemy.destroy();
  bullet.kill();
  this.addEnemy('bat', 'bat-move');
}

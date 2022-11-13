import { Scene } from 'phaser';
// import GameScene from './GameScene';

import PlayerAtlas from '../assets/sprites/char/sprites.png';
import PlayerAtlasJSON from '../assets/sprites/char/sprites.json';
import Player2Atlas from '../assets/sprites/char_two/sprites.png';
import Player2AtlasJSON from '../assets/sprites/char_two/sprites.json';

import SkeletonAtlas from '../assets/sprites/skeleton/sprites.png';
import SkeletonAtlasJSON from '../assets/sprites/skeleton/sprites.json';
import ZombieAtlas from '../assets/sprites/zombie/sprites.png';
import ZombieAtlasJSON from '../assets/sprites/zombie/sprites.json';

import CoinAtlas from '../assets/sprites/coin8/sprites.png';
import CoinAtlasJSON from '../assets/sprites/coin8/sprites.json';
import HeartAtlas from '../assets/sprites/heart/sprites.png';
import HeartAtlasJSON from '../assets/sprites/heart/sprites.json';

import FireAtlas from '../assets/sprites/fire/sprites.png';
import FireAtlasJSON from '../assets/sprites/fire/sprites.json';
import FireballAtlas from '../assets/sprites/fireball/sprites.png';
import FireballAtlasJSON from '../assets/sprites/fireball/sprites.json';

import MapTiled from '../assets/maps/dungeon/dungeon_tiles_extruded.png';
import MapTiledJSON from '../assets/maps/dungeon/dungeonMap2.json';

import BlackBars from '../assets/sprites/hud/black_bars.png';
import HeartWhite from '../assets/sprites/hud/heart-white.png';
import HeartGray from '../assets/sprites/hud/heart-gray.png';
import HeartRed from '../assets/sprites/hud/heart-red.png';

// import ArcadeFont from '../assets/fonts/bitmap/arcade.png';
// import ArcadeFontXML from '../assets/fonts/bitmap/arcade.xml';

import PS2PFont from '../assets/fonts/bitmap/PressStart2P.png';
import PS2PFontXML from '../assets/fonts/bitmap/PressStart2P.xml';
import Berkelium1541Font from '../assets/fonts/bitmap/Berkelium1541.png';
import Berkelium1541FontXML from '../assets/fonts/bitmap/Berkelium1541.xml';
import CGPixelMiniFont from '../assets/fonts/bitmap/CG-pixel-mini.png';
import CGPixelMiniFontXML from '../assets/fonts/bitmap/CG-pixel-mini.xml';

class LoadScreen extends Scene {
  constructor() {
    super({ key: 'LoadScreen' });
    this.progressBar = null;
    this.progressCompleteRect = null;
    this.progressRect = null;
  }

  preload() {
    this.load.atlas('char', PlayerAtlas, PlayerAtlasJSON);
    this.load.atlas('char2', Player2Atlas, Player2AtlasJSON);

    this.load.atlas('skeleton', SkeletonAtlas, SkeletonAtlasJSON);
    this.load.atlas('zombie', ZombieAtlas, ZombieAtlasJSON);
    // this.socket.emit("NewPlayerConnect", this, playerConfig);
    // this.load.image('player', 'assets/player/horns_side.png');
    // this.load.spritesheet('player','assets/horns/horns_side.png',{ frameWidth: 16, frameHeight: 16 });
    // this.load.bitmapFont('arcadeFont', ArcadeFont, ArcadeFontXML);
    this.load.bitmapFont('PS2PFont', PS2PFont, PS2PFontXML);
    this.load.bitmapFont('CGPixelMini', CGPixelMiniFont, CGPixelMiniFontXML);
    this.load.bitmapFont('Berkelium1541', Berkelium1541Font, Berkelium1541FontXML);

    this.load.atlas('coin', CoinAtlas, CoinAtlasJSON);
    this.load.atlas('heart', HeartAtlas, HeartAtlasJSON);
    this.load.atlas('fire', FireAtlas, FireAtlasJSON);
    this.load.atlas('fireball', FireballAtlas, FireballAtlasJSON);
    this.load.image('tiles', MapTiled);
    this.load.tilemapTiledJSON('map',MapTiledJSON);

    this.load.image('hudBar', BlackBars);
    this.load.image('heartWhite', HeartWhite);
    this.load.image('heartGray', HeartGray);
    this.load.image('heartRed', HeartRed);

    this.load.on('progress', this.onLoadProgress, this);
    this.load.on('complete', this.onLoadComplete, this);
    this.createProgressBar();
  }

  create() {

    // this.music = this.sound.add('music-town', { loop: true });
    // this.music.play();
    this.loadAnimations();

  }

  onLoadComplete(loader) {
    this.scene.start('MenuScreen');
    this.scene.shutdown();
  }

  onLoadProgress(progress) {
    let color = (0xffffff);

    this.progressRect.width = progress * this.progressCompleteRect.width;
    this.progressBar
    .clear()
    .fillStyle(0x222222)
    .fillRectShape(this.progressCompleteRect)
    .fillStyle(color)
    .fillRectShape(this.progressRect);
  }

  createProgressBar() {
    let Rectangle = Phaser.Geom.Rectangle;
    let main = Rectangle.Clone(this.cameras.main);

    this.progressRect = new Rectangle(0, 0, main.width / 2, 50);
    Rectangle.CenterOn(this.progressRect, main.centerX, main.centerY);

    this.progressCompleteRect = Phaser.Geom.Rectangle.Clone(this.progressRect);

    this.progressBar = this.add.graphics();
  }

  loadAnimations() {
    /**
     * PLAYER ANIMATIONS (idle/walk/attack)
     */
    let directions = ['left', 'right', 'up', 'down'];
    let chars = [
      {name: "char", opt: ['idle', 'walk', 'atk']},
      {name: "char2", opt: ['idle', 'walk', 'atk']},
    ];

    chars.map(char => {
      char.opt.map(opt => {
        directions.map(direction => {
          this.anims.create({
            key: `${char.name}-${opt}-${direction}`,
            frameRate: 8,
            repeat: opt=='idle'? -1: 0,
            frames: this.anims.generateFrameNames(`${char.name}`, {
              prefix: `${char.name}_${opt}_${direction}_`,
              start: 1,
              end: opt=='atk' ? 4: 6,
              zeroPad: 2
            }),
          });
        });
      });
    });

    /**
     * ENEMIES ANIMATIONS
     */

    let enemies = [
      {name: "skeleton", opt: ['idle', 'walk']},
      {name: "zombie", opt: ['idle', 'walk']},
    ];

    enemies.map(enemy => {
      enemy.opt.map(opt => {
        directions.map(direction => {
          this.anims.create({
            key: `${enemy.name}-${opt}-${direction}`,
            frameRate: 6,
            repeat: opt=='idle'? -1: 0,
            frames: this.anims.generateFrameNames(`${enemy.name}`, {
              prefix: `${enemy.name}_${opt}_${direction}_`,
              start: 1,
              end: opt=='atk' ? 4: 6,
              zeroPad: 2
            }),
          });
        });
      });
    });

    /**
     * COIN ANIMATION
     */

    this.anims.create({
      key: 'glow',
      repeat: -1,
      frameRate: 8,
      frames: this.anims.generateFrameNames('coin', {
        prefix: 'coin_',
        start: 1,
        end: 11,
        zeroPad: 2
      }),
    });

    this.anims.create({
      key: 'spin',
      repeat: -1,
      frameRate: 8,
      frames: this.anims.generateFrameNames('coin', {
        prefix: 'coin_',
        start: 8,
        end: 11,
        zeroPad: 2
      }),
    });

    /**
     * ITEMS ANIMATION
     */

    this.anims.create({
      key: 'heart',
      repeat: -1,
      frameRate: 8,
      frames: this.anims.generateFrameNames('heart', {
        prefix: 'heart_',
        start: 1,
        end: 6,
        zeroPad: 2
      }),
    });


    this.anims.create({
      key: 'fire',
      repeat: -1,
      yoyo: true,
      frameRate: 4,
      frames: this.anims.generateFrameNames('fire', {
        prefix: 'fire_',
        start: 1,
        end: 3,
        zeroPad: 2
      }),
    });


    /**
     * POWER ANIMATIONS
     */

    this.anims.create({
      key: 'shoot',
      frameRate: 6,
      repeat: -1,
      yoyo: true,
      frames: this.anims.generateFrameNames('fireball', {
        prefix: 'fireball_',
        start: 1,
        end: 3,
        zeroPad: 2
      }),
    });
  }
}

export default LoadScreen;

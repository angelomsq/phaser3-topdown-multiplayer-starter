import Phaser from "phaser";
import constants from "./constants/config";
import "./css/style.css";
import "./font-loader";
// import Map01 from "./scenes/Map01";

import LoadScreen from "./scenes/LoadScreen";
import MenuScreen from "./scenes/MenuScreen";
import DungeonMap from "./scenes/DungeonMap";


const config = {
  type: Phaser.AUTO,
  parent: "phaser-example",
  width: constants.WIDTH,
  height: constants.HEIGHT,
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      // debug: true
    }
  },
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    // width: constants.DEFAULT_WIDTH,
    // height: constants.DEFAULT_HEIGHT,
    // min: {
    //   width: 256,
    //   height: 144
    // },
    // max: {
    //   width: 512,
    //   height: 144
    // },
    zoom: 4,
  },
  scene: [LoadScreen, MenuScreen, DungeonMap],
  pixelArt: true,
  antialias: false
};

const game = new Phaser.Game(config);

// function preload() {
//   this.load.image("logo", logoImg);
// }

// function create() {
//   const logo = this.add.image(400, 150, "logo");

//   this.tweens.add({
//     targets: logo,
//     y: 450,
//     duration: 2000,
//     ease: "Power2",
//     yoyo: true,
//     loop: -1
//   });
// }

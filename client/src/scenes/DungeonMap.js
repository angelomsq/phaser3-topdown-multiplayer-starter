// import io from 'socket.io-client';
import GameScene from './GameScene';

class DungeonMap extends GameScene {
  constructor() {
    // let socket = io('http://localhost:3000');
    super('DungeonMap', 672, 352);
  }

  // init() {
  //   super.init(this.safePosition(10, 16));//safe position for player sprite (10x16)px
  // }

  create() {
    let tileset = {
      name: 'dungeon_tiles',
      key: 'tiles',
      width: 16,
      height: 16,
      margin: 1,
      spacing: 2,
    };
    super.create('map', tileset);
  }
}

export default DungeonMap;

import Phaser from 'phaser';
import Item from './Item';

class Coin extends Item {

  constructor(scene, x, y, id) {
    super(scene, x, y, 'coin', id);
    this.score = Math.floor(Math.random()*30)+1;
    this.itemType = this.constructor.name;
    this.anims.play('glow');
    // this.setDepth(1);
  }

  collectText() {
    return `+${this.score} Points`;
  }

  getObject() {
    return {
      id: this.id,
      scene: this.scene.key,
      x: this.x,
      y: this.y,
      score: this.score,
      itemType: this.itemType
    }
  }

}

export default Coin;

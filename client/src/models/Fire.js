import Phaser from 'phaser';
import Item from './Item';

class Fire extends Item {

  constructor(scene, x, y, id) {
    super(scene, x, y, 'fire', id);
    this.itemType = this.constructor.name;
    this.anims.play('fire');
  }

  collectText() {
    return '+1 Bullet';
  }

  getObject() {
    return {
      id: this.id,
      scene: this.scene.key,
      x: this.x,
      y: this.y,
      itemType: this.itemType
    }
  }

}

export default Fire;

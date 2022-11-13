import Phaser from 'phaser';
import Item from './Item';

class Heart extends Item {

  constructor(scene, x, y, id) {
    super(scene, x, y, 'heart', id);
    this.itemType = this.constructor.name;
    this.anims.play('heart');
  }

  collectText() {
    return '+1 Health';
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

export default Heart;

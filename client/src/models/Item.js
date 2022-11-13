import Phaser from 'phaser';

class Item extends Phaser.GameObjects.Sprite {

  constructor(scene, x, y, image, id) {
    super(scene, x, y, image);
    this.id = id != null ? id : Phaser.Utils.String.UUID();
    this.scene.add.existing(this);
  }

  getObject() {
    return {
      scene: this.scene.key,
      x: this.x,
      y: this.y,
      id: this.id
    }
  }

}

export default Item;

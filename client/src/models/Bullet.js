import Phaser from 'phaser';

class Bullet extends Phaser.Physics.Arcade.Sprite {

  constructor(scene, x, y, key, uuid, owner) {
    super(scene, x, y, key);
    this.speed = 300;
    this.born = 0;
    this.direction = '';
    this.owner = owner;
    this.scene = scene;
    this.id = uuid;
    // this.setSize(12, 12);

  }
  fire(x, y, direction) {
    this.body.reset(x, y)
    this.setActive(true);
    this.setVisible(true);
    this.anims.play('shoot')
    this.direction = direction;

    if(this.direction=='left'){
      this.setVelocityX(-this.speed);
      this.angle = 180;
    }
    if(this.direction=='right'){
      this.setVelocityX(this.speed);
      this.angle = 0;
    }
    if(this.direction=='up'){
      this.setVelocityY(-this.speed);
      this.angle = -90;
    }
    if(this.direction=='down'){
      this.setVelocityY(this.speed);
      this.angle = 90;
    }

    // this.rotation = shooter.rotation; // angle bullet with shooters rotation
    this.born = 0;
  }

  preUpdate(time, delta) {
    super.preUpdate(time, delta);
    this.born += delta;

    if (this.born > 1500 || !Phaser.Geom.Rectangle.Overlaps(this.scene.physics.world.bounds, this.getBounds())) {
      this.kill(this.owner);
    }
  }

  kill(emit=null) {
    this.setActive(false);
    this.setVisible(false);
    this.body.velocity.y = 0;
    this.body.velocity.x = 0;
    this.setPosition(0, 0);

    if(emit) {
      this.scene.socket.emit("bulletKill", this.id);
      console.log('emit bullet kill: ',this.id);
    }
  }
}

export default Bullet;

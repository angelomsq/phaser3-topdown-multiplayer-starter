import Phaser from 'phaser';
import Bullet from './Bullet';
import io from 'socket.io-client';

export default class Player extends Phaser.Physics.Arcade.Sprite  {
  constructor(scene, {image, w, h, x, y, type, health, speed, id, direction}){
    super(scene, x, y, image);
    this.id = id;
    this.w = w;
    this.h = h;
    this.playerType = type;
    this.scene = scene;
    this.speed = speed;
    this.health = health;
    this.maxHealth = 5;
    this.maxBullets = 1;
    this.score = 0;
    this.direction = direction
    this.fireRate = 200;
    this.lastFired = 0;
    this.invincible = false;
    // this.fireBall = scene.physics.add.sprite(this.x, this.y, 'fire');
    // this.fireBall.setActive(false);
    // this.fireBall.setVisible(false);
    // config.scene.physics.add.existing(this);
  }

  create() {
    this.scene.physics.world.enable(this);
    this.body.setSize(this.w, this.h);
    this.setOrigin(0.5, 0.5);
    this.body.setOffset(0, 0);
    this.body.setGravityY(0);
    this.setCollideWorldBounds(true);

    if(this.playerType==1) {
      this.scene.cameras.main.startFollow(this);
      this.bullets = this.scene.playerBulletGroup;
      this.bullets.createMultiple({
        frameQuantity: this.maxBullets,
        key: 'fireball',
        active: false,
        visible: false,
        classType: Bullet
      });

      this.actionKeys = this.scene.input.keyboard.addKeys({
        up: 'up',
        down: 'down',
        left: 'left',
        right: 'right',
        space: 'SPACE',
        shift: 'SHIFT',
        a: 'A',
        s: 'S',
        d: 'D',
        z: 'Z',
        x: 'X',
        c: 'C'
      });

    }else{
      this.bullets = this.scene.otherPlayerBulletGroup;
      this.bullets.createMultiple({
        frameQuantity: this.maxBullets*2,
        key: 'fireball',
        active: false,
        visible: false,
        classType: Bullet
      });
    }

    this.scene.add.existing(this);
    this.play(`idle${this.playerType}`);
  }

  update(time, delta) {
    if(this.health>0) {
      if (this.actionKeys.left.isDown && !(this.body.velocity.x > 0) && this.body.velocity.y == 0){
        this.left();
      }
      if (this.actionKeys.right.isDown && !(this.body.velocity.x < 0) && this.body.velocity.y == 0) {
        this.right();
      }
      if (this.actionKeys.up.isDown && !(this.body.velocity.y > 0) && this.body.velocity.x == 0) {
        this.up();
      }
      if (this.actionKeys.down.isDown && !(this.body.velocity.y < 0) && this.body.velocity.x == 0) {
        this.down();
      }

      if(this.actionKeys.space.isDown && time > this.lastFired) {
        this.fire(time);
      }
    }

    // if((this.actionKeys.left.isUp && this.body.velocity.x < 0) ||
    //   (this.actionKeys.right.isUp && this.body.velocity.x > 0) ||
    //   (this.actionKeys.up.isUp && this.body.velocity.y < 0) ||
    //   (this.actionKeys.down.isUp && this.body.velocity.y > 0)) {
    //   this.stop();
    // }

  }

  left() {
      this.body.velocity.x = -this.speed;
      this.anims.play(`left${this.playerType}`, true);
      this.direction = 'left';
      this.scene.socket.emit('PlayerMove', 'left', { x: this.x, y: this.y });
      // console.log('playerX: '+this.x);
      // console.log('playerY: '+this.y);
      // console.log('Direction: left');
  }

  right() {
      this.body.velocity.x = this.speed;
      this.anims.play(`right${this.playerType}`, true);
      this.direction = 'right';
      this.scene.socket.emit('PlayerMove', 'right', { x: this.x, y: this.y });
      // console.log('playerX: '+this.x);
      // console.log('playerY: '+this.y);
      // console.log('Direction: right');
  }

  up() {
    this.body.velocity.y = -this.speed;
    this.anims.play(`up${this.playerType}`, true);
    this.direction = 'up';
    this.scene.socket.emit('PlayerMove', 'up', { x: this.x, y: this.y });
    // console.log('playerX: '+this.x);
    // console.log('playerY: '+this.y);
    // console.log('Direction: up');
  }

  down() {
    this.body.velocity.y = this.speed;
    this.anims.play(`down${this.playerType}`, true);
    this.direction = 'down';
    this.scene.socket.emit('PlayerMove', 'down', { x: this.x, y: this.y });
    // console.log('playerX: '+this.x);
    // console.log('playerY: '+this.y);
    // console.log('Direction: down');
  }

  stop() {
    this.body.velocity.x = 0;
    this.body.velocity.y = 0;
    this.anims.stop();
    this.scene.socket.emit('PlayerStop', { x: this.x, y: this.y });
    // console.log('playerX: '+this.x);
    // console.log('playerY: '+this.y);
    // console.log('Direction: stop');
  }

  fire(time) {
    console.log('Fire');

    let bullet = this.bullets.getFirstDead(false);
    // let bullet = this.bullets.get();
    console.log(bullet);

    if (bullet) {
      bullet.fire(this.x, this.y, this.direction, this.id);
      this.lastFired = time + this.fireRate;
      this.scene.socket.emit('PlayerFire', time, this.direction, { x: this.x, y: this.y }, this.id);
    }
  }

  hit() {
    this.health--;
    this.getHealthBar();
    this.scene.cameras.main.shake(300, 0.005);
    this.invincible = true;

    if(this.health<=0) {
      this.setVelocity(0, 0);
      this.anims.play(`dead-down${this.playerType}`);
      this.scene.socket.emit('PlayerDead', this.direction, { x: this.x, y: this.y });
      return;
    }
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.5 },
      // tint: {to: 0xffffff},
      // alpha: { start: 0, to: 1 },
      // alpha: 1,
      // alpha: '+=1',
      ease: 'Linear',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
      duration: 100,
      repeat: 4,            // -1: infinity
      yoyo: true,
      onYoyo: () => this.clearTint(),
      onStart: () => this.setTintFill('0xffffff'),
      onRepeat: () => this.setTintFill('0xffffff'),
      onComplete: () => this.invincible = false,
    });
    this.scene.socket.emit('PlayerHit', this.direction, { x: this.x, y: this.y });
  }

  getScore() {
    return `${this.score}`.padStart(8, '0');
  }

  getHealthBar() {
    let heartX, color;
    for (let i = 0; i < this.maxHealth; i++) {
      if(i<this.health) color = 'heartRed';
      else color = 'heartGray';

      heartX = (i*10)+12;

      if (this.scene.healthBar[i]) this.scene.healthBar[i].setTexture(color);
      else this.scene.healthBar.push(this.scene.add.sprite(heartX, 14, color).setScrollFactor(0));
    }
  }

  addBullet() {
    this.maxBullets++;
    this.bullets.createMultiple({
      frameQuantity: 1,
      key: 'fireball',
      active: false,
      visible: false,
      classType: Bullet
    });
  }

  addHealth() {
    let newHealth = this.health+1;
    if(newHealth>this.maxHealth) newHealth = this.maxHealth;
    this.health = newHealth;
    this.getHealthBar();
  }

  /**
   * FUNCTIONS FOR OTHER PLAYERS
   */

  movePlayer(data) {
    this.x = data.x;
    this.y = data.y;
    this.direction = data.direction;
    this.anims.play(data.direction+this.playerType, true);
  }

  stopPlayer(data) {
    this.x = data.x;
    this.y = data.y;
    this.anims.stop();
  }

  firePlayer(data, time) {
    if(time > this.lastFired) {
      let bullet = this.bullets.getFirstDead(false);

      if (bullet) {
        bullet.fire(this.x, this.y, this.direction, this.id);
        this.lastFired = time + this.fireRate;
      }
      // let bullet = new Bullet(this.scene,this.x, this.y);
      // this.scene.physics.add.existing(bullet);
      // bullet.fire(data.x, data.y, data.direction);
    }
  }

}

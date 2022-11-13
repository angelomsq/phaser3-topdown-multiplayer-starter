import Phaser from 'phaser';
import Bullet from './Bullet';
import io from 'socket.io-client';

export default class Character extends Phaser.Physics.Arcade.Sprite  {
  constructor(scene, config) {
    // var {image, w, h, x, y, health, bullets, speed, id, direction, fireRate} = config;
    super(scene, config.x, config.y, config.image);
    this.id = config.id != null ? config.id : Phaser.Utils.String.UUID();
    this.w = config.w;
    this.h = config.h;
    this.image = config.image;
    this.speed = config.speed;
    this.health = config.health;
    this.maxHealth = config.health;
    this.maxBullets = config.maxBullets;
    this.score = 0;
    this.direction = config.direction
    this.fireRate = config.fireRate;
    this.lastFired = 0;
    this.invincible = false;
    this.dead = false;
    this.attacking = false;
  }

  init() {
    this.scene.physics.world.enable(this);
    this.setOrigin(0.5, 0.5);
    this.body.setGravityY(0);

    this.setCollisionBody(this.w, this.h);
    this.addHurtBox();
    this.addShadow();

    this.setCollideWorldBounds(true);

    this.scene.add.existing(this);

    this.play(`${this.image}-idle-down`);
  }

  preUpdate (time, delta) {
    super.preUpdate(time, delta);

    this.setCollisionBody(this.frame.width, this.frame.height);
    // this.hurtbox.setPosition(this.x, this.y);
    this.updateHurtBox(this.frame.width, this.frame.height);
    this.updateShadow(this.frame.width, this.frame.height);

    // if(this.frame.width > this.w) this.body.setOffset(Math.round((this.w-this.body.w)/2));
    // let frameOffsetX = Math.round((this.frame.width-this.body.width)/2);
    // let frameOffsetY = Math.round(this.frame.height-this.body.height);
    // this.body.setOffset(frameOffsetX,frameOffsetY);

    // this.body.setSize(this.frame.width, this.frame.height, false);
    // this.setOriginFromFrame();
    // this.setSizeToFrame();
    // this.updateDisplayOrigin();

  }

  setCollisionBody(width, height) {
    let bodyWidth = Math.round(this.w*.7);
    // console.log('body W:',bodyW);
    let bodyHeight = Math.round(this.h*.3);
    // console.log('body H:',bodyH);
    let offsetX = Math.round((width-bodyWidth)/2);
    let offsetY = Math.round(height-bodyHeight);
    this.body.setSize(bodyWidth, bodyHeight);
    this.body.setOffset(offsetX, offsetY);
  }

  addHurtBox() {
    this.hurtbox = this.scene.add.rectangle(this.x, this.y, this.w, this.h, 0x6666ff).setVisible(false);
    this.hurtbox.sprite = this;
    this.scene.physics.world.enable(this.hurtbox);
  }

  updateHurtBox(width, height) {
    this.hurtbox.setPosition(this.x, this.y);
    let bodyWidth = Math.round(width*.8);
    let bodyHeight = Math.round(height);
    this.hurtbox.body.setSize(bodyWidth, bodyHeight);

  }

  addShadow() {
    this.shadow = this.scene.add.ellipse(this.x, this.y+this.h/2, Math.round(this.w*.7), Math.round(this.h*.3),0x222222, .6);
  }

  updateShadow(width, height) {
    let botomCenter = this.getBottomCenter();
    this.shadow.setPosition(botomCenter.x, botomCenter.y);
    let bodyWidth = Math.round(width*.7);
    let bodyHeight = Math.round(height*.3);
    this.shadow.setSize(bodyWidth, bodyHeight);

  }

  move(direction, xSpeed, ySpeed) {
    this.direction = direction;
    this.body.setVelocity(xSpeed, ySpeed);
    this.anims.play(`${this.image}-walk-${this.direction}`, true);
  }

  stop() {
    this.body.setVelocity(0,0);
    // this.anims.stop();
    this.anims.play(`${this.image}-idle-${this.direction}`, true);
  }

  attack() {
    this.body.setVelocity(0,0);
    this.attacking = true;
    this.anims.play(`${this.image}-atk-${this.direction}`, true);
  }

  fire(time) {
    let bullet = this.bullets.getFirstDead(false);

    if (bullet) {
      console.log('fetched bullet', bullet);
      bullet.fire(this.x, this.y, this.direction);
      this.lastFired = time + this.fireRate;
      return true;
    }
    return false;
  }

  hit() {
    this.health--;
    if(!this.checkDeath()){
      this.damaged();
    }
  }

  damaged(duration=100, repeat=4) {
    this.invincible = true;
    this.scene.tweens.add({
      targets: this,
      alpha: { from: 1, to: 0.5 },
      // tint: {to: 0xffffff},
      // alpha: { start: 0, to: 1 },
      // alpha: 1,
      // alpha: '+=1',
      ease: 'Linear',       // 'Cubic', 'Elastic', 'Bounce', 'Back'
      duration: duration,
      repeat: repeat,            // -1: infinity
      yoyo: true,
      onYoyo: () => this.clearTint(),
      onStart: () => this.setTintFill('0xffffff'),
      onRepeat: () => this.setTintFill('0xffffff'),
      onComplete: () => this.invincible = false,
    });
  }

  checkDeath() {
    if(this.health<=0) {
      this.dead = true;
      // this.setVelocity(0, 0);
      // this.setActive(false);
      this.anims.play(`dead-${this.direction}-${this.image}`);

      return true;
    }
    return false;
  }

  kill() {
    this.hurtbox.destroy();
    this.shadow.destroy();
    this.destroy();
  }

  getScore() {
    return `${this.score}`.padStart(8, '0');
  }

}

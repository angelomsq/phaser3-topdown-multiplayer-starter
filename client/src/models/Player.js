import Character from './Character';
import Bullet from './Bullet';

export default class Player extends Character  {
  constructor(scene, config, type){
    super(scene, config);
    this.playerType = type;
    this.create();
    this.setBullets(config.bullets);
    // console.log('player config: ',config);
  }

  begin(position) {
    this.setPosition(position.x, position.y).setActive(true).setVisible(true);
    this.damaged();
  }

  create() {
    super.init();

    this.on('animationcomplete', (anim, frame) => {
      if (anim.key.indexOf('atk') != -1) {
        this.emit('animationcomplete_attack', anim, frame, this);
      }
    });

    this.on('animationcomplete_attack', (anim, frame, obj) => {
      this.attacking = false;
      this.anims.play(`${this.image}-idle-${this.direction}`, true);
    });

    if(this.playerType==1) {
      this.scene.cameras.main.startFollow(this).setZoom(1);
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

    }
  }

  setBullets(bullets) {
    if(this.playerType==1) {
      //create new bullets for new player 1
      this.bullets = this.scene.playerBulletGroup;
      this.bullets.createMultiple({
        frameQuantity: this.maxBullets,
        key: 'fireball',
        active: false,
        visible: false,
        classType: Bullet,
        createCallback: (bullet) => {
          bullet.id = Phaser.Utils.String.UUID();
          bullet.owner = this.id;
        }
      });
      // console.log('Player 1 Bullets',this.bullets.getChildren());
      this.bullets.setDepth(99);
    }else{
      //set already created bullets to another player
      this.bullets = this.scene.otherPlayerBulletGroup;
      bullets.map(item => {
        this.bullets.createMultiple({
          frameQuantity: 1,
          key: 'fireball',
          active: false,
          visible: false,
          classType: Bullet,
          createCallback: (bullet) => { bullet.id = item; }
        });
      });

      this.bullets.setDepth(99);
      // console.log('Player 2 Bullets',this.bullets.getChildren());
    }
  }

  update(time, delta) {
    if(!this.dead) {
      if(!this.attacking) {
        if (this.actionKeys.left.isDown && !(this.body.velocity.x > 0) && this.body.velocity.y == 0){
          this.move('left', -this.speed, 0);
          this.scene.socket.emit('PlayerMove', this.direction, this.x, this.y, -this.speed, 0);
        }
        if (this.actionKeys.right.isDown && !(this.body.velocity.x < 0) && this.body.velocity.y == 0) {
          this.move('right', this.speed, 0);
          this.scene.socket.emit('PlayerMove', this.direction, this.x, this.y, this.speed, 0);
        }
        if (this.actionKeys.up.isDown && !(this.body.velocity.y > 0) && this.body.velocity.x == 0) {
          this.move('up', 0, -this.speed);
          this.scene.socket.emit('PlayerMove', this.direction, this.x, this.y, 0, -this.speed);
        }
        if (this.actionKeys.down.isDown && !(this.body.velocity.y < 0) && this.body.velocity.x == 0) {
          this.move('down', 0, this.speed);
          this.scene.socket.emit('PlayerMove', this.direction, this.x, this.y, 0, this.speed);
        }

        if(this.actionKeys.space.isDown && time > this.lastFired) {
          if(this.fire(time)) this.scene.socket.emit('PlayerFire', time, this.direction, { x: this.x, y: this.y }, this.id);
        }

        /* ATTACK */
        if (Phaser.Input.Keyboard.JustDown(this.actionKeys.a)) {
          this.attack();
          this.scene.socket.emit('PlayerAttack', this.direction, { x: this.x, y: this.y });
        }
      }
    }else{
      console.log('DEAD: ',this.id);
      console.log('ACTIVE: ',this.active);
      this.scene.gamePaused = true;
      this.setVelocity(0, 0);
      this.setActive(false);
      this.setVisible(false);
      //render menu screen
      this.scene.showMenu(this.id);
    }

  }

  getHealthBar() {
    let heartX, color;
    for (let i = 0; i < this.maxHealth; i++) {
      if(i<this.health) color = 'heartRed';
      else color = 'heartGray';

      heartX = (i*10)+8;

      if (this.scene.healthBar[i]) this.scene.healthBar[i].setTexture(color);
      else this.scene.healthBar.push(this.scene.add.sprite(heartX, 8, color).setScrollFactor(0).setDepth(3));
    }
  }

  addBullet() {
    this.maxBullets++;
    this.bullets.createMultiple({
      frameQuantity: 1,
      key: 'fireball',
      active: false,
      visible: false,
      classType: Bullet,
      createCallback: (bullet) => {
        bullet.id = Phaser.Utils.String.UUID();
        bullet.owner = this.id;
        this.scene.socket.emit("bulletAdd", bullet.id);
      }
    });
  }

  addHealth() {
    if(this.health+1 > this.maxHealth) this.health = this.maxHealth;
    else this.health++;
    this.getHealthBar();
  }

  reset(position, bullets) {
    this.health = 5;
    this.maxHealth = 5;
    this.speed = 80;
    this.maxBullets = 1;
    this.direction = 'down';
    this.x = position.x;
    this.y = position.y;
    this.score = 0;

    this.setVisible(true);
    this.setActive(true);

    this.bullets.clear(false, true);

    this.setBullets(bullets);
  }

  /**
   * FUNCTIONS FOR OTHER PLAYERS
   */

  movePlayer(data) {

    // console.log(data);
    this.x = data.x;
    this.y = data.y;
    this.direction = data.direction;

    this.anims.play(`${this.image}-walk-${this.direction}`, true);
    // console.log('move other player: ',this);
  }

  stopPlayer(data) {
    this.x = data.x;
    this.y = data.y;
    this.anims.stop();
  }

  firePlayer(data, time) {
    if(time > this.lastFired) {
      let bullet = this.bullets.getFirstDead(false);
      console.log('fired bullet: ',bullet.id);

      if (bullet) {
        bullet.fire(this.x, this.y, this.direction);
        this.lastFired = time + this.fireRate;
      }
      // let bullet = new Bullet(this.scene,this.x, this.y);
      // this.scene.physics.add.existing(bullet);
      // bullet.fire(data.x, data.y, data.direction);
    }
  }

  addPlayerBullet(bulletId) {
    this.maxBullets++;
    this.bullets.createMultiple({
      frameQuantity: 1,
      key: 'fireball',
      active: false,
      visible: false,
      classType: Bullet,
      createCallback: (bullet) => {
        bullet.id = bulletId;
      }
    });
  }

  getPlayerBulletsIds() {
    let bullets = [];
    let fecth = this.bullets.getChildren();
    fecth.map(item => {
      bullets.push(item.id);
    });
    return bullets;
  }

  getObject() {
    return {
      scene: this.scene.key,
      image: this.image,
      w: this.w,
      h: this.h,
      x: this.x,
      y: this.y,
      type: this.playerType,
      health: this.health,
      maxHealth: this.maxHealth,
      speed: this.speed,
      bullets: this.getPlayerBulletsIds(),
      maxBullets: this.maxBullets,
      fireRate: this.fireRate,
      direction: this.direction,
      score: this.score,
      id: this.id
    }
  }

}

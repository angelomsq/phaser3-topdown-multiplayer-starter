import Character from './Character';

export default class Enemy extends Character  {
  constructor(scene, config, type){
    super(scene, config);
    this.enemyType = type;
    this.damage = 1;
    this.drops = this.randomDrop();
    this.target = '';
    this.timer = 0;
    this.create();
  }

  create() {
    super.init();
    // this.addVisionRadius();

  }

  preUpdate (time, delta) {
    super.preUpdate(time, delta);
    // this.visionRadius.setPosition(this.x, this.y);
  }

  update(time, delta) {
    if(this.health>0) {
      //TODO: enemy behaviors and moviments
      this.timer += delta;
      while (this.timer > 2000) {
          let movementOptions = ['left', 'right', 'up', 'down'];
          this.direction = movementOptions[Math.floor(Math.random() * movementOptions.length)];
          this.timer = 0;
      }
      this.movement();
    }
  }

  addVisionRadius() {

    this.visionRadius = this.scene.add.circle(this.x, this.y, 64, 0x6666ff);
    this.visionRadius.sprite = this;
    this.scene.physics.world.enable(this.visionRadius);
    this.visionRadius.body.setCircle(64);
  }

  movement() {
    // console.log('entrou patrol');
    // console.log(this.direction);
    switch (this.direction) {
      case 'left':
        // console.log('entrou left');
        this.move('left', -this.speed, 0);
        break;
      case 'right':
        this.move('right', this.speed, 0);
        break;
      case 'up':
        this.move('up', 0, -this.speed);
        break;
      case 'down':
        // console.log('entrou down');
        this.move('down', 0, this.speed);
        break;

      default:
        // console.log('entrou default');
        this.stop();
        break;
    }
  }

  randomDrop() {
    let dropTypes = ['empty', 'fire', 'heart', 'coin'];
    return dropTypes[Math.floor(Math.random() * dropTypes.length)]
  }

  getObject() {
    return {
      id: this.id,
      scene: this.scene.key,
      image: this.image,
      w: this.w,
      h: this.h,
      x: this.x,
      y: this.y,
      type: this.enemyType,
      health: this.health,
      maxHealth: this.maxHealth,
      speed: this.speed,
      // bullets: this.bullets,
      maxBullets: this.maxBullets,
      fireRate: this.fireRate,
      direction: this.direction
    }
  }

}

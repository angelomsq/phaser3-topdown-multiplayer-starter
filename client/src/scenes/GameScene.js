import { Scene } from "phaser";
import io from 'socket.io-client';
import Player from '../models/Player';
import Enemy from '../models/Enemy';
import Coin from '../models/Coin';
import Heart from '../models/Heart';
import Fire from '../models/Fire';

class GameScene extends Scene {
  constructor(key, width, height) {
    super({ key });
    this.key = key;
    this.mapWidth = width;
    this.mapHeight = height;
    this.layers = {};
    this.players = {};
    this.enemies = {};
    // this.coins = {};
    this.items = {};
    // this.hearts = {};
    this.gamePaused = false;
    this.socket = io('http://localhost:3000');
  }

  // init(position) {
  //   this.scene.setVisible(false, this.key);
  //   let playerConfig = {
  //     scene: this.key,
  //     image: "player",
  //     w: 10,
  //     h: 16,
  //     x: position.x,
  //     y: position.y,
  //     type: 1,
  //     health: 5,
  //     speed: 120,
  //     direction: 'idle',
  //     id: this.socket.id
  //   };
  //   this.player = new Player(this, playerConfig);
  //   this.transition = true;
  //   this.input.keyboard.removeAllListeners();
  // }

  create(tilemap, tileset) {
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight).centerToBounds();
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

    // this.scale.displaySize.setAspectRatio( 1280/800 );
    // this.scale.refresh();

    //GROUPS
    this.playerGroup = this.physics.add.group();
    this.playerHurtboxGroup = this.physics.add.group();
    this.playerHitboxGroup = this.physics.add.group();
    this.playerBulletGroup = this.physics.add.group({active: false, visible: false});
    this.otherPlayerGroup = this.physics.add.group();
    this.otherPlayerHurtboxGroup = this.physics.add.group();
    this.otherPlayerHitboxGroup = this.physics.add.group();
    this.otherPlayerBulletGroup = this.physics.add.group({active: false, visible: false});
    this.enemyGroup = this.physics.add.group();
    this.enemyHurtboxGroup = this.physics.add.group();
    this.enemyVisionRadiusGroup = this.physics.add.group();
    this.enemyHitboxGroup = this.physics.add.group();
    this.itemGroup = this.physics.add.group();

    //MAP
    this.map = this.add.tilemap(tilemap);
    this.tileset = this.map.addTilesetImage(tileset.name,tileset.key, tileset.width, tileset.height, tileset.margin, tileset.spacing);

    //LAYERS
    // console.log(this.map);
    let count = 0;
    this.map.layers.map(layer => {
      this.layers[layer.name] = this.map.createStaticLayer(layer.name, [this.tileset], 0, 0);
      this.layers[layer.name].setCollisionByProperty({ collides: true });
      this.physics.add.collider(this.playerGroup, this.layers[layer.name]);
      this.layers[layer.name].setDepth(count);
      count++;
    });

    this.map.objects.map(layer => {
      if(layer.name == 'collisions') {
        // console.log(layer);
        this.collisionsLayer = this.map.createFromObjects(layer.name, layer.objects[0].gid, { key: layer.name });
        this.collisionsLayer.forEach((wall, index) => {
          // console.log(wall);
          wall.width = wall.width * wall._scaleX;
          wall.height = wall.height * wall._scaleY;
          this.physics.world.enable(wall);
          wall.body.immovable = true;
          wall.visible = false;

          //check custom properties
          if(layer.objects[index].properties) {
            if(layer.objects[index].properties[0].name == 'noTRBL') {
              if(layer.objects[index].properties[0].value[0] == '1') wall.body.checkCollision.up = false;
              if(layer.objects[index].properties[0].value[1] == '1') wall.body.checkCollision.right = false;
              if(layer.objects[index].properties[0].value[2] == '1') wall.body.checkCollision.down = false;
              if(layer.objects[index].properties[0].value[3] == '1') wall.body.checkCollision.left = false;
            }
          }
        });
      }
    });
    //This loads the collision tree, needed for overlapRect() on this.safePosition()
    this.physics.world.step(0);

    // this.socket.open();
    console.log(this.socket.id);
    console.log(this.socket);

    console.log(this.layers);

    //CONFIG NEW PLAYER
    let newPosition = this.safePosition(10, 16, 'player');
    let playerConfig = {
      scene: this.key,
      image: "char",
      w: 10,
      h: 16,
      x: newPosition.x,
      y: newPosition.y,
      type: 1,
      health: 5,
      maxHealth: 5,
      speed: 80,
      maxBullets: 1,
      fireRate: 300,
      direction: 'down',
      id: this.socket.id
    };

    // console.log('Socket ID:', playerConfig.id);
    this.player = this.addPlayer(playerConfig, 1); //new player (1st player)
    console.log('Player ID:', this.player.id);
    console.log('Player:', this.player);
    this.playerGroup.setDepth(5);
    this.otherPlayerGroup.setDepth(5);
    this.enemyGroup.setDepth(5);
    this.itemGroup.setDepth(5);

    //SET OVERLAPS AND COLLISIONS
    this.physics.add.collider(this.playerGroup, this.collisionsLayer, this.checkCollision);
    this.physics.add.collider(this.otherPlayerGroup, this.collisionsLayer, this.checkCollision);
    this.physics.add.collider(this.enemyGroup, this.collisionsLayer, this.checkEnemyCollision);

    this.physics.add.overlap(this.playerHurtboxGroup, this.itemGroup, this.collectItem, null, this);
    this.physics.add.overlap(this.playerHurtboxGroup, this.enemyHurtboxGroup, this.playerTouchEnemy, null, this);
    this.physics.add.overlap(this.playerBulletGroup, this.enemyHurtboxGroup, this.enemyHit, null, this);
    // this.physics.add.overlap(this.playerBulletGroup, this.otherPlayerGroup, this.otherPlayerHit, null, this);
    // this.physics.add.overlap(this.otherPlayerBulletGroup, this.enemyGroup, this.enemyHit, null, this);
    this.physics.add.overlap(this.playerBulletGroup, this.otherPlayerHurtboxGroup, this.playerHit, null, this);
    this.physics.add.overlap(this.playerHurtboxGroup, this.otherPlayerHurtboxGroup, this.playerOverlap, null, this);
    // this.physics.add.overlap(this.playerGroup, this.layers['decoration'], this.playerOverlap, null, this);

    // this.physics.add.overlap(this.playerHurtboxGroup, this.enemyVisionRadiusGroup, this.enemySeePlayer, null, this);

    //stop player when arrows are not pressed
    this.input.keyboard.on('keyup', (event) => {
      if (event.keyCode >= 37 && event.keyCode <= 40 && !this.player.attacking) {
        this.player.stop();
        this.socket.emit('PlayerStop', { x: this.player.x, y: this.player.y });
      }
    });

    //send new player information to server
    this.socket.emit("NewPlayerConnection", this.key, this.player.getObject());

    //receive broadcast from another new player
    this.socket.on("NewPlayer", (data) => {
      //set user type 2 for another player
      this.addPlayer(data, 2);
    });

    //receive allPlayers on Start
    this.socket.on("AllPlayers", (data) => {
      // console.log('AllPLayers: ',data);
      Object.keys(data).map(key => {
        // console.log('AllPLayers item: ',data[key]);
        if(data[key].id != this.player.id){
          //add all player to scene
          this.addPlayer(data[key], 2);
        }
      });

      //receive another player moves
      this.socket.on('PlayerMove', (data, speedX, speedY) => {
        // this.players[data.id].movePlayer(data, actionSpeed);
        this.players[data.id].move(data.direction, speedX, speedY);
        this.players[data.id].x = data.x;
        this.players[data.id].y = data.y;
        // this.players[data.id].direction = data.direction;
        // this.players[data.id].anims.play(`${data.image}-walk-${data.direction}`, true);
        // this.players[data.id].anims.play(data.direction, true);
        // console.log('move other player: ',this.players[data.id]);
      });
      //receive another player stops
      this.socket.on('PlayerStop', (data) => {
        this.players[data.id].stop();
        // this.players[data.id].stopPlayer(data);
      });

      //receive another player fires
      this.socket.on('PlayerFire', (data, time) => {
        this.players[data.id].firePlayer(data, time);
      });

      //receive another player hits
      this.socket.on('PlayerHit', (playerId) => {
        this.players[playerId].hit();
      });
      //receive another player disconnection
      this.socket.on('RemovePlayer', (playerId) => {
        this.players[playerId].kill();
        delete this.players[playerId];
      });

      //receive another player reset
      this.socket.on('ResetPlayer', (playerId, position, bullets) => {
        this.players[playerId].reset(position, bullets);
        // delete this.players[playerId];
      });

      //send info to server create a new coin
      this.socket.emit("NewItem", this.addItem('coin').getObject());

      //receive all game coins
      this.socket.on("AllItems", (data) => {
        console.log('All Items: ',data);
        Object.keys(data).map(key => {
          // console.log('All Items Item: ', data[key]);
          this.addItem(data[key].itemType, data[key]);
        });
      });

      //receive a new item creation
      this.socket.on("AddItem", (item) => {
        this.addItem(item.itemType, item);
      });

      //receive a item collected to remove from scene
      this.socket.on("RemoveItem", (id) => {
        // console.log(id);
        this.items[id].destroy();
        //Animate score number
        this.collectAnimation(this.items[id]);
        delete this.items[id];
      });

      //receive all game enemies
      this.socket.on("AllEnemies", (data) => {
        Object.keys(data).map(key => this.addEnemy(data[key]));
      });

      //receive a new enemy creation
      this.socket.on("AddEnemy", (data) => {
        this.addEnemy(data);
      });

      //receive a enemy kill to remove from scene
      this.socket.on("RemoveEnemy", (enemyId) => {
        // console.log(enemyId);
        this.enemies[enemyId].kill();
        //TODO: Animate enemy death
        delete this.enemies[enemyId];
      });

      //receive a new coin creation
      this.socket.on("AddBullet", (bulletId, playerId) => {
        this.players[playerId].addPlayerBullet(bulletId);
      });

      //receive a enemy kill to remove from scene
      this.socket.on("RemoveBullet", (bulletId) => {
        // console.log('receive bullet kill: ', bulletId);
        let allBullets = [...this.otherPlayerBulletGroup.getChildren(), ...this.playerBulletGroup.getChildren()];
        allBullets.map(bullet => {
          if(bullet.id === bulletId) bullet.kill();
        });
        //TODO: Animate bullet collision
        // delete this.enemies[id];
      });

    });

    // this.addEnemy('bat', 'bat-move');

    //send info to server create a new Enemy
    this.socket.emit("NewEnemy", this.addEnemy(this.createSkeleton()).getObject()); //'skeleton', this.safePosition(10, 16));
    this.gameHUD();

    this.textclick = this.add.bitmapText(150, 20, 'CGPixelMini', '').setScrollFactor(0).setDepth(3);
    this.input.mouse.disableContextMenu();

    // this.input.on('pointerup', function (pointer) {
    //   let overlap = this.physics.overlapRect(pointer.worldX, pointer.worldY, 10, 16, true, true);
    //   if(overlap.length!=0) console.log(`Overlap on ${pointer.worldX}x${pointer.worldY}.`);
    //   this.player.x = pointer.worldX;
    //   this.player.y = pointer.worldY;

    // }, this);

    this.game.events.on('hidden', () => {
      console.log('TAB CHANGED => KILL BULLETS AND STUFF!');
      let bullet;
      while(bullet = this.playerBulletGroup.getFirstAlive()) {
        bullet.kill(true);
      }
      // this.player.invincible = false;

      this.triggerTimer = this.time.addEvent({
        callback: this.checkOverlap(this.player, this.enemyHurtboxGroup),
        callbackScope: this,
        delay: 500, // 1000 = 1 second
        loop: true
      });

    });

    this.game.events.on('resume', () => {
      console.log('TAB RESUME => GET HEALTH BAR');
      this.player.getHealthBar();

    });

  }

  checkOverlap(player, enemyHurtbox) {
    let overlaps;
    if (overlaps = this.physics.overlap(player.hurtbox, enemyHurtbox)) {
      console.log(overlaps);
      if(!player.invincible && !player.dead) {
        console.log(player);
        player.hit();
        player.getHealthBar();
        if(this.socket.emit("PlayerHit", player.id)) console.log('EMIT HIT');
      }
    }
  }

  update(time, delta) {
    if(!this.gamePaused) this.player.update(time, delta);
    this.textHUD.setText(this.player.getScore()); // set the text to show the current score

    this.enemyGroup.getChildren().map( enemy => {
      enemy.update(time, delta);
    })

    let overlap = 'No';
    var pointer = this.input.activePointer;
    if(this.physics.overlapRect(pointer.worldX, pointer.worldY, 10, 10, true, true).length) overlap = 'Yes';
    this.textclick.setText([
        'x: ' + this.cameras.main.centerX,
        'y: ' + this.cameras.main.centerY,
        'isDown: ' + pointer.isDown,
        'overlap: ' + this.physics.overlapRect(pointer.worldX, pointer.worldY, 10, 10, true, true).length
    ]);
  }

  getRandomInt(min, max) {
    min = Math.ceil(min);
    max = Math.floor(max);
    return Math.floor(Math.random() * (max - min)) + min;
  }

  safePosition(width, height, text) {
    let position = {
      x: this.getRandomInt(0, this.mapWidth),
      y: this.getRandomInt(0, this.mapHeight)
    }

    // console.log(`GET POSITION (${width}x${height}):`);
    // console.log(position);
    let offsetX = position.x - Math.round(width/2);
    let offsetY = position.y - Math.round(height/2);
    // console.log('offsetX',offsetX, width);
    // console.log('offsetY',offsetY, height);
    let overlap = this.physics.overlapRect(offsetX, offsetY, width, height, true, true);
    if(overlap.length!=0){
      console.log(`OVERLAP ${text}: (${width}x${height}): ${overlap.length}`);
      console.log(overlap);
      return this.safePosition(width, height, text);
    }else{
      return position;
    }
  }

  addPlayer(data, type) {
    let newPlayer = new Player(this, data, type);
    newPlayer.setDepth(5);
    this.players[newPlayer.id] = newPlayer;
    // this.players[data.id].create();
    if(type==1) {
      this.playerGroup.add(newPlayer);
      this.playerHurtboxGroup.add(newPlayer.hurtbox);
    }
    if(type==2) {
      this.otherPlayerGroup.add(newPlayer);
      this.otherPlayerHurtboxGroup.add(newPlayer.hurtbox);
    }


    // this.players[data.id].setDepth(1);
    return newPlayer;
  }

  addItem(type, item) {
    let id = item != null ? item.id : null;
    let pos = item != null ? {x: item.x, y: item.y} : this.safePosition(8, 8, 'item');
    let newItem;
    switch (type.toLowerCase()) {
      case 'coin':
        newItem = new Coin(this, pos.x, pos.y, id);
        break;
      case 'heart':
        newItem = new Heart(this, pos.x, pos.y, id);
        break;
      case 'fire':
        newItem = new Fire(this, pos.x, pos.y, id);
        break;
      default:
        break;
    }
    this.itemGroup.add(newItem);
    this.items[newItem.id] = newItem;

    console.log('My Items: ', this.items);

    // console.log('New Item: ',newItem);
    return newItem;
  }

  addEnemy(data, type) {

    let newEnemy = new Enemy(this, data, type);
    this.enemies[newEnemy.id] = newEnemy;
    this.enemyGroup.add(newEnemy);
    this.enemyHurtboxGroup.add(newEnemy.hurtbox);
    // this.enemyVisionRadiusGroup.add(newEnemy.visionRadius);
    this.enemies[newEnemy.id].setDepth(5);
    return newEnemy;

    // this.enemies[data.id] = this.add.sprite(data.x, data.y, data.type);
    // this.enemies[data.id].id = data.id;
    // this.enemies[data.id].health = data.health;
    // this.enemies[data.id].damage = data.damage;
    // this.enemies[data.id].drops = data.drops;
    // // this.enemies[data.id].anims.play(`${data.type}-move`);
    // this.enemies[data.id].setOrigin(0.5, 0.5);
    // // this.enemies[data.id].body.setOffset(0, 0);
    // this.enemies[data.id].anims.play('idle-down-skeleton');
    // this.enemyGroup.add(this.enemies[data.id]);
    // this.enemies[data.id].setDepth(1);
  }

  collectItem(playerHurtbox, item) {

    let player = playerHurtbox.sprite;
    switch (item.itemType) {
      case 'Coin':
        player.score = player.score+item.score; // increment the score
        // player.addScore(item.score); TODO: Create this player method
        //send new coin to server to create a new one
        // this.socket.emit("NewItem", this.addItem('coin').getObject());
        break;
      case 'Heart':
        player.addHealth();
        break;
      case 'Fire':
        player.addBullet();
        break;

      default:
        break;
    }

    this.collectAnimation(item);
    this.socket.emit("CollectItem", item.id, player.id);
    delete this.items[item.id];
    item.destroy(); // remove item

    return false;
  }

  playerOverlap(playerHurtbox, otherPlayerHurtbox) {
    let player = playerHurtbox.sprite;
    let otherPlayer = otherPlayerHurtbox.sprite;

    // console.log('player overlaps another (depth/depth):', player.depth, otherPlayer.depth);
    this.playerDepthSort(player, otherPlayer);
  }

  playerDepthSort(player, object) {
    // console.log(object);
    if (player.y < object.y) {
      player.setDepth(object.depth-1);
    }else{
      player.setDepth(object.depth+1);
    }
  }

  enemySeePlayer(playerHurtbox, enemyVisionRadius) {
    let enemy = enemyVisionRadius.sprite;
    enemy.target = playerHurtbox;
    // enemy.chase(playerHurtbox);
  }

  playerTouchEnemy(playerHurtbox, enemyHurtbox) {
    // enemy.destroy();
    let player = playerHurtbox.sprite;
    let enemy = enemyHurtbox.sprite;
    this.playerDepthSort(player, enemy);
    if(!player.invincible && !player.dead) {
      player.hit();
      player.getHealthBar();
      this.cameras.main.shake(300, 0.005);
      this.socket.emit("PlayerHit", player.id);
    }
    // this.addEnemy('bat', 'bat-move');
  }

  playerHit(bullet, playerHurtbox) {
    // enemy.destroy();
    // console.log(player);
    // console.log(bullet);
    let player = playerHurtbox.sprite;

    if(!player.invincible && !player.dead){
      bullet.kill(true);
      player.hit();
      // player.getHealthBar();
      // this.cameras.main.shake(300, 0.005);
      this.socket.emit("PlayerHit", player.id);
    }
    // this.addEnemy('bat', 'bat-move');
  }

  otherPlayerHit(bullet, player) {
    if(bullet.owner != player.id) bullet.kill();
  }

  enemyHit(bullet, enemyHurtbox) {

    let enemy = enemyHurtbox.sprite;
    // if(!enemy.invincible){
    //   bullet.kill();
    //   enemy.hit();
    //   //TODO: Show Enemy lifebar
    // }
    enemy.kill();
    //emit enemy kill
    this.socket.emit("enemyKill", enemy.id, bullet.owner);

    if(enemy.drops != 'empty'){
      // console.log(enemy.drops);
      //emit droped item
      // this.socket.emit("NewItem", enemy.x, enemy.y, enemy.drops);
      this.socket.emit("NewItem", this.addItem(enemy.drops, {x: enemy.x, y:enemy.y}).getObject() );
    }
    //emit new enemy
    // this.socket.emit("NewEnemy", 'skeleton', this.safePosition(10, 16));
    this.socket.emit("NewEnemy", this.addEnemy(this.createZombie()).getObject());

    bullet.kill(true);
  }

  collectAnimation(item) {
    let effect = this.add.bitmapText(item.x, item.y, 'CGPixelMini', item.collectText()).setDepth(10);
    this.tweens.add({
      targets: effect,
      y: item.y-16,
      duration: 1500,
      ease: 'Back',
      alpha: { from: 1, to: 0 },
      onComplete: function () {
        effect.destroy();
      },
    });
  }

  gameHUD() {
    this.healthBar = [];
    this.player.getHealthBar();
    this.textHUD = this.add.bitmapText(this.cameras.main.width-44, 4, 'CGPixelMini', this.player.getScore()).setScrollFactor(0).setDepth(3);
    this.textHUD2 = this.add.bitmapText(5, 12, 'CGPixelMini', `Player: ${this.player.id}`).setOrigin(0, 0).setScrollFactor(0).setDepth(3);
    // this.healthBar.setDepth(3);
    this.player.menuItems = [
      { text: 'BACK', action: 'GO', scene: 'MenuScreen', lineHeight: 16 },
      { text: 'RESTART', action: 'RESTART', scene: '', lineHeight: 16 }
    ];
    this.createMenu('GAME OVER', this.player.menuItems);
  }

  createMenu(title, items) {
    this.player.menubox = this.add.rectangle(this.cameras.main.centerX, this.cameras.main.centerY, this.cameras.main.width/2, this.cameras.main.height/2, 0x6666ff).setScrollFactor(0).setDepth(90).setVisible(false).setActive(false);
    // console.log(this.player.menubox);
    let menuTopCenter = this.player.menubox.getTopCenter();
    this.player.menuboxTitle = this.add.bitmapText(menuTopCenter.x, menuTopCenter.y+8, 'PS2PFont', title).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(99).setVisible(false).setActive(false);
    items.map((item, index) => {
      let order = index+1;
      let startPoint = {x: menuTopCenter.x, y: menuTopCenter.y+16};
      item.link = this.add.bitmapText(startPoint.x, startPoint.y+(item.lineHeight*order), 'PS2PFont', item.text).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(99).setVisible(false).setActive(false);
      item.link.setInteractive();
      item.link.on('pointerover', () => { item.link.setTintFill('0x333333') });
      item.link.on('pointerout', () => { item.link.clearTint() });
      item.link.on('pointerup', () => {
        if(item.action == 'GO') item.scene && this.exitScene(item.scene);
        if(item.action == 'RESTART') this.restartGame();
      });
    });

  }

  showMenu(playerId) {
    // if(this.player.id === playerId){
      this.player.menubox.setActive(true).setVisible(true);
      this.player.menuboxTitle.setActive(true).setVisible(true);
      this.player.menuItems.map(item => {
        item.link.setActive(true).setVisible(true);
      });

    // }
  }

  exitScene(scene) {
    let playerId = this.player.id;
    this.player.kill();
    delete this.players[playerId];
    this.socket.close();
    this.gamePaused = false;
    // this.scene.shutdown();
    this.scene.start(scene);
    this.scene.remove(this);
  }

  restartGame() {
    this.gamePaused = false;
    //emit restart to server (clear player data)
    this.player.reset(this.safePosition(10, 16, 'player'));
    this.player.getHealthBar();
    this.socket.emit('playerReset',this.key,this.player.getObject());
    // this.player.destroy()
    //restart map scene
    // this.scene.restart();
    this.player.menubox.setActive(false).setVisible(false);
    this.player.menuboxTitle.setActive(false).setVisible(false);
    this.player.menuItems.map(item => {
      item.link.setActive(false).setVisible(false);
    });
    //broadcast new player
  }

  checkEnemyCollision(object, enemy) {
    let movementOptions;
    if (enemy.body.touching.down && object.body.touching.up) {
      enemy.stop();
      movementOptions = ['left', 'right', 'up'];
      enemy.direction = movementOptions[Math.floor(Math.random() * movementOptions.length)];
    }

    if (enemy.body.touching.up && object.body.touching.down) {
      enemy.stop();
      movementOptions = ['left', 'right', 'down'];
      enemy.direction = movementOptions[Math.floor(Math.random() * movementOptions.length)];
    }

    if (enemy.body.touching.left && object.body.touching.right) {
      enemy.stop();
      movementOptions = ['down', 'right', 'up'];
      enemy.direction = movementOptions[Math.floor(Math.random() * movementOptions.length)];
    }

    if (enemy.body.touching.right && object.body.touching.left) {
      enemy.stop();
      movementOptions = ['down', 'left', 'up'];
      enemy.direction = movementOptions[Math.floor(Math.random() * movementOptions.length)];
    }

  }

  checkCollision(object, player) {
    // console.log(object.body);
    if(object.body.checkCollision.up == false && player.direction == 'down') {
      player.y++;
    }
    if(object.body.checkCollision.down == false && player.direction == 'up') {
      player.y--;
    }
    if(object.body.checkCollision.left == false && player.direction == 'right') {
      player.x++;
      // player.y++;
    }
    if(object.body.checkCollision.right == false && player.direction == 'left') {
      player.x--;
      // player.y++;
    }
  }

  createZombie() {
    let newEnemyPosition = this.safePosition(10, 16, 'enemy');
    let enemyConfig = {
      scene: this.key,
      image: "zombie",
      w: 10,
      h: 16,
      x: newEnemyPosition.x,
      y: newEnemyPosition.y,
      type: 1,
      health: 5,
      maxHealth: 5,
      speed: 40,
      maxBullets: 1,
      fireRate: 300,
      direction: 'down'
    };

    return enemyConfig;
  }

  createSkeleton() {
    let newEnemyPosition = this.safePosition(10, 16, 'enemy');
    let enemyConfig = {
      scene: this.key,
      image: "skeleton",
      w: 10,
      h: 16,
      x: newEnemyPosition.x,
      y: newEnemyPosition.y,
      type: 1,
      health: 5,
      maxHealth: 5,
      speed: 40,
      maxBullets: 1,
      fireRate: 300,
      direction: 'down'
    };

    return enemyConfig;
  }

  createBat() {
    let newEnemyPosition = this.safePosition(10, 16,'enemy');
    let enemyConfig = {
      scene: this.key,
      image: "bat",
      w: 10,
      h: 16,
      x: newEnemyPosition.x,
      y: newEnemyPosition.y,
      type: 1,
      health: 5,
      maxHealth: 5,
      speed: 80,
      maxBullets: 1,
      fireRate: 300,
      direction: 'down'
    };

    return enemyConfig;
  }

}

export default GameScene;

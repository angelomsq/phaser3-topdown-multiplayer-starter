import { Scene } from 'phaser';
// import DungeonMap from "./DungeonMap";

class MenuScreen extends Scene {
  constructor() {
    super({ key: 'MenuScreen' });
  }

  // init() {
  //   super.init(this.safePosition(10, 16));//safe position for player sprite (10x16)px
  // }

  create() {
    var menuItems = [
      { text: 'START', action: 'GO', scene: 'DungeonMap', lineHeight: 16 },
      { text: 'OPTIONS', action: 'GO', scene: 'OptionScreen', lineHeight: 16 }
    ];
    this.createMenu(this.cameras.main.width, this.cameras.main.height, 'Menu Screen', menuItems);
  }

  createMenu(w, h, title, items) {
    this.add.bitmapText(w/2, h/10, 'PS2PFont', 'MENU SCREEN').setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(99)
    items.map((item, index) => {
      let order = index+1;
      let startPoint = {x: w/2, y: (h/10)+16};
      item.link = this.add.bitmapText(startPoint.x, startPoint.y+(item.lineHeight*order), 'PS2PFont', item.text).setOrigin(0.5, 0.5).setScrollFactor(0).setDepth(99);
      item.link.setInteractive();
      item.link.on('pointerover', () => { item.link.setTintFill('0x333333') });
      item.link.on('pointerout', () => { item.link.clearTint() });
      item.link.on('pointerup', () => {
        if(item.action == 'GO') item.scene && this.goToScene(item.scene);
        if(item.action == 'RESTART') this.restartGame();
      });
    });
  }

  goToScene(scene) {
    // this.scene.add(scene, DungeonMap);
    this.scene.start(scene);
  }
}

export default MenuScreen;

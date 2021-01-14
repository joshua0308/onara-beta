// import Phaser from 'phaser';
import initAnimations from './playerAnims.js';
import collidable from '../mixins/collidable.js';

class Player extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y, socket) {
    super(scene, x, y, 'player');

    this.socket = socket;

    // add existing context - this will add image and set gravity
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Mixins
    Object.assign(this, collidable);

    this.init();
    this.initEvents();
    this.socket.emit('playerMovement', { x, y, flipX: false })
  }

  init() {
    this.gravity = 500;
    this.playerSpeed = 200;
    this.jumpCount = 0;
    this.consecutiveJumps = 1;
    this.cursors = this.scene.input.keyboard.createCursorKeys();

    this.body.setGravityY(this.gravity);
    this.setCollideWorldBounds(true);
    this.setOrigin(0.5, 1);

    initAnimations(this.scene.anims);
  }

  initEvents() {
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this)
  }

  update() {
    const { left, right, up, space } = this.cursors;
    const isSpaceJustDown = Phaser.Input.Keyboard.JustDown(space);
    const isUpJustDown = Phaser.Input.Keyboard.JustDown(up);
    const onFloor = this.body.onFloor();

    if (left.isDown) {
      this.setVelocityX(-this.playerSpeed);
      this.setFlipX(true);
    } else if (right.isDown) {
      this.setVelocityX(this.playerSpeed);
      this.setFlipX(false);
    } else {
      this.setVelocityX(0);
    }

    if ((isSpaceJustDown || isUpJustDown) && (onFloor || this.jumpCount < this.consecutiveJumps)) {
      this.setVelocityY(-this.playerSpeed * 1.8);
      this.jumpCount += 1;
    }

    if (onFloor) {
      this.jumpCount = 0;
    }

    let x = this.x;
    let y = this.y;
    let flipX = this.flipX;

    if (this.oldPosition && (x !== this.oldPosition.x || y !== this.oldPosition.y)) {
      this.socket.emit('playerMovement', { x, y, flipX })
    }

    onFloor ?
      this.body.velocity.x !== 0 ?
        this.play('run', true) : this.play('idle', true) :
      this.play('jump', true);
    // second param - ignore animation if its playing

    this.oldPosition = {
      x: this.x,
      y: this.y,
      flipX: this.flipX
    }
  }
}

export default Player;
import Player from './Player.js';

class Container extends Phaser.GameObjects.Container {
  constructor(scene, x, y, socket) {
    super(scene, x, y);

    this.socket = socket;
    this.setSize(32, 38)

    // add existing context - this will add image and set gravity
    scene.add.existing(this);
    scene.physics.add.existing(this);


    const player = scene.add.sprite(0, 0, 'player', 0);
    this.add(player);

    // Mixins
    // Object.assign(this, collidable);

    // // allow mouseover event listener
    // this.setInteractive();

    this.init();
    this.initEvents();
    // this.motion = 'idle';
    // this.socket.emit('playerMovement', { x, y, flipX: false, motion: this.motion })
  }

  init() {
    this.gravity = 500;
    //   this.playerSpeed = 200;
    //   this.jumpCount = 0;
    //   this.consecutiveJumps = 1;
    //   this.cursors = this.scene.input.keyboard.createCursorKeys();

    this.body.setGravityY(this.gravity);
    this.body.setCollideWorldBounds(true);
    //   this.setOrigin(0.5, 1);

    //   initAnimations(this.scene.anims);
  }

  initEvents() {
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this)
  }

  update() {
    //   const { left, right, up, space } = this.cursors;
    //   const isSpaceJustDown = Phaser.Input.Keyboard.JustDown(space);
    //   const isUpJustDown = Phaser.Input.Keyboard.JustDown(up);
    //   const onFloor = this.body.onFloor();

    //   if (left.isDown) {
    //     this.setVelocityX(-this.playerSpeed);
    //     this.setFlipX(true);
    //     this.motion = 'run';
    //   } else if (right.isDown) {
    //     this.setVelocityX(this.playerSpeed);
    //     this.setFlipX(false);
    //     this.motion = 'run';
    //   } else if (!onFloor) {
    //     this.motion = 'jump';
    //   } else {
    //     this.setVelocityX(0);
    //     this.motion = 'idle';
    //   }

    //   if ((isSpaceJustDown || isUpJustDown) && (onFloor || this.jumpCount < this.consecutiveJumps)) {
    //     this.setVelocityY(-this.playerSpeed * 1.5);
    //     this.jumpCount += 1;
    //   }

    //   if (onFloor) {
    //     this.jumpCount = 0;
    //   }

    //   // set animation based on movement
    //   if (onFloor && this.body.velocity.x !== 0) {
    //     this.motion = 'run';
    //   } else if (onFloor && this.body.velocity.x === 0) {
    //     this.motion = 'idle';
    //   } else if (!onFloor) {
    //     this.motion = 'jump';
    //   }

    //   this.play(this.motion, true);

    //   // if the player is moving, emit position and motion to the server
    //   const isMoving = this.oldPosition && (this.x !== this.oldPosition.x || this.y !== this.oldPosition.y);

    //   if (isMoving) {
    //     this.socket.emit('playerMovement',
    //       { x: this.x, y: this.y, flipX: this.flipX, motion: this.motion })
    //   }

    //   this.oldPosition = {
    //     x: this.x,
    //     y: this.y,
    //     flipX: this.flipX
    //   }
  }
}

export default Container;
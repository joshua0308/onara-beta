import collidable from '../mixins/collidable.js';
import initAnimations from './newPlayerAnims.js';

class MyPlayer extends Phaser.GameObjects.Container {
  constructor(scene, x, y, socket, playerInfo) {
    super(scene, x, y);
    if (playerInfo.gender) {
      this.characterType = playerInfo.gender === 'male' ? 'boy' : 'girl';
    } else {
      this.characterType = 'girl';
    }

    this.playerInfo = playerInfo;
    this.socket = socket;
    Object.assign(this, collidable);

    this.setupContainer();
    this.createSprite();
    this.createPlayerName(this.playerInfo.displayName);
    this.init();

    this.setInteractive().on(
      Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN,
      () => {
        this.scene.userInterfaceManager.createPlayerProfileInterface(
          playerInfo,
          true
        );
      }
    );

    this.socket.emit('player-movement', {
      x,
      y,
      flipX: false,
      motion: this.motion
    });
  }

  init() {
    this.gravity = 1400;
    this.playerSpeed = 400;
    this.jumpCount = 0;
    this.consecutiveJumps = 1;
    this.cursors = this.scene.input.keyboard.createCursorKeys();
    this.scene.input.keyboard.disableGlobalCapture();

    this.body.setGravityY(this.gravity);
    this.body.setCollideWorldBounds(true);

    initAnimations(this.scene.anims);
    this.motion = 'idle';
    this.scene.events.on(Phaser.Scenes.Events.UPDATE, this.update, this);
  }

  setupContainer() {
    this.setSize(70, 230);

    // add existing context - this will add image and set gravity
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
  }

  createSprite() {
    const player = this.scene.add.sprite(0, 0, `${this.characterType}-idle`, 0);
    player.setScale(0.4);
    player.name = 'sprite';
    this.add(player);
  }

  createPlayerName(name) {
    // ADD TEXT
    const nameElement = document.createElement('div');
    nameElement.setAttribute('id', 'player-sprite');
    nameElement.innerText = name;
    nameElement.style.fontSize = '20px';
    this.nameChild = this.scene.add.dom(0, 0, nameElement);
    this.nameChild.setOrigin(0.5, 5);
    this.add(this.nameChild);
  }

  removePlayerName() {
    this.remove(this.nameChild, true);
  }

  updatePlayerName(updatedName) {
    this.removePlayerName();
    this.createPlayerName(updatedName);
  }

  updateCharacterType(type) {
    this.characterType = type === 'male' ? 'boy' : 'girl';
  }

  update() {
    if (!this.body) return;

    const { left, right, up, space } = this.cursors;
    const isSpaceJustDown = Phaser.Input.Keyboard.JustDown(space);
    const isUpJustDown = Phaser.Input.Keyboard.JustDown(up);
    const onFloor = this.body.onFloor();
    const sprite = this.getByName('sprite');

    if (left.isDown) {
      this.body.setVelocityX(-this.playerSpeed);
      sprite.setFlipX(true);
      this.motion = 'walk';
    } else if (right.isDown) {
      this.body.setVelocityX(this.playerSpeed);
      sprite.setFlipX(false);
      this.motion = 'walk';
    } else if (!onFloor) {
      this.motion = 'jump';
    } else {
      this.body.setVelocityX(0);
      this.motion = 'idle';
    }

    if (onFloor) {
      this.jumpCount = 0;
    }

    if (
      (isSpaceJustDown || isUpJustDown) &&
      (onFloor || this.jumpCount < this.consecutiveJumps)
    ) {
      this.body.setVelocityY(-this.playerSpeed * 2.1);
      // this.startJumpMotion = false;
      // setTimeout(() => {
      //   // need to bend the knees before jumping
      //   // as soon as sprite is off the ground
      //   // set the startJumpMotion property to false
      //   this.body.setVelocityY(-this.playerSpeed * 1.3);
      //   this.startJumpMotion = false;
      // }, 310);
      this.jumpCount += 1;
      // this.startJumpMotion = true;
    }

    if (onFloor) {
      this.jumpCount = 0;
    }

    // set animation based on movement
    if (onFloor && this.body.velocity.x !== 0) {
      this.motion = 'walk';
    } else if (onFloor && this.body.velocity.x === 0) {
      this.motion = 'idle';
    } else if (!onFloor) {
      this.motion = 'jump';
    }

    sprite.play(`${this.characterType}-${this.motion}`, true);

    // if the player is moving, emit position and motion to the server
    const isMoving =
      this.oldPosition &&
      (this.x !== this.oldPosition.x || this.y !== this.oldPosition.y);

    if (isMoving) {
      this.socket.emit('player-movement', {
        x: this.x,
        y: this.y,
        flipX: sprite.flipX,
        motion: this.motion
      });
    }

    this.oldPosition = {
      x: this.x,
      y: this.y,
      flipX: sprite.flipX
    };
  }
}

export default MyPlayer;

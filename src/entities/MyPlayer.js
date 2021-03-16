import collidable from '../mixins/collidable.js';
import initAnimations from './newPlayerAnims.js';
import React from 'jsx-dom';

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
    const NameElement = (
      <div
        id="player-sprite"
        style={{
          fontSize: '15px',
          color: 'white',
          padding: '0px 5px'
          // backgroundColor: '#ffffff54',
          // borderRadius: '10px',
        }}
      >
        {name}
      </div>
    );

    this.nameChild = this.scene.add.dom(0, 0, NameElement);
    this.nameChild.setOrigin(0.6, 6.2);
    this.add(this.nameChild);
  }

  createMessage(message) {
    console.log('this.messageChild', this.messageChild);
    if (this.messageChild) {
      clearTimeout(this.messageTimeout);
      this.remove(this.messageChild, true);
      this.messageChild = null;
      this.messageTimeout = null;
    }

    const messageElement = (
      <div
        id="player-message"
        style={{
          fontSize: '15px',
          minWidth: '120px',
          minHeight: '50px',
          backgroundColor: 'rgb(133 133 133 / 78%)',
          borderRadius: '15px',
          padding: '5px',
          color: 'black'
        }}
      >
        <div
          style={{
            minWidth: '120px',
            minHeight: '50px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <p
            style={{
              textAlign: 'center',
              overflowWrap: 'break-word',
              wordWrap: 'break-word',
              hyphens: 'auto',
              maxWidth: '100px',
              overflow: 'auto',
              margin: '0px'
            }}
          >
            {message}
          </p>
        </div>
      </div>
    );

    const messageChild = this.scene.add.dom(0, -180, messageElement);
    this.add(messageChild);
    this.messageChild = messageChild;

    this.messageTimeout = setTimeout(() => {
      this.remove(messageChild, true);
      this.messageChild = null;
      this.messageTimeout = null;
    }, 4000);
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

    const { left, right, up, down } = this.cursors;
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
    } else if (down.isDown) {
      this.body.setVelocityX(0);
      this.motion = 'duck';
    } else if (!onFloor) {
      this.motion = 'jump';
    } else {
      this.body.setVelocityX(0);
      this.motion = 'idle';
    }

    if (onFloor) {
      this.jumpCount = 0;
    }

    if (isUpJustDown && (onFloor || this.jumpCount < this.consecutiveJumps)) {
      this.body.setVelocityY(-this.playerSpeed * 2.1);
      this.jumpCount += 1;
    }

    if (onFloor) {
      this.jumpCount = 0;
    }

    if (!onFloor) {
      this.motion = 'jump';
    }

    sprite.play(`${this.characterType}-${this.motion}`, true);

    // if the player is moving, emit position and motion to the server
    const isMoving =
      (this.oldPosition &&
        (this.x !== this.oldPosition.x || this.y !== this.oldPosition.y)) ||
      this.oldMotion !== this.motion;

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

    this.oldMotion = this.motion;
  }
}

export default MyPlayer;

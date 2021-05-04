import collidable from '../mixins/collidable.js';
import initAnimations from './newPlayerAnims.js';
import React from 'jsx-dom';

class MyPlayer extends Phaser.GameObjects.Container {
  constructor(scene, x, y, socket, playerInfo) {
    super(scene, x, y);
    this.setCharacterType(playerInfo.gender);

    this.playerInfo = playerInfo;
    this.socket = socket;
    Object.assign(this, collidable);

    this.setupContainer();
    this.createSprite();
    this.createPlayerName(this.playerInfo.displayName);
    this.init();

    this.setInteractive().on(
      Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN,
      (_, __, ___, e) => {
        e.stopPropagation();

        setTimeout(
          () =>
            this.scene.userInterfaceManager.createPlayerProfileInterface(
              playerInfo,
              true
            ),
          50
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
    this.updateSize();

    // add existing context - this will add image and set gravity
    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
  }

  setCharacterType(gender) {
    switch (gender) {
      case 'male':
        this.characterType = 'boy';
        break;
      case 'female':
        this.characterType = 'girl';
        break;
      case 'cat':
        this.characterType = 'cat';
        break;
      case 'dog':
        this.characterType = 'dog';
        break;
      default:
        this.characterType = 'boy';
        break;
    }
  }

  createSprite() {
    const player = this.scene.add.sprite(0, 0, `${this.characterType}-idle`, 0);
    this.player = player;

    this.updateScale();
    player.name = 'sprite';
    this.add(player);
  }

  getSize() {
    let size = [70, 230];

    if (['dog', 'cat'].includes(this.characterType)) {
      size = [70, 140];
    }

    return size;
  }

  getScale() {
    let scale = 0.4;

    if (['dog', 'cat'].includes(this.characterType)) {
      scale = 0.2;
    }

    return scale;
  }

  getNameOrigin() {
    let origin = [0.5, 6.2];

    if (['dog', 'cat'].includes(this.characterType)) {
      origin = [0.5, 4.2];
    }

    return origin;
  }

  getMessageOrigin() {
    let origin = [0, -180];

    if (['dog', 'cat'].includes(this.characterType)) {
      origin = [0, -130];
    }

    return origin;
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
    this.nameChild.setOrigin(...this.getNameOrigin());
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
          backgroundColor: 'rgb(200 200 200 / 85%)',
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

    const messageChild = this.scene.add.dom(
      ...this.getMessageOrigin(),
      messageElement
    );
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

  updateCharacterType(type) {
    this.setCharacterType(type);
    this.updateSize();
    this.updateScale();
  }

  updatePlayerName(updatedName) {
    this.removePlayerName();
    this.createPlayerName(updatedName);
  }

  updateScale() {
    this.player.setScale(this.getScale());
  }

  updateSize() {
    console.log('updateSize', ...this.getSize());
    this.setSize(...this.getSize());
    // eslint-disable-next-line no-console
    console.log('debug: this', this);
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

      if (this.scene.nativePeerManager.isConnected()) {
        this.motion = 'drink';
      } else {
        this.motion = 'idle';
      }
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

import collidable from '../mixins/collidable.js';
import initAnimations from './playerAnims.js';

class Container extends Phaser.GameObjects.Container {
  constructor(scene, x, y, socket, playerInfo) {
    super(scene, x, y);

    this.playerInfo = playerInfo;
    this.socket = socket;
    this.setSize(32, 38)

    // add existing context - this will add image and set gravity
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // ADD PLAYER
    const player = scene.add.sprite(0, 0, 'player', 0);
    player.name = 'sprite';
    this.add(player);

    // ADD TEXT
    const text = scene.add.text(0, 30, this.playerInfo.displayName);
    text.setOrigin(0.5, 0.5)
    this.add(text);

    // Mixins
    Object.assign(this, collidable);

    this.playerInfoText = this.createPlayerInfoText(scene, this, this.playerInfo);
    this.buyDrinkButton = this.createBuyDrinkButton(scene, this);

    this.setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        this.playerInfoText.setVisible(!this.playerInfoText.visible);
        this.buyDrinkButton.buyDrinkButtonOver.setVisible(!this.buyDrinkButton.buyDrinkButtonOver.visible);
        this.buyDrinkButton.buyDrinkText.setVisible(!this.buyDrinkButton.buyDrinkText.visible);
      });


    this.init();
    this.initEvents();
    this.motion = 'idle';
    this.socket.emit('playerMovement', { x, y, flipX: false, motion: this.motion })
  }

  createBuyDrinkButton(scene, container) {
    /**
     * BUY DRINK BUTTON
     */
    const buyDrinkButtonOver = scene.add.image(0, 0, 'button1');
    const buyDrinkButtonDown = scene.add.image(0, 0, 'button3');
    const buttons = [buyDrinkButtonOver, buyDrinkButtonDown]
    container.add(buttons);

    buttons.forEach(button => {
      button
        .setOrigin(0.5, 2.5)
        .setScale(1, 0.5)
        .setVisible(false)
    })

    buyDrinkButtonOver
      .setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        console.log('pointer down');
        buyDrinkButtonDown.setVisible(true);
      })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_UP, () => {
        console.log('pointer up');
        buyDrinkButtonDown.setVisible(false);
      })
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_OUT, () => {
        console.log('pointer out');
        buyDrinkButtonDown.setVisible(false);
      });

    /**
     * BUY DRINK TEXT
     */
    const buyDrinkText = scene.add.text(0, 0, 'Buy a drink!');
    container.add(buyDrinkText);

    buyDrinkText
      .setFill('#353d42')
      .setPadding(10, 20)
      .setOrigin(0.5, 1.3)
      .setVisible(false);

    return {
      buyDrinkButtonDown,
      buyDrinkButtonOver,
      buyDrinkText
    }
  }

  createPlayerInfoText(scene, container, playerInfo) {
    const playerInfoTextContent = `name: ${playerInfo.displayName}\nemail: ${playerInfo.email}
    `;
    const playerInfoText = scene.add.text(0, 0, playerInfoTextContent);
    container.add(playerInfoText);

    playerInfoText
      .setFill('black')
      .setBackgroundColor('#8cd1ff')
      .setPadding(10, 20)
      .setOrigin(0.5, 1.3)
      .setVisible(false);

    return playerInfoText;
  }

  init() {
    this.gravity = 500;
    this.playerSpeed = 200;
    this.jumpCount = 0;
    this.consecutiveJumps = 1;
    this.cursors = this.scene.input.keyboard.createCursorKeys();

    this.body.setGravityY(this.gravity);
    this.body.setCollideWorldBounds(true);

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
    const sprite = this.getByName('sprite');

    if (left.isDown) {
      this.body.setVelocityX(-this.playerSpeed);
      sprite.setFlipX(true);
      this.motion = 'run';
    } else if (right.isDown) {
      this.body.setVelocityX(this.playerSpeed);
      sprite.setFlipX(false);
      this.motion = 'run';
    } else if (!onFloor) {
      this.motion = 'jump';
    } else {
      this.body.setVelocityX(0);
      this.motion = 'idle';
    }

    if ((isSpaceJustDown || isUpJustDown) && (onFloor || this.jumpCount < this.consecutiveJumps)) {
      this.body.setVelocityY(-this.playerSpeed * 1.5);
      this.jumpCount += 1;
    }

    if (onFloor) {
      this.jumpCount = 0;
    }

    // set animation based on movement
    if (onFloor && this.body.velocity.x !== 0) {
      this.motion = 'run';
    } else if (onFloor && this.body.velocity.x === 0) {
      this.motion = 'idle';
    } else if (!onFloor) {
      this.motion = 'jump';
    }

    sprite.play(this.motion, true);

    // if the player is moving, emit position and motion to the server
    const isMoving = this.oldPosition && (this.x !== this.oldPosition.x || this.y !== this.oldPosition.y);

    if (isMoving) {
      this.socket.emit('playerMovement',
        {
          x: this.x,
          y: this.y,
          flipX: sprite.flipX,
          motion: this.motion
        })
    }

    this.oldPosition = {
      x: this.x,
      y: this.y,
      flipX: sprite.flipX,
    }
  }
}

export default Container;

// class PlayerInfoDisplayContainer extends Phaser.GameObjects.Container {
//   constructor(scene, x, y) {
//     super(scene, x, y);

//   }
// }
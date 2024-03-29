import React from 'jsx-dom';

class OtherPlayer extends Phaser.GameObjects.Container {
  constructor(
    scene,
    x,
    y,
    socket,
    playerInfo,
    otherPlayersGroup,
    userInterfaceManager
  ) {
    super(scene, x, y);
    this.setCharacterType(playerInfo.gender);

    this.uid = playerInfo.uid;
    this.socket = socket;
    this.socketId = playerInfo.socketId;
    this.userInterfaceManager = userInterfaceManager;

    this.setupContainer();
    this.createSprite();
    this.createPlayerName(playerInfo.displayName);

    this.setInteractive().on(
      Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN,
      (_, __, ___, e) => {
        e.stopPropagation();

        setTimeout(
          () =>
            this.userInterfaceManager.createPlayerProfileInterface(
              playerInfo,
              false
            ),
          50
        );
      }
    );

    otherPlayersGroup.add(this);
  }

  setupContainer() {
    this.setSize(70, 230);
    this.setInteractive();

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
    player.play(`${this.characterType}-idle`, true);
    this.add(player);
  }

  getScale() {
    let scale = 0.4;

    if (['dog', 'cat'].includes(this.characterType)) {
      scale = 0.2;
    }

    return scale;
  }

  createPlayerName(name) {
    const NameElement = (
      <div
        id="player-sprite"
        style={{
          fontSize: '15px',
          color: 'white',
          padding: '0px 5px'
        }}
      >
        {name}
      </div>
    );
    this.nameChild = this.scene.add.dom(0, 0, NameElement);
    this.nameChild.setOrigin(0.5, 6.2);
    this.add(this.nameChild);
  }

  createMessage(message) {
    console.log('createmessage', message);
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

  updateScale() {
    const scale = this.getScale();
    this.player.setScale(scale);
  }

  updateCharacterType(type) {
    this.setCharacterType(type);
    this.updateScale();

    const sprite = this.getByName('sprite');
    sprite.play(`${this.characterType}-idle`, true); // need to play anim to change the character type
  }

  updateMovement(otherPlayerInfo) {
    const sprite = this.getByName('sprite');
    this.setPosition(otherPlayerInfo.x, otherPlayerInfo.y);
    sprite.flipX = otherPlayerInfo.flipX;
    sprite.play(`${this.characterType}-${otherPlayerInfo.motion}`, true);
  }

  destroy() {
    this.removeAll(true); // remove all children and destroy
    this.body.destroy(); // destroy the container itself
  }
}

export default OtherPlayer;

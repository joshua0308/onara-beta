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
    if (playerInfo.gender) {
      this.characterType = playerInfo.gender === 'male' ? 'boy' : 'girl';
    } else {
      this.characterType = 'girl';
    }

    this.uid = playerInfo.uid;
    this.socket = socket;
    this.socketId = playerInfo.socketId;
    this.userInterfaceManager = userInterfaceManager;

    this.setupContainer();
    this.createSprite();
    this.createPlayerName(playerInfo.displayName);

    this.setInteractive().on(
      Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN,
      () => {
        this.userInterfaceManager.createPlayerProfileInterface(
          playerInfo,
          false
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

  createSprite() {
    const player = this.scene.add.sprite(0, 0, `${this.characterType}-idle`, 0);
    player.name = 'sprite';
    player.setScale(0.4);
    player.play(`${this.characterType}-idle`, true);
    this.add(player);
  }

  createPlayerName(name) {
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
          width: '100px',
          height: '70px',
          backgroundColor: '#ffffff54',
          borderRadius: '15px',
          padding: '5px',
          overflow: 'auto',
          color: 'black'
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
    );

    const messageChild = this.scene.add.dom(0, 0, messageElement);
    messageChild.setOrigin(0.55, 3);
    this.add(messageChild);
    this.messageChild = messageChild;

    this.messageTimeout = setTimeout(() => {
      this.remove(messageChild, true);
      this.messageChild = null;
      this.messageTimeout = null;
    }, 3000);
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

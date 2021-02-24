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

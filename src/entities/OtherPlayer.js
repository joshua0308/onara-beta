class OtherPlayer extends Phaser.GameObjects.Container {
  constructor(scene, x, y, socket, playerInfo, otherPlayersGroup, userInterfaceManager) {
    super(scene, x, y);

    this.uid = playerInfo.uid;
    this.socket = socket;
    this.socketId = playerInfo.socketId;
    this.userInterfaceManager = userInterfaceManager;

    this.setupContainer();
    this.createSprite();
    this.createPlayerName(playerInfo.displayName);


    this.setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        console.log('down');
        this.userInterfaceManager.createPlayerProfileInterface(playerInfo, socket);
      });

    otherPlayersGroup.add(this);
  }

  setupContainer() {
    this.setSize(32, 38);
    this.setScale(1.2);
    this.setInteractive();

    this.scene.add.existing(this);
    this.scene.physics.add.existing(this);
  }

  createSprite() {
    const player = this.scene.add.sprite(0, 0, 'player', 0);
    player.name = 'sprite';
    this.add(player);
  }

  createPlayerName(name) {
    const nameElement = document.createElement('div');
    nameElement.setAttribute('id', 'player-sprite');
    nameElement.innerText = name;
    this.nameChild = this.scene.add.dom(0, 0, nameElement);
    this.nameChild.setOrigin(0.5, -2.3)
    this.add(this.nameChild);
  }

  removePlayerName() {
    this.remove(this.nameChild, true);
  }

  updatePlayerName(updatedName) {
    this.removePlayerName();
    this.createPlayerName(updatedName);
  }

  createBuyDrinkButton() {
    const buyDrinkButtonElement = document.createElement('button');
    buyDrinkButtonElement.innerText = 'buy a drink!';
    buyDrinkButtonElement.addEventListener('click', () => {
      console.log('button clicked')
      this.socket.emit('request-call', { receiverId: this.socketId })
    })

    const buyDrinkButton = this.scene.add.dom(0, -40, buyDrinkButtonElement);
    buyDrinkButton.setVisible(false);

    this.add(buyDrinkButton);
    return buyDrinkButton;
  }
}

export default OtherPlayer;
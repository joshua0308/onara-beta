class OtherPlayer extends Phaser.GameObjects.Container {
  constructor(scene, x, y, socket, playerInfo, otherPlayersGroup, userInterfaceManager) {
    super(scene, x, y);

    this.socket = socket;
    this.socketId = playerInfo.socketId;
    this.userInterfaceManager = userInterfaceManager;
    this.setInteractive();
    this.setSize(32, 38);
    this.setScale(1.2);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    const player = scene.add.sprite(0, 0, 'player', 0);
    player.name = 'sprite';
    this.add(player);

    const textElement = document.createElement('div');
    // textElement.innerText = playerInfo.displayName;
    // const text = scene.add.dom(0, 30, textElement);
    textElement.setAttribute('id', 'player-sprite');
    textElement.innerText = playerInfo.displayName;
    const text = scene.add.dom(0, 0, textElement);
    text.setOrigin(0.5, -2.3)
    this.add(text);

    const buyDrinkButton = this.createBuyDrinkButton();

    this.setInteractive()
      .on(Phaser.Input.Events.GAMEOBJECT_POINTER_DOWN, () => {
        console.log('down');
        this.userInterfaceManager.createPlayerProfileInterface(playerInfo, socket);
        // buyDrinkButton.setVisible(!buyDrinkButton.visible);
      });

    otherPlayersGroup.add(this);
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
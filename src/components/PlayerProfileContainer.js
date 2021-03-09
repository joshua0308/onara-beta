import React from 'jsx-dom';

function PlayerProfileContainer({ props }) {
  const { playerData, isCurrentPlayer, player } = props;

  const handleBuyADrinkButton = () => {
    const buyADrinkButton = document.getElementById('buy-drink-button');
    const closeButton = document.getElementById('close-profile-button');

    buyADrinkButton.innerText = 'Calling...';
    closeButton.innerText = 'Cancel call';
    buyADrinkButton.style.backgroundColor = '#c9a747';
    this.socket.emit('request-call', {
      receiverId: player.socketId,
      roomHash: this.scene.nativePeerManager.roomHash,
      socketIdsInRoom: Object.keys(this.scene.nativePeerManager.peerConnections)
    });
    buyADrinkButton.removeEventListener('click', handleBuyADrinkButton);
  };

  const handleCloseButton = () => {
    const closeButton = document.getElementById('close-profile-button');
    if (closeButton.innerText === 'Cancel call') {
      this.socket.emit('cancel-call', { receiverId: player.socketId });
    }

    this.removePlayerProfileInterface();
  };

  return (
    <div id="player-profile-container">
      <img
        id="player-image"
        src={
          playerData.profilePicURL ||
          'public/assets/placeholder-profile-pic.png'
        }
      />
      <div id="player-name">{playerData.displayName}</div>
      <div id="player-bio">
        Position: {playerData.position}
        <br />
        Education: {playerData.education}
        <br />
        Location: {playerData.city}
      </div>
      {!isCurrentPlayer && (
        <button id="buy-drink-button" onClick={handleBuyADrinkButton}>
          Buy a drink!
        </button>
      )}
      <button id="close-profile-button" onClick={handleCloseButton}>
        Close
      </button>
    </div>
  );
}

export default PlayerProfileContainer;

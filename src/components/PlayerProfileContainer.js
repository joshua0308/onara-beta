import React from 'jsx-dom';

function PlayerProfileContainer({ props }) {
  const { playerData, isCurrentPlayer, player } = props;

  const handleBuyADrinkButton = () => {
    console.log('request-call', this.scene.nativePeerManager.roomHash);
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

  const BubbleText = (props) => {
    return (
      <div
        style={{
          backgroundColor: 'white',
          boxShadow: 'rgb(132 138 150) 2px 2px 3px',
          position: 'inline-block',
          display: 'inline-block',
          padding: '4px',
          borderRadius: '5px',
          fontSize: '13px',
          marginLeft: '5px',
          marginTop: '5px'
        }}
      >
        {props.message}
      </div>
    );
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
      <div id="player-name" className="font-bold">
        @{playerData.displayName}
      </div>
      <div id="player-name">{playerData.displayName}</div>
      <div style={{ margin: '20px 0' }}>
        <div style={{ textAlign: 'center' }}>#followers #following #rating</div>
        <div style={{ textAlign: 'center' }}>#mutual followers</div>
      </div>
      <div id="player-bio">
        <div className="profile-p">
          <span className=" profile-subheader">📍Location</span>
          <BubbleText message={`${playerData.city}, ${playerData.country}`} />
        </div>
        <div className="profile-p">
          <span className=" profile-subheader">🗣 Language</span>
          <BubbleText message="Korean" />
          <BubbleText message="English" />
          <BubbleText message="Chinese" />
        </div>
        <div className="profile-p">
          <span className=" profile-subheader">💯 I&apos;m good at</span>
          <BubbleText message="Resume building" />
          <BubbleText message="Investing" />
          <BubbleText message="Hiring" />
          <BubbleText message="Skiing" />
          <BubbleText message="TV shows" />
          {/* </div> */}
        </div>
        <div className="profile-p">
          <span className=" profile-subheader">🔖 I&apos;m interested in</span>
          {/* <br /> */}
          <BubbleText message="Startups" />
          <BubbleText message="Golf" />
          <BubbleText message="Travel" />
          <BubbleText message="Eat/Drink" />
        </div>
        <div className="profile-p">
          <span className=" profile-subheader">🎓 Education</span>
          <BubbleText message={playerData.education} />
        </div>
        <div className="profile-p">
          <span className=" profile-subheader">💼 Currently</span>
          <BubbleText message="Co-founder at Clink" />
        </div>
        <div className="profile-p">
          <span className=" profile-subheader">⏪ Previously</span>
          <BubbleText message="McKinsey & Co" />
          <BubbleText message="Bain & Co" />
          <BubbleText message="Google" />
        </div>
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

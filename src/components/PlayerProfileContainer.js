import React from 'jsx-dom';

function PlayerProfileContainer({ props }) {
  const { playerData, isCurrentPlayer, player } = props;
  console.log('playerData', playerData);

  const handleAudioCallButton = (e) => {
    console.log('request-call', e);
    const buyADrinkButton = document.getElementById('audio-call-button');
    const closeButton = document.getElementById('close-profile-button');

    buyADrinkButton.innerText = 'Calling...';
    closeButton.innerText = 'Cancel call';
    buyADrinkButton.style.backgroundColor = '#c9a747';
    this.socket.emit('request-call', {
      receiverId: player.socketId,
      roomHash: this.scene.nativePeerManager.roomHash,
      socketIdsInRoom: Object.keys(
        this.scene.nativePeerManager.peerConnections
      ),
      type: 'audio'
    });
    buyADrinkButton.removeEventListener('click', handleAudioCallButton);
  };

  const handleVideoCallButton = (e) => {
    console.log('request-call', e);
    const buyADrinkButton = document.getElementById('video-call-button');
    const closeButton = document.getElementById('close-profile-button');

    buyADrinkButton.innerText = 'Calling...';
    closeButton.innerText = 'Cancel call';
    buyADrinkButton.style.backgroundColor = '#c9a747';
    this.socket.emit('request-call', {
      receiverId: player.socketId,
      roomHash: this.scene.nativePeerManager.roomHash,
      socketIdsInRoom: Object.keys(
        this.scene.nativePeerManager.peerConnections
      ),
      type: 'video'
    });
    buyADrinkButton.removeEventListener('click', handleVideoCallButton);
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
          backgroundColor: 'transparent',
          display: 'inline-block',
          padding: '2px 4px',
          borderStyle: 'solid',
          borderWidth: '1px',
          borderColor: '#3333a9',
          color: '#3333a9',
          borderRadius: '5px',
          fontSize: '13px',
          marginLeft: '5px',
          marginTop: '5px',
          cursor: 'default'
        }}
      >
        {props.message}
      </div>
    );
  };

  const listStyle = {
    margin: '0',
    display: 'flex',
    fontSize: '1rem'
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
        <div style={{ textAlign: 'center', color: '#464646' }}>
          #followers #following #rating
        </div>
        <div style={{ textAlign: 'center', color: '#464646' }}>
          #mutual followers
        </div>
      </div>
      <div id="player-bio" style={{ fontSize: '15px', color: '#717171' }}>
        <div style={listStyle}>
          <span style={{ marginRight: '5px' }}>💼</span>
          <span>Currently {playerData.currently}</span>
        </div>
        <div style={listStyle}>
          <span style={{ marginRight: '5px' }}>📄</span>
          <span>Previously {playerData.previously}</span>
        </div>
        <div style={listStyle}>
          <span style={{ marginRight: '5px' }}>🎓</span>
          <span>{playerData.education}</span>
        </div>
        <div style={listStyle}>
          <span style={{ marginRight: '5px' }}>📍</span>
          <span>{`${playerData.city}, ${playerData.country}`}</span>
        </div>
        <div style={listStyle}>
          <span style={{ marginRight: '5px' }}>🌐</span>
          <span>{playerData.language}</span>
        </div>
        <hr style={{ border: '1px solid #cdcdcd', width: '90%' }} />
        <div
          className="profile-p"
          style={{
            marginBottom: '15px'
          }}
        >
          <span
            className="profile-subheader"
            style={{
              fontWeight: '600',
              color: '#565656'
            }}
          >
            💯 I&apos;m good at
          </span>
          <br />
          <div style={{ marginLeft: '15px' }}>
            {playerData.goodAt &&
              playerData.goodAt
                .split(',')
                .map((goodAt, index) => (
                  <BubbleText key={`good-${index}`} message={goodAt} />
                ))}
          </div>
        </div>
        <div className="profile-p">
          <span
            className=" profile-subheader"
            style={{ fontWeight: '600', color: '#565656' }}
          >
            ❤️ I want to meet people who like
          </span>
          <br />
          <div style={{ marginLeft: '15px' }}>
            {playerData.interestedIn &&
              playerData.interestedIn
                .split(',')
                .map((interestedIn, index) => (
                  <BubbleText
                    key={`interested-${index}`}
                    message={interestedIn}
                  />
                ))}
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {!isCurrentPlayer && (
          <>
            <button
              id="video-call-button"
              onClick={handleVideoCallButton}
              style={{
                backgroundColor: '#2cda54',
                color: 'white',
                borderStyle: 'none',
                borderRadius: '15px',
                padding: '3px 12px',
                marginRight: '10px',
                boxShadow: '#bcbdbd 3px 3px 3px'
              }}
            >
              <i className="fas fa-video"></i>
              <div>Video</div>
            </button>
            <button
              id="audio-call-button"
              onClick={handleAudioCallButton}
              style={{
                backgroundColor: 'rgb(91 207 117)',
                color: 'white',
                borderStyle: 'none',
                borderRadius: '15px',
                padding: '3px 12px',
                marginRight: '10px',
                boxShadow: '#bcbdbd 3px 3px 3px'
              }}
            >
              <i className="fas fa-phone"></i>
              <div>Audio</div>
            </button>
          </>
        )}
        <button
          id="close-profile-button"
          onClick={handleCloseButton}
          style={{
            backgroundColor: 'rgb(181 181 181)',
            color: 'white',
            borderStyle: 'none',
            borderRadius: '15px',
            padding: '3px 12px',
            cursor: 'pointer',
            boxShadow: '#bcbdbd 3px 3px 3px'
          }}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default PlayerProfileContainer;

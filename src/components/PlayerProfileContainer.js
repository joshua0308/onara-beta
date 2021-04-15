import React from 'jsx-dom';

function PlayerProfileContainer({ props }) {
  const { playerData, isCurrentPlayer, player } = props;

  const handleAudioCallButton = (e) => {
    console.log('request-call', e);
    const buyADrinkButton = document.getElementById('audio-call-button');
    const closeButton = document.getElementById('close-profile-button');
    const closeIcon = document.getElementById('close-button-icon');
    const closeText = document.getElementById('close-button-text');

    buyADrinkButton.innerText = 'Calling...';
    buyADrinkButton.style.backgroundColor = '#c9a747';

    closeText.innerText = 'Cancel';
    closeButton.style.backgroundColor = '#cb3838';
    closeIcon.classList.remove('fa-times');
    closeIcon.classList.add('fa-phone-slash');

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
    const buyADrinkButton = document.getElementById('video-call-button');
    const closeButton = document.getElementById('close-profile-button');
    const closeIcon = document.getElementById('close-button-icon');
    const closeText = document.getElementById('close-button-text');

    buyADrinkButton.innerText = 'Calling...';
    buyADrinkButton.style.backgroundColor = '#c9a747';

    closeText.innerText = 'Cancel';
    closeButton.style.backgroundColor = '#cb3838';
    closeIcon.classList.remove('fa-times');
    closeIcon.classList.add('fa-phone-slash');

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
    if (closeButton.innerText === 'Cancel') {
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

  function createImages(urls) {
    return urls.map((url, idx) => {
      return (
        <img
          key={`player-image-${url}`}
          id="player-image"
          src={url || 'public/assets/placeholder-profile-pic.png'}
          style={{ display: idx === 0 ? 'inline-block' : 'none' }}
          className="player-image-class"
        />
      );
    });
  }

  return (
    <div id="player-profile-container">
      {createImages(playerData.profilePicURL)}
      {playerData.profilePicURL.length > 1 && (
        <i
          style={{
            fontSize: '20px',
            position: 'fixed',
            marginTop: '1.5rem'
          }}
          className="fas fa-chevron-circle-right"
          onClick={() => {
            const imageElements = document.querySelectorAll(
              '.player-image-class'
            );

            let index;

            for (let i = 0; i < imageElements.length; i += 1) {
              if (imageElements[i].style.display === 'inline-block') {
                imageElements[i].style.display = 'none';
                index = i + 1;
                break;
              }
            }

            if (imageElements[index]) {
              imageElements[index].style.display = 'inline-block';
            } else {
              imageElements[0].style.display = 'inline-block';
            }
          }}
        ></i>
      )}
      <div id="player-name" className="font-bold">
        @{playerData.username || playerData.displayName}
      </div>
      <div id="player-name">{playerData.displayName}</div>
      <div style={{ margin: '20px 0' }}>
        <div style={{ textAlign: 'center', color: '#464646' }}>
          #friends #rating
        </div>
        <div style={{ textAlign: 'center', color: '#464646' }}>
          #mutual friends
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
          <i id="close-button-icon" className="fas fa-times"></i>
          <div id="close-button-text">Close</div>
        </button>
      </div>
    </div>
  );
}

export default PlayerProfileContainer;

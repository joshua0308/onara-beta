import React from 'jsx-dom';
import { v4 as uuidv4 } from 'uuid';

function IncomingCallContainer({ props }) {
  const { callerData, callerId, type } = props;
  const playerData = callerData;
  let { roomHash } = props;
  const declineButtonCallback = (callerId) => {
    console.log('call declined', this);
    this.socket.emit('call-declined', { callerId });

    this.removeIncomingCallInterface();
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
    <div id="caller-card-container" className="background-overlay">
      <div id="caller-card">
        <img
          id="player-image"
          src={
            playerData.profilePicURL[0] ||
            'public/assets/placeholder-profile-pic.png'
          }
        />
        <div id="player-name" className="font-bold">
          @{playerData.displayName}
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
        <div id="caller-buttons-wrapper">
          <button
            id="accept-button"
            onClick={() => {
              console.log('accept-button: roomHash', roomHash);
              this.removeIncomingCallInterface();
              if (!roomHash) {
                roomHash = uuidv4();
              }

              if (
                Object.keys(this.scene.nativePeerManager.connected).length === 0
              ) {
                this.scene.nativePeerManager.joinRoom(roomHash);
              }

              this.socket.emit('accept-call', {
                to: callerId,
                roomHash,
                type
              });
            }}
          >
            Accept
          </button>
          <button
            id="decline-button"
            onClick={() => declineButtonCallback(callerId)}
          >
            Decline
          </button>
        </div>
      </div>
    </div>
  );
}

export default IncomingCallContainer;

import React from 'jsx-dom';
import { v4 as uuidv4 } from 'uuid';

function IncomingCallContainer({ props }) {
  const { callerData, callerId } = props;
  let { roomHash } = props;
  const declineButtonCallback = (callerId) => {
    console.log('call declined', this);
    this.socket.emit('call-declined', { callerId });

    this.removeIncomingCallInterface();
  };

  return (
    <div id="caller-card-container" className="background-overlay">
      <div id="caller-card">
        <img
          i="caller-image"
          src={
            callerData.profilePicURL ||
            'public/assets/placeholder-profile-pic.png'
          }
        ></img>
        <div>{callerData.displayName}</div>
        <div id="caller-info">
          Position: {callerData.position}
          <br />
          Education: {callerData.education}
          <br />
          Location: {callerData.city}
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
                roomHash
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

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
    <div id="caller-card-container" className="background-overlay">
      <div id="caller-card">
        <img
          id="player-image"
          src={
            callerData.profilePicURL ||
            'public/assets/placeholder-profile-pic.png'
          }
        />
        <div id="player-name" className="font-bold">
          @{callerData.displayName}
        </div>
        <div id="player-name">{callerData.displayName}</div>
        <div style={{ margin: '20px 0' }}>
          <div style={{ textAlign: 'center' }}>
            #followers #following #rating
          </div>
          <div style={{ textAlign: 'center' }}>#mutual followers</div>
        </div>
        <div id="player-bio">
          <div className="profile-p">
            <span className=" profile-subheader">📍Location</span>
            <BubbleText message={`${callerData.city}, ${callerData.country}`} />
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
          </div>
          <div className="profile-p">
            <span className=" profile-subheader">
              🔖 I&apos;m interested in
            </span>
            {/* <br /> */}
            <BubbleText message="Startups" />
            <BubbleText message="Golf" />
            <BubbleText message="Travel" />
            <BubbleText message="Eat/Drink" />
          </div>
          <div className="profile-p">
            <span className=" profile-subheader">🎓 Education</span>
            <BubbleText message={callerData.education} />
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

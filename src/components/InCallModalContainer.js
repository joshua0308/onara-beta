import React from 'jsx-dom';
import IncallButtons from './InCallButtons';

function InCallModalContainer({ props }) {
  const { maximizeVideosWrapper, minimizeVideosWrapper } = props;
  const IncallButtonsBinded = IncallButtons.bind(this);

  const keyDownHandler = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      const message = e.target.value;
      this.scene.nativePeerManager.sendMessage(message);
      e.target.value = '';
    }
  };

  return (
    <div id="in-call-modal-container" className="background-overlay visible">
      <div id="videos-wrapper" style={{ zIndex: 40 }}>
        <div id="video-resize-btn-container" className="hide">
          <button className="video-resize-btn" onClick={minimizeVideosWrapper}>
            <i
              className="fas fa-minus"
              style={{
                background: '#FFBD44',
                borderRadius: '50%',
                padding: '8px',
                fontSize: '12px',
                borderColor: '#989898',
                borderStyle: 'solid',
                borderWidth: '1px'
              }}
            ></i>
          </button>
          <button className="video-resize-btn" onClick={maximizeVideosWrapper}>
            <i
              className="fas fa-expand-alt"
              style={{
                background: '#00CA4E',
                borderRadius: '50%',
                padding: '6px',
                fontSize: '15px',
                borderColor: '#989898',
                borderStyle: 'solid',
                borderWidth: '1px'
              }}
            ></i>
          </button>
        </div>
      </div>

      <IncallButtonsBinded
        props={{ maximizeVideosWrapper, minimizeVideosWrapper }}
      />
      <div
        id="chat-container"
        style={{
          position: 'fixed',
          bottom: '0px',
          right: '0px',
          margin: '40px',
          backgroundColor: '#000000a8',
          borderRadius: '10px',
          color: 'white',
          padding: '10px',
          width: '350px'
        }}
      >
        <div
          style={{
            backgroundColor: '#000000a8',
            borderRadius: '10px',
            color: 'rgb(162,162,162)',
            padding: '5px',
            position: 'absolute',
            top: '-38px'
          }}
        >
          Chat in Call 📞
        </div>
        <button
          className="icon-button"
          style={{ position: 'absolute', bottom: '0px', right: '0px' }}
          onClick={() => {
            const messageContainer = document.getElementById(
              'message-container'
            );
            const messageToggleIcon = document.getElementById(
              'chat-toggle-icon'
            );

            if (messageContainer.style.display === 'none') {
              messageContainer.style.display = 'flex';
              messageToggleIcon.classList.add('fa-chevron-down');
              messageToggleIcon.classList.remove('fa-chevron-up');
            } else {
              messageToggleIcon.classList.add('fa-chevron-up');
              messageToggleIcon.classList.remove('fa-chevron-down');
              messageContainer.style.display = 'none';
            }
          }}
        >
          <i id="chat-toggle-icon" className="fas fa-chevron-down"></i>
        </button>
        <div id="message-container" className="chat-window">
          <ul
            id="messages-ul"
            className="messages"
            style={{
              overflow: 'scroll',
              maxHeight: '30vh',
              margin: '0px'
            }}
          ></ul>
        </div>
        <div id="chat-input-container">
          <input
            id="private-chat-input"
            type="text"
            style={{
              width: '100%',
              backgroundColor: 'transparent',
              border: 'none',
              color: 'white'
            }}
            placeholder="Type message here..."
            onKeyDown={keyDownHandler}
          />
        </div>
      </div>
    </div>
  );
}

export default InCallModalContainer;

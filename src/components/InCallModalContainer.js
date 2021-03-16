import React from 'jsx-dom';
import IncallButtons from './InCallButtons';

function InCallContainer() {
  const IncallButtonsBinded = IncallButtons.bind(this);

  const keyDownHandler = (e) => {
    if (e.key === 'Enter' && e.target.value) {
      console.log('key pressed', e.key, e.target.value, e);

      const message = e.target.value;
      this.scene.nativePeerManager.sendMessage(message);
      e.target.value = '';
    }
  };

  return (
    <div id="in-call-modal-container" className="background-overlay visible">
      <div id="videos-wrapper"></div>
      <IncallButtonsBinded />
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
          Private Chat
        </div>
        <button
          className="icon-button"
          style={{ position: 'absolute', top: '0px', right: '0px' }}
          onClick={() => {
            const messageContainer = document.getElementById(
              'message-container'
            );
            const messageToggleIcon = document.getElementById(
              'chat-toggle-icon'
            );

            if (messageContainer.style.display === 'none') {
              messageContainer.style.display = 'flex';
              messageToggleIcon.classList.add('fa-times');
              messageToggleIcon.classList.remove('fa-chevron-up');
            } else {
              messageToggleIcon.classList.add('fa-chevron-up');
              messageToggleIcon.classList.remove('fa-times');
              messageContainer.style.display = 'none';
            }
          }}
        >
          <i id="chat-toggle-icon" className="fas fa-times"></i>
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

export default InCallContainer;

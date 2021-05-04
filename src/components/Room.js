import React from 'jsx-dom';

function LevelThreeOption({ props }) {
  const { roomName, levelTwoFilter, displayName } = props;

  const clickHandler = (e) => {
    e.preventDefault();
    this.scene.socket.emit('leave-room', this.scene.barId);
    this.scene.registry.set('map', 'bar');
    this.scene.registry.set('spawn', 'start');
    this.removeOnlineList();
    this.removeGeneralChat();
    this.removeBarQuestionnaireInterface();
    this.scene.scene.restart({ barId: roomName });
  };

  const style = {
    display: 'none',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexFlow: 'wrap'
  };

  return (
    <div
      style={style}
      id="room-container"
      levelTwoFilter={levelTwoFilter}
      name={roomName}
    >
      <div>{displayName}</div>
      <button className="btn" onClick={clickHandler}>
        Join
      </button>
    </div>
  );
}

export default LevelThreeOption;

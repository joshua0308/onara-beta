import React from 'jsx-dom';

function LevelThreeOption({ props }) {
  const { roomName, levelTwoFilter } = props;

  const clickHandler = (e) => {
    e.preventDefault();
    this.scene.socket.close();
    this.scene.registry.set('map', 'bar');
    this.removeOnlineList();
    this.removeBarQuestionnaireInterface();
    this.scene.scene.restart({ barId: roomName });
  };

  const style = {
    display: 'none'
  };

  return (
    <div
      style={style}
      id="room-container"
      className="btn btn-warning"
      levelTwoFilter={levelTwoFilter}
      name={roomName}
    >
      {roomName}
      <br />
      <button onClick={clickHandler}>Join</button>
    </div>
  );
}

export default LevelThreeOption;

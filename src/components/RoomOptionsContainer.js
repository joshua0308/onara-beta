import React from 'jsx-dom';
import { rooms } from '../constants/rooms';

function RoomOptionsContainer({ props }) {
  const { isBar } = props;
  const levelOneOptions = [...new Set(rooms.map((room) => room.levelOne))];
  const levelTwoOptions = [...new Set(rooms.map((room) => room.levelTwo))];

  const levelThreeRooms = rooms.map((room) => (
    <this.Room
      key={room.name}
      props={{
        roomName: room.name,
        displayName: room.name,
        levelTwoFilter: room.levelTwo
      }}
    />
  ));

  const levelTwoButtons = levelTwoOptions.map((levelTwoOption) => (
    <this.LevelTwoButton
      key={levelTwoOption}
      props={{
        id: 'level-one-option',
        text: levelTwoOption,
        color: 'success',
        onClickHandler: (e) => {
          const target = e.target;
          const isSelected = target.classList.contains('btn-success');
          const levelTwo = target.name;

          if (!isSelected) {
            target.classList.remove('btn-outline-success');
            target.classList.add('btn-success');

            // deselect other levelTwo buttons
            levelTwoButtons.forEach((button) => {
              if (target !== button) {
                button.classList.remove('btn-success');
                button.classList.add('btn-outline-success');
              }
            });

            // show levelTwo buttons
            const filteredRooms = [
              ...new Set(
                rooms
                  .filter((room) => room.levelTwo === levelTwo)
                  .map((room) => room.name)
              )
            ];

            levelThreeRooms.forEach((room) => {
              if (filteredRooms.includes(room.attributes.name.value)) {
                room.style.display = 'flex';
              } else {
                room.style.display = 'none';
              }
            });
          }
        }
      }}
    />
  ));

  const levelOneButtons = levelOneOptions.map((levelOneOption) => (
    <this.LevelOneButton
      key={levelOneOption}
      props={{
        id: 'level-one-option',
        text: levelOneOption,
        onClickHandler: (e) => {
          const target = e.target;
          const isSelected = target.classList.contains('btn-primary');
          const levelOne = target.name;

          if (!isSelected) {
            target.classList.remove('btn-outline-primary');
            target.classList.add('btn-primary');

            // deselect other levelOne buttons
            levelOneButtons.forEach((button) => {
              if (target !== button) {
                button.classList.remove('btn-primary');
                button.classList.add('btn-outline-primary');
              }
            });

            // show levelTwo buttons
            const levelTwos = [
              ...new Set(
                rooms
                  .filter((room) => room.levelOne === levelOne)
                  .map((room) => room.levelTwo)
              )
            ];

            levelTwoButtons.forEach((button) => {
              if (levelTwos.includes(button.name)) {
                button.style.display = 'inline-block';
              } else {
                button.style.display = 'none';
                button.classList.remove('btn-success');
                button.classList.add('btn-outline-success');
              }
            });

            // a new filter is selected. hide all rooms.
            levelThreeRooms.forEach((room) => {
              room.style.display = 'none';
            });
          }
        }
      }}
    />
  ));

  const handleBackToTownButton = () => {
    this.logger.log(this.scene.getCurrentMap());
    if (this.scene.getCurrentMap() === 'bar') {
      this.scene.registry.set('map', 'town');
      this.scene.socket.close();

      this.removeOnlineList();
      this.removeGeneralChat();
      this.scene.scene.restart({ barId: undefined });
    }
    this.removeBarQuestionnaireInterface();
  };

  const style = isBar ? {} : { width: '50vw', height: '50vh' };
  return (
    <div id="bar-questionnaire-modal-wrapper" className="background-overlay">
      <div id="questionnaire-container" style={style}>
        <i
          id="close-button"
          onClick={() => this.removeBarQuestionnaireInterface()}
          className="fas fa-times-circle fa-lg"
        ></i>
        {isBar ? (
          <button
            id="back-to-game-button"
            className="btn"
            onClick={handleBackToTownButton}
          >
            Go back to town
          </button>
        ) : (
          <>
            <div id="questionnaire-question">What are you here for?</div>
            <div id="level-one-option-container">{levelOneButtons}</div>
            <div id="level-two-option-container">{levelTwoButtons}</div>
            <div id="level-three-option-container">{levelThreeRooms}</div>
          </>
        )}
      </div>
    </div>
  );
}

export default RoomOptionsContainer;

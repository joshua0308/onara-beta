import React from 'jsx-dom';
import { rooms } from '../constants/rooms';

function RoomOptionsContainer() {
  const roomOptionsModal = document.getElementById(
    'bar-questionnaire-modal-wrapper'
  );

  if (roomOptionsModal.style.display === 'flex') return;
  roomOptionsModal.style.display = 'flex';

  const levelOneOptions = [...new Set(rooms.map((room) => room.levelOne))];
  const levelTwoOptions = [...new Set(rooms.map((room) => room.levelTwo))];

  const levelThreeRooms = rooms.map((room) => (
    <this.LevelThreeOption
      key={room.name}
      props={{ roomName: room.name, levelTwoFilter: room.levelTwo }}
      name={room.name}
    />
  ));

  const levelTwoButtons = levelTwoOptions.map((levelTwoOption) => (
    <this.LevelTwoOption
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
                room.style.display = 'block';
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
    <this.LevelOneOption
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
      this.scene.scene.restart({ barId: undefined });
    }
    this.removeBarQuestionnaireInterface();
  };

  return (
    <div id="questionnaire-wrapper">
      <div id="questionnaire-question">What are you here for?</div>
      <div id="level-one-option-container">{levelOneButtons}</div>
      <div id="level-two-option-container">{levelTwoButtons}</div>
      <div id="level-three-option-container">{levelThreeRooms}</div>
      <div id="action-buttons-wrapper">
        {!(this.scene.getCurrentMap() === 'town') && (
          <div id="back-to-game-button" onClick={handleBackToTownButton}>
            Go back to town
          </div>
        )}
        <button
          id="back-to-game-button"
          onClick={() => this.removeBarQuestionnaireInterface()}
        >
          Close
        </button>
      </div>
    </div>
  );
}

export default RoomOptionsContainer;

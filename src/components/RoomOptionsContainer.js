import React from 'jsx-dom';

const rooms = {
  learn: {
    language: ['chinese', 'english', 'spanish'],
    professional: ['career', 'resume'],
    life: ['investing', 'tax']
  },
  business: {
    recruiting: ['designers', 'engineers', 'finance'],
    pitch_prep: ['seed', 'early stage', 'post series C']
  },
  health: {
    mental_awareness: ['yoga', 'meditation', 'talk to a therapist'],
    physical_fitness: ['weight', 'strength', 'endurance']
  },
  fun: {
    dating: ['serious', 'fun'],
    activity: ['karaoke', 'cook', 'watch'],
    chat: ['sports', 'books', 'travel']
  }
};

function RoomOptionsContainer() {
  const roomOptionsModal = document.getElementById(
    'bar-questionnaire-modal-wrapper'
  );

  if (roomOptionsModal.style.display === 'flex') return;
  roomOptionsModal.style.display = 'flex';

  const levelOneOptions = Object.keys(rooms).map((levelOneOption) => (
    <this.LevelOneOption
      key={levelOneOption}
      props={{
        id: 'level-one-option',
        text: levelOneOption
      }}
    />
  ));

  levelOneOptions.forEach((button) => {
    button.addEventListener('click', () => {
      const isSelected = button.classList.contains('btn-primary');

      if (isSelected) {
        this.removeLevelTwoFilters();
        button.selected = false;
        button.classList.remove('btn-primary');
        button.classList.add('btn-outline-primary');
      } else {
        this.removeLevelTwoFilters();
        this.createLevelTwo(rooms[button.name]);
        button.selected = true;
        button.classList.remove('btn-outline-primary');
        button.classList.add('btn-primary');
        levelOneOptions.forEach((otherButton) => {
          if (button !== otherButton) {
            otherButton.classList.remove('btn-primary');
            otherButton.classList.add('btn-outline-primary');
            otherButton.selected = false;
          }
        });
      }
    });
  });

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
      <div id="level-one-option-wrapper">{levelOneOptions}</div>
      <div id="level-two-option-wrapper"></div>
      <div id="level-three-option-wrapper"></div>
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

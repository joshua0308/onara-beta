class UserInterfaceManager {

  createInCallInterface(stream, toggleVideoButtonCallback, toggleAudioButtonCallback, endCallButtonCallback) {
    const inCallModalWrapper = document.getElementById('in-call-modal-wrapper');
    inCallModalWrapper.style.display = 'inline';
    inCallModalWrapper.isGameVisible = true;
    inCallModalWrapper.style.backgroundColor = 'rgba(74, 67, 67, 0.4)';

    const videosWrapper = document.createElement('div');
    videosWrapper.setAttribute('id', 'videos-wrapper');

    const inCallButtonsWrapper = this.createInCallButtons(stream, toggleVideoButtonCallback, toggleAudioButtonCallback, endCallButtonCallback);

    inCallModalWrapper.appendChild(videosWrapper);
    inCallModalWrapper.appendChild(inCallButtonsWrapper);
  }

  createOutgoingCallInterface() { }

  createOnlineList(barId) {
    if (!barId) { barId = 'Town'; }
    else { barId = 'Bar - ' + barId; }

    const onlineListWrapper = document.getElementById('online-list-wrapper');

    const barName = document.createElement('div');
    barName.innerText = barId;

    const ul = document.createElement('ul');
    ul.setAttribute('id', 'online-list');

    onlineListWrapper.appendChild(barName);
    onlineListWrapper.appendChild(ul);
  }

  removeOnlineList() {
    const onlineListWrapper = document.getElementById('online-list-wrapper');
    while (onlineListWrapper.firstChild) {
      onlineListWrapper.removeChild(onlineListWrapper.lastChild);
    }
  }

  removeBarQuestionnaireInterface() {
    const barQuestionnaireModalWrapper = document.getElementById('bar-questionnaire-modal-wrapper');
    if (barQuestionnaireModalWrapper.style.display === 'none') return;

    barQuestionnaireModalWrapper.style.display = 'none';

    while (barQuestionnaireModalWrapper.firstChild) {
      barQuestionnaireModalWrapper.removeChild(barQuestionnaireModalWrapper.lastChild);
    }
  }

  createBarQuestionnaireInterface({ scene }) {
    const barQuestionnaireModalWrapper = document.getElementById('bar-questionnaire-modal-wrapper');

    if (barQuestionnaireModalWrapper.style.display === 'flex') return;

    barQuestionnaireModalWrapper.style.display = 'flex';

    const questionnaireQuestion = document.createElement('div');
    questionnaireQuestion.setAttribute('id', 'questionnaire-question');
    questionnaireQuestion.innerText = 'What are you here for?';

    const levelOneLearn = document.createElement('div');
    levelOneLearn.setAttribute('id', 'level-one-option');
    levelOneLearn.innerText = "Learn";

    const levelOneBusiness = document.createElement('div');
    levelOneBusiness.setAttribute('id', 'level-one-option');
    levelOneBusiness.innerText = "Business";

    const levelOneHealth = document.createElement('div');
    levelOneHealth.setAttribute('id', 'level-one-option');
    levelOneHealth.innerText = "Health";

    const levelOneFun = document.createElement('div');
    levelOneFun.setAttribute('id', 'level-one-option');
    levelOneFun.innerText = "Fun";

    const levelOneOptionWrapper = document.createElement('div');
    levelOneOptionWrapper.setAttribute('id', 'level-one-option-wrapper');

    levelOneOptionWrapper.appendChild(levelOneLearn);
    levelOneOptionWrapper.appendChild(levelOneBusiness);
    levelOneOptionWrapper.appendChild(levelOneHealth);
    levelOneOptionWrapper.appendChild(levelOneFun);

    const levelOneOptionButtons = [levelOneLearn, levelOneBusiness, levelOneHealth, levelOneFun];
    levelOneOptionButtons.forEach(button => {
      button.addEventListener('click', () => {
        const selectedColor = 'rgb(100, 201, 80)';
        const unselectedColor = 'rgb(167, 242, 176)';

        if (button.style.backgroundColor === selectedColor) {
          button.style.backgroundColor = unselectedColor;
          button.selected = false;
        } else {
          button.selected = true;
          button.style.backgroundColor = selectedColor;
          levelOneOptionButtons.forEach(otherButton => {
            if (button !== otherButton) {
              otherButton.selected = false;
              otherButton.style.backgroundColor = unselectedColor;
            }
          })
        }
        console.log(button.innerText, button.selected)
      })
    })

    const backToTownButton = document.createElement('div');
    backToTownButton.setAttribute('id', 'back-to-game-button');
    backToTownButton.innerText = "Go back to town";
    backToTownButton.addEventListener('click', () => {
      console.log(scene.getCurrentMap())
      if (scene.getCurrentMap() === 'bar') {
        scene.registry.set('map', 'town');
        scene.socket.close();
        // this.removeAllPlayersFromOnlineList();
        this.removeOnlineList();
        scene.scene.restart();
      }
      this.removeBarQuestionnaireInterface();
    })

    const joinBarButton = document.createElement('div');
    joinBarButton.setAttribute('id', 'join-bar-button');
    joinBarButton.innerText = "Join bar";

    joinBarButton.addEventListener('click', () => {
      let selectedBar;
      levelOneOptionButtons.forEach(button => {
        if (button.selected) {
          selectedBar = button.innerText.toLowerCase();
        }
      })
      console.log('selectedBar', selectedBar)

      if (!selectedBar) {
        alert('Please select a bar to join 🙂')
      } else {
        scene.socket.close();
        scene.registry.set('map', 'bar');
        this.removeOnlineList();
        this.removeBarQuestionnaireInterface();
        // this.removeAllPlayersFromOnlineList();
        scene.scene.restart({ barId: selectedBar });
      }
    })

    const actionButtonsWrapper = document.createElement('div');
    actionButtonsWrapper.setAttribute('id', 'action-buttons-wrapper');

    if (!(scene.getCurrentMap() === 'town')) {
      actionButtonsWrapper.appendChild(backToTownButton)
    }
    actionButtonsWrapper.appendChild(joinBarButton)

    const questionnaireWrapper = document.createElement('div');
    questionnaireWrapper.setAttribute('id', 'questionnaire-wrapper');

    questionnaireWrapper.appendChild(questionnaireQuestion);
    questionnaireWrapper.appendChild(levelOneOptionWrapper);
    questionnaireWrapper.appendChild(actionButtonsWrapper);

    barQuestionnaireModalWrapper.appendChild(questionnaireWrapper);

  }
  createIncomingCallInterface(players, callerId, acceptButtonCallback, declineButtonCallback) {
    console.log('debug: incoming call from', players[callerId]);

    const callerName = document.createElement('div');
    callerName.innerText = `${players[callerId].displayName}`;

    const callerImage = document.createElement('img');
    callerImage.setAttribute('id', 'caller-image');
    callerImage.src = "https://media-exp1.licdn.com/dms/image/C4D03AQEvRvRJmKWoDg/profile-displayphoto-shrink_200_200/0/1589619361084?e=1617235200&v=beta&t=3-uo_2qiaKJTSj3k0e5XcL2a3kAZZEM3Yd37i82tZqQ";

    const callerInfo = document.createElement('div');
    callerInfo.setAttribute('id', 'caller-info');
    callerInfo.innerText = "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.";

    const acceptButton = document.createElement('button');
    acceptButton.setAttribute('id', 'accept-button');
    acceptButton.innerText = 'Accept';
    acceptButton.addEventListener('click', () => acceptButtonCallback(callerId));
    
    const declineButton = document.createElement('button');
    declineButton.setAttribute('id', 'decline-button');
    declineButton.innerText = 'Decline';
    declineButton.addEventListener('click', () => declineButtonCallback(callerId));

    const buttonWrapper = document.createElement('div');
    buttonWrapper.setAttribute('id', 'caller-buttons-wrapper');

    buttonWrapper.appendChild(acceptButton);
    buttonWrapper.appendChild(declineButton);

    const callerCard = document.createElement('div');
    callerCard.setAttribute('id', 'caller-card');

    callerCard.appendChild(callerImage);
    callerCard.appendChild(callerName);
    callerCard.appendChild(callerInfo);
    callerCard.appendChild(buttonWrapper);

    const callerCardWrapper = document.getElementById('caller-card-wrapper');
    callerCardWrapper.style.display = 'flex';

    callerCardWrapper.appendChild(callerCard);
  }

  createInCallButtons(stream, toggleVideoButtonCallback, toggleAudioButtonCallback, endCallButtonCallback) {
    const toggleVideoButton = document.createElement('button');
    toggleVideoButton.setAttribute('id', 'toggle-video');
    toggleVideoButton.innerText = 'Hide video';
    toggleVideoButton.addEventListener('click', () => toggleVideoButtonCallback(toggleVideoButton, stream))
    
    const toggleAudioButton = document.createElement('button');
    toggleAudioButton.setAttribute('id', 'toggle-audio');
    toggleAudioButton.innerText = 'Mute';
    toggleAudioButton.addEventListener('click', () => toggleAudioButtonCallback(toggleAudioButton, stream))

    const toggleBackgroundButton = document.createElement('button');
    toggleBackgroundButton.setAttribute('id', 'toggle-background');
    toggleBackgroundButton.innerText = 'Hide game';
    toggleBackgroundButton.addEventListener('click', () => {
      const inCallModalWrapper = document.getElementById('in-call-modal-wrapper');
      if (inCallModalWrapper.isGameVisible) {
        inCallModalWrapper.style.backgroundColor = '#000000';
        inCallModalWrapper.isGameVisible = false;
        toggleBackgroundButton.innerText = 'Show game'
      } else {
        inCallModalWrapper.style.backgroundColor = 'rgba(74, 67, 67, 0.4)';
        inCallModalWrapper.isGameVisible = true;
        toggleBackgroundButton.innerText = 'Hide game'
      }
    })

    const endCallButton = document.createElement('button');
    endCallButton.classList.add('button');
    endCallButton.setAttribute('id', 'end-call-button');
    endCallButton.innerText = 'Leave chat';
    endCallButton.addEventListener('click', () => endCallButtonCallback(endCallButton))

    const inCallButtonsWrapper = document.createElement('in-call-buttons-wrapper');
    inCallButtonsWrapper.setAttribute('id', 'in-call-buttons-wrapper');

    inCallButtonsWrapper.appendChild(toggleVideoButton);
    inCallButtonsWrapper.appendChild(toggleAudioButton);
    inCallButtonsWrapper.appendChild(toggleBackgroundButton);
    inCallButtonsWrapper.appendChild(endCallButton);

    return inCallButtonsWrapper;
  }

  removeIncomingCallInterface() {
    const callerCardWrapper = document.getElementById('caller-card-wrapper');
    if (callerCardWrapper) {
      callerCardWrapper.style.display = 'none';
    }

    while (callerCardWrapper.firstChild) {
      callerCardWrapper.removeChild(callerCardWrapper.lastChild);
    }
  }

  removeInCallInterface() {
    const modalWrapper = document.getElementById('in-call-modal-wrapper');
    if (modalWrapper) {
      modalWrapper.style.display = 'none';
    }

    while (modalWrapper.firstChild) {
      modalWrapper.removeChild(modalWrapper.lastChild);
    }
  }

  addStreamToVideoElement(stream, setMute = false) {
    const videoElement = document.createElement('video');
    videoElement.srcObject = stream;
    if (setMute) {
      videoElement.muted = 'true';
    }
    videoElement.addEventListener('loadedmetadata', () => {
      videoElement.play();
    });

    const videosWrapper = document.getElementById('videos-wrapper');
    videosWrapper.appendChild(videoElement);
  }

  addPlayerToOnlineList(playerName, playerSocketId, isCurrentPlayer = false) {
    if (document.getElementById(playerSocketId)) return;

    const onlineList = document.getElementById('online-list');

    const playerListItem = document.createElement('li');
    playerListItem.innerText = playerName;
    playerListItem.setAttribute('id', playerSocketId);


    if (isCurrentPlayer) {
      playerListItem.style.fontWeight = '600';
      onlineList.insertBefore(playerListItem, onlineList.firstChild)
    } else {
      onlineList.appendChild(playerListItem);
    }
  }

  removePlayerFromOnlineList(playerSocketId) {
    if (document.getElementById(playerSocketId)) {
      document.getElementById(playerSocketId).remove();
    }
  }

  removeAllPlayersFromOnlineList() {
    const onlineList = document.getElementById('online-list');

    while (onlineList.firstChild) {
      onlineList.removeChild(onlineList.lastChild);
    }
  }
}

export default UserInterfaceManager;
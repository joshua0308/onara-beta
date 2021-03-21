import React from 'jsx-dom';

function OnlineList({ props }) {
  const { barId } = props;

  const onClickHandler = () => {
    const listWrapper = document.getElementById('online-list-wrapper');
    const onlineListIcon = document.getElementById('online-list-icon');
    const onlineListIconContainer = document.getElementById(
      'online-list-icon-container'
    );
    if (listWrapper.style.transform === 'translateX(200px)') {
      listWrapper.style.transform = 'translateX(0px)';

      onlineListIconContainer.style.transform = 'translateX(20px)';
      onlineListIconContainer.style.backgroundColor = 'transparent';

      onlineListIcon.classList.remove('fa-chevron-left');
      onlineListIcon.classList.add('fa-chevron-right');
    } else {
      listWrapper.style.transform = 'translateX(200px)';

      onlineListIconContainer.style.transform = 'translateX(0px)';
      onlineListIconContainer.style.backgroundColor = 'rgba(45, 45, 53, 0.8)';

      onlineListIcon.classList.remove('fa-chevron-right');
      onlineListIcon.classList.add('fa-chevron-left');
    }
  };

  return (
    <div id="online-list-wrapper" style={{ zIndex: 100 }}>
      <div
        id="online-list-icon-container"
        style={{
          position: 'absolute',
          height: '100px',
          width: '20px',
          left: '-20px',
          top: '45%',
          borderRadius: '30px 0 0 30px',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          transform: 'translateX(20px)',
          backgroundColor: 'transparent'
        }}
        onClick={onClickHandler}
      >
        <i
          id="online-list-icon"
          className="fas fa-chevron-right"
          style={{ marginLeft: '5px' }}
        ></i>
      </div>
      <div style={{ fontSize: '1.5rem' }}>
        {barId === 'town' ? 'My Friends' : `People in ${barId}`}
      </div>
      <ul id="online-list" style={{ marginTop: '15px' }}></ul>
    </div>
  );
}

export default OnlineList;

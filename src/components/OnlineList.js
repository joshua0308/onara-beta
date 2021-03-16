import React from 'jsx-dom';

function OnlineList({ props }) {
  const { barId } = props;

  return (
    <div id="online-list-wrapper">
      <div style={{ fontSize: '23px' }}>
        People in {barId === 'town' ? 'Town' : barId}
      </div>
      <ul id="online-list" style={{ marginTop: '15px' }}></ul>
    </div>
  );
}

export default OnlineList;

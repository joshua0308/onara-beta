import React from 'jsx-dom';

function OnlineList({ props }) {
  const { barId } = props;

  return (
    <div id="online-list-wrapper">
      <div>{barId === 'town' ? 'Town' : barId}</div>
      <ul id="online-list"></ul>
    </div>
  );
}

export default OnlineList;

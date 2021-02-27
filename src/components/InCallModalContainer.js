import React from 'jsx-dom';
import IncallButtons from './InCallButtons';

function InCallContainer() {
  const IncallButtonsBinded = IncallButtons.bind(this);
  return (
    <div id="in-call-modal-container" className="background-overlay visible">
      <div id="videos-wrapper"></div>
      <IncallButtonsBinded />
    </div>
  );
}

export default InCallContainer;

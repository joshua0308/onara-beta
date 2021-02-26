import React from 'jsx-dom';

function LevelOneOption({ props }) {
  let { id, text, color, onClickHandler } = props;
  const colorClass = `btn-outline-${color || 'primary'}`;

  return (
    <button
      id={id}
      className={'btn ' + colorClass}
      name={text}
      onClick={onClickHandler}
      style={{ outline: 'none' }}
    >
      {text}
    </button>
  );
}

export default LevelOneOption;

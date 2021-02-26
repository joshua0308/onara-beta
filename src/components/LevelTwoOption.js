import React from 'jsx-dom';

function LevelTwoOption({ props }) {
  let { id, text, color, onClickHandler } = props;
  const colorClass = `btn-outline-${color || 'primary'}`;

  const style = {
    display: 'none'
  };
  return (
    <button
      id={id}
      className={'btn ' + colorClass}
      name={text}
      style={style}
      onClick={onClickHandler}
    >
      {text}
    </button>
  );
}

export default LevelTwoOption;

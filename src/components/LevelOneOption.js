import React from 'jsx-dom';

function LevelOneOption({ props }) {
  let { id, text, color } = props;

  // if (!color) {
  //   color = 'primary';
  // }

  const colorClass = `btn-outline-${color || 'primary'}`;

  return (
    <button id={id} className={'btn ' + colorClass} name={text}>
      {text}
    </button>
  );
}

export default LevelOneOption;

// createLevelOne(id, text, color = 'primary') {
//   const colorClass = `btn-outline-${color}`;
//   return (
//     <button id={id} className={'btn ' + colorClass} name={text}>
//       {text}
//     </button>
//   );
// }

import React from 'jsx-dom';

// DOM Elements.
const container = document.getElementById('container');
container.appendChild(
  <div id="greeting" className="alert">
    Hello World
  </div>
);

document.body.appendChild(
  <div id="greeting" className="alert">
    Hello World
  </div>
);
// const yo = document.getElementById('container');
// // eslint-disable-next-line no-console
// console.log('debug: yo', yo);
// yo.style.borderStyle = 'solid';

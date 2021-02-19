export default (anims) => {
  anims.create({
    key: 'idle',
    frames: anims.generateFrameNumbers('boy-idle', {
      start: 0,
      end: 4
    }),
    frameRate: 4,
    repeat: -1
  });

  anims.create({
    key: 'run',
    frames: anims.generateFrameNumbers('boy-walk', {
      start: 0,
      end: 7
    }),
    frameRate: 8,
    repeat: -1
  });

  anims.create({
    key: 'jump',
    frames: anims.generateFrameNumbers('boy-jump', {
      start: 3,
      end: 8
    }),
    frameRate: 3,
    repeat: -1
  });
};

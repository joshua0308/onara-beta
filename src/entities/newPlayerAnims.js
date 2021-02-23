export default (anims) => {
  anims.create({
    key: 'boy-idle',
    frames: anims.generateFrameNumbers('boy-idle', {
      start: 0,
      end: 4
    }),
    frameRate: 4,
    repeat: -1
  });

  anims.create({
    key: 'boy-walk',
    frames: anims.generateFrameNumbers('boy-walk', {
      start: 0,
      end: 7
    }),
    frameRate: 8,
    repeat: -1
  });

  anims.create({
    key: 'boy-jump',
    frames: anims.generateFrameNumbers('boy-jump', {
      start: 2,
      end: 7
    }),
    frameRate: 4,
    repeat: -1
  });

  anims.create({
    key: 'girl-idle',
    frames: anims.generateFrameNumbers('girl-idle', {
      start: 0,
      end: 4
    }),
    frameRate: 4,
    repeat: -1
  });

  anims.create({
    key: 'girl-walk',
    frames: anims.generateFrameNumbers('girl-walk', {
      start: 0,
      end: 10
    }),
    frameRate: 8,
    repeat: -1
  });

  anims.create({
    key: 'girl-jump',
    frames: anims.generateFrameNumbers('girl-jump', {
      start: 2,
      end: 6
    }),
    frameRate: 4,
    repeat: -1
  });
};

## Getting started
`npm run dev` - start server with nodemon (port 3000)

## Endpoints
- `/login` - login endpoint
- `/game` - game endpoint
- `/status` - status endpoint

## How to deploy
`git push heroku HEAD:master` - push your HEAD to master in heroku's remote 

## Troubleshoot
`heroku logs -a onara-beta -d web -t` - watch heroku logs

## Stack
### Authentication
- [FirebaseUI](https://firebase.google.com/docs/auth/web/firebaseui?authuser=0)

## Resources
### Video Chat
- [Build a Zoom Clone with Node JS for Beginners](https://youtu.be/ZVznzY7EjuY)
- [How To Create A Video Chat App With WebRTC](https://youtu.be/DvlyzDZDEq4)

### Phaser tutorials
  - [Udemy - The Complete Guide to Phaser 3](https://www.udemy.com/course/game-development-in-js-the-complete-guide-w-phaser-3/)

### Smooth movement in multiplayer game
  - [tween](https://www.html5gamedevs.com/topic/21644-smooth-texture-movement-from-point-to-point/?do=findComment&comment=123395)
  - [direction and velocity](https://www.html5gamedevs.com/topic/21028-smooth-movement-in-multiplayer/?do=findComment&comment=119741)

### Phaser Wiki
https://github.com/samme/phaser3-faq/wiki#how-do-i-scaleresize-the-game-canvas

### Camera/Audio
- if you're camera/audio is disabled, you will get streams from users who were already in the room, but will not receive streams from new users

### Resize phaser when window size is changed
- https://labs.phaser.io/edit.html?src=src/scalemanager/manually%20resize.js
- https://labs.phaser.io/index.html?dir=scalemanager/&q=


### Add dom elements in phaser
- [Add DOM element within Phaser](https://www.youtube.com/watch?v=y8_WqDX3MCo&ab_channel=Ourcade)

### Use container and text to display information
- Use container to display player info
  - https://phaser.io/examples/v3/view/game-objects/container/text-and-sprite-test
  - https://phaser.io/examples/v3/view/game-objects/container/rotation
- [Add Buttons to Your Phaser 3 Game with RexUI Plugins](https://youtu.be/SU2H903RJcE)
- [How to Make a Custom Phaser 3 Button](https://youtu.be/yWlILdKrbqQ)



https://phaser.io/phaser3/devlog/120

## Game Assets
- https://www.kenney.nl/assets
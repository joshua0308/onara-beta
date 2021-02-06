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

## Bugs
1. when a player disconnects while moving, `socket.close()` is not fired. therefore, other players see the disconnected player for a while after the player has left.
2. Call doesn't work when I call Won. Only works when Won calls me. Look into turn and stun server.

## Resources
### Firebase
- [Auth and DB](https://www.youtube.com/watch?v=q5J5ho7YUhA&ab_channel=Fireship)

### Bootstrap
- [Profile page](https://bbbootstrap.com/snippets/bootstrap-edit-job-profile-form-add-experience-94553916)
- [Vertical navbar](https://getbootstrap.com/docs/4.0/components/navs/#javascript-behavior)

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
- scale manager
  - https://labs.phaser.io/index.html?dir=scalemanager/&q=
  - https://labs.phaser.io/edit.html?src=src/scalemanager/manually%20resize.js
- window resize event
  - https://phaser.discourse.group/t/how-to-change-the-game-size/1145/4
- phaser resize example (this works well)
  - https://phaser.io/examples/v3/view/scalemanager/resize

### Flex basis
- https://mastery.games/post/the-difference-between-width-and-flex-basis/

### Add dom elements in phaser
- [Add DOM element within Phaser](https://www.youtube.com/watch?v=y8_WqDX3MCo&ab_channel=Ourcade)

### Use container and text to display information
- Use container to display player info
  - https://phaser.io/examples/v3/view/game-objects/container/text-and-sprite-test
  - https://phaser.io/examples/v3/view/game-objects/container/rotation
- [Add Buttons to Your Phaser 3 Game with RexUI Plugins](https://youtu.be/SU2H903RJcE)
- [How to Make a Custom Phaser 3 Button](https://youtu.be/yWlILdKrbqQ)

## React + Phaser
https://phaser.discourse.group/t/phaser-3-interaction-with-react/308/7
```
Just adding my 2 cents since I’m also working on a project using both React and Phaser 3.
The way we linked both is quite simple, we simply used EventEmitters.
When something interesting happens in Phaser, we emit an event and our React components are listening to them. We can then use setState since we’re back inside React.
It also perfectly work the other way around when we need to update Phaser based on React events.
```


https://phaser.io/phaser3/devlog/120

## Game Assets
- https://www.kenney.nl/assets
- https://www.codeandweb.com/texturepacker
## Getting started
`npm run dev` - start server with nodemon (port 3000)

## Endpoints
- `/login` - login endpoint
- `/game` - game endpoint
- `/status` - status endpoint

## How to deploy
`git push heroku HEAD:master` - push your HEAD to master in heroku's remote 

## Stack
### Authentication
- [FirebaseUI](https://firebase.google.com/docs/auth/web/firebaseui?authuser=0)

## Resources
### Video Chat
- [Build a Zoom Clone with Node JS for Beginners](https://youtu.be/ZVznzY7EjuY)
- [How To Create A Video Chat App With WebRTC](https://youtu.be/DvlyzDZDEq4)

### Phaser
- Tutorials
  - [Udemy - The Complete Guide to Phaser 3](https://www.udemy.com/course/game-development-in-js-the-complete-guide-w-phaser-3/)
- Smooth movement in multiplayer game
  - [tween](https://www.html5gamedevs.com/topic/21644-smooth-texture-movement-from-point-to-point/?do=findComment&comment=123395)
  - [direction and velocity](https://www.html5gamedevs.com/topic/21028-smooth-movement-in-multiplayer/?do=findComment&comment=119741)

### Known issues
- if you're camera/audio is disabled, you will get streams from users who were already in the room, but will not receive streams from new users

### Links
- [Add DOM element within Phaser](https://www.youtube.com/watch?v=y8_WqDX3MCo&ab_channel=Ourcade)
- Use container to display player info
  - https://phaser.io/examples/v3/view/game-objects/container/text-and-sprite-test
  - https://phaser.io/examples/v3/view/game-objects/container/rotation

```js
this.player = this.add.sprite(0, 0, 'player', 6);

this.container = this.add.container(playerInfo.x, playerInfo.y);
this.container.setSize(16, 16);
this.physics.world.enable(this.container);
this.container.add(this.player);

// update camera
this.updateCamera();

// don't go out of the map
this.container.body.setCollideWorldBounds(true);
```

- Cannot join the same room when clicking on the button (I suspect this has to do smth with websockets. Is it using the same websocket connection? is that why) Try using `location.replace`
```js
// Simulate a mouse click:
window.location.href = "http://www.w3schools.com";

// Simulate an HTTP redirect:
window.location.replace("http://www.w3schools.com");
```

https://phaser.io/phaser3/devlog/120

export default class DemoScene extends Phaser.Scene {
  constructor() {
    super('demoScene')
  }

  create() {
    console.log(this);
    // this.add.dom(100, 100, 'div', 'background-color: lime; width: 220px; height: 100px; font: 48px Arial', 'Phaser');
    var style = {
      'background-color': 'lime',
      'width': '220px',
      'height': '100px',
      'font': '48px Arial',
      'font-weight': 'bold'
    };

    console.log('demo scene')
    const button = document.createElement('button');
    // button.className = 'button';
    button.innerText = 'Buy a drink';


    this.add.dom(400, 300, button);
    // this.add.dom(400, 300, 'div', style, 'Phaser 3');
    // this.add.dom()
  }
}
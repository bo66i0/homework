'use strict';

class Vector {
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  plus(vector) {
    if (!(vector instanceof Vector)) {
      throw new Error('Можно прибавлять к вектору только вектор типа Vector');
    }
    return new Vector( this.x + vector.x,  this.y + vector.y)
  }

  times(coefficient) {
    return new Vector( this.x * coefficient,  this.y * coefficient);
  }
}

class Actor {
  constructor(pos = new Vector(0, 0), size = new Vector(1, 1), speed = new Vector(0, 0)) {
    if (!(pos instanceof Vector) || !(size instanceof Vector) || !(speed instanceof Vector)) {
      throw new Error('size, pos, speed должны быть типа Vector');
    }

    this.pos = pos;
    this.size = size;
    this.speed = speed;
  }

  act() {
  }

  get type() {
    return 'actor';
  }

  get left() {
    return this.pos.x;
  }

  get right() {
    return this.pos.x + this.size.x;
  }

  get top() {
    return this.pos.y;
  }

  get bottom() {
    return this.pos.y + this.size.y;
  }

  isIntersect(actor) {
    if(!actor) {
      throw new Error('Объект должен быть не пустым');
    } else if(!(actor instanceof Actor)) {
      throw new Error('Объект должен являться экземпляром класса Actor');
    } else if(actor === this) {
      return false
    }

    return this !== actor &&
      this.right > actor.left &&
      this.left < actor.right &&
      this.bottom > actor.top &&
      this.top < actor.bottom;
  }
}

class Level {
  constructor(grid = [], actors = []) {
    this.grid = grid;
    this.actors = actors;
    this.player = this.actors.find((actor) => actor.type === 'player');
    this.height = grid.length;
    this.status = null;
    this.finishDelay = 1;
  }

  get width() {
    if (!this.grid[0]) {
      return 0;
    }
    let max = this.grid[0].length;
    for (let i = 1; i < this.grid.length; i++) {
      if (this.grid[i].length > max) {
        max = this.grid[i].length;
      }
    }
    return max;
  }

  isFinished() {
    return this.status !== null && this.finishDelay < 0;
  }

  actorAt(actor) {
    return this.actors.find((obj) => obj.isIntersect(actor))
  }

  obstacleAt(positionToMove, size) {
    if (!(positionToMove instanceof Vector) || !(size instanceof Vector)) {
      throw new Error('объекты должны иметь тип Vector');
    }
    const myActor = new Actor(positionToMove, size);
    if (myActor.bottom > this.height) {
      return 'lava';
    }

    if (myActor.top < 0  || myActor.right > this.width || myActor.left < 0) {
      return 'wall'
    }

    for (let i = Math.floor(positionToMove.y); i < Math.ceil(positionToMove.y + size.y); i++) {
      for (let j = Math.floor(positionToMove.x); j < Math.ceil(positionToMove.x + size.x); j++) {
        if (this.grid[i][j]) {
          return this.grid[i][j];
        }
      }
    }
  }

  removeActor(actor) {
    this.actors = this.actors.filter((arrayActor) => arrayActor !== actor);
  }

  noMoreActors(type) {
    if (!this.actors.find((actor) => actor.type === type)) {
      return true;
    }
    return false;
  }

  playerTouched(type, actor) {
    if (this.status) {
      return;
    }

    if (type === 'lava' || type === 'fireball') {
      this.status = 'lost';
      return;
    }

    if (type === 'coin') {
      this.actors = this.actors.filter((arrayActor) => arrayActor !== actor);
      if (!this.actors.find((actor) => actor.type === 'coin')) {
        this.status = 'won';
      }
    }

  }
}

class LevelParser {
  constructor(dictionary = Object.create(null)) {
    this.dictionary = dictionary;
  }

  actorFromSymbol(key) {
   if (key)  return this.dictionary[key]
  }

  obstacleFromSymbol(key) {
    if (key === 'x') {
      return 'wall';
    }

    if (key === '!') {
      return 'lava';
    }

    return undefined;
  }

  createGrid(levelLines) {
    const getElementValue = (value) => {
      switch (value) {
        case 'x':
          return 'wall';
        case '!':
          return 'lava';
        default:
          return undefined;
      }
    };

    return levelLines
      .map((levelLine) => levelLine.split(''))
      .map((levelRow) => levelRow.map((element) => getElementValue(element)));
  }

  createActors(levelLines) {
    const actors = [];
    const elementsArray = levelLines.map((levelLine) => levelLine.split(''));
    for (let i = 0; i < elementsArray.length; i++) {
      for (let j = 0; j < elementsArray[0].length; j++) {
        const symbol = elementsArray[i][j];
        const objectConstructor = this.dictionary[symbol];
        if (typeof objectConstructor === 'function') {
          let newActor = new objectConstructor(new Vector(j, i));
          if (newActor instanceof Actor) {
            actors.push(newActor);
          }
        }
      }
    }
    return actors;
  }

  parse(levelLines) {
    return new Level(this.createGrid(levelLines), this.createActors(levelLines));
  }
}

class Fireball extends Actor {
  constructor(pos, speed) {
    super();
    this.pos = pos;
    this.speed = speed;
    this.size = new Vector(1, 1);
  }

  get type() {
    return  'fireball';
  }

  getNextPosition(time) {
    const nextPosition = new Vector(this.speed.x, this.speed.y);
    if (arguments.length === 0) {
      return nextPosition.plus(this.pos)
    }

    nextPosition.x *= time;
    nextPosition.y *= time;
    return nextPosition.plus(this.pos);
  }

  handleObstacle() {
    this.speed.x *= -1;
    this.speed.y *= -1;
  }

  act(time, level) {
    if (!level.obstacleAt(this.getNextPosition(time), this.size)) {
      this.pos = this.getNextPosition(time);
    } else {
      this.handleObstacle();
    }
  }
}

class HorizontalFireball extends Fireball {
  constructor(pos) {
    super();
    this.pos = pos;
    this.speed = new Vector(2, 0);
    this.size = new Vector(1, 1)
  }

}

class VerticalFireball extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 2));
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super(pos, new Vector(0, 3));
    this.initialPos = pos;
  }

  handleObstacle() {
    this.pos = this.initialPos;
  }
}

class Coin extends Actor {
  constructor(pos = new Vector(0, 0)) {
    const posPlus = pos.plus(new Vector(0.2, 0.1));
    super(posPlus,  new Vector(0.6, 0.6));
    this.springSpeed = 8;
    this.springDist = 0.07;
    this.spring = Math.random() * 2 * Math.PI;
    this.basePos = posPlus;
  }

  get type() {
    return 'coin'
  }

  updateSpring(time = 1) {
    this.spring += this.springSpeed * time;
  }

  getSpringVector() {
    return new Vector(0, Math.sin(this.spring) * this.springDist);
  }

  getNextPosition(time = 1) {
    this.updateSpring(time);
    return this.basePos.plus(this.getSpringVector());
  }

  act(time) {
    this.pos = this.getNextPosition(time);
  }
}

class Player extends Actor {
  constructor(pos) {
    super(pos, new Vector(0.8, 1.5), new Vector(0, 0));
    this.pos = this.pos.plus(new Vector(0, -0.5));
  }

  get type() {
    return 'player';
  }
}


const schemas = [
  [
    '         ',
    '         ',
    '    =    ',
    '       o ',
    '     !xxx',
    ' @       ',
    'xxx!     ',
    '         '
  ],
  [
    '      v  ',
    '    v    ',
    '  v      ',
    '        o',
    '        x',
    '@   x    ',
    'x        ',
    '         '
  ]
];
const actorDict = {
  '@': Player,
  'v': FireRain,
  'o': Coin
}
const parser = new LevelParser(actorDict);
runGame(schemas, parser, DOMDisplay)
  .then(() => console.log('Вы выиграли приз!'));
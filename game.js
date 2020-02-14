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
    return new Vector(vector.x = this.x + vector.x, vector.y = this.y + vector.y)
  }

  times(coefficient) {
    return new Vector(this.x = this.x * coefficient, this.y = this.y * coefficient);
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
    if (!(actor instanceof Actor)) {
      throw new Error('объект должен иметь класс Actor');
    }

    return this !== actor &&
      this.right >= actor.left &&
      this.left <= actor.right &&
      this.bottom >= actor.top &&
      this.top <= actor.bottom;
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

    console.log(this.actors[0]);

    return this.actors.find((actor) => actor.isIntersect(myActor));
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
    if (type === 'lava' || type === 'fireball') {
      this.status = 'lost';
      return;
    }

    if (type === 'coin') {
      this.actors = this.actors.filter((arrayActor) => arrayActor !== actor);
      if (!this.actors.find((actor) => actor.type === 'coin')) {
        this.status = 'won';
        return;
      }
    }

    if (this.status) {
      return;
    }
  }
}

class LevelParser {
  constructor(dictionary = Object.create(null)) {
    this.dictionary = dictionary;
  }

  actorFromSymbol(key) {
    if (arguments.length === 0) {
      return  undefined;
    }

    if (this.dictionary.hasOwnProperty(key)) {
      return this.dictionary.key;
    } else {
      return undefined;
    }
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
    const movingActors = ['@', 'o', 'v', '=', '|'];
    const elementsArray = levelLines.map((levelLine) => levelLine.split(''));
    for (let i = 0; i < elementsArray.length; i++) {
      for (let j = 0; j < elementsArray[0].length; j++) {
        if (movingActors.includes(elementsArray[i][j])) {
          let newActor = new this.dictionary[elementsArray[i][j]](new Vector(j, i));
          actors.push(newActor);
        }
      }
    }
    return actors;
  }

  parse(levelLines) {

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
      this.pos.plus(this.getNextPosition(time));
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
    super();
    this.pos = pos;
    this.speed = new Vector(0, 2);
    this.size = new Vector(1, 1)
  }
}

class FireRain extends Fireball {
  constructor(pos) {
    super();
    this.pos = pos;
    this.size = new Vector(1, 1);
    this.speed = new Vector(0, 3);
  }

  handleObstacle() {

  }
}



const actorsDict = Object.create(null);
actorsDict['='] = Actor;

const parser = new LevelParser(actorsDict);

const plan = [
  ' ! ',
  'x!x',
  '==='
];

parser.createActors(plan);
console.log(parser.createActors(plan));


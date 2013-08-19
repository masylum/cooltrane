/*global Cooltrane*/
(function () {
  var canvas = document.getElementById('cooltrane')
    , _
    , WIDTH = 960
    , HEIGHT = 960
    , R_HEIGHT = HEIGHT / 12
    , C_WIDTH = WIDTH / 12

    // VARS
    , GAME_ACC = 0.01

    // COLORS
    , B_R = 255
    , B_G = 155
    , B_B = 155
    , V_R = 21
    , V_G = 10
    , V_B = 10;

  function Game() {
    this.time = Date.now();
    this.ctx = canvas.getContext('2d');
    this.speed = 50;

    this.tone = 6;
    this.music = new Cooltrane.Music();

    this.layers = [
      {blocks: []}
    , {blocks: []}
    , {blocks: []}
    , {blocks: [], notes: true}
    ];
  }

  _ = Game.prototype;

  function shuffle(o) {
    for (var j, x, i = o.length; i; j = Math.floor(Math.random() * i), x = o[--i], o[i] = o[j], o[j] = x);
    return o;
  }

  function getLayerRGB(i) {
    return "rgb(" + (B_R - (V_R * i)) + ", " + (B_G - (V_G * i)) + ", " + (B_B - (V_B * i)) + ")";
  }

  function generateRandomBlock(layer, i) {
    layer.blocks.push({
      width: Math.min((0.1 + Math.random()) * 0.2 * WIDTH, 300)
    , height: Math.min((0.1 + Math.random()) * 0.6 * HEIGHT, 400)
    , x: WIDTH - i - 1
    , direction: Math.random() > 0.5 ? 'top' : 'bottom'
    });
  }

  function between(number, min, max) {
    return Math.min(Math.max(number, min), max);
  }

  function rand(max) {
    return Math.ceil(Math.random() * max);
  }

  function randomHeight(base_height) {
    return between(base_height + (Math.random() > 0.5 ? -R_HEIGHT : R_HEIGHT), R_HEIGHT, 5 * R_HEIGHT);
  }

  _.clock = function clock() {
    var chord;

    if (Date.now() - this.time > this.speed) {
      this.time = Date.now();
      this.speed -= GAME_ACC;
      chord = this.music.play();
      if (chord) {
        this.setChord(chord);
      }
      this.scrollLanscape();
    }
  };

  _.moveCooltrane = function moveCooltrane(tone) {
    this.tone = tone + 1;
  };

  _.setChord = function setChord(chord) {
    var layer = {x: WIDTH / 2};

    layer.notes = shuffle(chord.notes());
    layer.chord_name = chord.name;
    this.layers[this.layers.length - 1].blocks.push(layer);
  };

  _.scrollLanscape = function scrollLanscape() {
    var self = this;

    this.layers.forEach(function (layer, i) {
      var last_block;

      layer.blocks.forEach(function (block) {
        block.x -= i + 0.5;

        if (block.x + block.width < 0) {
          layer.blocks.shift();
        }
      });

      last_block = layer.blocks[layer.blocks.length - 1];

      if (!last_block || last_block.x + last_block.width <= WIDTH) {
        generateRandomBlock(layer, i);
      }
    });
  };

  _.drawBackground = function drawBackground() {
    var i = 0;
    for (;i < 12; i++) {
      this.ctx.fillStyle = getLayerRGB(i);
      this.ctx.fillRect(0, R_HEIGHT * i, WIDTH, R_HEIGHT);
    }
  };

  _.drawNotes = function drawNotes() {
    var self = this
      , padding = R_HEIGHT / 3;

    this.layers[this.layers.length - 1].blocks.forEach(function (chord) {
      self.ctx.beginPath();
      self.ctx.moveTo(chord.x, 0);
      self.ctx.lineTo(chord.x, HEIGHT);
      self.ctx.strokeStyle = '#ffffff';
      self.ctx.stroke();

      chord.notes.forEach(function (note, i) {
        self.ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';

        self.ctx.fillRect(
          chord.x + (i * C_WIDTH)
        , note.chroma() * R_HEIGHT + padding
        , C_WIDTH - 2 * padding
        , R_HEIGHT - 2 * padding
        );
      });
      self.ctx.font = 'italic 40pt Calibri';
      self.ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
      self.ctx.fillText(chord.chord_name, chord.x + C_WIDTH, HEIGHT / 2 - padding);
    });
  };

  _.drawParallax = function drawParallax() {
    var self = this;

    this.layers.forEach(function (layer, i) {
      if (layer.notes) {
        return;
      }

      layer.blocks.forEach(function (block) {
        var color_i = 12 - self.layers.length + i
          , scaled_height = Math.max(block.height / (i + 1), R_HEIGHT * (self.layers.length - i));

        self.ctx.fillStyle = getLayerRGB(color_i);
        if (block.direction === 'top') {
          self.ctx.fillRect(block.x, 0, block.width, scaled_height);
        } else {
          self.ctx.fillRect(block.x, HEIGHT - scaled_height, block.width, scaled_height);
        }
      });
    });
  };

  _.drawCooltrane = function drawCooltrane() {
    var padding = R_HEIGHT / 4;
    this.ctx.fillStyle = 'rgba(20, 20, 20, 0.8)';
    this.ctx.fillRect(
      C_WIDTH * 2 + padding
    , (HEIGHT - R_HEIGHT * this.tone) + padding
    , C_WIDTH - 2 * padding
    , R_HEIGHT - 2 * padding
    );
  };

  _.draw = function draw() {
    this.clock();
    this.drawBackground();
    this.drawParallax();
    this.drawNotes();
    this.drawCooltrane();
  };

  // exports
  Cooltrane.Game = Game;
}());

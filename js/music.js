/*global Cooltrane, T, teoria*/
(function () {

  var CHORDS
    , SPEED = 20
    , _;

  CHORDS = [ 'Bmaj7', 'D7', 'Gmaj7', 'Bb7', 'Ebmaj7', 'Ebmaj7', 'Am7', 'D7'
           , 'Gmaj7', 'Bb7', 'Ebmaj7', 'Gb7', 'Bmaj7', 'Bmaj7', 'Fm7', 'Bb7'
           , 'Ebmaj7', 'Ebmaj7', 'Am7', 'D7', 'Gmaj7', 'Gmaj7', 'C#m7', 'F#7'
           ];

  function onEnd() {
    this.pause();
  }

  function playHitHat() {
    var pluck = T('pluck', {freq: 10, mul: 0.5}).bang();
    return T('perc', {r: 60, lv: 2}, pluck).on('ended', onEnd);
  }

  function playOpenHitHat() {
    var noise = T('pink', {mul: 0.15});
    return T('perc', {r: 1000}, noise).on('ended', onEnd);
  }

  function playChord(notes) {
    var gen;

    gen = T.apply(T, ['+'].concat(notes.map(function (note) {
      return T('sin', {freq: note.fq(), mul: 0.25});
    })));

    return T('linen', {r: 2000}, gen).on('ended', onEnd);
  }

  function Music() {
    var self = this;

    this.chords = CHORDS.map(function (chord) {
      return playChord(teoria.chord(chord, 4).notes());
    });

    this.count = 0;
    this.chords_i = 0;
    this.hit_hat = playHitHat();
    this.open_hit_hat = playOpenHitHat();
  }

  _ = Music.prototype;

  _.play = function () {
    var ret = null;

    if (this.count % SPEED === 0) {
      this.hit_hat.bang().play();
    }

    if (this.count % (2 * SPEED) === 0) {
      this.open_hit_hat.bang().play();
    }

    if (this.count % (4 * SPEED) === 0) {
      this.chords_i++;
      this.chords[this.chords_i % this.chords.length].play().bang();
      ret = teoria.chord(CHORDS[this.chords_i % this.chords.length], 4);
    }

    this.count++;

    return ret;
  };

  // exports
  Cooltrane.Music = Music;
}());

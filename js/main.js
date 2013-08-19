/*global AudioContext, Cooltrane*/
(function () {
  var pitch
    , tones = []
    , last_tone
    , CONSENSUS_WINDOW = 3
    , game = new Cooltrane.Game();

  if (!window.requestAnimationFrame) {
    window.requestAnimationFrame = window.webkitRequestAnimationFrame;
  }

  function consensus(array, tone) {
    return array.every(function (t) {
      return t === tone;
    });
  }

  function onError() {
    alert('Stream generation failed.');
  }

  function step() {
    var tone = pitch.analizePitch();

    if (typeof tone === 'number') {
      tones.push(tone);

      if (tones.length > CONSENSUS_WINDOW) {
        tones.shift();
      }

      // moving average
      if (consensus(tones, tone)) {
        game.moveCooltrane(tone);
        game.draw(true);
      }
      console.log('consensus', tone, tones);
    }

    game.draw();

    window.requestAnimationFrame(step);
  }

  function gotStream(stream) {
    pitch = new Cooltrane.Pitch(stream);
    game.draw();
    game.music.play();
    window.requestAnimationFrame(step);
  }

  window.onload = function () {
    try {
      if (!navigator.getUserMedia) {
        navigator.getUserMedia = navigator.webkitGetUserMedia;
      }
      navigator.getUserMedia({audio: true}, gotStream, onError);
    } catch (e) {
      alert('getUserMedia threw exception :' + e);
    }
  };
}());

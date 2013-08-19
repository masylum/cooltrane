/*global AudioContext, Cooltrane, PitchAnalyzer*/
(function () {

  var BUFLEN = 2048
    , C3_FREQ = 131
    , B3_FREQ = 248
    , MIN_DB = 1
    , MINVAL = 134
    , _;

  /**
   * Constructor
   */
  function Pitch(stream) {
    this.audioContext = new AudioContext();
    this.buffer = new Uint8Array(BUFLEN);
    this.analyser = this.audioContext.createAnalyser();

    var mediaStreamSource = this.audioContext.createMediaStreamSource(stream);
    this.convertToMono(mediaStreamSource).connect(this.analyser);
  }

  _ = Pitch.prototype;

  _.findNextPositiveZeroCrossing = function findNextPositiveZeroCrossing(start) {
    var i = Math.ceil(start)
      , t
      , last_zero = -1;

    // advance until we're zero or negative
    while (i < BUFLEN && (this.buffer[i] > 128)) {
      i++;
    }

    if (i >= BUFLEN) {
      return -1;
    }

    // advance until we're above MINVAL, keeping track of last zero.
    while (i < BUFLEN && ((t = this.buffer[i]) < MINVAL)) {
      if (t >= 128) {
        if (last_zero === -1) {
          last_zero = i;
        }
      } else {
        last_zero = -1;
      }
      i++;
    }

    // we may have jumped over MINVAL in one sample.
    if (last_zero === -1) {
      last_zero = i;
    }

    if (i === BUFLEN) {// We didn't find any more positive zero crossings
      return -1;
    }

    // The first sample might be a zero.  If so, return it.
    if (last_zero === 0) {
      return 0;
    }

    // Otherwise, the zero might be between two values, so we need to scale it.
    t = (128 - this.buffer[last_zero - 1]) / (this.buffer[last_zero] - this.buffer[last_zero - 1]);
    return last_zero + t;
  };

  _.getToneZeroCrossing = function getToneZeroCrossing() {
    var cycles = []
      , i = 0
      , num_cycles, sum, pitch
      , next_zero, confidence
      , last_zero = this.findNextPositiveZeroCrossing(0)
      , n = 0;

    // keep finding points, adding cycle lengths to array
    while (last_zero !== -1) {
      next_zero = this.findNextPositiveZeroCrossing(last_zero + 1);
      if (next_zero > -1) {
        cycles.push(next_zero - last_zero);
      }

      last_zero = next_zero;
      n++;

      if (n > 1000) {
        break;
      }
    }

    // 1?: average the array
    num_cycles = cycles.length;
    sum = 0;
    pitch = 0;

    for (i = 0; i < num_cycles; i++) {
      sum += cycles[i];
    }

    if (num_cycles) {
      sum /= num_cycles;
      pitch = this.audioContext.sampleRate / sum;
    }

    // confidence = num_cycles / num_possible_cycles = num_cycles / (audioContext.sampleRate/)
    confidence = num_cycles ? ((num_cycles / (pitch * BUFLEN / this.audioContext.sampleRate)) * 100) : 0;
    if (confidence > 80) {
      return pitch;
    } else {
      return null;
    }
  };

  _.convertToMono = function convertToMono(input) {
    var splitter = this.audioContext.createChannelSplitter(2)
      , merger = this.audioContext.createChannelMerger(2);

    input.connect(splitter);
    splitter.connect(merger, 0, 0);
    splitter.connect(merger, 0, 1);
    return merger;
  };

  /**
   * Get a note from a given frequency
   *
   * @param {Number} frequency
   * @return {Number}
   */
  _.noteFromPitch = function noteFromPitch(frequency) {
    var noteNum = 12 * (Math.log(frequency / 440) / Math.log(2));
    return Math.round(noteNum) + 69;
  };

  /**
   * Analize the input
   *
   * @return {Number}
   */
  _.analizePitch = function analizePitch() {
    var pitch_analyzer, tone_a, tone_b, note_a, note_b;

    this.analyser.getByteTimeDomainData(this.buffer);

    // A
    pitch_analyzer = new PitchAnalyzer({sampleRate: this.audioContext.sampleRate});
    pitch_analyzer.input(this.buffer);
    pitch_analyzer.process();
    tone_a = pitch_analyzer.findTone();

    // B
    tone_b = this.getToneZeroCrossing();

    if (tone_b && tone_b > (C3_FREQ - 2) && tone_b < (B3_FREQ + 2)) {
      note_b = this.noteFromPitch(tone_b) % 12;
      console.log('B) Found a tone, frequency:', tone_b, 'note:', note_b);
      return note_b;
    }

    // A
    if (tone_a && tone_a.db > MIN_DB && tone_a.freq > (C3_FREQ - 2) && tone_a.freq < (B3_FREQ + 2)) {
      note_a = this.noteFromPitch(tone_a.freq) % 12;
      console.log('A) Found a tone, frequency:', tone_a.freq, 'volume:', tone_a.db, 'note:', note_a);
      return note_a;
    }

    return null;
  };

  // exports
  Cooltrane.Pitch = Pitch;
}());

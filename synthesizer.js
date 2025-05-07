/* ------------------------------------------------
   TouchSynth  – ノードごとに周波数を持つサイン波シンセ
   使い方:
     const synth = new TouchSynth(p, 440);
     synth.trigger();
--------------------------------------------------*/

class TouchSynth {
    constructor(p, freq = 440) {
      this.p = p;
      // ▶︎ オシレータ
      this.osc = new p5.Oscillator('sine');
      this.osc.freq(freq);
      // ▶︎ エンベロープ（アタック10ms / ディケイ100ms / リリース150ms）
      this.env = new p5.Envelope(0.01, 0.7, 0.1, 0.0, 0.15);
      this.osc.amp(this.env);
      this.osc.start();
    }
    trigger() {
      // iOS Safari 対策: AudioContext が止まっていれば再開
      if (this.p.getAudioContext().state !== 'running') {
        this.p.getAudioContext().resume();
      }
      this.env.play();
    }
  }
  
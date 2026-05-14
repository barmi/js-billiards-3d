// 절차적 사운드. Web Audio API의 AudioBuffer를 미리 합성해 빠르게 재생.
// 외부 오디오 파일 없음 (HTML/JS/CSS만으로 배포 요건 유지).
// 모든 합성은 짧은 임펄스(주파수 + 노이즈 + 지수 감쇠 엔벨로프) 기반.

const SAMPLE_RATE = 44100;

// 단일 합성 함수 — 주파수, 노이즈 혼합, 감쇠 시정수를 받아 1채널 버퍼를 만듦.
function synth(ctx, durationSec, fnPerSample) {
  const len = Math.floor(durationSec * ctx.sampleRate);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) {
    const t = i / ctx.sampleRate;
    data[i] = fnPerSample(t);
  }
  return buf;
}

// 공-공: 짧고 날카로운 "tock". 두 주파수 합성으로 좀 더 풍부한 음색.
function buildBallBallBuffer(ctx) {
  return synth(ctx, 0.07, (t) => {
    const env = Math.exp(-t / 0.018);
    const tone =
      Math.sin(2 * Math.PI * 1180 * t) * 0.55 +
      Math.sin(2 * Math.PI * 1740 * t) * 0.30;
    const noise = (Math.random() * 2 - 1) * 0.40;
    return (tone + noise) * env * 0.7;
  });
}

// 공-쿠션: 둔탁한 "thud". 낮은 주파수 + 더 긴 감쇠.
function buildBallCushionBuffer(ctx) {
  return synth(ctx, 0.13, (t) => {
    const env = Math.exp(-t / 0.045);
    const tone =
      Math.sin(2 * Math.PI * 320 * t) * 0.55 +
      Math.sin(2 * Math.PI * 540 * t) * 0.25;
    const noise = (Math.random() * 2 - 1) * 0.45;
    return (tone + noise) * env * 0.85;
  });
}

// 포켓 진입: "plop" — 하강 주파수 + 잔향.
function buildPocketBuffer(ctx) {
  return synth(ctx, 0.22, (t) => {
    const env = Math.exp(-t / 0.080);
    const freq = 380 * Math.exp(-t * 5.5);
    const tone = Math.sin(2 * Math.PI * freq * t);
    const noise = (Math.random() * 2 - 1) * 0.30;
    return (tone * 0.7 + noise * 0.3) * env * 0.9;
  });
}

// 큐 임팩트: 짧은 "tap".
function buildCueImpactBuffer(ctx) {
  return synth(ctx, 0.05, (t) => {
    const env = Math.exp(-t / 0.012);
    const tone = Math.sin(2 * Math.PI * 620 * t) * 0.55;
    const noise = (Math.random() * 2 - 1) * 0.55;
    return (tone + noise) * env * 0.65;
  });
}

export class SoundManager {
  constructor() {
    this.enabled = true;
    this.ctx = null;
    this.buffers = null;
    this.master = null;
    this.masterVolume = 0.6;
  }

  // 사용자 입력 직후 호출. AudioContext 생성·resume + 버퍼 준비.
  init() {
    if (this.ctx) return;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) {
        this.enabled = false;
        return;
      }
      this.ctx = new AC({ sampleRate: SAMPLE_RATE });
      this.master = this.ctx.createGain();
      this.master.gain.value = this.masterVolume;
      this.master.connect(this.ctx.destination);
      this.buffers = {
        ballBall:    buildBallBallBuffer(this.ctx),
        ballCushion: buildBallCushionBuffer(this.ctx),
        pocket:      buildPocketBuffer(this.ctx),
        cueImpact:   buildCueImpactBuffer(this.ctx),
      };
    } catch (e) {
      this.enabled = false;
    }
  }

  // 자동 재생 정책 회피: 사용자 입력에서 호출.
  resume() {
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  _play(key, volume = 1.0) {
    if (!this.enabled || !this.ctx || !this.buffers) return;
    if (this.ctx.state !== 'running') {
      // 아직 사용자 입력 전이거나 suspended.
      this.ctx.resume().catch(() => {});
      if (this.ctx.state !== 'running') return;
    }
    const src = this.ctx.createBufferSource();
    src.buffer = this.buffers[key];
    const gain = this.ctx.createGain();
    gain.gain.value = Math.max(0.0, Math.min(1.0, volume));
    src.connect(gain);
    gain.connect(this.master);
    src.start();
  }

  // 0~1 사이 volume 매핑 — 충돌 속도(m/s)에서 적절한 강도로.
  // ballBall은 두 공의 상대 속도, ballCushion은 공 속도.
  playBallBall(relativeSpeed) {
    const v = Math.min(1.0, Math.max(0.06, relativeSpeed / 4.5));
    this._play('ballBall', v);
  }
  playBallCushion(speed) {
    const v = Math.min(1.0, Math.max(0.06, speed / 3.5));
    this._play('ballCushion', v);
  }
  playPocket() {
    this._play('pocket', 0.85);
  }
  playCueImpact(power01) {
    const v = Math.max(0.15, Math.min(1.0, 0.3 + power01 * 0.7));
    this._play('cueImpact', v);
  }
}

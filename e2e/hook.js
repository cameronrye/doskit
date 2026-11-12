// An init script for the browser tests: it watches every emulator the page starts, through
// js-dos's own API, without changing what the page does. For each start it keeps the frames'
// fingerprints as they change, what DOS printed, DOSBox's log, and how loud the sound was;
// and it keeps every AudioContext the page makes, to tell whether sound was allowed to play.
//
// Tests read window.__e2e only after their audio checks, or not at all: Playwright counts
// page.evaluate() as a user gesture, which would unlock the sound it is meant to test.
// The same facts also go to the console, as lines starting with [e2e].
(() => {
  const E = (window.__e2e = { starts: [], audio: [] });
  const say = (event, data) => console.log(`[e2e] ${JSON.stringify({ event, ...data })}`);

  // FNV-1a over every byte, as src/utils/frameHash.ts
  const fnv1a = (bytes) => {
    let hash = 0x811c9dc5;
    for (let i = 0; i < bytes.length; i++) {
      hash ^= bytes[i];
      hash = Math.imul(hash, 0x01000193);
    }
    return hash >>> 0;
  };

  const RealAudioContext = window.AudioContext;
  if (RealAudioContext) {
    window.AudioContext = class extends RealAudioContext {
      constructor(...args) {
        super(...args);
        E.audio.push(this);
        say('audio-context', { state: this.state });
        this.addEventListener('statechange', () => say('audio-state', { state: this.state }));
      }
    };
  }

  const attach = (start, ci) => {
    start.ci = ci;
    start.readyAt = performance.now();
    say('ci-ready', { index: start.index });
    const events = ci.events();
    let latest = null;
    events.onFrame((rgb, rgba) => {
      latest = rgb || rgba;
      start.frames += 1;
    });
    events.onStdout((line) => {
      start.stdout.push(String(line));
      say('stdout', { index: start.index, line: String(line) });
    });
    events.onMessage((type, ...args) => start.messages.push([type, ...args].join(' ')));
    events.onSoundPush((samples) => {
      let sum = 0;
      let squares = 0;
      for (let i = 0; i < samples.length; i++) {
        sum += samples[i];
        squares += samples[i] * samples[i];
      }
      const n = samples.length || 1;
      const ac = Math.sqrt(Math.max(0, squares / n - (sum / n) ** 2));
      const second = Math.floor((performance.now() - start.t0) / 1000);
      start.loudness[second] = Math.max(start.loudness[second] || 0, ac);
    });
    start.timer = setInterval(() => {
      if (!latest) return;
      const hash = fnv1a(latest);
      const last = start.hashes[start.hashes.length - 1];
      if (!last || last[1] !== hash) {
        const t = Math.round(performance.now() - start.t0);
        start.hashes.push([t, hash, ci.width(), ci.height()]);
        say('frame', { index: start.index, t, hash, width: ci.width(), height: ci.height() });
      }
    }, 100);
  };

  let wrapped;
  Object.defineProperty(window, 'Dos', {
    configurable: true,
    get: () => wrapped,
    set: (real) => {
      wrapped = function (element, options = {}) {
        const start = {
          index: E.starts.length,
          t0: performance.now(),
          isApp: options.initFs !== undefined,
          conf: options.dosboxConf || '',
          hashes: [],
          stdout: [],
          messages: [],
          loudness: [],
          frames: 0,
        };
        E.starts.push(start);
        say('start', { index: start.index, isApp: start.isApp });
        const onEvent = options.onEvent;
        return real(element, {
          ...options,
          onEvent: (event, arg) => {
            if (event === 'ci-ready') attach(start, arg);
            if (onEvent) onEvent(event, arg);
          },
        });
      };
    },
  });
})();

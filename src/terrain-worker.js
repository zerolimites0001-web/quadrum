// ============================================================================
//  terrain-worker.js — geração de terreno fora da thread principal.
//  Importa apenas módulos puros (sem DOM/Three). Recebe init e pedidos de
//  geração; devolve os dados do chunk (Uint16Array) por transferência.
// ============================================================================
import {Terrain} from './terrain.js';

let terrain = null;

self.onmessage = (event) => {
  const msg = event.data;
  if (!msg || typeof msg !== 'object') return;

  if (msg.type === 'init') {
    try {
      terrain = new Terrain(msg.seed, msg.options);
      self.postMessage({ type: 'ready' });
    } catch (err) {
      self.postMessage({ type: 'error', message: String(err && err.message || err) });
    }
    return;
  }

  if (msg.type === 'gen') {
    const { id, cx, cz, key } = msg;
    if (!terrain) {
      self.postMessage({ type: 'error', id, key, message: 'Worker não inicializado.' });
      return;
    }
    try {
      const data = terrain.generate(cx, cz);
      // transfere o buffer (zero-copy) para a main thread
      self.postMessage({ type: 'chunk', id, cx, cz, key, data }, [data.buffer]);
    } catch (err) {
      self.postMessage({ type: 'error', id, key, message: String(err && err.message || err) });
    }
  }
};

// ============================================================================
//  terrain-bridge.js — gerencia o Web Worker de geração de terreno.
//  A main thread pede chunks; o worker gera e devolve Uint16Array por
//  transferência (zero-copy). Se o Worker falhar/indisponível, cai no
//  modo síncrono (world.bridge = null), preservando o comportamento antigo.
// ============================================================================
export class TerrainBridge {
  constructor(world) {
    this.world = world;
    this.worker = null;
    this.ready = false;
    this.failed = false;
    this.reqSeq = 0;
    this.pending = new Set();   // keys pedidos e ainda não entregues
    this.maxInflight = 6;        // não pedir tudo de uma vez
    this._onMessage = this._onMessage.bind(this);
    this._onError = this._onError.bind(this);
  }

  // Inicia o worker. Retorna true se ficou disponível.
  async start() {
    const meta = this.world.meta;
    try {
      this.worker = new Worker(new URL('./terrain-worker.js', import.meta.url), { type: 'module' });
    } catch (err) {
      // Ambientes que não aceitam module worker → fallback síncrono
      this.failed = true;
      return false;
    }
    this.worker.addEventListener('message', this._onMessage);
    this.worker.addEventListener('error', this._onError);
    // envia init e espera 'ready' (ou timeout curto)
    return await new Promise((resolve) => {
      const timer = setTimeout(() => { this.failed = true; resolve(false); }, 4000);
      this._resolveReady = (ok) => { clearTimeout(timer); resolve(ok); };
      try {
        this.worker.postMessage({ type: 'init', seed: meta.seed, options: meta.generator });
      } catch (err) {
        clearTimeout(timer);
        this.failed = true;
        resolve(false);
      }
    });
  }

  _onError() {
    this.failed = true;
    this.ready = false;
    // libera a espera, se houver
    this._resolveReady?.(false);
  }

  _onMessage(event) {
    const msg = event.data;
    if (!msg || typeof msg !== 'object') return;
    if (msg.type === 'ready') {
      this.ready = true;
      this._resolveReady?.(true);
      return;
    }
    if (msg.type === 'chunk') {
      this.ready = true;
      this.pending.delete(msg.key);
      // guarda o dado pronto para o world.ensure consumir
      this.world.prefetched.set(msg.key, msg.data);
      return;
    }
    if (msg.type === 'error') {
      if (msg.key) this.pending.delete(msg.key);
    }
  }

  // Pede geração de um chunk (idempotente). Não gera no main thread.
  request(cx, cz) {
    if (!this.ready || this.failed || !this.worker) return false;
    const key = cx + ',' + cz;
    if (this.world.chunks.has(key) || this.world.prefetched.has(key) || this.pending.has(key)) return true;
    if (this.pending.size >= this.maxInflight) return false;
    this.pending.add(key);
    try {
      this.worker.postMessage({ type: 'gen', id: ++this.reqSeq, cx, cz, key });
    } catch (err) {
      this.pending.delete(key);
      return false;
    }
    return true;
  }

  // Pede todos os chunks numa área (usado no stream/entrada do mundo).
  requestArea(cx, cz, radius) {
    if (!this.ready || this.failed) return;
    const list = [];
    for (let dz = -radius; dz <= radius; dz++)
      for (let dx = -radius; dx <= radius; dx++)
        if (dx * dx + dz * dz <= (radius + 0.5) ** 2)
          list.push({ cx: cx + dx, cz: cz + dz, d: dx * dx + dz * dz });
    list.sort((a, b) => a.d - b.d);
    for (const p of list) this.request(p.cx, p.cz);
  }

  // Quantos chunks já estão prontos (dados) aguardando meshar.
  get readyCount() { return this.world ? this.world.prefetched.size : 0; }

  dispose() {
    if (this.worker) {
      try { this.worker.terminate(); } catch {}
      this.worker = null;
    }
    this.ready = false;
    this.pending.clear();
  }
}

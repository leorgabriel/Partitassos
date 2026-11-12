const Viewer = {
  el: null,
  scrollArea: null,
  img: null,
  scrolling: false,
  rafId: null,

  init() {
    this.el = document.getElementById('viewer');
    this.scrollArea = document.getElementById('viewer-scroll-area');
    this.img = document.getElementById('viewer-img');

    this.setupSwipe();
    document.getElementById('viewer-close').onclick = () => this.close();
    document.getElementById('viewer-download').onclick = () => this.download();
    document.getElementById('viewer-edit').onclick = () => openEditModal(this.itemId);
    document.getElementById('viewer-theme').onclick = () => this.toggleTheme();
    document.getElementById('viewer-scroll').onclick = () => this.toggleAutoScroll();
    document.getElementById('viewer-speed').oninput = () => {}; // lido direto no loop
  },

  download() {
    if (!this.img.src) return;
    const name = (this.title || 'partitura').replace(/[\\/:*?"<>|]+/g, ' ').trim() || 'partitura';
    const ext = /^data:image\/png/.test(this.img.src) ? 'png' : 'jpg';
    const a = document.createElement('a');
    a.href = this.img.src;
    a.download = `${name}.${ext}`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    const btn = document.getElementById('viewer-download');
    btn.textContent = '✅';
    setTimeout(() => { btn.textContent = '💾'; }, 1500);
  },

  items: [],
  index: 0,

  open(items, index) {
    this.items = items;
    this.el.hidden = false;
    this.show(index);
  },

  show(index) {
    const item = this.items[index];
    if (!item) return;
    this.index = index;
    this.title = item.title || '';
    this.itemId = item.id;
    this.img.src = item.image;
    this.scrollArea.scrollTop = 0;
    document.getElementById('viewer-counter').textContent = `${index + 1} / ${this.items.length}`;
    document.getElementById('viewer-prev').hidden = index <= 0;
    document.getElementById('viewer-next').hidden = index >= this.items.length - 1;
  },

  go(delta) {
    const next = this.index + delta;
    if (next < 0 || next >= this.items.length) return;
    this.show(next);
  },

  setupSwipe() {
    document.getElementById('viewer-prev').onclick = () => this.go(-1);
    document.getElementById('viewer-next').onclick = () => this.go(1);
    document.addEventListener('keydown', (e) => {
      if (this.el.hidden) return;
      if (e.key === 'ArrowLeft') this.go(-1);
      if (e.key === 'ArrowRight') this.go(1);
    });

    let start = null;
    this.scrollArea.addEventListener('touchstart', (e) => {
      const zoomed = window.visualViewport && window.visualViewport.scale > 1.05;
      start = (e.touches.length === 1 && !zoomed)
        ? { x: e.touches[0].clientX, y: e.touches[0].clientY, t: Date.now() } : null;
    }, { passive: true });
    this.scrollArea.addEventListener('touchend', (e) => {
      if (!start || e.changedTouches.length !== 1) { start = null; return; }
      const dx = e.changedTouches[0].clientX - start.x;
      const dy = e.changedTouches[0].clientY - start.y;
      const fast = Date.now() - start.t < 600;
      start = null;
      if (fast && Math.abs(dx) > 70 && Math.abs(dx) > Math.abs(dy) * 2) {
        this.go(dx < 0 ? 1 : -1);
      }
    }, { passive: true });
  },

  close() {
    this.stopAutoScroll();
    this.el.hidden = true;
    this.img.src = '';
  },

  toggleTheme() {
    this.el.classList.toggle('theme-light');
  },

  toggleAutoScroll() {
    this.scrolling ? this.stopAutoScroll() : this.startAutoScroll();
  },

  startAutoScroll() {
    this.scrolling = true;
    document.getElementById('viewer-speed-wrap').hidden = false;
    document.getElementById('viewer-scroll').textContent = '⏸️';
    const speedInput = document.getElementById('viewer-speed');
    let last = performance.now();

    const step = (now) => {
      if (!this.scrolling) return;
      const dt = now - last;
      last = now;
      const pxPerSec = Number(speedInput.value) * 8; // bem lento por padrão
      this.scrollArea.scrollTop += (pxPerSec * dt) / 1000;
      this.rafId = requestAnimationFrame(step);
    };
    this.rafId = requestAnimationFrame(step);
  },

  stopAutoScroll() {
    this.scrolling = false;
    document.getElementById('viewer-speed-wrap').hidden = true;
    document.getElementById('viewer-scroll').textContent = '▶️';
    if (this.rafId) cancelAnimationFrame(this.rafId);
  }
};

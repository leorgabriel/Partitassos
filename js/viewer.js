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

    document.getElementById('viewer-close').onclick = () => this.close();
    document.getElementById('viewer-download').onclick = () => this.download();
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

  open(imageSrc, title) {
    this.title = title || '';
    this.img.src = imageSrc;
    this.el.hidden = false;
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

// Small helpers shared by the demos in /demos.
window.DemoKit = {
  // Returns a tick() function to call once per frame; updates `el` twice a second.
  fpsCounter(el) {
    let frames = 0;
    let last = performance.now();
    return function tick() {
      frames++;
      const now = performance.now();
      if (now - last >= 500) {
        el.textContent = `${Math.round((frames * 1000) / (now - last))} fps`;
        frames = 0;
        last = now;
      }
    };
  },

  // Resizes the canvas backing store to its CSS size times DPR. Returns true if it changed.
  fitCanvas(canvas, maxDpr = 2) {
    const dpr = Math.min(window.devicePixelRatio || 1, maxDpr);
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width === w && canvas.height === h) return false;
    canvas.width = w;
    canvas.height = h;
    return true;
  },

  // Binds a range input to a value display and a callback.
  bindRange(id, onChange) {
    const input = document.getElementById(id);
    const out = document.querySelector(`output[for="${id}"]`);
    const update = () => {
      const v = parseFloat(input.value);
      if (out) out.textContent = input.step && input.step.includes(".") ? v.toFixed(2) : String(v);
      onChange(v);
    };
    input.addEventListener("input", update);
    update();
  },

  showError(title, html) {
    document.querySelectorAll("canvas.demo").forEach((c) => c.remove());
    const el = document.createElement("div");
    el.className = "demo-error";
    el.innerHTML = `<div><h2>${title}</h2><p>${html}</p><p><a href="/demos.html">&larr; Back to demos</a></p></div>`;
    document.body.appendChild(el);
  },
};

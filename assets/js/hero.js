// Home page hero: a WebGL2 raymarched SDF scene shaded with iso-depth contour lines.
(function () {
  const canvas = document.getElementById("hero-canvas");
  if (!canvas) return;
  const gl = canvas.getContext("webgl2", { antialias: false, alpha: false, powerPreference: "low-power" });
  if (!gl) { canvas.remove(); return; } // CSS gradient on .hero is the fallback

  const VS = `#version 300 es
  void main() {
    vec2 p = vec2((gl_VertexID << 1) & 2, gl_VertexID & 2);
    gl_Position = vec4(p * 2.0 - 1.0, 0.0, 1.0);
  }`;

  const FS = `#version 300 es
  precision highp float;
  uniform vec2 uRes;
  uniform float uTime;
  out vec4 outColor;

  const vec3 BG = vec3(0.043, 0.051, 0.071);

  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  float smin(float a, float b, float k) {
    float h = clamp(0.5 + 0.5 * (b - a) / k, 0.0, 1.0);
    return mix(b, a, h) - k * h * (1.0 - h);
  }

  float sdTorus(vec3 p, vec2 t) { return length(vec2(length(p.xz) - t.x, p.y)) - t.y; }

  float map(vec3 p) {
    float t = uTime;
    vec3 q = p - vec3(0.0, 0.25, 0.0);
    q.yz *= rot(0.9 + 0.25 * sin(t * 0.3));
    q.xz *= rot(t * 0.25);
    float d = sdTorus(q, vec2(1.05, 0.3));
    vec3 a = vec3(sin(t * 0.7) * 1.5, 0.35 + 0.45 * sin(t * 1.1), cos(t * 0.7) * 1.5);
    vec3 b = vec3(cos(t * 0.5) * 0.6, 0.6 + 0.35 * cos(t * 0.9), sin(t * 0.5) * 0.6);
    d = smin(d, length(p - a) - 0.42, 0.55);
    d = smin(d, length(p - b) - 0.32, 0.45);
    return min(d, p.y + 1.0);
  }

  vec3 normal(vec3 p) {
    const vec2 k = vec2(1.0, -1.0);
    const float e = 0.0015;
    return normalize(k.xyy * map(p + k.xyy * e) + k.yyx * map(p + k.yyx * e) +
                     k.yxy * map(p + k.yxy * e) + k.xxx * map(p + k.xxx * e));
  }

  float softShadow(vec3 ro, vec3 rd) {
    float res = 1.0, t = 0.03;
    for (int i = 0; i < 28; i++) {
      float h = map(ro + rd * t);
      res = min(res, 10.0 * h / t);
      t += clamp(h, 0.02, 0.25);
      if (res < 0.01 || t > 8.0) break;
    }
    return clamp(res, 0.0, 1.0);
  }

  void main() {
    vec2 uv = (2.0 * gl_FragCoord.xy - uRes) / uRes.y;
    uv.x -= 0.55 * clamp(uRes.x / uRes.y - 1.0, 0.0, 1.0); // push the scene right on wide screens

    float ang = uTime * 0.08 + 0.6;
    vec3 ro = vec3(sin(ang) * 5.2, 1.7, cos(ang) * 5.2);
    vec3 ww = normalize(vec3(0.0, 0.1, 0.0) - ro);
    vec3 uu = normalize(cross(ww, vec3(0.0, 1.0, 0.0)));
    vec3 vv = cross(uu, ww);
    vec3 rd = normalize(uv.x * uu + uv.y * vv + 1.8 * ww);

    float t = 0.0;
    bool hit = false;
    for (int i = 0; i < 96; i++) {
      float d = map(ro + rd * t);
      if (d < 0.001 * t) { hit = true; break; }
      t += d;
      if (t > 30.0) break;
    }

    vec3 col = BG;
    if (hit) {
      vec3 p = ro + rd * t;
      vec3 n = normal(p);
      vec3 l = normalize(vec3(0.6, 0.9, 0.4));
      float diff = max(dot(n, l), 0.0) * softShadow(p + n * 0.002, l);
      float rim = pow(1.0 - max(dot(n, -rd), 0.0), 3.0);

      // Iso-depth contours: lines of constant distance from the camera.
      float z = t * 2.2;
      float w = fwidth(z) * 1.2;
      float f = fract(z);
      float line = 1.0 - smoothstep(0.0, w, min(f, 1.0 - f));
      vec3 ink = mix(vec3(0.37, 0.89, 1.0), vec3(1.0, 0.37, 0.64), smoothstep(3.5, 8.0, t));

      vec3 base = vec3(0.08, 0.1, 0.14) * (0.25 + 0.9 * diff) + ink * rim * 0.25;
      col = base + ink * line * (0.35 + 0.65 * diff);
      col = mix(col, BG, smoothstep(6.0, 16.0, t));
    }

    col = pow(col, vec3(0.9));
    outColor = vec4(col, 1.0);
  }`;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s));
    return s;
  }

  let prog;
  try {
    prog = gl.createProgram();
    gl.attachShader(prog, compile(gl.VERTEX_SHADER, VS));
    gl.attachShader(prog, compile(gl.FRAGMENT_SHADER, FS));
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog));
  } catch (err) {
    console.warn("Hero shader failed, using fallback:", err);
    canvas.remove();
    return;
  }

  gl.useProgram(prog);
  gl.bindVertexArray(gl.createVertexArray());
  const uRes = gl.getUniformLocation(prog, "uRes");
  const uTime = gl.getUniformLocation(prog, "uTime");

  // Render below native resolution; the contour lines stay crisp enough and it keeps laptops cool.
  const RENDER_SCALE = 0.75;
  function resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 1.5) * RENDER_SCALE;
    const w = Math.max(1, Math.round(canvas.clientWidth * dpr));
    const h = Math.max(1, Math.round(canvas.clientHeight * dpr));
    if (canvas.width !== w || canvas.height !== h) {
      canvas.width = w;
      canvas.height = h;
      gl.viewport(0, 0, w, h);
    }
  }

  function draw(seconds) {
    resize();
    gl.uniform2f(uRes, canvas.width, canvas.height);
    gl.uniform1f(uTime, seconds);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  let visible = true;
  let raf = 0;
  let elapsed = 4.0; // start a few seconds in so the first frame is a nice composition
  let last = 0;

  function frame(now) {
    if (last) elapsed += Math.min((now - last) / 1000, 0.1);
    last = now;
    draw(elapsed);
    raf = requestAnimationFrame(frame);
  }

  function update() {
    const shouldRun = visible && !document.hidden && !reducedMotion.matches;
    if (shouldRun && !raf) { last = 0; raf = requestAnimationFrame(frame); }
    else if (!shouldRun && raf) { cancelAnimationFrame(raf); raf = 0; }
    if (!shouldRun) draw(elapsed); // keep a correct still frame (e.g. after a resize)
  }

  new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; update(); }).observe(canvas);
  document.addEventListener("visibilitychange", update);
  reducedMotion.addEventListener("change", update);
  window.addEventListener("resize", () => { if (!raf) draw(elapsed); });

  canvas.addEventListener("webglcontextlost", (e) => { e.preventDefault(); cancelAnimationFrame(raf); raf = 0; canvas.remove(); });

  update();
})();

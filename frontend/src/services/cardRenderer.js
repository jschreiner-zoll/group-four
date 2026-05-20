/**
 * WebGL Blackjack Card Renderer.
 * Renders cards directly on a persistent WebGL canvas with animation.
 */

const VERT_SRC = `
  attribute vec2 a_position;
  attribute vec2 a_texCoord;
  uniform vec2 u_resolution;
  uniform vec2 u_translate;
  uniform vec2 u_scale;
  uniform float u_rotation;
  varying vec2 v_texCoord;

  void main() {
    float c = cos(u_rotation);
    float s = sin(u_rotation);
    vec2 rotated = vec2(
      a_position.x * c - a_position.y * s,
      a_position.x * s + a_position.y * c
    );
    vec2 pos = (rotated * u_scale + u_translate) / u_resolution * 2.0 - 1.0;
    gl_Position = vec4(pos.x, -pos.y, 0.0, 1.0);
    v_texCoord = a_texCoord;
  }
`;

const FRAG_CARD = `
  precision mediump float;
  varying vec2 v_texCoord;
  uniform float u_faceDown;
  uniform float u_memeIndex;
  uniform vec4 u_suitColor;
  uniform float u_time;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  void main() {
    vec2 uv = v_texCoord;
    vec4 color;

    // Rounded corner discard
    vec2 corner = abs(uv - 0.5) * 2.0;
    float cornerDist = length(max(corner - vec2(0.85, 0.9), 0.0));
    if (cornerDist > 0.08) discard;

    if (u_faceDown > 0.5) {
      // Card back: Spider-Man web pattern (animated)
      vec3 baseRed = vec3(0.7, 0.05, 0.05);
      vec3 darkRed = vec3(0.5, 0.02, 0.02);
      color = vec4(mix(baseRed, darkRed, uv.y), 1.0);

      // Animated web pattern
      float cx = 0.5, cy = 0.5;
      float angle = atan(uv.y - cy, uv.x - cx);
      float dist = distance(uv, vec2(cx, cy));

      // Radial web lines
      float radial = abs(sin(angle * 8.0 + u_time * 0.5));
      float webLine = smoothstep(0.94, 0.98, radial);

      // Circular web rings (pulsing)
      float rings = abs(sin(dist * 20.0 - u_time * 1.5));
      float ringLine = smoothstep(0.92, 0.96, rings);

      float web = max(webLine, ringLine);
      color.rgb = mix(color.rgb, vec3(0.0), web * 0.5);

      // Spider emblem center (pulsing glow)
      float spiderGlow = smoothstep(0.12, 0.05, dist) * (0.7 + 0.3 * sin(u_time * 2.0));
      color.rgb = mix(color.rgb, vec3(0.0, 0.0, 0.2), spiderGlow);

      // Border
      if (uv.x < 0.04 || uv.x > 0.96 || uv.y < 0.03 || uv.y > 0.97) {
        color = vec4(0.1, 0.1, 0.2, 1.0);
      }
    } else {
      // Card face
      color = vec4(0.98, 0.96, 0.94, 1.0);

      // Border
      if (uv.x < 0.03 || uv.x > 0.97 || uv.y < 0.025 || uv.y > 0.975) {
        color = vec4(0.15, 0.15, 0.15, 1.0);
        gl_FragColor = color;
        return;
      }

      // Spider-Man meme art center
      float cx = 0.5, cy = 0.48;
      float dist = distance(uv, vec2(cx, cy));
      float angle = atan(uv.y - cy, uv.x - cx);

      if (dist < 0.32) {
        // Red/blue split (classic Spider-Man)
        vec3 spideyRed = vec3(0.82, 0.1, 0.1);
        vec3 spideyBlue = vec3(0.1, 0.12, 0.55);

        // Meme variation changes the split pattern
        float splitAngle = u_memeIndex * 0.5;
        float split = sin(angle + splitAngle);
        vec3 base = mix(spideyRed, spideyBlue, step(0.0, split));

        // Animated web overlay
        float webR = abs(sin(angle * 6.0 + u_time * 0.3));
        float webC = abs(sin(dist * 18.0 - u_time * 0.8));
        float webPattern = smoothstep(0.9, 0.95, webR) + smoothstep(0.9, 0.95, webC);
        base = mix(base, vec3(0.0), webPattern * 0.4);

        // Spider-Man eyes (white angular shapes)
        vec2 leftEye = vec2(0.42, 0.43);
        vec2 rightEye = vec2(0.58, 0.43);
        float eyeL = length((uv - leftEye) * vec2(1.5, 1.0));
        float eyeR = length((uv - rightEye) * vec2(1.5, 1.0));
        float eyeMask = smoothstep(0.07, 0.05, min(eyeL, eyeR));

        // Eye squint animation (like meme expressions)
        float squint = 0.8 + 0.2 * sin(u_time * 1.5 + u_memeIndex);
        float eyeTop = step(0.43 - 0.02 * squint, uv.y);
        eyeMask *= eyeTop;

        base = mix(base, vec3(1.0), eyeMask);

        // Vignette on the meme circle
        float vignette = smoothstep(0.32, 0.25, dist);
        color = vec4(base * vignette + color.rgb * (1.0 - vignette), 1.0);
      }

      // Suit color accent in corners
      float topLeft = length(uv - vec2(0.1, 0.1));
      float botRight = length(uv - vec2(0.9, 0.9));
      float cornerAccent = smoothstep(0.12, 0.06, min(topLeft, botRight));
      color.rgb = mix(color.rgb, u_suitColor.rgb, cornerAccent * 0.8);
    }

    gl_FragColor = color;
  }
`;

const SUIT_COLORS = {
  spades: [0.1, 0.1, 0.18, 1],
  clubs: [0.1, 0.18, 0.1, 1],
  hearts: [0.55, 0.0, 0.0, 1],
  diamonds: [0.55, 0.28, 0.0, 1],
};

const SUIT_SYMBOLS = { spades: '♠', hearts: '♥', diamonds: '♦', clubs: '♣' };
const MEME_LABELS = [
  'Pointing', 'Desk', 'Pizza Time', 'Crying', 'Dancing',
  'Swinging', 'Selfie', 'Reading', 'Confused', 'Thumbs Up',
  'Hiding', 'Running', 'Flexing',
];

export class CardRenderer {
  constructor(canvas) {
    this.canvas = canvas;
    this.gl = canvas.getContext('webgl', { alpha: true, antialias: true });
    if (!this.gl) {
      this.failed = true;
      return;
    }
    this.failed = false;
    this.animationId = null;
    this.startTime = performance.now();
    this.cards = []; // {x, y, w, h, card, faceDown, targetX, targetY, rotation}
    this._initShaders();
    this._initBuffers();
  }

  _initShaders() {
    const gl = this.gl;
    const vs = gl.createShader(gl.VERTEX_SHADER);
    gl.shaderSource(vs, VERT_SRC);
    gl.compileShader(vs);
    if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) {
      console.error('Vertex shader error:', gl.getShaderInfoLog(vs));
    }

    const fs = gl.createShader(gl.FRAGMENT_SHADER);
    gl.shaderSource(fs, FRAG_CARD);
    gl.compileShader(fs);
    if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) {
      console.error('Fragment shader error:', gl.getShaderInfoLog(fs));
    }

    this.program = gl.createProgram();
    gl.attachShader(this.program, vs);
    gl.attachShader(this.program, fs);
    gl.linkProgram(this.program);
    if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) {
      console.error('Program link error:', gl.getProgramInfoLog(this.program));
    }
    gl.useProgram(this.program);

    this.locs = {
      position: gl.getAttribLocation(this.program, 'a_position'),
      texCoord: gl.getAttribLocation(this.program, 'a_texCoord'),
      resolution: gl.getUniformLocation(this.program, 'u_resolution'),
      translate: gl.getUniformLocation(this.program, 'u_translate'),
      scale: gl.getUniformLocation(this.program, 'u_scale'),
      rotation: gl.getUniformLocation(this.program, 'u_rotation'),
      faceDown: gl.getUniformLocation(this.program, 'u_faceDown'),
      memeIndex: gl.getUniformLocation(this.program, 'u_memeIndex'),
      suitColor: gl.getUniformLocation(this.program, 'u_suitColor'),
      time: gl.getUniformLocation(this.program, 'u_time'),
    };
  }

  _initBuffers() {
    const gl = this.gl;
    // Unit quad (0,0) to (1,1)
    const positions = new Float32Array([0,0, 1,0, 0,1, 1,0, 1,1, 0,1]);
    const texCoords = new Float32Array([0,1, 1,1, 0,0, 1,1, 1,0, 0,0]);

    this.posBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
    gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

    this.texBuf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuf);
    gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
  }

  setCards(cards) {
    if (this.failed) return;
    // cards: [{card: {rank, suit}, faceDown, x, y}]
    const cardW = 90;
    const cardH = 126;
    this.cards = cards.map((c, i) => ({
      ...c,
      w: cardW,
      h: cardH,
      targetX: c.x,
      targetY: c.y,
      currentX: c.currentX != null ? c.currentX : c.x,
      currentY: c.currentY != null ? c.currentY : c.y,
      rotation: 0,
      dealAnim: c.dealAnim != null ? c.dealAnim : 1,
    }));
  }

  start() {
    if (this.failed || this.animationId) return;
    this._render();
  }

  stop() {
    if (this.animationId) {
      cancelAnimationFrame(this.animationId);
      this.animationId = null;
    }
  }

  _render = () => {
    const gl = this.gl;
    const time = (performance.now() - this.startTime) / 1000;

    gl.viewport(0, 0, this.canvas.width, this.canvas.height);
    gl.clearColor(0.06, 0.28, 0.16, 1.0); // Green felt
    gl.clear(gl.COLOR_BUFFER_BIT);
    gl.enable(gl.BLEND);
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);

    gl.useProgram(this.program);

    // Bind position buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.posBuf);
    gl.enableVertexAttribArray(this.locs.position);
    gl.vertexAttribPointer(this.locs.position, 2, gl.FLOAT, false, 0, 0);

    // Bind texCoord buffer
    gl.bindBuffer(gl.ARRAY_BUFFER, this.texBuf);
    gl.enableVertexAttribArray(this.locs.texCoord);
    gl.vertexAttribPointer(this.locs.texCoord, 2, gl.FLOAT, false, 0, 0);

    gl.uniform2f(this.locs.resolution, this.canvas.width, this.canvas.height);
    gl.uniform1f(this.locs.time, time);

    for (const c of this.cards) {
      // Animate position (lerp toward target)
      c.currentX += (c.targetX - c.currentX) * 0.12;
      c.currentY += (c.targetY - c.currentY) * 0.12;

      // Deal animation (scale in)
      c.dealAnim = Math.min(1, c.dealAnim + 0.05);
      const scale = c.dealAnim;

      const rankIndex = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'].indexOf(c.card.rank);
      const suitColor = SUIT_COLORS[c.card.suit] || [0,0,0,1];

      gl.uniform2f(this.locs.translate, c.currentX, c.currentY);
      gl.uniform2f(this.locs.scale, c.w * scale, c.h * scale);
      gl.uniform1f(this.locs.rotation, 0);
      gl.uniform1f(this.locs.faceDown, c.faceDown ? 1.0 : 0.0);
      gl.uniform1f(this.locs.memeIndex, rankIndex);
      gl.uniform4fv(this.locs.suitColor, suitColor);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
    }

    this.animationId = requestAnimationFrame(this._render);
  };

  /**
   * Draw text overlays on a 2D canvas layered on top.
   */
  drawTextOverlays(ctx) {
    for (const c of this.cards) {
      if (c.faceDown) continue;
      const x = c.currentX;
      const y = c.currentY;
      const scale = c.dealAnim;
      const w = c.w * scale;
      const h = c.h * scale;

      const rankIndex = ['A','2','3','4','5','6','7','8','9','10','J','Q','K'].indexOf(c.card.rank);

      // Rank + suit
      ctx.font = 'bold 14px monospace';
      ctx.fillStyle = c.card.suit === 'hearts' || c.card.suit === 'diamonds' ? '#8b0000' : '#1a1a2e';
      ctx.textAlign = 'left';
      ctx.fillText(c.card.rank, x + 5, y + 16);
      ctx.fillText(SUIT_SYMBOLS[c.card.suit], x + 5, y + 30);

      // Meme label
      ctx.font = '9px sans-serif';
      ctx.fillStyle = 'rgba(255,255,255,0.85)';
      ctx.textAlign = 'center';
      ctx.fillText(MEME_LABELS[rankIndex] || '', x + w / 2, y + h - 8);
    }
  }

  destroy() {
    this.stop();
    const gl = this.gl;
    if (gl && this.program) {
      gl.deleteProgram(this.program);
    }
  }
}

(function () {
  // Generador QR ISO/IEC 18004 (Modo Byte, Nivel L, Versiones 1 a 4) en SVG puro sin dependencias
  const EXP = new Uint8Array(512);
  const LOG = new Uint8Array(256);
  let x = 1;
  for (let i = 0; i < 255; i++) {
    EXP[i] = x;
    LOG[x] = i;
    x <<= 1;
    if (x & 0x100) x ^= 0x11d;
  }
  for (let i = 255; i < 512; i++) EXP[i] = EXP[i - 255];

  function gfMul(a, b) {
    if (a === 0 || b === 0) return 0;
    return EXP[LOG[a] + LOG[b]];
  }

  function rsGeneratorPoly(ecLen) {
    let poly = [1];
    for (let i = 0; i < ecLen; i++) {
      const next = new Array(poly.length + 1).fill(0);
      const factor = EXP[i];
      for (let j = 0; j < poly.length; j++) {
        next[j] ^= poly[j];
        next[j + 1] ^= gfMul(poly[j], factor);
      }
      poly = next;
    }
    return poly;
  }

  function rsEncode(data, ecLen) {
    const gen = rsGeneratorPoly(ecLen);
    const res = new Array(data.length + ecLen).fill(0);
    for (let i = 0; i < data.length; i++) res[i] = data[i];
    for (let i = 0; i < data.length; i++) {
      const coef = res[i];
      if (coef !== 0) {
        for (let j = 1; j < gen.length; j++) {
          res[i + j] ^= gfMul(gen[j], coef);
        }
      }
    }
    return res.slice(data.length);
  }

  const VERSIONS = [
    { ver: 1, size: 21, dataBytes: 19, ecBytes: 7, align: [] },
    { ver: 2, size: 25, dataBytes: 34, ecBytes: 10, align: [6, 18] },
    { ver: 3, size: 29, dataBytes: 55, ecBytes: 15, align: [6, 22] },
    { ver: 4, size: 33, dataBytes: 80, ecBytes: 20, align: [6, 26] }
  ];

  function encodeBytes(text) {
    const encoder = new TextEncoder();
    const bytes = Array.from(encoder.encode(String(text)));
    const spec = VERSIONS.find((v) => bytes.length + 2 <= v.dataBytes) || VERSIONS[VERSIONS.length - 1];
    const maxPayload = spec.dataBytes - 2;
    const payload = bytes.slice(0, maxPayload);

    const bits = [];
    const pushBits = (val, len) => {
      for (let i = len - 1; i >= 0; i--) bits.push((val >>> i) & 1);
    };

    pushBits(0b0100, 4);
    pushBits(payload.length, 8);
    payload.forEach((b) => pushBits(b, 8));
    pushBits(0, Math.min(4, spec.dataBytes * 8 - bits.length));
    while (bits.length % 8 !== 0) bits.push(0);

    const codewords = [];
    for (let i = 0; i < bits.length; i += 8) {
      let byte = 0;
      for (let b = 0; b < 8; b++) byte = (byte << 1) | bits[i + b];
      codewords.push(byte);
    }
    const pads = [0xec, 0x11];
    let pIdx = 0;
    while (codewords.length < spec.dataBytes) {
      codewords.push(pads[pIdx % 2]);
      pIdx++;
    }

    const ec = rsEncode(codewords, spec.ecBytes);
    return { spec, allCodewords: codewords.concat(ec) };
  }

  function buildMatrix(text) {
    const { spec, allCodewords } = encodeBytes(text);
    const n = spec.size;
    const grid = Array.from({ length: n }, () => new Array(n).fill(null));
    const isFunc = Array.from({ length: n }, () => new Array(n).fill(false));

    const setFunc = (r, c, val) => {
      if (r >= 0 && r < n && c >= 0 && c < n) {
        grid[r][c] = val ? 1 : 0;
        isFunc[r][c] = true;
      }
    };

    const drawFinder = (r0, c0) => {
      for (let r = -1; r <= 7; r++) {
        for (let c = -1; c <= 7; c++) {
          const inOuter = r >= 0 && r <= 6 && c >= 0 && c <= 6;
          const inInner = r >= 2 && r <= 4 && c >= 2 && c <= 4;
          const onBorder = r === 0 || r === 6 || c === 0 || c === 6;
          setFunc(r0 + r, c0 + c, inOuter && (onBorder || inInner));
        }
      }
    };

    drawFinder(0, 0);
    drawFinder(0, n - 7);
    drawFinder(n - 7, 0);

    if (spec.align.length > 0) {
      const pos = spec.align[spec.align.length - 1];
      for (let r = -2; r <= 2; r++) {
        for (let c = -2; c <= 2; c++) {
          const onEdge = Math.abs(r) === 2 || Math.abs(c) === 2;
          const center = r === 0 && c === 0;
          setFunc(pos + r, pos + c, onEdge || center);
        }
      }
    }

    for (let i = 8; i < n - 8; i++) {
      setFunc(6, i, i % 2 === 0);
      setFunc(i, 6, i % 2 === 0);
    }

    setFunc(n - 8, 8, true);
    for (let i = 0; i < 9; i++) {
      if (!isFunc[8][i]) setFunc(8, i, false);
      if (!isFunc[i][8]) setFunc(i, 8, false);
    }
    for (let i = 0; i < 8; i++) {
      if (!isFunc[8][n - 1 - i]) setFunc(8, n - 1 - i, false);
      if (!isFunc[n - 1 - i][8]) setFunc(n - 1 - i, 8, false);
    }

    const bitStream = [];
    allCodewords.forEach((cw) => {
      for (let b = 7; b >= 0; b--) bitStream.push((cw >>> b) & 1);
    });

    let bitIdx = 0;
    let upward = true;
    for (let right = n - 1; right >= 1; right -= 2) {
      if (right === 6) right = 5;
      for (let step = 0; step < n; step++) {
        const r = upward ? n - 1 - step : step;
        for (let dx = 0; dx < 2; dx++) {
          const c = right - dx;
          if (!isFunc[r][c]) {
            const rawBit = bitIdx < bitStream.length ? bitStream[bitIdx++] : 0;
            const masked = ((r + c) % 2 === 0) ? (rawBit ^ 1) : rawBit;
            grid[r][c] = masked;
          }
        }
      }
      upward = !upward;
    }

    const fmt = [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 0, 0, 1, 0, 0];
    const coords1 = [
      [8, 0], [8, 1], [8, 2], [8, 3], [8, 4], [8, 5], [8, 7], [8, 8],
      [7, 8], [5, 8], [4, 8], [3, 8], [2, 8], [1, 8], [0, 8]
    ];
    const coords2 = [
      [n - 1, 8], [n - 2, 8], [n - 3, 8], [n - 4, 8], [n - 5, 8], [n - 6, 8], [n - 7, 8],
      [8, n - 8], [8, n - 7], [8, n - 6], [8, n - 5], [8, n - 4], [8, n - 3], [8, n - 2], [8, n - 1]
    ];
    for (let i = 0; i < 15; i++) {
      grid[coords1[i][0]][coords1[i][1]] = fmt[i];
      grid[coords2[i][0]][coords2[i][1]] = fmt[i];
    }

    return grid;
  }

  function renderQrSVG(text, pxSize) {
    const grid = buildMatrix(text);
    const n = grid.length;
    const quiet = 3;
    const total = n + quiet * 2;
    const size = pxSize || 168;
    let rects = '';
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        if (grid[r][c] === 1) {
          rects += `<rect x="${c + quiet}" y="${r + quiet}" width="1" height="1" fill="#111827"/>`;
        }
      }
    }
    return `<svg viewBox="0 0 ${total} ${total}" width="${size}" height="${size}" role="img" aria-label="Código QR de Sala" style="background:#ffffff;border:1px solid var(--border);border-radius:8px;display:block;">${rects}</svg>`;
  }

  window.QPlanQR = { renderQrSVG };
})();

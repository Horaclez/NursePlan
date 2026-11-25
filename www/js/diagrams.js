(function () {
  function escXml(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function wrapLines(text, maxChars, maxLines) {
    const words = String(text || '').trim().split(/\s+/).filter(Boolean);
    if (words.length === 0) return ['(Sin especificar)'];
    const lines = [];
    let current = '';
    for (const w of words) {
      const candidate = current ? `${current} ${w}` : w;
      if (candidate.length <= maxChars) {
        current = candidate;
      } else {
        if (current) lines.push(current);
        current = w.length > maxChars ? w.slice(0, maxChars - 1) + '…' : w;
        if (lines.length >= maxLines) break;
      }
    }
    if (current && lines.length < maxLines) {
      lines.push(current);
    } else if (current && lines.length === maxLines) {
      const last = lines[maxLines - 1];
      lines[maxLines - 1] = last.length > maxChars - 2 ? last.slice(0, maxChars - 2) + '…' : last + '…';
    }
    return lines;
  }

  function renderIshikawaSVG(plan, problemText) {
    const ramas = (plan.causas && plan.causas.ramas) || {};
    const prioSet = new Set((plan.causas && plan.causas.priorizadasIds) || []);

    const topCats = ['Método', 'Mano de Obra', 'Materiales'];
    const botCats = ['Medición', 'Medio Ambiente', 'Maquinaria'];

    const W = 980;
    const H = 560;
    const spineY = 280;
    const spineStartX = 48;
    const spineEndX = 720;

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Diagrama Causa-Efecto de Ishikawa" style="background:#ffffff;border:1px solid #d1d5db;border-radius:10px;display:block;font-family:'Segoe UI',system-ui,sans-serif;">`;

    svg += `<defs>
      <marker id="ish-arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto">
        <path d="M0,0 L0,6 L9,3 z" fill="#0f766e" />
      </marker>
    </defs>`;

    svg += `<rect x="0" y="0" width="${W}" height="${H}" fill="#ffffff"/>`;
    svg += `<text x="24" y="30" font-size="14" font-weight="700" fill="#0f766e">DIAGRAMA DE CAUSA - EFECTO (ISHIKAWA / 6M)</text>`;
    svg += `<text x="24" y="48" font-size="11" fill="#4b5563">Las causas destacadas en ámbar corresponden a las causas críticas priorizadas para intervención.</text>`;

    svg += `<line x1="${spineStartX}" y1="${spineY}" x2="${spineEndX}" y2="${spineY}" stroke="#0f766e" stroke-width="3.5" marker-end="url(#ish-arrow)"/>`;

    const headX = 728;
    const headY = 205;
    const headW = 228;
    const headH = 150;
    svg += `<rect x="${headX}" y="${headY}" width="${headW}" height="${headH}" rx="10" fill="#f0fdfa" stroke="#0f766e" stroke-width="2.5"/>`;
    svg += `<text x="${headX + headW / 2}" y="${headY + 24}" text-anchor="middle" font-size="11" font-weight="700" fill="#0f766e">EFECTO / PROBLEMA</text>`;
    svg += `<line x1="${headX + 16}" y1="${headY + 32}" x2="${headX + headW - 16}" y2="${headY + 32}" stroke="#99f6e4" stroke-width="1.2"/>`;

    const probLines = wrapLines(problemText || 'Problema priorizado pendiente de delimitar', 28, 6);
    probLines.forEach((line, idx) => {
      svg += `<text x="${headX + headW / 2}" y="${headY + 52 + idx * 16}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#111827">${escXml(line)}</text>`;
    });

    const topAnchors = [230, 445, 660];
    topCats.forEach((cat, idx) => {
      const ax = topAnchors[idx];
      const topX = ax - 95;
      const topY = 86;
      svg += `<line x1="${topX}" y1="${topY}" x2="${ax}" y2="${spineY}" stroke="#475569" stroke-width="2.2"/>`;
      svg += `<rect x="${topX - 62}" y="${topY - 26}" width="136" height="26" rx="5" fill="#0f766e"/>`;
      svg += `<text x="${topX + 6}" y="${topY - 9}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#ffffff">${escXml(cat.toUpperCase())}</text>`;

      const items = (ramas[cat] || []).slice(0, 4);
      if (items.length === 0) {
        svg += `<text x="${topX - 45}" y="${topY + 38}" font-size="10.5" font-style="italic" fill="#9ca3af">(Sin causas registradas)</text>`;
      } else {
        items.forEach((item, cIdx) => {
          const frac = (cIdx + 1) / (items.length + 1);
          const bx = topX + (ax - topX) * frac;
          const by = topY + (spineY - topY) * frac;
          const isPrio = prioSet.has(item.id);
          const strokeCol = isPrio ? '#d97706' : '#64748b';
          const bgCol = isPrio ? '#fef3c7' : '#f8fafc';
          const textCol = isPrio ? '#92400e' : '#1f2937';

          svg += `<line x1="${bx - 125}" y1="${by}" x2="${bx}" y2="${by}" stroke="${strokeCol}" stroke-width="${isPrio ? '2' : '1.3'}"/>`;
          svg += `<rect x="${bx - 172}" y="${by - 15}" width="166" height="28" rx="4" fill="${bgCol}" stroke="${strokeCol}" stroke-width="${isPrio ? '1.5' : '0.8'}"/>`;
          const lines = wrapLines((isPrio ? '★ ' : '') + item.text, 26, 2);
          lines.forEach((ln, lIdx) => {
            svg += `<text x="${bx - 166}" y="${by - 3 + lIdx * 11}" font-size="9.5" font-weight="${isPrio ? '700' : '500'}" fill="${textCol}">${escXml(ln)}</text>`;
          });
        });
      }
    });

    const botAnchors = [230, 445, 660];
    botCats.forEach((cat, idx) => {
      const ax = botAnchors[idx];
      const botX = ax - 95;
      const botY = 474;
      svg += `<line x1="${botX}" y1="${botY}" x2="${ax}" y2="${spineY}" stroke="#475569" stroke-width="2.2"/>`;
      svg += `<rect x="${botX - 62}" y="${botY}" width="136" height="26" rx="5" fill="#0f766e"/>`;
      svg += `<text x="${botX + 6}" y="${botY + 17}" text-anchor="middle" font-size="11.5" font-weight="700" fill="#ffffff">${escXml(cat.toUpperCase())}</text>`;

      const items = (ramas[cat] || []).slice(0, 4);
      if (items.length === 0) {
        svg += `<text x="${botX - 45}" y="${botY - 30}" font-size="10.5" font-style="italic" fill="#9ca3af">(Sin causas registradas)</text>`;
      } else {
        items.forEach((item, cIdx) => {
          const frac = (cIdx + 1) / (items.length + 1);
          const bx = botX + (ax - botX) * frac;
          const by = botY + (spineY - botY) * frac;
          const isPrio = prioSet.has(item.id);
          const strokeCol = isPrio ? '#d97706' : '#64748b';
          const bgCol = isPrio ? '#fef3c7' : '#f8fafc';
          const textCol = isPrio ? '#92400e' : '#1f2937';

          svg += `<line x1="${bx - 125}" y1="${by}" x2="${bx}" y2="${by}" stroke="${strokeCol}" stroke-width="${isPrio ? '2' : '1.3'}"/>`;
          svg += `<rect x="${bx - 172}" y="${by - 15}" width="166" height="28" rx="4" fill="${bgCol}" stroke="${strokeCol}" stroke-width="${isPrio ? '1.5' : '0.8'}"/>`;
          const lines = wrapLines((isPrio ? '★ ' : '') + item.text, 26, 2);
          lines.forEach((ln, lIdx) => {
            svg += `<text x="${bx - 166}" y="${by - 3 + lIdx * 11}" font-size="9.5" font-weight="${isPrio ? '700' : '500'}" fill="${textCol}">${escXml(ln)}</text>`;
          });
        });
      }
    });

    svg += `</svg>`;
    return svg;
  }

  function renderProblemTreeSVG(plan, problemText) {
    const arbol = (plan.causas && plan.causas.arbol) || { efectos: [], causasDirectas: [] };
    const efectos = (arbol.efectos || []).slice(0, 4);
    const directas = (arbol.causasDirectas || []).slice(0, 4);
    const prioSet = new Set((plan.causas && plan.causas.priorizadasIds) || []);

    const W = 960;
    const H = 560;
    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Árbol de Problemas" style="background:#ffffff;border:1px solid #d1d5db;border-radius:10px;display:block;font-family:'Segoe UI',system-ui,sans-serif;">`;
    svg += `<text x="24" y="28" font-size="14" font-weight="700" fill="#0f766e">ÁRBOL DE PROBLEMAS (EFECTOS - PROBLEMA CENTRAL - CAUSAS)</text>`;

    const efCount = Math.max(1, efectos.length);
    const efW = Math.min(260, Math.floor((W - 80) / efCount) - 16);
    efectos.forEach((ef, i) => {
      const cx = ((W - 60) / efCount) * (i + 0.5) + 30;
      const x = cx - efW / 2;
      const y = 52;
      svg += `<line x1="${cx}" y1="${y + 68}" x2="${W / 2}" y2="210" stroke="#94a3b8" stroke-width="1.8"/>`;
      svg += `<rect x="${x}" y="${y}" width="${efW}" height="68" rx="8" fill="#fef2f2" stroke="#dc2626" stroke-width="1.5"/>`;
      svg += `<text x="${x + 10}" y="${y + 16}" font-size="9.5" font-weight="700" fill="#b91c1c">EFECTO ${i + 1}</text>`;
      wrapLines(ef.text, Math.floor(efW / 6.5), 3).forEach((ln, li) => {
        svg += `<text x="${x + 10}" y="${y + 32 + li * 13}" font-size="10.5" fill="#1f2937">${escXml(ln)}</text>`;
      });
    });

    const trunkW = 540;
    const trunkX = (W - trunkW) / 2;
    const trunkY = 210;
    svg += `<rect x="${trunkX}" y="${trunkY}" width="${trunkW}" height="82" rx="10" fill="#f0fdfa" stroke="#0f766e" stroke-width="2.5"/>`;
    svg += `<text x="${W / 2}" y="${trunkY + 20}" text-anchor="middle" font-size="11" font-weight="700" fill="#0f766e">PROBLEMA CENTRAL PRIORIZADO (TRONCO)</text>`;
    wrapLines(problemText || 'Problema central pendiente', 72, 3).forEach((ln, li) => {
      svg += `<text x="${W / 2}" y="${trunkY + 38 + li * 15}" text-anchor="middle" font-size="11.5" font-weight="600" fill="#111827">${escXml(ln)}</text>`;
    });

    const cdCount = Math.max(1, directas.length);
    const cdW = Math.min(270, Math.floor((W - 80) / cdCount) - 16);
    directas.forEach((cd, i) => {
      const cx = ((W - 60) / cdCount) * (i + 0.5) + 30;
      const x = cx - cdW / 2;
      const y = 342;
      const isPrio = prioSet.has(cd.id);
      svg += `<line x1="${cx}" y1="${y}" x2="${W / 2}" y2="${trunkY + 82}" stroke="${isPrio ? '#d97706' : '#64748b'}" stroke-width="${isPrio ? '2.4' : '1.8'}"/>`;
      svg += `<rect x="${x}" y="${y}" width="${cdW}" height="74" rx="8" fill="${isPrio ? '#fef3c7' : '#f8fafc'}" stroke="${isPrio ? '#d97706' : '#475569'}" stroke-width="${isPrio ? '2' : '1.4'}"/>`;
      svg += `<text x="${x + 10}" y="${y + 16}" font-size="9.5" font-weight="700" fill="${isPrio ? '#92400e' : '#334155'}">${isPrio ? '★ CAUSA DIRECTA PRIORIZADA' : `CAUSA DIRECTA ${i + 1}`}</text>`;
      wrapLines(cd.text, Math.floor(cdW / 6.5), 3).forEach((ln, li) => {
        svg += `<text x="${x + 10}" y="${y + 32 + li * 13}" font-size="10.5" fill="#111827">${escXml(ln)}</text>`;
      });

      const sub = (cd.indirectas || [])[0];
      if (sub) {
        const sy = 446;
        svg += `<line x1="${cx}" y1="${y + 74}" x2="${cx}" y2="${sy}" stroke="#94a3b8" stroke-width="1.4" stroke-dasharray="3,2"/>`;
        svg += `<rect x="${x + 8}" y="${sy}" width="${cdW - 16}" height="64" rx="6" fill="#ffffff" stroke="#94a3b8" stroke-width="1.1"/>`;
        svg += `<text x="${x + 16}" y="${sy + 15}" font-size="9" font-weight="700" fill="#64748b">CAUSA INDIRECTA / RAÍZ</text>`;
        wrapLines(sub.text, Math.floor((cdW - 24) / 6.2), 3).forEach((ln, li) => {
          svg += `<text x="${x + 16}" y="${sy + 29 + li * 12}" font-size="9.5" fill="#374151">${escXml(ln)}</text>`;
        });
      }
    });

    svg += `</svg>`;
    return svg;
  }

  function renderRunChartSVG(indicador, puntos) {
    if (!indicador || !puntos || puntos.length === 0) return '';
    const W = 720;
    const H = 260;
    const padL = 54;
    const padR = 30;
    const padT = 34;
    const padB = 46;
    const plotW = W - padL - padR;
    const plotH = H - padT - padB;

    const baseVal = parseFloat(indicador.lineaBase);
    const metaVal = parseFloat(indicador.meta);
    const critVal = parseFloat(indicador.umbralCritico);
    const vals = puntos.map((p) => Number(p.valor)).filter((v) => !isNaN(v));
    if (!isNaN(baseVal)) vals.push(baseVal);
    if (!isNaN(metaVal)) vals.push(metaVal);
    if (!isNaN(critVal)) vals.push(critVal);

    const minV = Math.max(0, Math.floor(Math.min(...vals) * 0.85));
    const maxV = Math.max(minV + 10, Math.ceil(Math.max(...vals) * 1.1));

    const yOf = (v) => padT + plotH - ((v - minV) / (maxV - minV)) * plotH;
    const xOf = (idx) => {
      if (puntos.length === 1) return padL + plotW / 2;
      return padL + (idx / (puntos.length - 1)) * plotW;
    };

    let svg = `<svg viewBox="0 0 ${W} ${H}" width="100%" role="img" aria-label="Gráfico de Tendencia del Indicador" style="background:#ffffff;border:1px solid #d1d5db;border-radius:8px;display:block;font-family:'Segoe UI',system-ui,sans-serif;">`;
    svg += `<text x="${padL}" y="20" font-size="11.5" font-weight="700" fill="#0f766e">EVOLUCIÓN TEMPORAL (RUN CHART): ${escXml(indicador.nombre.slice(0, 68))}</text>`;

    for (let g = 0; g <= 4; g++) {
      const gv = minV + ((maxV - minV) * g) / 4;
      const gy = yOf(gv);
      svg += `<line x1="${padL}" y1="${gy}" x2="${W - padR}" y2="${gy}" stroke="#e5e7eb" stroke-width="1"/>`;
      svg += `<text x="${padL - 8}" y="${gy + 4}" text-anchor="end" font-size="10" fill="#6b7280">${gv.toFixed(0)}</text>`;
    }

    if (!isNaN(metaVal)) {
      const my = yOf(metaVal);
      svg += `<line x1="${padL}" y1="${my}" x2="${W - padR}" y2="${my}" stroke="#15803d" stroke-width="1.8" stroke-dasharray="6,4"/>`;
      svg += `<text x="${W - padR}" y="${my - 5}" text-anchor="end" font-size="10" font-weight="700" fill="#15803d">Meta: ${metaVal}</text>`;
    }

    if (!isNaN(critVal)) {
      const cy = yOf(critVal);
      svg += `<line x1="${padL}" y1="${cy}" x2="${W - padR}" y2="${cy}" stroke="#dc2626" stroke-width="1.4" stroke-dasharray="3,3"/>`;
      svg += `<text x="${padL + 6}" y="${cy - 5}" font-size="9.5" font-weight="700" fill="#dc2626">Umbral Crítico: ${critVal}</text>`;
    }

    if (!isNaN(baseVal)) {
      const by = yOf(baseVal);
      svg += `<line x1="${padL}" y1="${by}" x2="${W - padR}" y2="${by}" stroke="#64748b" stroke-width="1.2" stroke-dasharray="2,3"/>`;
      svg += `<text x="${padL + 6}" y="${by + 12}" font-size="9.5" fill="#475569">Línea Base: ${baseVal}</text>`;
    }

    const coords = puntos.map((pt, idx) => ({ x: xOf(idx), y: yOf(Number(pt.valor)), pt }));
    if (coords.length > 1) {
      const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`).join(' ');
      svg += `<path d="${d}" fill="none" stroke="#0f766e" stroke-width="2.8"/>`;
    }

    coords.forEach((c) => {
      svg += `<circle cx="${c.x.toFixed(1)}" cy="${c.y.toFixed(1)}" r="5.5" fill="#0f766e" stroke="#ffffff" stroke-width="2"/>`;
      svg += `<text x="${c.x.toFixed(1)}" y="${(c.y - 10).toFixed(1)}" text-anchor="middle" font-size="10.5" font-weight="700" fill="#111827">${c.pt.valor}</text>`;
      svg += `<text x="${c.x.toFixed(1)}" y="${H - 16}" text-anchor="middle" font-size="10" fill="#374151">${escXml(c.pt.periodo)}</text>`;
    });

    svg += `</svg>`;
    return svg;
  }

  window.QPlanDiagrams = {
    renderIshikawaSVG,
    renderProblemTreeSVG,
    renderRunChartSVG
  };
})();

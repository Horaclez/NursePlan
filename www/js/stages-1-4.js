(function () {
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function renderStage1(plan) {
    const quadrants = [
      { key: 'F', title: 'Fortalezas', sub: 'Capacidades y recursos internos favorables', badge: 'badge-green', placeholder: 'Ej. Equipo de enfermería capacitado y comprometido...' },
      { key: 'O', title: 'Oportunidades', sub: 'Factores externos que facilitan la mejora', badge: 'badge-teal', placeholder: 'Ej. Programa institucional de calidad y acreditación vigente...' },
      { key: 'D', title: 'Debilidades (Problemas Internos)', sub: 'Brechas internas gobernables → Pasan a Etapa 2', badge: 'badge-amber', placeholder: 'Ej. Incumplimiento de reevaluación de riesgo al cambio de turno...' },
      { key: 'A', title: 'Amenazas (Riesgos Externos)', sub: 'Factores del entorno → Se evalúa gobernabilidad en Etapa 2', badge: 'badge-red', placeholder: 'Ej. Sobredemanda estacional o restricción presupuestaria externa...' }
    ];

    const cardsHtml = quadrants.map((q) => {
      const items = plan.foda[q.key] || [];
      const listHtml = items.length === 0
        ? `<p class="empty-hint">Sin registros aún en ${q.title.toLowerCase()}.</p>`
        : `<ul class="item-list">${items.map((item) => `
            <li class="item-row">
              <span class="item-text">${esc(item.text)}</span>
              <button type="button" class="btn-icon btn-danger-ghost" data-action="foda-del" data-quad="${q.key}" data-id="${item.id}" title="Eliminar">✕</button>
            </li>`).join('')}</ul>`;

      return `
        <div class="card foda-card foda-${q.key.toLowerCase()}">
          <div class="card-header">
            <div>
              <span class="badge ${q.badge}">${q.key}</span>
              <h3>${q.title}</h3>
              <p class="card-sub">${q.sub}</p>
            </div>
            <span class="count-pill">${items.length}</span>
          </div>
          <div class="inline-add">
            <input type="text" class="input" id="foda-input-${q.key}" placeholder="${q.placeholder}" data-foda-input="${q.key}">
            <button type="button" class="btn btn-primary btn-sm" data-action="foda-add" data-quad="${q.key}">Agregar</button>
          </div>
          ${listHtml}
        </div>`;
    }).join('');

    return `
      <div class="stage-intro">
        <div>
          <span class="stage-kicker">ETAPA 1 DE 8 · DIAGNÓSTICO SITUACIONAL</span>
          <h2>Análisis FODA y Ficha Técnica del Plan</h2>
          <p>Completa los metadatos institucionales y registra el diagnóstico situacional. Las <strong>Debilidades (D)</strong> y <strong>Amenazas (A)</strong> alimentarán automáticamente el filtro de gobernabilidad en la Etapa 2.</p>
        </div>
      </div>

      <div class="card meta-card">
        <h3>Ficha de Identificación Institucional</h3>
        <div class="form-grid-3">
          <div class="form-group">
            <label for="meta-title">Título del Plan de Mejora</label>
            <input id="meta-title" class="input" type="text" value="${esc(plan.title)}" data-meta="title">
          </div>
          <div class="form-group">
            <label for="meta-unit">Servicio / Unidad Clínica / CESFAM</label>
            <input id="meta-unit" class="input" type="text" value="${esc(plan.unit)}" data-meta="unit">
          </div>
          <div class="form-group">
            <label for="meta-facility">Tipo de Establecimiento</label>
            <input id="meta-facility" class="input" type="text" value="${esc(plan.facilityType)}" data-meta="facilityType">
          </div>
          <div class="form-group">
            <label for="meta-domain">Ámbito / Estándar de Calidad</label>
            <input id="meta-domain" class="input" type="text" value="${esc(plan.qualityDomain)}" data-meta="qualityDomain">
          </div>
          <div class="form-group">
            <label for="meta-leader">Responsable / Líder del Plan</label>
            <input id="meta-leader" class="input" type="text" value="${esc(plan.leader)}" data-meta="leader">
          </div>
          <div class="form-group">
            <label for="meta-team">Equipo Multidisciplinario</label>
            <input id="meta-team" class="input" type="text" value="${esc(plan.team)}" data-meta="team">
          </div>
          <div class="form-group">
            <label for="meta-start">Fecha de Inicio</label>
            <input id="meta-start" class="input" type="date" value="${esc(plan.startDate)}" data-meta="startDate">
          </div>
          <div class="form-group">
            <label for="meta-horizon">Horizonte de Ejecución (Semanas)</label>
            <input id="meta-horizon" class="input" type="number" min="2" max="52" value="${plan.horizonWeeks}" data-meta="horizonWeeks">
          </div>
        </div>
      </div>

      <div class="foda-grid">${cardsHtml}</div>
    `;
  }

  function renderStage2(plan) {
    const problems = window.QPlanState.getFodaProblems(plan);
    const abordables = window.QPlanState.getAbordableProblems(plan);
    const noAbordables = window.QPlanState.getNonAbordableProblems(plan);

    const rowsHtml = problems.length === 0
      ? `<tr><td colspan="6" class="empty-cell">No hay Debilidades ni Amenazas registradas en la Etapa 1.</td></tr>`
      : problems.map((p) => {
          const entry = plan.abordabilidad[p.id] || { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: '' };
          const isAb = entry.abordable !== false;
          return `
            <tr class="${isAb ? '' : 'row-muted'}">
              <td><span class="badge ${p.origin === 'Debilidad' ? 'badge-amber' : 'badge-red'}">${p.origin}</span></td>
              <td><strong>${esc(p.text)}</strong></td>
              <td class="text-center">
                <input type="checkbox" class="chk-lg" ${entry.alcance !== false ? 'checked' : ''} data-action="ab-check" data-id="${p.id}" data-dim="alcance" title="¿Está bajo la competencia técnica del equipo?">
              </td>
              <td class="text-center">
                <input type="checkbox" class="chk-lg" ${entry.recursos !== false ? 'checked' : ''} data-action="ab-check" data-id="${p.id}" data-dim="recursos" title="¿Se dispone de recursos locales sin licitación mayor?">
              </td>
              <td class="text-center">
                <input type="checkbox" class="chk-lg" ${entry.plazo !== false ? 'checked' : ''} data-action="ab-check" data-id="${p.id}" data-dim="plazo" title="¿Es resoluble dentro del horizonte del plan?">
              </td>
              <td>
                <div style="display:flex;align-items:center;gap:6px;margin-bottom:4px;">
                  <span class="badge ${isAb ? 'badge-green' : 'badge-gray'}">${isAb ? 'Abordable (Pasa a Etapa 3)' : 'No Abordable (Derivado)'}</span>
                </div>
                <input type="text" class="input input-sm" value="${esc(entry.justificacion || '')}" placeholder="Justificación técnica de gobernabilidad o derivación..." data-action="ab-just" data-id="${p.id}">
              </td>
            </tr>`;
        }).join('');

    return `
      <div class="stage-intro">
        <div>
          <span class="stage-kicker">ETAPA 2 DE 8 · FILTRO DE GOBERNABILIDAD</span>
          <h2>Evaluación de Abordabilidad (3 Dimensiones)</h2>
          <p>Evalúa cada problema según <strong>Competencia/Alcance</strong>, <strong>Recursos Locales</strong> y <strong>Plazo de Ejecución</strong>. Si los 3 criterios se cumplen, el problema queda habilitado para la Matriz de Priorización.</p>
        </div>
        <div class="kpi-row">
          <div class="kpi-box"><span class="kpi-num">${abordables.length}</span><span class="kpi-lbl">Abordables</span></div>
          <div class="kpi-box"><span class="kpi-num">${noAbordables.length}</span><span class="kpi-lbl">No Abordables</span></div>
        </div>
      </div>

      <div class="card">
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:105px;">Origen</th>
                <th>Problema Detectado (FODA)</th>
                <th class="text-center" style="width:95px;">Alcance Local</th>
                <th class="text-center" style="width:95px;">Recursos Disp.</th>
                <th class="text-center" style="width:95px;">Plazo Viable</th>
                <th style="width:310px;">Dictamen y Justificación</th>
              </tr>
            </thead>
            <tbody>${rowsHtml}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderStage3(plan) {
    const abordables = window.QPlanState.getAbordableProblems(plan);
    const criterios = plan.priorizacion.criterios || [];
    const { ranking, winner, hasTie, tiedProblems } = window.QPlanState.getPrioritizationRanking(plan);
    const scoresMap = plan.priorizacion.scores || {};

    const critChips = criterios.map((c) => `
      <span class="crit-chip">
        <span>${esc(c.nombre)}</span>
        <select class="select select-xs" data-action="prio-crit-peso" data-cid="${c.id}" title="Ponderación del criterio">
          <option value="1" ${Number(c.peso) === 1 ? 'selected' : ''}>×1</option>
          <option value="2" ${Number(c.peso) === 2 ? 'selected' : ''}>×2</option>
          <option value="3" ${Number(c.peso) === 3 ? 'selected' : ''}>×3</option>
        </select>
        ${criterios.length > 1 ? `<button type="button" class="chip-del" data-action="prio-crit-del" data-cid="${c.id}" title="Quitar criterio">×</button>` : ''}
      </span>`).join('');

    const headerCols = criterios.map((c) => `
      <th class="text-center">
        ${esc(c.nombre)}
        <div class="th-sub">1–6 pts (Peso ×${c.peso || 1})</div>
      </th>`).join('');

    const matrixRows = abordables.length === 0
      ? `<tr><td colspan="${criterios.length + 3}" class="empty-cell">No hay problemas abordables disponibles. Revisa las Etapas 1 y 2.</td></tr>`
      : abordables.map((prob) => {
          const pScores = scoresMap[prob.id] || {};
          const rankedItem = ranking.find((r) => r.id === prob.id);
          const isWinner = winner && winner.id === prob.id;
          const cells = criterios.map((c) => {
            const val = Number(pScores[c.id]) || 0;
            const opts = [0, 1, 2, 3, 4, 5, 6].map((n) => `<option value="${n}" ${val === n ? 'selected' : ''}>${n === 0 ? '-' : n}</option>`).join('');
            return `<td class="text-center"><select class="score-select" data-action="prio-score" data-pid="${prob.id}" data-cid="${c.id}">${opts}</select></td>`;
          }).join('');

          return `
            <tr class="${isWinner ? 'row-winner' : ''}">
              <td>
                <div class="prob-cell-title">${isWinner ? '<span class="winner-star">★</span> ' : ''}${esc(prob.text)}</div>
                <span class="badge ${prob.origin === 'Debilidad' ? 'badge-amber' : 'badge-red'}">${prob.origin}</span>
              </td>
              ${cells}
              <td class="text-center"><strong>${rankedItem ? rankedItem.total : 0}</strong> <span class="muted-sm">/ ${rankedItem ? rankedItem.maxWeighted : 0}</span></td>
              <td class="text-center">${rankedItem ? rankedItem.avg : '0.00'}</td>
            </tr>`;
        }).join('');

    const tieHtml = hasTie ? `
      <div class="callout-amber" style="margin-top:12px;">
        <strong>Empate en puntaje máximo (${tiedProblems[0].total} pts):</strong> Selecciona el problema ganador por consenso clínico del equipo:
        <select class="select" style="margin-top:6px;max-width:480px;" data-action="prio-tie-winner">
          ${tiedProblems.map((tp) => `<option value="${tp.id}" ${winner && winner.id === tp.id ? 'selected' : ''}>${esc(tp.text)}</option>`).join('')}
        </select>
      </div>` : '';

    const winnerBanner = winner
      ? `<div class="winner-banner">
          <div class="winner-icon">🏆</div>
          <div>
            <span class="winner-kicker">PROBLEMA PRIORIZADO SELECCIONADO PARA EL PLAN DE MEJORA</span>
            <h3>${esc(winner.text)}</h3>
            <p>Puntaje ponderado: <strong>${winner.total} / ${winner.maxWeighted} pts</strong> (Promedio simple: ${winner.avg} / 6.00) · Vinculado automáticamente a la Etapa 4.</p>
            ${tieHtml}
          </div>
        </div>`
      : `<div class="callout-info">Asigna puntajes del 1 al 6 en la matriz para calcular automáticamente el problema prioritario.</div>`;

    return `
      <div class="stage-intro">
        <div>
          <span class="stage-kicker">ETAPA 3 DE 8 · DECISIÓN MULTICRITERIO PONDERADA</span>
          <h2>Matriz de Priorización de Problemas</h2>
          <p>Evalúa cada problema abordable en escala de <strong>1 (muy bajo) a 6 (muy alto)</strong> y ajusta la ponderación (×1, ×2, ×3) según la relevancia clínica del servicio.</p>
        </div>
      </div>

      ${winnerBanner}

      <div class="card">
        <div class="card-header-flex">
          <div>
            <h3>Criterios de Evaluación y Ponderación</h3>
            <p class="card-sub">Puedes ajustar el peso de cada criterio o agregar criterios institucionales.</p>
          </div>
          <div class="inline-add">
            <input type="text" id="new-crit-input" class="input input-sm" placeholder="Nuevo criterio (ej. Impacto Acreditación)">
            <button type="button" class="btn btn-secondary btn-sm" data-action="prio-crit-add">+ Criterio</button>
          </div>
        </div>
        <div class="chips-wrap">${critChips}</div>

        <div class="table-wrap" style="margin-top:1rem;">
          <table class="data-table">
            <thead>
              <tr>
                <th>Problema Abordable</th>
                ${headerCols}
                <th class="text-center">Total Pond.</th>
                <th class="text-center">Prom.</th>
              </tr>
            </thead>
            <tbody>${matrixRows}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderStage4(plan) {
    const { winner } = window.QPlanState.getPrioritizationRanking(plan);
    const del = plan.delimitacion;

    if (!del.que && winner) {
      del.que = winner.text;
    }

    return `
      <div class="stage-intro">
        <div>
          <span class="stage-kicker">ETAPA 4 DE 8 · LÍNEA BASE Y OPERACIONALIZACIÓN</span>
          <h2>Delimitación Operativa del Problema (5W + Cuánto)</h2>
          <p>Transforma el problema priorizado en un enunciado preciso, medible y acotado en espacio y tiempo, estableciendo su línea base y meta esperada.</p>
        </div>
      </div>

      <div class="callout-teal">
        <strong>Problema Priorizado Base (Etapa 3):</strong> ${winner ? esc(winner.text) : 'Aún no definido en Etapa 3.'}
      </div>

      <div class="card">
        <h3>Dimensiones de Delimitación Operativa</h3>
        <div class="form-grid-2">
          <div class="form-group">
            <label for="del-que">¿QUÉ ocurre exactamente? (Fenómeno / brecha clínica)</label>
            <textarea id="del-que" class="textarea" rows="3" data-del="que">${esc(del.que)}</textarea>
          </div>
          <div class="form-group">
            <label for="del-como">¿CÓMO se manifiesta o evidencia? (Registros, auditorías, eventos)</label>
            <textarea id="del-como" class="textarea" rows="3" data-del="como">${esc(del.como)}</textarea>
          </div>
          <div class="form-group">
            <label for="del-donde">¿DÓNDE ocurre? (Servicio, unidad, sector, número de camas/box)</label>
            <input id="del-donde" class="input" type="text" value="${esc(del.donde)}" data-del="donde">
          </div>
          <div class="form-group">
            <label for="del-cuando">¿CUÁNDO ocurre? (Periodo observado, turnos, frecuencia)</label>
            <input id="del-cuando" class="input" type="text" value="${esc(del.cuando)}" data-del="cuando">
          </div>
        </div>

        <div class="divider"></div>
        <h3>Cuantificación Basal y Meta (Calculadora Asistida)</h3>
        <div class="form-grid-4">
          <div class="form-group">
            <label for="del-num">Numerador Basal (Casos/Eventos)</label>
            <input id="del-num" class="input" type="number" step="any" value="${esc(del.cuantoNumerador)}" placeholder="Ej. 18" data-del="cuantoNumerador">
          </div>
          <div class="form-group">
            <label for="del-den">Denominador Basal (Total/Días-cama)</label>
            <input id="del-den" class="input" type="number" step="any" value="${esc(del.cuantoDenominador)}" placeholder="Ej. 3750" data-del="cuantoDenominador">
          </div>
          <div class="form-group">
            <label for="del-fac">Factor Amplificación</label>
            <select id="del-fac" class="select" data-del="cuantoFactor">
              <option value="100" ${Number(del.cuantoFactor) === 100 ? 'selected' : ''}>× 100 (%)</option>
              <option value="1000" ${Number(del.cuantoFactor) === 1000 ? 'selected' : ''}>× 1.000 (Tasa)</option>
              <option value="1" ${Number(del.cuantoFactor) === 1 ? 'selected' : ''}>× 1 (Conteo directo)</option>
            </select>
          </div>
          <div class="form-group" style="display:flex;align-items:flex-end;">
            <button type="button" class="btn btn-secondary btn-block" data-action="del-calc">Calcular Magnitud</button>
          </div>
        </div>

        <div class="form-grid-3" style="margin-top:0.5rem;">
          <div class="form-group">
            <label for="del-val">Magnitud / Valor Línea Base</label>
            <input id="del-val" class="input" type="number" step="any" value="${esc(del.cuantoValor)}" placeholder="Ej. 4.8" data-del="cuantoValor">
          </div>
          <div class="form-group">
            <label for="del-unit">Unidad de Medida</label>
            <input id="del-unit" class="input" type="text" value="${esc(del.cuantoUnidad)}" placeholder="Ej. % de cumplimiento o tasa × 1.000" data-del="cuantoUnidad">
          </div>
          <div class="form-group">
            <label for="del-meta">Meta Esperada al Cierre</label>
            <input id="del-meta" class="input" type="number" step="any" value="${esc(del.metaValor)}" placeholder="Ej. 2.0 o 95" data-del="metaValor">
          </div>
        </div>

        <div class="synthesis-box">
          <span class="synthesis-label">ENUNCIADO SINTÉTICO DEL PROBLEMA DELIMITADO</span>
          <p id="del-synthesis-text">${buildDelimitationSynthesis(del)}</p>
        </div>
      </div>
    `;
  }

  function buildDelimitationSynthesis(del) {
    if (!del.que && !del.donde) {
      return 'Completa los campos superiores para generar automáticamente la síntesis operativa del problema.';
    }
    const parts = [];
    if (del.que) parts.push(del.que.replace(/\.$/, ''));
    if (del.donde) parts.push(`en ${del.donde.replace(/\.$/, '')}`);
    if (del.cuando) parts.push(`durante ${del.cuando.replace(/\.$/, '')}`);
    if (del.como) parts.push(`evidenciado mediante ${del.como.replace(/\.$/, '')}`);
    if (del.cuantoValor !== '' && del.cuantoValor !== null) {
      parts.push(`con una línea base de ${del.cuantoValor} ${del.cuantoUnidad || ''} (meta proyectada: ${del.metaValor || 'por definir'})`);
    }
    return esc(parts.join(', ') + '.');
  }

  window.QPlanStages1to4 = {
    renderStage1,
    renderStage2,
    renderStage3,
    renderStage4,
    buildDelimitationSynthesis
  };
})();

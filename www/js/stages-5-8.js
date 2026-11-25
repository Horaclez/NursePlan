(function () {
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function getAllCauses(plan) {
    const list = [];
    const ramas = (plan.causas && plan.causas.ramas) || {};
    Object.entries(ramas).forEach(([cat, items]) => {
      (items || []).forEach((item) => {
        list.push({ id: item.id, category: `Ishikawa · ${cat}`, text: item.text });
      });
    });
    const arbol = (plan.causas && plan.causas.arbol) || { causasDirectas: [] };
    (arbol.causasDirectas || []).forEach((cd) => {
      list.push({ id: cd.id, category: 'Árbol · Causa Directa', text: cd.text });
      (cd.indirectas || []).forEach((ci) => {
        list.push({ id: ci.id, category: 'Árbol · Causa Indirecta', text: ci.text });
      });
    });
    return list;
  }

  function renderStage5(plan) {
    const { winner } = window.QPlanState.getPrioritizationRanking(plan);
    const problemTitle = (plan.delimitacion && plan.delimitacion.que) || (winner ? winner.text : 'Problema priorizado pendiente');
    const activeTool = plan.causas.tool || 'ishikawa';
    const categorias = Object.keys(plan.causas.ramas);
    const prioSet = new Set(plan.causas.priorizadasIds || []);
    const allCauses = getAllCauses(plan);

    let workspaceHtml = '';

    if (activeTool === 'ishikawa') {
      const svgHtml = window.QPlanDiagrams.renderIshikawaSVG(plan, problemTitle);
      const branchesHtml = categorias.map((cat) => {
        const items = plan.causas.ramas[cat] || [];
        const itemsList = items.length === 0
          ? `<p class="empty-hint">Sin causas en ${cat}.</p>`
          : `<ul class="item-list">${items.map((c) => {
              const isPrio = prioSet.has(c.id);
              return `
                <li class="item-row ${isPrio ? 'item-prio' : ''}">
                  <label class="prio-check-label" title="Priorizar causa (máx. 3)">
                    <input type="checkbox" ${isPrio ? 'checked' : ''} data-action="cause-prio-toggle" data-id="${c.id}">
                    <span>${esc(c.text)}</span>
                  </label>
                  <button type="button" class="btn-icon btn-danger-ghost" data-action="cause-del" data-cat="${esc(cat)}" data-id="${c.id}" title="Eliminar">✕</button>
                </li>`;
            }).join('')}</ul>`;

        return `
          <div class="card branch-card">
            <div class="card-header">
              <h4>${esc(cat)}</h4>
              <span class="count-pill">${items.length}</span>
            </div>
            <div class="inline-add">
              <input type="text" class="input input-sm" id="cause-input-${esc(cat)}" placeholder="Agregar causa en ${esc(cat)}..." data-cause-input="${esc(cat)}">
              <button type="button" class="btn btn-primary btn-sm" data-action="cause-add" data-cat="${esc(cat)}">+</button>
            </div>
            ${itemsList}
          </div>`;
      }).join('');

      workspaceHtml = `
        <div class="card" style="margin-bottom:1.1rem;">
          <div class="card-header-flex">
            <div>
              <h3>Diagrama Visual Causa-Efecto (Ishikawa)</h3>
              <p class="card-sub">Generado automáticamente a partir de las 6M. Se incluye en el Informe Técnico Final.</p>
            </div>
          </div>
          <div class="diagram-scroll">${svgHtml}</div>
        </div>
        <div class="branches-grid">${branchesHtml}</div>
      `;
    } else if (activeTool === 'arbol') {
      const arbol = plan.causas.arbol || { efectos: [], causasDirectas: [] };
      const treeSvg = window.QPlanDiagrams.renderProblemTreeSVG(plan, problemTitle);

      const efectosHtml = (arbol.efectos || []).map((ef) => `
        <li class="item-row">
          <span class="item-text">${esc(ef.text)}</span>
          <button type="button" class="btn-icon btn-danger-ghost" data-action="tree-ef-del" data-id="${ef.id}">✕</button>
        </li>`).join('');

      const directasHtml = (arbol.causasDirectas || []).map((cd) => {
        const isPrio = prioSet.has(cd.id);
        const subList = (cd.indirectas || []).map((ci) => {
          const subPrio = prioSet.has(ci.id);
          return `
            <li class="item-row ${subPrio ? 'item-prio' : ''}" style="margin-left:18px;border-left:2px solid var(--border);">
              <label class="prio-check-label">
                <input type="checkbox" ${subPrio ? 'checked' : ''} data-action="cause-prio-toggle" data-id="${ci.id}">
                <span>↳ ${esc(ci.text)}</span>
              </label>
              <button type="button" class="btn-icon btn-danger-ghost" data-action="tree-ci-del" data-cdid="${cd.id}" data-id="${ci.id}">✕</button>
            </li>`;
        }).join('');

        return `
          <div class="card" style="margin-bottom:0.75rem;padding:0.85rem;">
            <div class="item-row ${isPrio ? 'item-prio' : ''}">
              <label class="prio-check-label">
                <input type="checkbox" ${isPrio ? 'checked' : ''} data-action="cause-prio-toggle" data-id="${cd.id}">
                <strong>${esc(cd.text)}</strong>
              </label>
              <button type="button" class="btn-icon btn-danger-ghost" data-action="tree-cd-del" data-id="${cd.id}">✕</button>
            </div>
            <ul class="item-list" style="margin-top:6px;">${subList}</ul>
            <div class="inline-add" style="margin-top:6px;margin-bottom:0;">
              <input type="text" class="input input-sm" id="tree-ci-input-${cd.id}" placeholder="Agregar causa indirecta / raíz...">
              <button type="button" class="btn btn-secondary btn-sm" data-action="tree-ci-add" data-cdid="${cd.id}">+ Indirecta</button>
            </div>
          </div>`;
      }).join('');

      workspaceHtml = `
        <div class="card" style="margin-bottom:1.1rem;">
          <h3>Esquema Visual del Árbol de Problemas</h3>
          <div class="diagram-scroll">${treeSvg}</div>
        </div>
        <div class="form-grid-2">
          <div class="card">
            <h3>Efectos / Consecuencias (Copa del Árbol)</h3>
            <div class="inline-add">
              <input type="text" class="input input-sm" id="tree-ef-input" placeholder="Ej. Aumento de estadía hospitalaria y eventos adversos...">
              <button type="button" class="btn btn-primary btn-sm" data-action="tree-ef-add">+ Efecto</button>
            </div>
            <ul class="item-list">${efectosHtml || '<p class="empty-hint">Sin efectos registrados.</p>'}</ul>
          </div>
          <div class="card">
            <h3>Causas Directas e Indirectas (Raíces)</h3>
            <div class="inline-add">
              <input type="text" class="input input-sm" id="tree-cd-input" placeholder="Nueva causa directa...">
              <button type="button" class="btn btn-primary btn-sm" data-action="tree-cd-add">+ Causa Directa</button>
            </div>
            ${directasHtml || '<p class="empty-hint">Agrega causas directas y marca hasta 3 causas críticas.</p>'}
          </div>
        </div>
      `;
    } else {
      const chains = plan.causas.cincoPorques || [];
      const chainsHtml = chains.map((ch, idx) => {
        const niveles = ch.niveles || ['', '', '', '', ''];
        const lastRoot = [...niveles].reverse().find((v) => v && v.trim()) || '';
        const stepsHtml = [0, 1, 2, 3, 4].map((lvl) => `
          <div class="pq-step">
            <span class="pq-badge">¿Por qué? #${lvl + 1}</span>
            <input type="text" class="input input-sm" value="${esc(niveles[lvl] || '')}" placeholder="Nivel ${lvl + 1} de profundización causal..." data-action="pq-edit" data-pqid="${ch.id}" data-lvl="${lvl}">
          </div>`).join('');

        return `
          <div class="card" style="margin-bottom:1rem;">
            <div class="card-header-flex">
              <h3>Cadena Causal #${idx + 1}</h3>
              <div style="display:flex;gap:8px;">
                ${lastRoot ? `<button type="button" class="btn btn-primary btn-sm" data-action="pq-promote" data-pqid="${ch.id}">Enviar Causa Raíz a Ishikawa y Priorizar ★</button>` : ''}
                ${chains.length > 1 ? `<button type="button" class="btn btn-ghost btn-sm" data-action="pq-del" data-pqid="${ch.id}">Eliminar</button>` : ''}
              </div>
            </div>
            <div class="pq-chain">${stepsHtml}</div>
          </div>`;
      }).join('');

      workspaceHtml = `
        <div style="margin-bottom:0.85rem;display:flex;justify-content:flex-end;">
          <button type="button" class="btn btn-secondary btn-sm" data-action="pq-add">+ Nueva Cadena de 5 Porqués</button>
        </div>
        ${chainsHtml}
      `;
    }

    const prioCards = allCauses
      .filter((c) => prioSet.has(c.id))
      .map((c, idx) => `
        <div class="prio-cause-pill">
          <span class="badge badge-teal">Causa Crítica #${idx + 1}</span>
          <strong>[${esc(c.category)}]</strong> ${esc(c.text)}
        </div>`).join('');

    return `
      <div class="stage-intro">
        <div>
          <span class="stage-kicker">ETAPA 5 DE 8 · ANÁLISIS CAUSAL Y VISUALIZACIÓN</span>
          <h2>Análisis de Causa Raíz (Ishikawa · Árbol · 5 Porqués)</h2>
          <p>Alterna entre herramientas metodológicas según el enfoque de tu comité y selecciona <strong>hasta 3 causas críticas</strong> (casilla de verificación) para transformarlas en Objetivos Específicos en la Etapa 6.</p>
        </div>
        <div class="tool-switcher" role="group" aria-label="Herramienta de análisis causal">
          <button type="button" class="btn ${activeTool === 'ishikawa' ? 'btn-primary' : 'btn-ghost'}" data-action="cause-tool" data-tool="ishikawa">Espina de Pescado (6M)</button>
          <button type="button" class="btn ${activeTool === 'arbol' ? 'btn-primary' : 'btn-ghost'}" data-action="cause-tool" data-tool="arbol">Árbol de Problemas</button>
          <button type="button" class="btn ${activeTool === 'porques' ? 'btn-primary' : 'btn-ghost'}" data-action="cause-tool" data-tool="porques">5 Porqués</button>
        </div>
      </div>

      <div class="card prio-summary-card">
        <div class="card-header-flex">
          <h3>Causas Críticas Seleccionadas (${prioSet.size} / 3 máx.)</h3>
          <span class="muted-sm">Cada causa seleccionada generará un Objetivo Específico en la Etapa 6</span>
        </div>
        <div class="prio-pills-wrap">
          ${prioCards || '<p class="empty-hint">Marca las casillas junto a las causas para seleccionar hasta 3 causas críticas.</p>'}
        </div>
      </div>

      ${workspaceHtml}
    `;
  }

  function renderStage6(plan) {
    const allCauses = getAllCauses(plan);
    const prioCauses = allCauses.filter((c) => (plan.causas.priorizadasIds || []).includes(c.id));

    prioCauses.forEach((pc) => {
      if (!plan.objetivos.especificos.some((oe) => oe.causaId === pc.id)) {
        plan.objetivos.especificos.push({
          id: window.QPlanState.generateId('oe'),
          causaId: pc.id,
          texto: '',
          plazoSemanas: Math.min(8, plan.horizonWeeks || 8)
        });
      }
    });

    const oeCards = plan.objetivos.especificos.map((oe, idx) => {
      const linkedCause = allCauses.find((c) => c.id === oe.causaId);
      const hasVerb = /^[A-ZÁÉÍÓÚÑ][a-záéíóúñ]+(ar|er|ir)/i.test((oe.texto || '').trim());
      const hasNumber = /\d/.test(oe.texto || '');

      return `
        <div class="card oe-card">
          <div class="card-header-flex">
            <span class="badge badge-teal">Objetivo Específico #${idx + 1}</span>
            <div style="display:flex;align-items:center;gap:8px;">
              <label style="font-size:0.8rem;color:var(--text-muted);">Plazo (sem):</label>
              <input type="number" class="input input-sm" style="width:72px;" min="1" max="52" value="${oe.plazoSemanas || 6}" data-action="oe-plazo" data-id="${oe.id}">
              <button type="button" class="btn-icon btn-danger-ghost" data-action="oe-del" data-id="${oe.id}" title="Eliminar objetivo">✕</button>
            </div>
          </div>
          <div class="linked-cause-box">
            <strong>Causa Raíz Asociada:</strong> ${linkedCause ? `[${esc(linkedCause.category)}] ${esc(linkedCause.text)}` : 'Sin causa vinculada'}
          </div>
          <div class="form-group" style="margin-top:0.75rem;">
            <label>Redacción SMART (Verbo en infinitivo + Meta cuantificable + Plazo)</label>
            <textarea class="textarea" rows="2" placeholder="Ej. Capacitar al menos al 90 % del personal clínico en reevaluación de riesgo en un plazo de 6 semanas." data-action="oe-text" data-id="${oe.id}">${esc(oe.texto)}</textarea>
          </div>
          <div class="smart-checks">
            <span class="smart-tag ${hasVerb ? 'smart-ok' : 'smart-warn'}">${hasVerb ? '✓ Verbo operativo' : '• Iniciar con verbo infinitivo'}</span>
            <span class="smart-tag ${hasNumber ? 'smart-ok' : 'smart-warn'}">${hasNumber ? '✓ Meta cuantificada' : '• Incluir % o cifra'}</span>
          </div>
        </div>`;
    }).join('');

    return `
      <div class="stage-intro">
        <div>
          <span class="stage-kicker">ETAPA 6 DE 8 · FORMULACIÓN DE OBJETIVOS SMART</span>
          <h2>Objetivo General, Específicos y Fundamentación</h2>
          <p>Redacta el propósito global alineado al problema delimitado y define los <strong>Objetivos Específicos</strong> derivados de cada causa crítica priorizada.</p>
        </div>
        <button type="button" class="btn btn-secondary btn-sm" data-action="oe-add">+ Objetivo Específico</button>
      </div>

      <div class="card">
        <h3>Objetivo General del Plan de Mejora</h3>
        <p class="card-sub">Debe responder al Problema Delimitado (Etapa 4) indicando acción, magnitud de cambio esperado y horizonte temporal.</p>
        <textarea class="textarea" rows="3" placeholder="Ej. Disminuir la tasa de caídas intrahospitalarias desde 4.8 a menos de 2.0 por cada 1.000 días-cama ocupados en un plazo de 12 semanas." data-obj="general">${esc(plan.objetivos.general)}</textarea>
      </div>

      <div class="oe-list">${oeCards || '<div class="card"><p class="empty-hint">Selecciona causas críticas en la Etapa 5 o agrega un objetivo específico manualmente.</p></div>'}</div>

      <div class="card" style="margin-top:1.1rem;">
        <h3>Fundamentación Técnica y Pertinencia Estratégica</h3>
        <p class="card-sub">Justifica el impacto clínico de la intervención y cómo apalanca las Fortalezas y Oportunidades identificadas en el FODA.</p>
        <textarea class="textarea" rows="4" placeholder="Explica por qué las intervenciones propuestas resuelven las causas raíz y cómo aprovechan las capacidades del servicio..." data-obj="fundamentacion">${esc(plan.objetivos.fundamentacion)}</textarea>
      </div>
    `;
  }

  function renderStage7(plan) {
    const oes = plan.objetivos.especificos || [];
    const inds = plan.indicadores || [];
    const acts = plan.operativo.actividades || [];
    const mons = plan.operativo.monitoreo || [];
    const horizon = Math.max(2, Math.min(52, Number(plan.horizonWeeks) || 12));

    const indRows = inds.map((ind) => {
      const oeOpts = oes.map((o, i) => `<option value="${o.id}" ${ind.oeId === o.id ? 'selected' : ''}>OE #${i + 1}</option>`).join('');
      const tipoOpts = ['Estructura', 'Proceso', 'Resultado'].map((t) => `<option value="${t}" ${ind.tipo === t ? 'selected' : ''}>${t}</option>`).join('');
      const perOpts = ['Semanal', 'Bisemanal', 'Quincenal', 'Mensual'].map((p) => `<option value="${p}" ${ind.periodicidad === p ? 'selected' : ''}>${p}</option>`).join('');

      return `
        <tr>
          <td>
            <select class="select select-sm" data-action="ind-edit" data-id="${ind.id}" data-field="oeId" style="margin-bottom:4px;">
              <option value="">Vincular OE...</option>${oeOpts}
            </select>
            <select class="select select-sm" data-action="ind-edit" data-id="${ind.id}" data-field="tipo">${tipoOpts}</select>
          </td>
          <td><input type="text" class="input input-sm" value="${esc(ind.nombre)}" placeholder="Nombre del indicador..." data-action="ind-edit" data-id="${ind.id}" data-field="nombre"></td>
          <td><textarea class="textarea textarea-sm" rows="2" placeholder="(Numerador / Denominador) × 100" data-action="ind-edit" data-id="${ind.id}" data-field="formula">${esc(ind.formula)}</textarea></td>
          <td><input type="text" class="input input-sm" value="${esc(ind.lineaBase)}" placeholder="Ej. 38%" data-action="ind-edit" data-id="${ind.id}" data-field="lineaBase"></td>
          <td><input type="text" class="input input-sm" value="${esc(ind.meta)}" placeholder="Ej. 95%" data-action="ind-edit" data-id="${ind.id}" data-field="meta"></td>
          <td><input type="text" class="input input-sm" value="${esc(ind.umbralCritico || '')}" placeholder="Ej. 85%" data-action="ind-edit" data-id="${ind.id}" data-field="umbralCritico"></td>
          <td>
            <select class="select select-sm" data-action="ind-edit" data-id="${ind.id}" data-field="periodicidad" style="margin-bottom:4px;">${perOpts}</select>
            <input type="text" class="input input-sm" value="${esc(ind.fuente)}" placeholder="Fuente verificación" data-action="ind-edit" data-id="${ind.id}" data-field="fuente">
          </td>
          <td class="text-center"><button type="button" class="btn-icon btn-danger-ghost" data-action="ind-del" data-id="${ind.id}">✕</button></td>
        </tr>`;
    }).join('');

    const actRows = acts.map((act) => {
      const oeOpts = oes.map((o, i) => `<option value="${o.id}" ${act.oeId === o.id ? 'selected' : ''}>OE #${i + 1}</option>`).join('');
      const pdcaOpts = [
        { v: 'P', l: 'P · Planificar' },
        { v: 'H', l: 'H · Hacer' },
        { v: 'V', l: 'V · Verificar' },
        { v: 'A', l: 'A · Actuar' }
      ].map((x) => `<option value="${x.v}" ${act.pdca === x.v ? 'selected' : ''}>${x.l}</option>`).join('');
      const stOpts = ['Pendiente', 'En curso', 'Completada'].map((s) => `<option value="${s}" ${act.estado === s ? 'selected' : ''}>${s}</option>`).join('');

      return `
        <tr>
          <td>
            <select class="select select-sm" data-action="act-edit" data-id="${act.id}" data-field="oeId" style="margin-bottom:4px;">
              <option value="">OE...</option>${oeOpts}
            </select>
            <select class="select select-sm" data-action="act-edit" data-id="${act.id}" data-field="pdca" style="margin-bottom:4px;">${pdcaOpts}</select>
            <select class="select select-sm" data-action="act-edit" data-id="${act.id}" data-field="estado">${stOpts}</select>
          </td>
          <td><textarea class="textarea textarea-sm" rows="2" placeholder="Descripción de la actividad..." data-action="act-edit" data-id="${act.id}" data-field="que">${esc(act.que)}</textarea></td>
          <td><input type="text" class="input input-sm" value="${esc(act.quien)}" placeholder="Responsable" data-action="act-edit" data-id="${act.id}" data-field="quien"></td>
          <td><input type="text" class="input input-sm" value="${esc(act.cuandoTexto)}" placeholder="Ej. Semanas 1-3" data-action="act-edit" data-id="${act.id}" data-field="cuandoTexto"></td>
          <td><input type="text" class="input input-sm" value="${esc(act.donde)}" placeholder="Lugar / Unidad" data-action="act-edit" data-id="${act.id}" data-field="donde"></td>
          <td><input type="text" class="input input-sm" value="${esc(act.recursos)}" placeholder="Insumos / Horas" data-action="act-edit" data-id="${act.id}" data-field="recursos"></td>
          <td><input type="text" class="input input-sm" value="${esc(act.verificacion)}" placeholder="Medio de verificación" data-action="act-edit" data-id="${act.id}" data-field="verificacion"></td>
          <td class="text-center"><button type="button" class="btn-icon btn-danger-ghost" data-action="act-del" data-id="${act.id}">✕</button></td>
        </tr>`;
    }).join('');

    const weekHeaders = Array.from({ length: horizon }, (_, i) => `<th class="gantt-wk">S${i + 1}</th>`).join('');
    const ganttRows = acts.length === 0
      ? `<tr><td colspan="${horizon + 2}" class="empty-cell">Agrega actividades en la tabla 5W1H para programar la Carta Gantt interactiva.</td></tr>`
      : acts.map((act) => {
          const activeWeeks = new Set(act.semanas || []);
          const cells = Array.from({ length: horizon }, (_, i) => {
            const wk = i + 1;
            const on = activeWeeks.has(wk);
            return `<td class="gantt-cell ${on ? 'gantt-active' : ''}" data-action="gantt-toggle" data-id="${act.id}" data-wk="${wk}" title="Clic para activar/desactivar Semana ${wk}">${on ? '■' : ''}</td>`;
          }).join('');
          return `
            <tr>
              <td class="gantt-task-name"><span class="badge badge-teal">${esc(act.pdca || 'H')}</span> ${esc(act.que || 'Actividad sin título')}</td>
              <td class="gantt-resp">${esc(act.quien || '-')}</td>
              ${cells}
            </tr>`;
        }).join('');

    const monRows = mons.map((m) => {
      const indOpts = inds.map((ind) => `<option value="${ind.id}" ${m.indicadorId === ind.id ? 'selected' : ''}>${esc(ind.nombre || 'Indicador')}</option>`).join('');
      return `
        <tr>
          <td><select class="select select-sm" data-action="mon-edit" data-id="${m.id}" data-field="indicadorId"><option value="">Seleccionar indicador...</option>${indOpts}</select></td>
          <td><input type="text" class="input input-sm" value="${esc(m.metodo)}" placeholder="Método y tamaño muestral" data-action="mon-edit" data-id="${m.id}" data-field="metodo"></td>
          <td><input type="text" class="input input-sm" value="${esc(m.frecuencia)}" placeholder="Ej. Semanal" data-action="mon-edit" data-id="${m.id}" data-field="frecuencia"></td>
          <td><input type="text" class="input input-sm" value="${esc(m.supervisor)}" placeholder="Responsable" data-action="mon-edit" data-id="${m.id}" data-field="supervisor"></td>
          <td><input type="text" class="input input-sm" value="${esc(m.umbralCorrectivo)}" placeholder="Acción correctiva si incumple" data-action="mon-edit" data-id="${m.id}" data-field="umbralCorrectivo"></td>
          <td class="text-center"><button type="button" class="btn-icon btn-danger-ghost" data-action="mon-del" data-id="${m.id}">✕</button></td>
        </tr>`;
    }).join('');

    return `
      <div class="stage-intro">
        <div>
          <span class="stage-kicker">ETAPA 7 DE 8 · DISEÑO OPERATIVO Y CICLO PHVA</span>
          <h2>Indicadores, Plan 5W1H, Carta Gantt y Monitoreo</h2>
          <p>Operacionaliza cada objetivo mediante indicadores de Estructura/Proceso/Resultado, actividades clasificadas por fase <strong>PHVA (Planificar, Hacer, Verificar, Actuar)</strong> y cronograma semanal interactivo.</p>
        </div>
      </div>

      <div class="card">
        <div class="card-header-flex">
          <div>
            <h3>7.1 Matriz de Indicadores de Evaluación</h3>
            <p class="card-sub">Define fórmula matemática, línea base, meta esperada y umbral crítico de alerta.</p>
          </div>
          <button type="button" class="btn btn-primary btn-sm" data-action="ind-add">+ Agregar Indicador</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:120px;">OE / Tipo</th>
                <th style="width:190px;">Nombre del Indicador</th>
                <th>Fórmula de Cálculo</th>
                <th style="width:82px;">L. Base</th>
                <th style="width:82px;">Meta</th>
                <th style="width:82px;">Umbral</th>
                <th style="width:165px;">Periodicidad / Fuente</th>
                <th style="width:42px;"></th>
              </tr>
            </thead>
            <tbody>${indRows || '<tr><td colspan="8" class="empty-cell">Sin indicadores definidos aún.</td></tr>'}</tbody>
          </table>
        </div>
      </div>

      <div class="card" style="margin-top:1.1rem;">
        <div class="card-header-flex">
          <div>
            <h3>7.2 Plan de Acción Operativo (5W1H + Ciclo PHVA)</h3>
            <p class="card-sub">Detalla Qué, Quién, Cuándo, Dónde, Recursos y Medio de Verificación por fase PHVA.</p>
          </div>
          <button type="button" class="btn btn-primary btn-sm" data-action="act-add">+ Agregar Actividad</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:125px;">OE / PHVA / Est.</th>
                <th style="width:220px;">¿Qué? (Actividad)</th>
                <th style="width:140px;">¿Quién?</th>
                <th style="width:110px;">¿Cuándo?</th>
                <th style="width:130px;">¿Dónde?</th>
                <th style="width:135px;">¿Con qué?</th>
                <th style="width:145px;">Verificación</th>
                <th style="width:42px;"></th>
              </tr>
            </thead>
            <tbody>${actRows || '<tr><td colspan="8" class="empty-cell">Sin actividades operativas aún.</td></tr>'}</tbody>
          </table>
        </div>
      </div>

      <div class="card" style="margin-top:1.1rem;">
        <div class="card-header-flex">
          <div>
            <h3>7.3 Carta Gantt Interactiva (${horizon} Semanas)</h3>
            <p class="card-sub">Haz clic sobre cualquier celda semanal para programar las semanas de ejecución; el texto "¿Cuándo?" se actualiza automáticamente.</p>
          </div>
        </div>
        <div class="table-wrap">
          <table class="gantt-table">
            <thead>
              <tr>
                <th>Actividad (PHVA)</th>
                <th style="width:150px;">Responsable</th>
                ${weekHeaders}
              </tr>
            </thead>
            <tbody>${ganttRows}</tbody>
          </table>
        </div>
      </div>

      <div class="card" style="margin-top:1.1rem;">
        <div class="card-header-flex">
          <div>
            <h3>7.4 Plan de Supervisión, Auditoría y Umbrales Correctivos</h3>
            <p class="card-sub">Define cómo y con qué frecuencia se vigilará cada indicador y qué acción correctiva se activará ante desviaciones.</p>
          </div>
          <button type="button" class="btn btn-secondary btn-sm" data-action="mon-add">+ Regla de Monitoreo</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:210px;">Indicador Vigilado</th>
                <th>Método y Muestra de Auditoría</th>
                <th style="width:135px;">Frecuencia</th>
                <th style="width:150px;">Supervisor</th>
                <th>Umbral y Acción Correctiva</th>
                <th style="width:42px;"></th>
              </tr>
            </thead>
            <tbody>${monRows || '<tr><td colspan="6" class="empty-cell">Agrega reglas de monitoreo para asegurar el control de calidad.</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  function renderStage8(plan) {
    const inds = plan.indicadores || [];
    const meds = plan.mediciones || [];
    const riesgos = plan.riesgos || [];

    const indOpts = inds.map((ind) => `<option value="${ind.id}">${esc(ind.nombre || 'Indicador')}</option>`).join('');

    const runChartsHtml = inds.map((ind) => {
      const pts = meds.filter((m) => m.indicadorId === ind.id);
      if (pts.length === 0) return '';
      return `<div style="margin-bottom:1rem;">${window.QPlanDiagrams.renderRunChartSVG(ind, pts)}</div>`;
    }).join('');

    const medRows = meds.map((m) => {
      const ind = inds.find((i) => i.id === m.indicadorId);
      const metaNum = ind ? parseFloat(ind.meta) : NaN;
      const baseNum = ind ? parseFloat(ind.lineaBase) : NaN;
      const valNum = Number(m.valor);
      let statusBadge = '<span class="badge badge-gray">Registrado</span>';
      if (!isNaN(metaNum) && !isNaN(valNum)) {
        const isLowerBetter = !isNaN(baseNum) && metaNum < baseNum;
        const ok = isLowerBetter ? valNum <= metaNum : valNum >= metaNum;
        statusBadge = ok
          ? '<span class="badge badge-green">En Meta ✓</span>'
          : '<span class="badge badge-amber">En Progreso</span>';
      }
      return `
        <tr>
          <td><strong>${ind ? esc(ind.nombre) : 'Indicador'}</strong></td>
          <td>${esc(m.periodo)}</td>
          <td class="text-center">${m.numerador !== '' && m.numerador !== undefined ? `${m.numerador} / ${m.denominador}` : '-'}</td>
          <td class="text-center"><strong>${m.valor}</strong></td>
          <td class="text-center">${statusBadge}</td>
          <td>${esc(m.nota || '')}</td>
          <td class="text-center"><button type="button" class="btn-icon btn-danger-ghost" data-action="med-del" data-id="${m.id}">✕</button></td>
        </tr>`;
    }).join('');

    const riskRows = riesgos.map((r) => {
      const prob = Number(r.probabilidad) || 3;
      const imp = Number(r.impacto) || 3;
      const level = prob * imp;
      const badgeCls = level >= 15 ? 'badge-red' : level >= 8 ? 'badge-amber' : 'badge-green';
      const label = level >= 15 ? `Crítico (${level})` : level >= 8 ? `Moderado (${level})` : `Bajo (${level})`;

      return `
        <tr>
          <td><textarea class="textarea textarea-sm" rows="2" placeholder="Descripción del riesgo operativo..." data-action="rsk-edit" data-id="${r.id}" data-field="descripcion">${esc(r.descripcion)}</textarea></td>
          <td class="text-center">
            <select class="select select-sm" data-action="rsk-edit" data-id="${r.id}" data-field="probabilidad">
              ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${prob === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </td>
          <td class="text-center">
            <select class="select select-sm" data-action="rsk-edit" data-id="${r.id}" data-field="impacto">
              ${[1, 2, 3, 4, 5].map((n) => `<option value="${n}" ${imp === n ? 'selected' : ''}>${n}</option>`).join('')}
            </select>
          </td>
          <td class="text-center"><span class="badge ${badgeCls}">${label}</span></td>
          <td><textarea class="textarea textarea-sm" rows="2" placeholder="Plan de mitigación y contingencia..." data-action="rsk-edit" data-id="${r.id}" data-field="mitigacion">${esc(r.mitigacion)}</textarea></td>
          <td><input type="text" class="input input-sm" value="${esc(r.responsable)}" placeholder="Responsable" data-action="rsk-edit" data-id="${r.id}" data-field="responsable"></td>
          <td class="text-center"><button type="button" class="btn-icon btn-danger-ghost" data-action="rsk-del" data-id="${r.id}">✕</button></td>
        </tr>`;
    }).join('');

    return `
      <div class="stage-intro">
        <div>
          <span class="stage-kicker">ETAPA 8 DE 8 · SEGUIMIENTO CONTINUO Y RESILIENCIA</span>
          <h2>Seguimiento de Indicadores (Run Charts) y Matriz de Riesgos</h2>
          <p>Registra las mediciones periódicas para visualizar la tendencia hacia la meta y gestiona los riesgos operativos que podrían amenazar la sostenibilidad del plan.</p>
        </div>
      </div>

      <div class="card">
        <h3>8.1 Registro de Mediciones Periódicas y Gráficos de Tendencia</h3>
        <div class="form-grid-4" style="margin-bottom:0.85rem;background:var(--bg-subtle);padding:0.85rem;border-radius:var(--radius-sm);">
          <div class="form-group">
            <label for="med-ind">Indicador</label>
            <select id="med-ind" class="select select-sm">${indOpts || '<option value="">Crea un indicador en Etapa 7</option>'}</select>
          </div>
          <div class="form-group">
            <label for="med-per">Periodo (ej. Semana 5)</label>
            <input id="med-per" class="input input-sm" type="text" placeholder="Ej. Semana 5">
          </div>
          <div class="form-group">
            <label for="med-val">Valor Medido (o Num / Den)</label>
            <div style="display:flex;gap:4px;">
              <input id="med-num" class="input input-sm" type="number" step="any" placeholder="Num" title="Numerador (opcional)">
              <input id="med-den" class="input input-sm" type="number" step="any" placeholder="Den" title="Denominador (opcional)">
              <input id="med-val" class="input input-sm" type="number" step="any" placeholder="Valor %">
            </div>
          </div>
          <div class="form-group" style="display:flex;align-items:flex-end;gap:6px;">
            <input id="med-nota" class="input input-sm" type="text" placeholder="Observación breve...">
            <button type="button" class="btn btn-primary btn-sm" data-action="med-add">Registrar</button>
          </div>
        </div>

        ${runChartsHtml}

        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th>Indicador</th>
                <th style="width:110px;">Periodo</th>
                <th class="text-center" style="width:100px;">Num / Den</th>
                <th class="text-center" style="width:90px;">Resultado</th>
                <th class="text-center" style="width:115px;">Estado Meta</th>
                <th>Observación / Análisis</th>
                <th style="width:42px;"></th>
              </tr>
            </thead>
            <tbody>${medRows || '<tr><td colspan="7" class="empty-cell">Registra mediciones periódicas para construir el gráfico de tendencia.</td></tr>'}</tbody>
          </table>
        </div>
      </div>

      <div class="card" style="margin-top:1.1rem;">
        <div class="card-header-flex">
          <div>
            <h3>8.2 Matriz de Riesgos Operativos y Contingencia (P × I)</h3>
            <p class="card-sub">Evalúa Probabilidad (1–5) × Impacto (1–5) para anticipar barreras de implementación.</p>
          </div>
          <button type="button" class="btn btn-primary btn-sm" data-action="rsk-add">+ Agregar Riesgo</button>
        </div>
        <div class="table-wrap">
          <table class="data-table">
            <thead>
              <tr>
                <th style="width:240px;">Riesgo Identificado</th>
                <th class="text-center" style="width:75px;">Prob. (1-5)</th>
                <th class="text-center" style="width:75px;">Imp. (1-5)</th>
                <th class="text-center" style="width:115px;">Nivel Riesgo</th>
                <th>Plan de Mitigación y Contingencia</th>
                <th style="width:150px;">Responsable</th>
                <th style="width:42px;"></th>
              </tr>
            </thead>
            <tbody>${riskRows || '<tr><td colspan="7" class="empty-cell">Sin riesgos operativos registrados aún.</td></tr>'}</tbody>
          </table>
        </div>
      </div>
    `;
  }

  window.QPlanStages5to8 = {
    getAllCauses,
    renderStage5,
    renderStage6,
    renderStage7,
    renderStage8
  };
})();

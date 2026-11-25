(function () {
  function esc(str) {
    return String(str || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function evaluateQualityAudit(plan) {
    const { winner } = window.QPlanState.getPrioritizationRanking(plan);
    const del = plan.delimitacion || {};
    const allCauses = window.QPlanStages5to8.getAllCauses(plan);
    const prioCauses = allCauses.filter((c) => (plan.causas.priorizadasIds || []).includes(c.id));
    const oes = plan.objetivos.especificos || [];
    const inds = plan.indicadores || [];
    const acts = plan.operativo.actividades || [];
    const mons = plan.operativo.monitoreo || [];
    const riesgos = plan.riesgos || [];

    const checks = [
      {
        stage: 1,
        label: 'Diagnóstico FODA completo (Fortalezas, Oportunidades, Debilidades y Amenazas) y ficha técnica',
        weight: 10,
        passed: Boolean(
          plan.title &&
          plan.unit &&
          (plan.foda.F || []).length > 0 &&
          (plan.foda.O || []).length > 0 &&
          (plan.foda.D || []).length > 0 &&
          (plan.foda.A || []).length > 0
        ),
        advice: 'Completa los 4 cuadrantes del FODA y los metadatos del servicio en Etapa 1.'
      },
      {
        stage: 2,
        label: 'Filtro de gobernabilidad (abordabilidad evaluada sobre debilidades y amenazas)',
        weight: 10,
        passed: window.QPlanState.getFodaProblems(plan).length > 0 && window.QPlanState.getAbordableProblems(plan).length > 0,
        advice: 'Evalúa y deja al menos un problema abordable en Etapa 2.'
      },
      {
        stage: 3,
        label: 'Priorización multicriterio ponderada con problema ganador identificado',
        weight: 12,
        passed: Boolean(winner && winner.total > 0),
        advice: 'Asigna puntajes del 1 al 6 en la Matriz de Priorización (Etapa 3).'
      },
      {
        stage: 4,
        label: 'Delimitación operativa completa (Qué, Cómo, Dónde, Cuándo, Línea Base y Meta)',
        weight: 13,
        passed: Boolean(del.que && del.como && del.donde && del.cuando && del.cuantoValor !== '' && del.metaValor !== ''),
        advice: 'Completa todas las dimensiones 5W + Cuánto y la meta esperada en Etapa 4.'
      },
      {
        stage: 5,
        label: 'Análisis causal profundo con 1 a 3 causas críticas seleccionadas',
        weight: 13,
        passed: prioCauses.length >= 1 && prioCauses.length <= 3,
        advice: 'Selecciona entre 1 y 3 causas críticas en Etapa 5.'
      },
      {
        stage: 6,
        label: 'Objetivo General, Objetivos Específicos SMART y Fundamentación Técnica',
        weight: 14,
        passed: Boolean(
          plan.objetivos.general &&
          plan.objetivos.fundamentacion &&
          oes.length >= 1 &&
          oes.every((o) => o.texto && o.texto.trim().length > 10)
        ),
        advice: 'Redacta el Objetivo General, todos los Objetivos Específicos y la Fundamentación en Etapa 6.'
      },
      {
        stage: 7,
        label: 'Trazabilidad completa: cada OE cuenta con Indicador con fórmula/meta y Actividad 5W1H + Gantt',
        weight: 18,
        passed: Boolean(
          oes.length > 0 &&
          oes.every((o) => inds.some((i) => i.oeId === o.id && i.nombre && i.formula && i.meta)) &&
          oes.every((o) => acts.some((a) => a.oeId === o.id && a.que && a.quien)) &&
          acts.some((a) => Array.isArray(a.semanas) && a.semanas.length > 0)
        ),
        advice: 'Asegura que cada Objetivo Específico tenga al menos un indicador con fórmula/meta, actividades 5W1H y semanas marcadas en la Carta Gantt (Etapa 7).'
      },
      {
        stage: 8,
        label: 'Plan de supervisión/monitoreo y gestión de riesgos operativos (P × I)',
        weight: 10,
        passed: Boolean(mons.length >= 1 && riesgos.length >= 1),
        advice: 'Define al menos una regla de monitoreo en Etapa 7 y un riesgo mitigado en Etapa 8.'
      }
    ];

    const score = checks.reduce((acc, c) => acc + (c.passed ? c.weight : 0), 0);
    return { score, checks };
  }

  function renderAuditDrawer(plan) {
    const { score, checks } = evaluateQualityAudit(plan);
    const itemsHtml = checks.map((c) => `
      <div class="audit-row ${c.passed ? 'audit-pass' : 'audit-fail'}">
        <div class="audit-icon">${c.passed ? '✓' : '!'}</div>
        <div class="audit-body">
          <div class="audit-title"><strong>Etapa ${c.stage}:</strong> ${esc(c.label)} <span class="audit-pts">(${c.passed ? c.weight : 0}/${c.weight} pts)</span></div>
          ${c.passed ? '' : `<div class="audit-advice">Sugerencia: ${esc(c.advice)}</div>`}
        </div>
        <button type="button" class="btn btn-secondary btn-sm" data-goto-stage="${c.stage}">Ir</button>
      </div>`).join('');

    return `
      <div class="audit-score-header">
        <div class="audit-gauge">
          <span class="audit-big">${score}%</span>
          <span class="audit-sub">Índice de Calidad Metodológica</span>
        </div>
        <p style="margin:0;color:var(--text-muted);font-size:0.88rem;">Verifica en tiempo real la coherencia vertical entre diagnóstico FODA, priorización, análisis causal, objetivos SMART, indicadores, actividades PHVA y control de riesgos.</p>
      </div>
      <div class="audit-list">${itemsHtml}</div>
    `;
  }

  function buildExecutiveReportHTML(plan) {
    const { ranking, winner } = window.QPlanState.getPrioritizationRanking(plan);
    const nonAbordables = window.QPlanState.getNonAbordableProblems(plan);
    const criterios = plan.priorizacion.criterios || [];
    const scoresMap = plan.priorizacion.scores || {};
    const del = plan.delimitacion || {};
    const allCauses = window.QPlanStages5to8.getAllCauses(plan);
    const prioCauses = allCauses.filter((c) => (plan.causas.priorizadasIds || []).includes(c.id));
    const oes = plan.objetivos.especificos || [];
    const inds = plan.indicadores || [];
    const acts = plan.operativo.actividades || [];
    const mons = plan.operativo.monitoreo || [];
    const meds = plan.mediciones || [];
    const riesgos = plan.riesgos || [];
    const horizon = Math.max(2, Math.min(52, Number(plan.horizonWeeks) || 12));
    const { score } = evaluateQualityAudit(plan);

    const problemTitle = del.que || (winner ? winner.text : 'Problema priorizado');
    const causalDiagramSvg = plan.causas.tool === 'arbol'
      ? window.QPlanDiagrams.renderProblemTreeSVG(plan, problemTitle)
      : window.QPlanDiagrams.renderIshikawaSVG(plan, problemTitle);

    const fodaList = (arr) => arr && arr.length > 0
      ? `<ul>${arr.map((i) => `<li>${esc(i.text)}</li>`).join('')}</ul>`
      : '<p class="rep-muted">Sin registros</p>';

    const nonAbHtml = nonAbordables.length === 0
      ? '<p class="rep-muted">Todos los problemas detectados resultaron gobernables a nivel local.</p>'
      : `<table><thead><tr><th>Origen</th><th>Problema No Abordable</th><th>Justificación de Derivación</th></tr></thead><tbody>
          ${nonAbordables.map((na) => `<tr><td>${esc(na.origin)}</td><td>${esc(na.text)}</td><td>${esc(na.justificacion)}</td></tr>`).join('')}
        </tbody></table>`;

    const critHeaders = criterios.map((c) => `<th>${esc(c.nombre)} (×${c.peso || 1})</th>`).join('');
    const prioRows = ranking.map((r, idx) => {
      const pScores = scoresMap[r.id] || {};
      const cols = criterios.map((c) => `<td style="text-align:center;">${pScores[c.id] || '-'}</td>`).join('');
      return `<tr class="${idx === 0 ? 'rep-highlight' : ''}">
        <td>${idx === 0 ? '★ ' : ''}${esc(r.text)}</td>
        <td>${esc(r.origin)}</td>
        ${cols}
        <td style="text-align:center;"><strong>${r.total}</strong></td>
        <td style="text-align:center;">${r.avg}</td>
      </tr>`;
    }).join('');

    const runChartsHtml = inds.map((ind) => {
      const pts = meds.filter((m) => m.indicadorId === ind.id);
      if (pts.length === 0) return '';
      return `<div style="margin-top:10px;">${window.QPlanDiagrams.renderRunChartSVG(ind, pts)}</div>`;
    }).join('');

    const weekHeaders = Array.from({ length: horizon }, (_, i) => `<th style="text-align:center;font-size:7.5pt;padding:2px;">S${i + 1}</th>`).join('');
    const ganttBody = acts.map((act) => {
      const set = new Set(act.semanas || []);
      const cells = Array.from({ length: horizon }, (_, i) => {
        const on = set.has(i + 1);
        return `<td style="text-align:center;background:${on ? '#0f766e' : 'transparent'};color:#ffffff;font-size:7pt;padding:2px;">${on ? '■' : ''}</td>`;
      }).join('');
      return `<tr><td>[${esc(act.pdca || 'H')}] ${esc(act.que)}</td><td>${esc(act.quien)}</td>${cells}</tr>`;
    }).join('');

    return `
      <div class="report-sheet" id="printable-report">
        <div class="rep-header">
          <div>
            <span class="rep-kicker">PLAN DE MEJORA CONTINUA EN SALUD · Q-PLAN</span>
            <h1>${esc(plan.title)}</h1>
            <p class="rep-sub">${esc(plan.unit)} · ${esc(plan.facilityType)} · ${esc(plan.qualityDomain)}</p>
          </div>
          <div class="rep-badge-box">
            <div><strong>Calidad Metodológica:</strong> ${score}%</div>
            <div><strong>Fecha Inicio:</strong> ${esc(plan.startDate)}</div>
            <div><strong>Horizonte:</strong> ${horizon} semanas</div>
          </div>
        </div>

        <table class="rep-meta-table">
          <tr>
            <th>Responsable / Líder</th><td>${esc(plan.leader || 'No especificado')}</td>
            <th>Equipo Ejecutor</th><td>${esc(plan.team || 'No especificado')}</td>
          </tr>
        </table>

        <h2>1. Diagnóstico Situacional (Análisis FODA)</h2>
        <table class="rep-foda-table">
          <tr>
            <th style="width:50%;">Fortalezas (F)</th>
            <th style="width:50%;">Oportunidades (O)</th>
          </tr>
          <tr>
            <td>${fodaList(plan.foda.F)}</td>
            <td>${fodaList(plan.foda.O)}</td>
          </tr>
          <tr>
            <th>Debilidades (D)</th>
            <th>Amenazas (A)</th>
          </tr>
          <tr>
            <td>${fodaList(plan.foda.D)}</td>
            <td>${fodaList(plan.foda.A)}</td>
          </tr>
        </table>

        <h2>2. Evaluación de Gobernabilidad y Derivación</h2>
        <p><strong>Problemas gobernables habilitados:</strong> ${window.QPlanState.getAbordableProblems(plan).length} · <strong>No abordables derivados:</strong> ${nonAbordables.length}</p>
        ${nonAbHtml}

        <h2>3. Matriz de Priorización Multicriterio</h2>
        <table>
          <thead>
            <tr>
              <th>Problema Abordable</th>
              <th>Origen</th>
              ${critHeaders}
              <th>Total Pond.</th>
              <th>Prom.</th>
            </tr>
          </thead>
          <tbody>${prioRows || '<tr><td colspan="6">Sin datos de priorización.</td></tr>'}</tbody>
        </table>

        <h2>4. Delimitación Operativa del Problema Priorizado</h2>
        <div class="rep-callout">
          <strong>Síntesis Operativa:</strong> ${window.QPlanStages1to4.buildDelimitationSynthesis(del)}
        </div>
        <table>
          <tr><th style="width:22%;">¿Qué ocurre?</th><td>${esc(del.que)}</td></tr>
          <tr><th>¿Cómo se evidencia?</th><td>${esc(del.como)}</td></tr>
          <tr><th>¿Dónde ocurre?</th><td>${esc(del.donde)}</td></tr>
          <tr><th>¿Cuándo ocurre?</th><td>${esc(del.cuando)}</td></tr>
          <tr><th>Línea Base y Meta</th><td>Basal: <strong>${esc(del.cuantoValor)} ${esc(del.cuantoUnidad)}</strong> → Meta esperada: <strong>${esc(del.metaValor)} ${esc(del.cuantoUnidad)}</strong></td></tr>
        </table>

        <h2>5. Análisis de Causa Raíz</h2>
        <div style="margin:10px 0;">${causalDiagramSvg}</div>
        <h3>Causas Críticas Seleccionadas para Intervención</h3>
        <ol>
          ${prioCauses.map((c) => `<li><strong>[${esc(c.category)}]</strong> ${esc(c.text)}</li>`).join('') || '<li>Sin causas priorizadas.</li>'}
        </ol>

        <h2>6. Objetivos y Fundamentación Estratégica</h2>
        <div class="rep-callout">
          <strong>Objetivo General:</strong> ${esc(plan.objetivos.general || 'Pendiente de redacción')}
        </div>
        <h3>Objetivos Específicos</h3>
        <table>
          <thead><tr><th style="width:65px;">Código</th><th>Causa Crítica Asociada</th><th>Objetivo Específico SMART</th><th style="width:90px;">Plazo</th></tr></thead>
          <tbody>
            ${oes.map((oe, i) => {
              const lc = allCauses.find((c) => c.id === oe.causaId);
              return `<tr><td><strong>OE #${i + 1}</strong></td><td>${lc ? esc(lc.text) : '-'}</td><td>${esc(oe.texto)}</td><td>${oe.plazoSemanas || '-'} sem</td></tr>`;
            }).join('') || '<tr><td colspan="4">Sin objetivos específicos.</td></tr>'}
          </tbody>
        </table>
        <p><strong>Fundamentación Técnica:</strong> ${esc(plan.objetivos.fundamentacion || 'Pendiente de redacción')}</p>

        <h2>7. Matriz Operativa: Indicadores, Plan 5W1H, Carta Gantt y Monitoreo</h2>
        <h3>7.1 Indicadores de Evaluación</h3>
        <table>
          <thead><tr><th>OE</th><th>Tipo</th><th>Indicador</th><th>Fórmula</th><th>L. Base</th><th>Meta</th><th>Umbral</th><th>Periodicidad / Fuente</th></tr></thead>
          <tbody>
            ${inds.map((ind) => {
              const oeIdx = oes.findIndex((o) => o.id === ind.oeId);
              return `<tr>
                <td>${oeIdx >= 0 ? `OE #${oeIdx + 1}` : '-'}</td>
                <td>${esc(ind.tipo)}</td>
                <td><strong>${esc(ind.nombre)}</strong></td>
                <td>${esc(ind.formula)}</td>
                <td>${esc(ind.lineaBase)}</td>
                <td><strong>${esc(ind.meta)}</strong></td>
                <td>${esc(ind.umbralCritico || '-')}</td>
                <td>${esc(ind.periodicidad)} · ${esc(ind.fuente)}</td>
              </tr>`;
            }).join('') || '<tr><td colspan="8">Sin indicadores definidos.</td></tr>'}
          </tbody>
        </table>

        <h3>7.2 Plan de Acción Operativo (5W1H + PHVA)</h3>
        <table>
          <thead><tr><th>OE / PHVA</th><th>Actividad (¿Qué?)</th><th>Responsable (¿Quién?)</th><th>Plazo (¿Cuándo?)</th><th>Lugar (¿Dónde?)</th><th>Recursos (¿Con qué?)</th><th>Medio Verificación</th></tr></thead>
          <tbody>
            ${acts.map((act) => {
              const oeIdx = oes.findIndex((o) => o.id === act.oeId);
              return `<tr>
                <td>${oeIdx >= 0 ? `OE #${oeIdx + 1}` : '-'} · <strong>${esc(act.pdca || 'H')}</strong></td>
                <td>${esc(act.que)}</td>
                <td>${esc(act.quien)}</td>
                <td>${esc(act.cuandoTexto)}</td>
                <td>${esc(act.donde)}</td>
                <td>${esc(act.recursos)}</td>
                <td>${esc(act.verificacion)}</td>
              </tr>`;
            }).join('') || '<tr><td colspan="7">Sin actividades operativas.</td></tr>'}
          </tbody>
        </table>

        <h3>7.3 Carta Gantt de Ejecución (${horizon} Semanas)</h3>
        <table>
          <thead><tr><th>Actividad</th><th>Responsable</th>${weekHeaders}</tr></thead>
          <tbody>${ganttBody || '<tr><td colspan="4">Sin cronograma programado.</td></tr>'}</tbody>
        </table>

        <h3>7.4 Plan de Supervisión y Umbrales Correctivos</h3>
        <table>
          <thead><tr><th>Indicador</th><th>Método de Auditoría</th><th>Frecuencia</th><th>Supervisor</th><th>Acción Correctiva</th></tr></thead>
          <tbody>
            ${mons.map((m) => {
              const ind = inds.find((i) => i.id === m.indicadorId);
              return `<tr><td>${ind ? esc(ind.nombre) : '-'}</td><td>${esc(m.metodo)}</td><td>${esc(m.frecuencia)}</td><td>${esc(m.supervisor)}</td><td>${esc(m.umbralCorrectivo)}</td></tr>`;
            }).join('') || '<tr><td colspan="5">Sin plan de supervisión registrado.</td></tr>'}
          </tbody>
        </table>

        <h2>8. Seguimiento de Resultados y Matriz de Riesgos</h2>
        ${runChartsHtml}
        <h3>8.1 Registro de Mediciones Periódicas</h3>
        <table>
          <thead><tr><th>Indicador</th><th>Periodo</th><th>Num / Den</th><th>Resultado</th><th>Observación</th></tr></thead>
          <tbody>
            ${meds.map((m) => {
              const ind = inds.find((i) => i.id === m.indicadorId);
              return `<tr><td>${ind ? esc(ind.nombre) : '-'}</td><td>${esc(m.periodo)}</td><td>${m.numerador !== '' && m.numerador !== undefined ? `${m.numerador}/${m.denominador}` : '-'}</td><td><strong>${m.valor}</strong></td><td>${esc(m.nota || '')}</td></tr>`;
            }).join('') || '<tr><td colspan="5">Sin mediciones registradas aún.</td></tr>'}
          </tbody>
        </table>

        <h3>8.2 Matriz de Riesgos Operativos y Contingencia</h3>
        <table>
          <thead><tr><th>Riesgo Identificado</th><th>Prob.</th><th>Imp.</th><th>Nivel</th><th>Plan de Mitigación</th><th>Responsable</th></tr></thead>
          <tbody>
            ${riesgos.map((r) => {
              const lvl = (Number(r.probabilidad) || 3) * (Number(r.impacto) || 3);
              return `<tr><td>${esc(r.descripcion)}</td><td style="text-align:center;">${r.probabilidad}</td><td style="text-align:center;">${r.impacto}</td><td style="text-align:center;"><strong>${lvl}</strong></td><td>${esc(r.mitigacion)}</td><td>${esc(r.responsable)}</td></tr>`;
            }).join('') || '<tr><td colspan="6">Sin riesgos operativos registrados.</td></tr>'}
          </tbody>
        </table>
      </div>
    `;
  }

  function renderReportView(plan) {
    return `
      <div class="stage-intro">
        <div>
          <span class="stage-kicker">ENTREGABLE FINAL · CONSOLIDACIÓN Y EXPORTACIÓN</span>
          <h2>Informe Técnico Completo del Plan de Mejora Continua</h2>
          <p>Documento consolidado con trazabilidad horizontal y vertical, diagramas vectoriales (Ishikawa / Árbol / Run Charts) y Carta Gantt listo para imprimir en PDF o descargar en Word (.doc).</p>
        </div>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary" data-action="export-word">Descargar Word (.doc)</button>
          <button type="button" class="btn btn-primary" data-action="print-report">Imprimir / Guardar PDF</button>
        </div>
      </div>
      ${buildExecutiveReportHTML(plan)}
    `;
  }

  window.QPlanReport = {
    evaluateQualityAudit,
    renderAuditDrawer,
    buildExecutiveReportHTML,
    renderReportView
  };
})();

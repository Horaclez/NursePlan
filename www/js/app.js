(function () {
  const STAGES = [
    { id: 1, short: '1. FODA', title: 'Diagnóstico FODA' },
    { id: 2, short: '2. Gobernabilidad', title: 'Abordabilidad' },
    { id: 3, short: '3. Priorización', title: 'Priorización' },
    { id: 4, short: '4. Delimitación', title: 'Delimitación 5W' },
    { id: 5, short: '5. Causas', title: 'Causa Raíz' },
    { id: 6, short: '6. Objetivos', title: 'Objetivos SMART' },
    { id: 7, short: '7. Operativo', title: 'Indicadores & Gantt' },
    { id: 8, short: '8. Seguimiento', title: 'Monitoreo & Riesgos' },
    { id: 9, short: 'Informe Final', title: 'Informe Ejecutivo' }
  ];

  let currentStage = 1;
  let toastTimer = null;

  function showToast(msg, durationMs) {
    const el = document.getElementById('toast-banner');
    if (!el) return;
    el.textContent = msg;
    el.classList.add('toast-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => {
      el.classList.remove('toast-visible');
    }, durationMs || 3200);
  }

  function applyTheme(theme) {
    document.documentElement.setAttribute('data-theme', theme);
    try {
      localStorage.setItem(window.QPlanState.THEME_KEY, theme);
    } catch (_e) {}
    const btn = document.getElementById('btn-theme');
    if (btn) btn.textContent = theme === 'dark' ? '☀️ Claro' : '🌙 Oscuro';
  }

  function initTheme() {
    let saved = 'light';
    try {
      saved = localStorage.getItem(window.QPlanState.THEME_KEY) || 'light';
    } catch (_e) {}
    applyTheme(saved);
  }

  function renderCurrentStagePreservingFocus() {
    const active = document.activeElement;
    const mainEl = document.getElementById('stage-content');
    let focusInfo = null;
    if (active && mainEl && mainEl.contains(active) && (active.tagName === 'INPUT' || active.tagName === 'TEXTAREA' || active.tagName === 'SELECT')) {
      focusInfo = {
        id: active.id || '',
        action: active.getAttribute('data-action') || '',
        dataId: active.getAttribute('data-id') || '',
        field: active.getAttribute('data-field') || '',
        meta: active.getAttribute('data-meta') || '',
        del: active.getAttribute('data-del') || '',
        obj: active.getAttribute('data-obj') || '',
        pqid: active.getAttribute('data-pqid') || '',
        lvl: active.getAttribute('data-lvl') || '',
        selStart: typeof active.selectionStart === 'number' ? active.selectionStart : null,
        selEnd: typeof active.selectionEnd === 'number' ? active.selectionEnd : null
      };
    }

    renderCurrentStage();

    if (focusInfo && mainEl) {
      let targetEl = null;
      if (focusInfo.id) {
        targetEl = document.getElementById(focusInfo.id);
      } else if (focusInfo.meta) {
        targetEl = mainEl.querySelector(`[data-meta="${focusInfo.meta}"]`);
      } else if (focusInfo.del) {
        targetEl = mainEl.querySelector(`[data-del="${focusInfo.del}"]`);
      } else if (focusInfo.obj) {
        targetEl = mainEl.querySelector(`[data-obj="${focusInfo.obj}"]`);
      } else if (focusInfo.action === 'pq-edit') {
        targetEl = mainEl.querySelector(`[data-action="pq-edit"][data-pqid="${focusInfo.pqid}"][data-lvl="${focusInfo.lvl}"]`);
      } else if (focusInfo.action && focusInfo.dataId && focusInfo.field) {
        targetEl = mainEl.querySelector(`[data-action="${focusInfo.action}"][data-id="${focusInfo.dataId}"][data-field="${focusInfo.field}"]`);
      } else if (focusInfo.action && focusInfo.dataId) {
        targetEl = mainEl.querySelector(`[data-action="${focusInfo.action}"][data-id="${focusInfo.dataId}"]`);
      }
      if (targetEl) {
        targetEl.focus({ preventScroll: true });
        if (focusInfo.selStart !== null && typeof targetEl.setSelectionRange === 'function') {
          try {
            targetEl.setSelectionRange(focusInfo.selStart, focusInfo.selEnd);
          } catch (_e) {}
        }
      }
    }
  }

  function syncAndRender(actionNote, skipFullRender) {
    window.QPlanState.save();
    updateTopIndicators();
    if (!skipFullRender) renderCurrentStage();
    if (actionNote) {
      window.QPlanCollab.broadcastLocalChange(actionNote);
    }
  }

  function updateTopIndicators() {
    const plan = window.QPlanState.getActivePlan();
    const { score } = window.QPlanReport.evaluateQualityAudit(plan);
    const auditBtn = document.getElementById('btn-audit');
    if (auditBtn) {
      auditBtn.textContent = `Auditoría: ${score}%`;
      auditBtn.className = `btn btn-sm ${score >= 85 ? 'btn-teal-soft' : score >= 55 ? 'btn-amber-soft' : 'btn-ghost'}`;
    }

    const select = document.getElementById('plan-selector');
    if (select) {
      const plans = window.QPlanState.getAllPlans();
      select.innerHTML = plans
        .map((p) => `<option value="${p.id}" ${p.id === plan.id ? 'selected' : ''}>${p.title}</option>`)
        .join('');
    }
  }

  function updateCollabHeaderBadge(status) {
    const btn = document.getElementById('btn-collab');
    const dot = document.getElementById('collab-dot');
    const label = document.getElementById('collab-btn-text');
    if (!btn || !dot || !label) return;
    if (status.mode === 'offline') {
      dot.className = 'status-dot dot-offline';
      label.textContent = 'Equipo';
    } else {
      dot.className = 'status-dot dot-online';
      label.textContent = `Sala #${status.roomCode} (${status.peerCount + 1})`;
    }
  }

  function renderStepper() {
    const nav = document.getElementById('stage-stepper');
    if (!nav) return;
    const plan = window.QPlanState.getActivePlan();
    const { checks } = window.QPlanReport.evaluateQualityAudit(plan);
    const passedStages = new Set(checks.filter((c) => c.passed).map((c) => c.stage));

    nav.innerHTML = STAGES.map((st) => {
      const isActive = currentStage === st.id;
      const isDone = passedStages.has(st.id);
      return `
        <button type="button" class="step-pill ${isActive ? 'step-active' : ''} ${isDone ? 'step-done' : ''}" data-stage="${st.id}">
          <span class="step-num">${st.id === 9 ? '📄' : isDone ? '✓' : st.id}</span>
          <span class="step-label">${st.short}</span>
        </button>`;
    }).join('');
  }

  function renderCurrentStage() {
    const container = document.getElementById('stage-content');
    if (!container) return;
    const plan = window.QPlanState.getActivePlan();

    renderStepper();
    updateTopIndicators();

    if (currentStage === 1) container.innerHTML = window.QPlanStages1to4.renderStage1(plan);
    else if (currentStage === 2) container.innerHTML = window.QPlanStages1to4.renderStage2(plan);
    else if (currentStage === 3) container.innerHTML = window.QPlanStages1to4.renderStage3(plan);
    else if (currentStage === 4) container.innerHTML = window.QPlanStages1to4.renderStage4(plan);
    else if (currentStage === 5) container.innerHTML = window.QPlanStages5to8.renderStage5(plan);
    else if (currentStage === 6) container.innerHTML = window.QPlanStages5to8.renderStage6(plan);
    else if (currentStage === 7) container.innerHTML = window.QPlanStages5to8.renderStage7(plan);
    else if (currentStage === 8) container.innerHTML = window.QPlanStages5to8.renderStage8(plan);
    else container.innerHTML = window.QPlanReport.renderReportView(plan);

    const prevBtn = document.getElementById('btn-prev-stage');
    const nextBtn = document.getElementById('btn-next-stage');
    if (prevBtn) prevBtn.disabled = currentStage <= 1;
    if (nextBtn) {
      nextBtn.textContent = currentStage >= 9 ? 'Volver a Etapa 1' : 'Siguiente Etapa →';
    }
  }

  function renderCollabModalBody() {
    const body = document.getElementById('collab-modal-body');
    if (!body) return;
    const status = window.QPlanCollab.getStatus();
    const plan = window.QPlanState.getActivePlan();
    const logs = (plan.collabLog || []).slice().reverse().slice(0, 12);

    const profileSection = `
      <div class="card" style="margin-bottom:1rem;padding:0.95rem;">
        <h4 style="margin-bottom:0.5rem;">1. Tu Identidad en el Equipo Clínico</h4>
        <div class="form-grid-2">
          <div class="form-group">
            <label for="collab-my-name">Tu Nombre / Alias</label>
            <input id="collab-my-name" class="input input-sm" type="text" value="${status.myProfile.name.replace(/"/g, '&quot;')}">
          </div>
          <div class="form-group">
            <label for="collab-my-role">Rol / Estamento</label>
            <div style="display:flex;gap:6px;">
              <input id="collab-my-role" class="input input-sm" type="text" value="${status.myProfile.role.replace(/"/g, '&quot;')}">
              <button type="button" class="btn btn-secondary btn-sm" data-collab-action="save-profile">Guardar</button>
            </div>
          </div>
        </div>
      </div>
    `;

    let liveSection = '';
    if (status.mode === 'offline') {
      liveSection = `
        <div class="card" style="margin-bottom:1rem;padding:0.95rem;">
          <h4 style="margin-bottom:0.35rem;">2. Sala Colaborativa en Tiempo Real (Enlace Directo P2P + QR)</h4>
          <p class="card-sub" style="margin-bottom:0.85rem;">Trabaja simultáneamente con tus compañeros sin cuentas ni servidores intermedios. Todos ven los cambios al instante.</p>
          <div class="form-grid-2">
            <div class="collab-option-box">
              <strong>Crear Nueva Sala como Anfitrión</strong>
              <p class="muted-sm" style="margin:4px 0 10px;">Comparte tu plan actual y genera un Código + QR para que otros se unan.</p>
              <button type="button" class="btn btn-primary btn-block" data-collab-action="host-room">Crear Sala Colaborativa</button>
            </div>
            <div class="collab-option-box">
              <strong>Unirse a una Sala Existente</strong>
              <p class="muted-sm" style="margin:4px 0 8px;">Pega el código de 6 letras o el enlace recibido por WhatsApp/Teams.</p>
              <input id="collab-join-code" class="input input-sm" type="text" placeholder="Ej. K7M9P2 o enlace ?sala=..." style="margin-bottom:6px;">
              <label style="display:flex;align-items:center;gap:6px;font-size:0.78rem;margin-bottom:8px;cursor:pointer;">
                <input type="checkbox" id="collab-merge-local"> Fusionar mis aportes locales al entrar
              </label>
              <button type="button" class="btn btn-secondary btn-block" data-collab-action="join-room">Unirse a Sala</button>
            </div>
          </div>
        </div>
      `;
    } else {
      const qrSvg = window.QPlanQR.renderQrSVG(status.shareUrl, 148);
      const peersHtml = status.peers.length === 0
        ? '<span class="muted-sm">Esperando que tus compañeros ingresen el código...</span>'
        : status.peers.map((p) => `<span class="badge badge-teal">${p.name} (${p.role})</span>`).join(' ');

      liveSection = `
        <div class="card" style="margin-bottom:1rem;padding:0.95rem;border-color:var(--primary);">
          <div class="card-header-flex">
            <div>
              <span class="badge badge-green">● SALA ACTIVA (${status.mode === 'host' ? 'Anfitrión' : 'Participante'})</span>
              <h3 style="margin-top:4px;">Código de Sala: <span style="letter-spacing:2px;color:var(--primary);">${status.roomCode}</span></h3>
            </div>
            <div style="display:flex;gap:6px;flex-wrap:wrap;">
              <button type="button" class="btn btn-secondary btn-sm" data-collab-action="sync-now">Sincronizar Ahora</button>
              <button type="button" class="btn btn-danger btn-sm" data-collab-action="leave-room">Salir de Sala</button>
            </div>
          </div>

          <div style="display:flex;gap:1rem;align-items:center;flex-wrap:wrap;margin:0.75rem 0;">
            <div>${qrSvg}</div>
            <div style="flex:1;min-width:220px;">
              <p style="font-size:0.85rem;margin-bottom:6px;">Comparte este código o enlace con tu equipo para editar simultáneamente:</p>
              <div style="display:flex;gap:6px;margin-bottom:8px;">
                <input type="text" class="input input-sm" readonly value="${status.shareUrl}" id="collab-share-url">
                <button type="button" class="btn btn-primary btn-sm" data-collab-action="copy-invite">Copiar</button>
              </div>
              <div style="font-size:0.82rem;"><strong>Conectados (${status.peerCount + 1}):</strong> ${peersHtml}</div>
            </div>
          </div>
        </div>
      `;
    }

    const offlineSyncSection = `
      <div class="card" style="margin-bottom:1rem;padding:0.95rem;">
        <h4 style="margin-bottom:0.35rem;">3. Sincronización Offline por Archivo (Fusión Inteligente sin Internet)</h4>
        <p class="card-sub" style="margin-bottom:0.75rem;">Si cada integrante trabajó por separado en distintas etapas, exporta tu avance y fúsionalo sin sobrescribir ni duplicar ítems.</p>
        <div style="display:flex;gap:8px;flex-wrap:wrap;">
          <button type="button" class="btn btn-secondary btn-sm" data-collab-action="export-json">Exportar Mi Avance (.json)</button>
          <button type="button" class="btn btn-primary btn-sm" data-collab-action="merge-json-btn">Fusionar Archivo de Compañero (.json)</button>
          <input type="file" id="collab-merge-file-input" accept=".json,application/json" hidden>
        </div>
      </div>
    `;

    const logSection = `
      <div class="card" style="padding:0.95rem;">
        <h4 style="margin-bottom:0.5rem;">Bitácora de Colaboración del Equipo</h4>
        ${logs.length === 0
          ? '<p class="empty-hint">Aún no hay registros de cambios colaborativos en este plan.</p>'
          : `<ul class="item-list">${logs.map((l) => `<li class="item-row" style="font-size:0.82rem;"><span><strong>${l.author}:</strong> ${l.action}</span><span class="muted-sm">${new Date(l.ts).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></li>`).join('')}</ul>`}
      </div>
    `;

    body.innerHTML = profileSection + liveSection + offlineSyncSection + logSection;
  }

  function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (!el) return;
    if (modalId === 'audit-modal') {
      const body = document.getElementById('audit-modal-body');
      if (body) body.innerHTML = window.QPlanReport.renderAuditDrawer(window.QPlanState.getActivePlan());
    } else if (modalId === 'collab-modal') {
      renderCollabModalBody();
    } else if (modalId === 'templates-modal') {
      const body = document.getElementById('templates-modal-body');
      if (body) {
        body.innerHTML = window.QPlanSample.TEMPLATES.map((t) => `
          <div class="template-card">
            <div>
              <span class="badge badge-teal">${t.domain}</span>
              <h4 style="margin-top:4px;">${t.label}</h4>
            </div>
            <button type="button" class="btn btn-primary btn-sm" data-load-template="${t.id}">Cargar Plantilla</button>
          </div>`).join('');
      }
    }
    el.hidden = false;
  }

  function closeAllModals() {
    document.querySelectorAll('.modal-backdrop').forEach((m) => {
      m.hidden = true;
    });
  }

  function handleMainClick(e) {
    const target = e.target.closest('[data-action]');
    if (!target) return;
    const action = target.getAttribute('data-action');
    const plan = window.QPlanState.getActivePlan();

    if (action === 'foda-add') {
      const quad = target.getAttribute('data-quad');
      const input = document.getElementById(`foda-input-${quad}`);
      if (input && input.value.trim()) {
        const text = input.value.trim();
        plan.foda[quad].push({ id: window.QPlanState.generateId(quad.toLowerCase()), text });
        syncAndRender(`Agregó ítem en FODA (${quad})`);
      }
    } else if (action === 'foda-del') {
      const quad = target.getAttribute('data-quad');
      const id = target.getAttribute('data-id');
      plan.foda[quad] = plan.foda[quad].filter((i) => i.id !== id);
      delete plan.abordabilidad[id];
      delete plan.priorizacion.scores[id];
      syncAndRender(`Eliminó ítem en FODA (${quad})`);
    } else if (action === 'prio-crit-add') {
      const input = document.getElementById('new-crit-input');
      if (input && input.value.trim()) {
        plan.priorizacion.criterios.push({
          id: window.QPlanState.generateId('c'),
          nombre: input.value.trim(),
          peso: 1
        });
        syncAndRender('Agregó criterio de priorización');
      }
    } else if (action === 'prio-crit-del') {
      const cid = target.getAttribute('data-cid');
      plan.priorizacion.criterios = plan.priorizacion.criterios.filter((c) => c.id !== cid);
      syncAndRender('Eliminó criterio de priorización');
    } else if (action === 'del-calc') {
      const num = parseFloat(plan.delimitacion.cuantoNumerador);
      const den = parseFloat(plan.delimitacion.cuantoDenominador);
      const fac = Number(plan.delimitacion.cuantoFactor) || 100;
      if (!isNaN(num) && !isNaN(den) && den > 0) {
        const res = ((num / den) * fac).toFixed(fac === 1 ? 0 : 1);
        plan.delimitacion.cuantoValor = Number(res);
        syncAndRender('Calculó magnitud basal en Delimitación');
      } else {
        showToast('Ingresa un numerador y denominador mayor a 0.');
      }
    } else if (action === 'cause-tool') {
      plan.causas.tool = target.getAttribute('data-tool');
      syncAndRender();
    } else if (action === 'cause-add') {
      const cat = target.getAttribute('data-cat');
      const input = document.getElementById(`cause-input-${cat}`);
      if (input && input.value.trim()) {
        plan.causas.ramas[cat].push({
          id: window.QPlanState.generateId('cr'),
          text: input.value.trim()
        });
        syncAndRender(`Agregó causa en Ishikawa (${cat})`);
      }
    } else if (action === 'cause-del') {
      const cat = target.getAttribute('data-cat');
      const id = target.getAttribute('data-id');
      plan.causas.ramas[cat] = plan.causas.ramas[cat].filter((c) => c.id !== id);
      plan.causas.priorizadasIds = plan.causas.priorizadasIds.filter((pid) => pid !== id);
      syncAndRender('Eliminó causa de Ishikawa');
    } else if (action === 'tree-ef-add') {
      const input = document.getElementById('tree-ef-input');
      if (input && input.value.trim()) {
        plan.causas.arbol.efectos.push({ id: window.QPlanState.generateId('ef'), text: input.value.trim() });
        syncAndRender('Agregó efecto en Árbol de Problemas');
      }
    } else if (action === 'tree-ef-del') {
      const id = target.getAttribute('data-id');
      plan.causas.arbol.efectos = plan.causas.arbol.efectos.filter((e) => e.id !== id);
      syncAndRender('Eliminó efecto del Árbol');
    } else if (action === 'tree-cd-add') {
      const input = document.getElementById('tree-cd-input');
      if (input && input.value.trim()) {
        plan.causas.arbol.causasDirectas.push({
          id: window.QPlanState.generateId('cd'),
          text: input.value.trim(),
          indirectas: []
        });
        syncAndRender('Agregó causa directa en Árbol');
      }
    } else if (action === 'tree-cd-del') {
      const id = target.getAttribute('data-id');
      plan.causas.arbol.causasDirectas = plan.causas.arbol.causasDirectas.filter((c) => c.id !== id);
      plan.causas.priorizadasIds = plan.causas.priorizadasIds.filter((pid) => pid !== id);
      syncAndRender('Eliminó causa directa del Árbol');
    } else if (action === 'tree-ci-add') {
      const cdid = target.getAttribute('data-cdid');
      const input = document.getElementById(`tree-ci-input-${cdid}`);
      const parent = plan.causas.arbol.causasDirectas.find((c) => c.id === cdid);
      if (parent && input && input.value.trim()) {
        parent.indirectas.push({ id: window.QPlanState.generateId('ci'), text: input.value.trim() });
        syncAndRender('Agregó causa indirecta en Árbol');
      }
    } else if (action === 'tree-ci-del') {
      const cdid = target.getAttribute('data-cdid');
      const id = target.getAttribute('data-id');
      const parent = plan.causas.arbol.causasDirectas.find((c) => c.id === cdid);
      if (parent) {
        parent.indirectas = parent.indirectas.filter((ci) => ci.id !== id);
        plan.causas.priorizadasIds = plan.causas.priorizadasIds.filter((pid) => pid !== id);
        syncAndRender('Eliminó causa indirecta');
      }
    } else if (action === 'pq-add') {
      plan.causas.cincoPorques.push({ id: window.QPlanState.generateId('pq'), niveles: ['', '', '', '', ''] });
      syncAndRender('Agregó cadena de 5 Porqués');
    } else if (action === 'pq-del') {
      const pqid = target.getAttribute('data-pqid');
      plan.causas.cincoPorques = plan.causas.cincoPorques.filter((p) => p.id !== pqid);
      syncAndRender('Eliminó cadena de 5 Porqués');
    } else if (action === 'pq-promote') {
      const pqid = target.getAttribute('data-pqid');
      const chain = plan.causas.cincoPorques.find((p) => p.id === pqid);
      if (chain) {
        const rootText = [...(chain.niveles || [])].reverse().find((v) => v && v.trim());
        if (rootText) {
          const newId = window.QPlanState.generateId('cr');
          plan.causas.ramas['Método'].push({ id: newId, text: rootText.trim() });
          if (plan.causas.priorizadasIds.length < 3) {
            plan.causas.priorizadasIds.push(newId);
          }
          plan.causas.tool = 'ishikawa';
          syncAndRender('Promovió causa raíz de 5 Porqués a Ishikawa');
          showToast('Causa raíz enviada a Ishikawa y marcada como prioritaria ★');
        }
      }
    } else if (action === 'oe-add') {
      plan.objetivos.especificos.push({
        id: window.QPlanState.generateId('oe'),
        causaId: '',
        texto: '',
        plazoSemanas: Math.min(8, plan.horizonWeeks || 8)
      });
      syncAndRender('Agregó Objetivo Específico');
    } else if (action === 'oe-del') {
      const id = target.getAttribute('data-id');
      plan.objetivos.especificos = plan.objetivos.especificos.filter((o) => o.id !== id);
      syncAndRender('Eliminó Objetivo Específico');
    } else if (action === 'ind-add') {
      const firstOe = plan.objetivos.especificos[0];
      plan.indicadores.push({
        id: window.QPlanState.generateId('ind'),
        oeId: firstOe ? firstOe.id : '',
        tipo: 'Proceso',
        nombre: '',
        formula: '',
        lineaBase: '',
        meta: '',
        umbralCritico: '',
        periodicidad: 'Semanal',
        fuente: ''
      });
      syncAndRender('Agregó Indicador');
    } else if (action === 'ind-del') {
      const id = target.getAttribute('data-id');
      plan.indicadores = plan.indicadores.filter((i) => i.id !== id);
      syncAndRender('Eliminó Indicador');
    } else if (action === 'act-add') {
      const firstOe = plan.objetivos.especificos[0];
      plan.operativo.actividades.push({
        id: window.QPlanState.generateId('act'),
        oeId: firstOe ? firstOe.id : '',
        pdca: 'H',
        estado: 'Pendiente',
        que: '',
        quien: '',
        cuandoTexto: '',
        semanas: [],
        donde: '',
        recursos: '',
        verificacion: ''
      });
      syncAndRender('Agregó Actividad Operativa');
    } else if (action === 'act-del') {
      const id = target.getAttribute('data-id');
      plan.operativo.actividades = plan.operativo.actividades.filter((a) => a.id !== id);
      syncAndRender('Eliminó Actividad Operativa');
    } else if (action === 'gantt-toggle') {
      const id = target.getAttribute('data-id');
      const wk = Number(target.getAttribute('data-wk'));
      const act = plan.operativo.actividades.find((a) => a.id === id);
      if (act && wk > 0) {
        const set = new Set(act.semanas || []);
        if (set.has(wk)) set.delete(wk);
        else set.add(wk);
        act.semanas = Array.from(set).sort((a, b) => a - b);
        act.cuandoTexto = window.QPlanState.formatWeeksRange(act.semanas);
        syncAndRender('Actualizó Carta Gantt');
      }
    } else if (action === 'mon-add') {
      const firstInd = plan.indicadores[0];
      plan.operativo.monitoreo.push({
        id: window.QPlanState.generateId('mon'),
        indicadorId: firstInd ? firstInd.id : '',
        metodo: '',
        frecuencia: 'Semanal',
        supervisor: '',
        umbralCorrectivo: ''
      });
      syncAndRender('Agregó regla de monitoreo');
    } else if (action === 'mon-del') {
      const id = target.getAttribute('data-id');
      plan.operativo.monitoreo = plan.operativo.monitoreo.filter((m) => m.id !== id);
      syncAndRender('Eliminó regla de monitoreo');
    } else if (action === 'med-add') {
      const indId = document.getElementById('med-ind').value;
      const periodo = document.getElementById('med-per').value.trim();
      const numRaw = document.getElementById('med-num').value;
      const denRaw = document.getElementById('med-den').value;
      let valRaw = document.getElementById('med-val').value;
      const nota = document.getElementById('med-nota').value.trim();

      if (!indId || !periodo) {
        showToast('Selecciona un indicador e ingresa el periodo (ej. Semana 5).');
        return;
      }
      if (valRaw === '' && numRaw !== '' && denRaw !== '' && Number(denRaw) > 0) {
        valRaw = ((Number(numRaw) / Number(denRaw)) * 100).toFixed(1);
      }
      if (valRaw === '' || isNaN(Number(valRaw))) {
        showToast('Ingresa un valor numérico o numerador/denominador válido.');
        return;
      }
      plan.mediciones.push({
        id: window.QPlanState.generateId('med'),
        indicadorId: indId,
        periodo,
        numerador: numRaw !== '' ? Number(numRaw) : '',
        denominador: denRaw !== '' ? Number(denRaw) : '',
        valor: Number(valRaw),
        nota
      });
      syncAndRender(`Registró medición (${periodo}: ${valRaw})`);
    } else if (action === 'med-del') {
      const id = target.getAttribute('data-id');
      plan.mediciones = plan.mediciones.filter((m) => m.id !== id);
      syncAndRender('Eliminó medición periódica');
    } else if (action === 'rsk-add') {
      plan.riesgos.push({
        id: window.QPlanState.generateId('rsk'),
        descripcion: '',
        probabilidad: 3,
        impacto: 3,
        mitigacion: '',
        responsable: ''
      });
      syncAndRender('Agregó riesgo operativo');
    } else if (action === 'rsk-del') {
      const id = target.getAttribute('data-id');
      plan.riesgos = plan.riesgos.filter((r) => r.id !== id);
      syncAndRender('Eliminó riesgo operativo');
    } else if (action === 'print-report') {
      window.print();
    } else if (action === 'export-word') {
      const html = window.QPlanReport.buildExecutiveReportHTML(plan);
      window.QPlanState.exportPlanWord(plan, html);
      showToast('Descargando informe en formato Word (.doc)...');
    }
  }

  function handleMainChange(e) {
    const target = e.target;
    const action = target.getAttribute('data-action');
    const plan = window.QPlanState.getActivePlan();

    if (target.hasAttribute('data-meta')) {
      const field = target.getAttribute('data-meta');
      plan[field] = field === 'horizonWeeks' ? Math.max(2, Math.min(52, Number(target.value) || 12)) : target.value;
      syncAndRender(`Actualizó ${field} del plan`, field !== 'horizonWeeks');
      return;
    }

    if (target.hasAttribute('data-del')) {
      const field = target.getAttribute('data-del');
      plan.delimitacion[field] = target.value;
      const syn = document.getElementById('del-synthesis-text');
      if (syn) syn.innerHTML = window.QPlanStages1to4.buildDelimitationSynthesis(plan.delimitacion);
      syncAndRender('Editó delimitación operativa', true);
      return;
    }

    if (target.hasAttribute('data-obj')) {
      const field = target.getAttribute('data-obj');
      plan.objetivos[field] = target.value;
      syncAndRender(`Editó objetivo ${field}`, true);
      return;
    }

    if (action === 'ab-check') {
      const id = target.getAttribute('data-id');
      const dim = target.getAttribute('data-dim');
      if (!plan.abordabilidad[id]) {
        plan.abordabilidad[id] = { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: '' };
      }
      plan.abordabilidad[id][dim] = target.checked;
      const entry = plan.abordabilidad[id];
      entry.abordable = Boolean(entry.alcance && entry.recursos && entry.plazo);
      syncAndRender('Evaluó gobernabilidad en Etapa 2');
    } else if (action === 'ab-just') {
      const id = target.getAttribute('data-id');
      if (!plan.abordabilidad[id]) {
        plan.abordabilidad[id] = { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: '' };
      }
      plan.abordabilidad[id].justificacion = target.value;
      syncAndRender('Editó justificación de gobernabilidad', true);
    } else if (action === 'prio-crit-peso') {
      const cid = target.getAttribute('data-cid');
      const crit = plan.priorizacion.criterios.find((c) => c.id === cid);
      if (crit) {
        crit.peso = Number(target.value) || 1;
        syncAndRender('Ajustó ponderación de criterio');
      }
    } else if (action === 'prio-score') {
      const pid = target.getAttribute('data-pid');
      const cid = target.getAttribute('data-cid');
      if (!plan.priorizacion.scores[pid]) plan.priorizacion.scores[pid] = {};
      plan.priorizacion.scores[pid][cid] = Number(target.value) || 0;
      syncAndRender('Actualizó puntaje de priorización');
    } else if (action === 'prio-tie-winner') {
      plan.priorizacion.manualWinnerId = target.value;
      syncAndRender('Definió desempate de priorización');
    } else if (action === 'cause-prio-toggle') {
      const id = target.getAttribute('data-id');
      const set = new Set(plan.causas.priorizadasIds || []);
      if (target.checked) {
        if (set.size >= 3) {
          target.checked = false;
          showToast('Máximo 3 causas críticas permitidas para mantener foco operativo.');
          return;
        }
        set.add(id);
      } else {
        set.delete(id);
      }
      plan.causas.priorizadasIds = Array.from(set);
      syncAndRender('Actualizó causas críticas priorizadas');
    } else if (action === 'pq-edit') {
      const pqid = target.getAttribute('data-pqid');
      const lvl = Number(target.getAttribute('data-lvl'));
      const chain = plan.causas.cincoPorques.find((p) => p.id === pqid);
      if (chain) {
        chain.niveles[lvl] = target.value;
        syncAndRender('Editó cadena de 5 Porqués', true);
      }
    } else if (action === 'oe-text') {
      const id = target.getAttribute('data-id');
      const oe = plan.objetivos.especificos.find((o) => o.id === id);
      if (oe) {
        oe.texto = target.value;
        syncAndRender('Editó Objetivo Específico');
      }
    } else if (action === 'oe-plazo') {
      const id = target.getAttribute('data-id');
      const oe = plan.objetivos.especificos.find((o) => o.id === id);
      if (oe) {
        oe.plazoSemanas = Number(target.value) || 6;
        syncAndRender('Editó plazo de Objetivo Específico', true);
      }
    } else if (action === 'ind-edit') {
      const id = target.getAttribute('data-id');
      const field = target.getAttribute('data-field');
      const ind = plan.indicadores.find((i) => i.id === id);
      if (ind) {
        ind[field] = target.value;
        syncAndRender('Editó indicador de calidad', true);
      }
    } else if (action === 'act-edit') {
      const id = target.getAttribute('data-id');
      const field = target.getAttribute('data-field');
      const act = plan.operativo.actividades.find((a) => a.id === id);
      if (act) {
        act[field] = target.value;
        syncAndRender('Editó actividad operativa', true);
      }
    } else if (action === 'mon-edit') {
      const id = target.getAttribute('data-id');
      const field = target.getAttribute('data-field');
      const mon = plan.operativo.monitoreo.find((m) => m.id === id);
      if (mon) {
        mon[field] = target.value;
        syncAndRender('Editó plan de monitoreo', true);
      }
    } else if (action === 'rsk-edit') {
      const id = target.getAttribute('data-id');
      const field = target.getAttribute('data-field');
      const rsk = plan.riesgos.find((r) => r.id === id);
      if (rsk) {
        rsk[field] = field === 'probabilidad' || field === 'impacto' ? Number(target.value) : target.value;
        syncAndRender('Editó matriz de riesgos', field !== 'probabilidad' && field !== 'impacto');
      }
    }
  }

  function bindGlobalEvents() {
    const mainEl = document.getElementById('stage-content');
    if (mainEl) {
      let liveInputTimer = null;
      mainEl.addEventListener('click', handleMainClick);
      mainEl.addEventListener('change', handleMainChange);
      mainEl.addEventListener('input', (e) => {
        const t = e.target;
        if (!t || (t.tagName !== 'INPUT' && t.tagName !== 'TEXTAREA')) return;
        if (t.type === 'checkbox' || t.type === 'radio' || t.type === 'number') return;
        const isLiveField = t.hasAttribute('data-meta') ||
          t.hasAttribute('data-del') ||
          t.hasAttribute('data-obj') ||
          ['ab-just', 'pq-edit', 'oe-text', 'ind-edit', 'act-edit', 'mon-edit', 'rsk-edit'].includes(t.getAttribute('data-action'));
        if (!isLiveField) return;
        clearTimeout(liveInputTimer);
        liveInputTimer = setTimeout(() => {
          handleMainChange({ target: t });
        }, 650);
      });
      mainEl.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' && e.target.tagName === 'INPUT') {
          if (e.target.hasAttribute('data-foda-input')) {
            e.preventDefault();
            const quad = e.target.getAttribute('data-foda-input');
            const btn = mainEl.querySelector(`[data-action="foda-add"][data-quad="${quad}"]`);
            if (btn) btn.click();
          } else if (e.target.hasAttribute('data-cause-input')) {
            e.preventDefault();
            const cat = e.target.getAttribute('data-cause-input');
            const btn = mainEl.querySelector(`[data-action="cause-add"][data-cat="${cat}"]`);
            if (btn) btn.click();
          }
        }
      });
    }

    const stepper = document.getElementById('stage-stepper');
    if (stepper) {
      stepper.addEventListener('click', (e) => {
        const btn = e.target.closest('[data-stage]');
        if (btn) {
          currentStage = Number(btn.getAttribute('data-stage'));
          renderCurrentStage();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    document.getElementById('btn-prev-stage').addEventListener('click', () => {
      if (currentStage > 1) {
        currentStage--;
        renderCurrentStage();
        window.scrollTo({ top: 0, behavior: 'smooth' });
      }
    });

    document.getElementById('btn-next-stage').addEventListener('click', () => {
      currentStage = currentStage >= 9 ? 1 : currentStage + 1;
      renderCurrentStage();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    document.getElementById('plan-selector').addEventListener('change', (e) => {
      window.QPlanState.setActivePlan(e.target.value);
      renderCurrentStage();
      showToast('Plan activo cambiado.');
    });

    document.getElementById('btn-new-plan').addEventListener('click', () => {
      const title = prompt('Título del nuevo Plan de Mejora Continua:', 'Plan de Mejora Continua — Nuevo');
      if (title !== null) {
        window.QPlanState.createNewPlan(title.trim() || 'Nuevo Plan de Mejora Continua');
        currentStage = 1;
        renderCurrentStage();
        showToast('Nuevo plan en blanco creado.');
      }
    });

    document.getElementById('btn-duplicate-plan').addEventListener('click', () => {
      window.QPlanState.duplicateActivePlan();
      renderCurrentStage();
      showToast('Plan duplicado correctamente.');
    });

    document.getElementById('btn-delete-plan').addEventListener('click', () => {
      const plan = window.QPlanState.getActivePlan();
      if (window.QPlanState.getAllPlans().length <= 1) {
        showToast('Debe existir al menos un plan en la aplicación.');
        return;
      }
      if (confirm(`¿Eliminar permanentemente "${plan.title}"?`)) {
        window.QPlanState.deletePlan(plan.id);
        renderCurrentStage();
        showToast('Plan eliminado.');
      }
    });

    document.getElementById('btn-templates').addEventListener('click', () => openModal('templates-modal'));
    document.getElementById('btn-audit').addEventListener('click', () => openModal('audit-modal'));
    document.getElementById('btn-collab').addEventListener('click', () => openModal('collab-modal'));

    document.getElementById('btn-theme').addEventListener('click', () => {
      const cur = document.documentElement.getAttribute('data-theme');
      applyTheme(cur === 'dark' ? 'light' : 'dark');
    });

    document.getElementById('btn-export-json').addEventListener('click', async () => {
      const plan = window.QPlanState.getActivePlan();
      await window.QPlanState.exportPlanJSON(plan);
      showToast('Respaldo JSON exportado.');
    });

    const importInput = document.getElementById('import-json-input');
    document.getElementById('btn-import-json').addEventListener('click', () => importInput.click());
    importInput.addEventListener('change', (e) => {
      const file = e.target.files[0];
      if (!file) return;
      window.QPlanState.importPlanJSON(file, (err, imported) => {
        importInput.value = '';
        if (err) {
          showToast('Error al importar: ' + err.message, 4500);
        } else {
          currentStage = 1;
          renderCurrentStage();
          showToast(`Plan "${imported.title}" importado con éxito.`);
        }
      });
    });

    document.querySelectorAll('[data-close-modal]').forEach((btn) => {
      btn.addEventListener('click', closeAllModals);
    });
    document.querySelectorAll('.modal-backdrop').forEach((backdrop) => {
      backdrop.addEventListener('click', (e) => {
        if (e.target === backdrop) closeAllModals();
      });
    });

    document.getElementById('templates-modal-body').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-load-template]');
      if (btn) {
        const tplId = btn.getAttribute('data-load-template');
        window.QPlanState.loadSamplePlan(tplId);
        currentStage = 1;
        closeAllModals();
        renderCurrentStage();
        showToast('Caso clínico modelo cargado.');
      }
    });

    document.getElementById('audit-modal-body').addEventListener('click', (e) => {
      const btn = e.target.closest('[data-goto-stage]');
      if (btn) {
        currentStage = Number(btn.getAttribute('data-goto-stage'));
        closeAllModals();
        renderCurrentStage();
      }
    });

    document.getElementById('collab-modal-body').addEventListener('click', async (e) => {
      const btn = e.target.closest('[data-collab-action]');
      if (!btn) return;
      const act = btn.getAttribute('data-collab-action');

      if (act === 'save-profile') {
        const name = document.getElementById('collab-my-name').value;
        const role = document.getElementById('collab-my-role').value;
        window.QPlanCollab.saveProfile(name, role);
        renderCollabModalBody();
        showToast('Perfil de equipo guardado.');
      } else if (act === 'host-room') {
        btn.disabled = true;
        btn.textContent = 'Creando sala...';
        try {
          const st = await window.QPlanCollab.hostRoom();
          renderCollabModalBody();
          showToast(`Sala #${st.roomCode} creada. Comparte el código o QR con tu equipo.`);
        } catch (err) {
          showToast(err.message, 5000);
          renderCollabModalBody();
        }
      } else if (act === 'join-room') {
        const codeInput = document.getElementById('collab-join-code').value;
        const mergeLocal = document.getElementById('collab-merge-local').checked;
        btn.disabled = true;
        btn.textContent = 'Conectando...';
        try {
          const st = await window.QPlanCollab.joinRoom(codeInput, mergeLocal);
          renderCollabModalBody();
          renderCurrentStage();
          showToast(`Conectado a sala #${st.roomCode}`);
        } catch (err) {
          showToast(err.message, 5000);
          renderCollabModalBody();
        }
      } else if (act === 'sync-now') {
        if (window.QPlanCollab.forceSyncNow()) {
          showToast('Sincronización enviada al equipo.');
        }
      } else if (act === 'leave-room') {
        window.QPlanCollab.leaveRoom();
        renderCollabModalBody();
      } else if (act === 'copy-invite') {
        const urlInput = document.getElementById('collab-share-url');
        if (urlInput && navigator.clipboard) {
          await navigator.clipboard.writeText(urlInput.value);
          showToast('Enlace / Código de sala copiado al portapapeles.');
        }
      } else if (act === 'export-json') {
        await window.QPlanState.exportPlanJSON(window.QPlanState.getActivePlan());
        showToast('Archivo JSON exportado para compartir.');
      } else if (act === 'merge-json-btn') {
        const fi = document.getElementById('collab-merge-file-input');
        if (fi) fi.click();
      }
    });

    document.getElementById('collab-modal-body').addEventListener('change', (e) => {
      if (e.target && e.target.id === 'collab-merge-file-input') {
        const file = e.target.files[0];
        if (!file) return;
        window.QPlanState.mergeFromJSONFile(file, (err, res) => {
          e.target.value = '';
          if (err) {
            showToast('Error al fusionar: ' + err.message, 4500);
          } else {
            const s = res.stats;
            renderCollabModalBody();
            renderCurrentStage();
            showToast(`Fusión completada (+${s.foda} FODA, +${s.causas} causas, +${s.indicadores} ind., +${s.actividades} act.)`, 4500);
          }
        });
      }
    });
  }

  function registerServiceWorker() {
    if ('serviceWorker' in navigator && window.location.protocol.startsWith('http')) {
      navigator.serviceWorker.register('./sw.js').catch(() => {});
    }
  }

  function checkUrlRoomInvite() {
    try {
      const params = new URLSearchParams(window.location.search);
      const sala = params.get('sala');
      if (sala) {
        openModal('collab-modal');
        const input = document.getElementById('collab-join-code');
        if (input) input.value = sala.toUpperCase();
        showToast(`Invitación detectada para Sala #${sala.toUpperCase()}. Pulsa "Unirse a Sala".`, 4500);
      }
    } catch (_e) {}
  }

  document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    window.QPlanState.init();

    window.QPlanCollab.init({
      onRemoteStateChange: (note) => {
        renderCurrentStagePreservingFocus();
        if (!document.getElementById('collab-modal').hidden) {
          renderCollabModalBody();
        }
        if (note) showToast(note, 2600);
      },
      onStatusChange: (status) => {
        updateCollabHeaderBadge(status);
        if (!document.getElementById('collab-modal').hidden) {
          renderCollabModalBody();
        }
      }
    });

    bindGlobalEvents();
    renderCurrentStage();
    updateCollabHeaderBadge(window.QPlanCollab.getStatus());
    registerServiceWorker();
    checkUrlRoomInvite();
  });
})();

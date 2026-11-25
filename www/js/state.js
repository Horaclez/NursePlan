(function () {
  const STORAGE_KEY = 'qplan_store_v1';
  const THEME_KEY = 'qplan_theme_v1';
  const PROFILE_KEY = 'qplan_collab_profile_v1';

  let store = {
    activePlanId: null,
    plans: []
  };

  function generateId(prefix) {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;
  }

  function createBlankPlan(title, unit) {
    return {
      id: generateId('plan'),
      title: title || 'Nuevo Plan de Mejora Continua',
      unit: unit || 'Servicio / Unidad Clínica',
      facilityType: 'Hospital / Establecimiento Asistencial',
      qualityDomain: 'Seguridad del Paciente y Calidad Asistencial',
      leader: '',
      team: '',
      startDate: new Date().toISOString().slice(0, 10),
      horizonWeeks: 12,
      updatedAt: new Date().toISOString(),
      foda: { F: [], O: [], D: [], A: [] },
      abordabilidad: {},
      priorizacion: {
        criterios: [
          { id: 'c_1', nombre: 'Magnitud / Frecuencia', peso: 1 },
          { id: 'c_2', nombre: 'Gravedad / Riesgo Clínico', peso: 1 },
          { id: 'c_3', nombre: 'Factibilidad de Intervención', peso: 1 },
          { id: 'c_4', nombre: 'Costo-Beneficio', peso: 1 }
        ],
        scores: {},
        manualWinnerId: '',
        teamVotes: {}
      },
      delimitacion: {
        problemId: '',
        que: '',
        como: '',
        donde: '',
        cuando: '',
        cuantoValor: '',
        cuantoUnidad: '',
        cuantoNumerador: '',
        cuantoDenominador: '',
        cuantoFactor: 100,
        metaValor: ''
      },
      causas: {
        tool: 'ishikawa',
        ramas: {
          'Método': [],
          'Mano de Obra': [],
          'Materiales': [],
          'Medición': [],
          'Medio Ambiente': [],
          'Maquinaria': []
        },
        arbol: {
          efectos: [],
          causasDirectas: []
        },
        cincoPorques: [
          { id: generateId('pq'), niveles: ['', '', '', '', ''] }
        ],
        priorizadasIds: []
      },
      objetivos: {
        general: '',
        especificos: [],
        fundamentacion: ''
      },
      indicadores: [],
      operativo: {
        actividades: [],
        monitoreo: []
      },
      mediciones: [],
      riesgos: [],
      collabLog: []
    };
  }

  function migratePlan(plan) {
    if (!plan || typeof plan !== 'object') return createBlankPlan();
    plan.facilityType = plan.facilityType || 'Hospital / Establecimiento Asistencial';
    plan.qualityDomain = plan.qualityDomain || 'Seguridad del Paciente y Calidad Asistencial';
    plan.leader = plan.leader || '';
    plan.team = plan.team || '';
    plan.startDate = plan.startDate || new Date().toISOString().slice(0, 10);
    plan.horizonWeeks = Math.max(2, Math.min(52, Number(plan.horizonWeeks) || 12));

    plan.foda = plan.foda || { F: [], O: [], D: [], A: [] };
    ['F', 'O', 'D', 'A'].forEach((k) => {
      if (!Array.isArray(plan.foda[k])) plan.foda[k] = [];
    });

    plan.abordabilidad = plan.abordabilidad || {};
    Object.keys(plan.abordabilidad).forEach((pid) => {
      const ab = plan.abordabilidad[pid];
      if (ab) {
        if (typeof ab.alcance !== 'boolean') ab.alcance = ab.abordable !== false;
        if (typeof ab.recursos !== 'boolean') ab.recursos = ab.abordable !== false;
        if (typeof ab.plazo !== 'boolean') ab.plazo = ab.abordable !== false;
        if (typeof ab.justificacion !== 'string') ab.justificacion = '';
      }
    });

    plan.priorizacion = plan.priorizacion || { criterios: [], scores: {}, manualWinnerId: '', teamVotes: {} };
    if (!Array.isArray(plan.priorizacion.criterios)) plan.priorizacion.criterios = [];
    plan.priorizacion.criterios.forEach((c) => {
      c.peso = Math.max(1, Math.min(3, Number(c.peso) || 1));
    });
    plan.priorizacion.scores = plan.priorizacion.scores || {};
    plan.priorizacion.manualWinnerId = plan.priorizacion.manualWinnerId || '';
    plan.priorizacion.teamVotes = plan.priorizacion.teamVotes || {};

    plan.delimitacion = Object.assign(
      {
        problemId: '',
        que: '',
        como: '',
        donde: '',
        cuando: '',
        cuantoValor: '',
        cuantoUnidad: '',
        cuantoNumerador: '',
        cuantoDenominador: '',
        cuantoFactor: 100,
        metaValor: ''
      },
      plan.delimitacion || {}
    );

    plan.causas = plan.causas || { tool: 'ishikawa', ramas: {}, priorizadasIds: [] };
    plan.causas.tool = plan.causas.tool || 'ishikawa';
    plan.causas.ramas = Object.assign(
      {
        'Método': [],
        'Mano de Obra': [],
        'Materiales': [],
        'Medición': [],
        'Medio Ambiente': [],
        'Maquinaria': []
      },
      plan.causas.ramas || {}
    );
    plan.causas.arbol = plan.causas.arbol || { efectos: [], causasDirectas: [] };
    if (!Array.isArray(plan.causas.arbol.efectos)) plan.causas.arbol.efectos = [];
    if (!Array.isArray(plan.causas.arbol.causasDirectas)) plan.causas.arbol.causasDirectas = [];
    plan.causas.arbol.causasDirectas.forEach((cd) => {
      if (!Array.isArray(cd.indirectas)) cd.indirectas = [];
    });
    if (!Array.isArray(plan.causas.cincoPorques) || plan.causas.cincoPorques.length === 0) {
      plan.causas.cincoPorques = [{ id: generateId('pq'), niveles: ['', '', '', '', ''] }];
    }
    if (!Array.isArray(plan.causas.priorizadasIds)) plan.causas.priorizadasIds = [];

    plan.objetivos = Object.assign(
      { general: '', especificos: [], fundamentacion: '' },
      plan.objetivos || {}
    );
    if (!Array.isArray(plan.objetivos.especificos)) plan.objetivos.especificos = [];

    if (!Array.isArray(plan.indicadores)) plan.indicadores = [];
    plan.indicadores.forEach((ind) => {
      ind.tipo = ind.tipo || 'Proceso';
      ind.periodicidad = ind.periodicidad || 'Semanal';
      ind.umbralCritico = ind.umbralCritico || '';
    });

    plan.operativo = Object.assign({ actividades: [], monitoreo: [] }, plan.operativo || {});
    if (!Array.isArray(plan.operativo.actividades)) plan.operativo.actividades = [];
    plan.operativo.actividades.forEach((act) => {
      act.pdca = act.pdca || 'H';
      act.estado = act.estado || 'Pendiente';
      if (!Array.isArray(act.semanas)) act.semanas = [];
    });
    if (!Array.isArray(plan.operativo.monitoreo)) plan.operativo.monitoreo = [];

    if (!Array.isArray(plan.mediciones)) plan.mediciones = [];
    if (!Array.isArray(plan.riesgos)) plan.riesgos = [];
    if (!Array.isArray(plan.collabLog)) plan.collabLog = [];

    return plan;
  }

  function save(skipTimestamp) {
    const active = getActivePlan();
    if (active && !skipTimestamp) {
      active.updatedAt = new Date().toISOString();
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
    } catch (err) {
      console.error('Error guardando en localStorage:', err);
    }
  }

  function init() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && Array.isArray(parsed.plans) && parsed.plans.length > 0) {
          parsed.plans = parsed.plans.map(migratePlan);
          store = parsed;
          return;
        }
      }
    } catch (err) {
      console.warn('Almacenamiento previo inválido, cargando caso modelo.', err);
    }
    const sample = migratePlan(window.QPlanSample.createSamplePlan('caidas'));
    store = { activePlanId: sample.id, plans: [sample] };
    save();
  }

  function getAllPlans() {
    return store.plans;
  }

  function getActivePlan() {
    const found = store.plans.find((p) => p.id === store.activePlanId) || store.plans[0];
    return migratePlan(found);
  }

  function setActivePlan(id) {
    if (store.plans.some((p) => p.id === id)) {
      store.activePlanId = id;
      save(true);
    }
  }

  function replaceActivePlanData(incomingPlan) {
    const idx = store.plans.findIndex((p) => p.id === store.activePlanId);
    const migrated = migratePlan(JSON.parse(JSON.stringify(incomingPlan)));
    if (idx >= 0) {
      migrated.id = store.plans[idx].id;
      store.plans[idx] = migrated;
    } else {
      store.plans.unshift(migrated);
      store.activePlanId = migrated.id;
    }
    save(true);
    return migrated;
  }

  function createNewPlan(title, unit) {
    const plan = createBlankPlan(title, unit);
    store.plans.unshift(plan);
    store.activePlanId = plan.id;
    save();
    return plan;
  }

  function duplicateActivePlan() {
    const current = getActivePlan();
    if (!current) return null;
    const copy = migratePlan(JSON.parse(JSON.stringify(current)));
    copy.id = generateId('plan');
    copy.title = `${current.title} (Copia)`;
    copy.updatedAt = new Date().toISOString();
    store.plans.unshift(copy);
    store.activePlanId = copy.id;
    save();
    return copy;
  }

  function deletePlan(id) {
    if (store.plans.length <= 1) return false;
    store.plans = store.plans.filter((p) => p.id !== id);
    if (store.activePlanId === id) {
      store.activePlanId = store.plans[0].id;
    }
    save();
    return true;
  }

  function loadSamplePlan(templateId) {
    const sample = migratePlan(window.QPlanSample.createSamplePlan(templateId || 'caidas'));
    sample.id = generateId('plan_modelo');
    store.plans.unshift(sample);
    store.activePlanId = sample.id;
    save();
    return sample;
  }

  function mergeArrayById(targetArr, incomingArr, onNewItem) {
    const map = new Map();
    (targetArr || []).forEach((item) => {
      if (item && item.id) map.set(item.id, item);
    });
    let added = 0;
    (incomingArr || []).forEach((item) => {
      if (!item || !item.id) return;
      if (!map.has(item.id)) {
        map.set(item.id, JSON.parse(JSON.stringify(item)));
        added++;
        if (onNewItem) onNewItem(item);
      } else {
        const existing = map.get(item.id);
        Object.keys(item).forEach((k) => {
          if ((existing[k] === '' || existing[k] === null || existing[k] === undefined) && item[k]) {
            existing[k] = item[k];
          }
        });
      }
    });
    return { merged: Array.from(map.values()), added };
  }

  function mergePlanData(basePlan, incomingRaw) {
    const base = migratePlan(JSON.parse(JSON.stringify(basePlan)));
    const inc = migratePlan(JSON.parse(JSON.stringify(incomingRaw)));
    const stats = { foda: 0, causas: 0, objetivos: 0, indicadores: 0, actividades: 0, mediciones: 0, riesgos: 0 };

    ['leader', 'team', 'facilityType', 'qualityDomain'].forEach((k) => {
      if (!base[k] && inc[k]) base[k] = inc[k];
    });

    ['F', 'O', 'D', 'A'].forEach((q) => {
      const res = mergeArrayById(base.foda[q], inc.foda[q]);
      base.foda[q] = res.merged;
      stats.foda += res.added;
    });

    Object.entries(inc.abordabilidad || {}).forEach(([pid, ab]) => {
      if (!base.abordabilidad[pid]) {
        base.abordabilidad[pid] = ab;
      } else if (!base.abordabilidad[pid].justificacion && ab.justificacion) {
        base.abordabilidad[pid].justificacion = ab.justificacion;
      }
    });

    const critRes = mergeArrayById(base.priorizacion.criterios, inc.priorizacion.criterios);
    base.priorizacion.criterios = critRes.merged;
    Object.entries(inc.priorizacion.scores || {}).forEach(([pid, cMap]) => {
      if (!base.priorizacion.scores[pid]) base.priorizacion.scores[pid] = {};
      Object.entries(cMap || {}).forEach(([cid, val]) => {
        if (!base.priorizacion.scores[pid][cid] && val) {
          base.priorizacion.scores[pid][cid] = val;
        }
      });
    });
    Object.entries(inc.priorizacion.teamVotes || {}).forEach(([voterKey, vData]) => {
      base.priorizacion.teamVotes[voterKey] = vData;
    });

    Object.keys(base.delimitacion).forEach((k) => {
      if ((base.delimitacion[k] === '' || base.delimitacion[k] === null) && inc.delimitacion[k] !== '' && inc.delimitacion[k] !== null) {
        base.delimitacion[k] = inc.delimitacion[k];
      }
    });

    Object.keys(inc.causas.ramas || {}).forEach((cat) => {
      if (!base.causas.ramas[cat]) base.causas.ramas[cat] = [];
      const r = mergeArrayById(base.causas.ramas[cat], inc.causas.ramas[cat]);
      base.causas.ramas[cat] = r.merged;
      stats.causas += r.added;
    });
    const efRes = mergeArrayById(base.causas.arbol.efectos, inc.causas.arbol.efectos);
    base.causas.arbol.efectos = efRes.merged;
    const cdRes = mergeArrayById(base.causas.arbol.causasDirectas, inc.causas.arbol.causasDirectas);
    base.causas.arbol.causasDirectas = cdRes.merged;
    stats.causas += cdRes.added;

    const pqRes = mergeArrayById(base.causas.cincoPorques, inc.causas.cincoPorques);
    base.causas.cincoPorques = pqRes.merged;

    const prioSet = new Set(base.causas.priorizadasIds || []);
    (inc.causas.priorizadasIds || []).forEach((cid) => {
      if (prioSet.size < 3) prioSet.add(cid);
    });
    base.causas.priorizadasIds = Array.from(prioSet);

    if (!base.objetivos.general && inc.objetivos.general) base.objetivos.general = inc.objetivos.general;
    if (!base.objetivos.fundamentacion && inc.objetivos.fundamentacion) base.objetivos.fundamentacion = inc.objetivos.fundamentacion;
    const oeRes = mergeArrayById(base.objetivos.especificos, inc.objetivos.especificos);
    base.objetivos.especificos = oeRes.merged.slice(0, 3);
    stats.objetivos += oeRes.added;

    const indRes = mergeArrayById(base.indicadores, inc.indicadores);
    base.indicadores = indRes.merged;
    stats.indicadores += indRes.added;

    const actRes = mergeArrayById(base.operativo.actividades, inc.operativo.actividades);
    base.operativo.actividades = actRes.merged;
    stats.actividades += actRes.added;

    const monRes = mergeArrayById(base.operativo.monitoreo, inc.operativo.monitoreo);
    base.operativo.monitoreo = monRes.merged;

    const medRes = mergeArrayById(base.mediciones, inc.mediciones);
    base.mediciones = medRes.merged;
    stats.mediciones += medRes.added;

    const rskRes = mergeArrayById(base.riesgos, inc.riesgos);
    base.riesgos = rskRes.merged;
    stats.riesgos += rskRes.added;

    const logRes = mergeArrayById(base.collabLog, inc.collabLog);
    base.collabLog = logRes.merged.slice(-80);

    return { mergedPlan: base, stats };
  }

  function getFodaProblems(plan) {
    const debilidades = (plan.foda.D || []).map((item) => ({
      id: item.id,
      text: item.text,
      origin: 'Debilidad'
    }));
    const amenazas = (plan.foda.A || []).map((item) => ({
      id: item.id,
      text: item.text,
      origin: 'Amenaza'
    }));
    return [...debilidades, ...amenazas];
  }

  function getAbordableProblems(plan) {
    return getFodaProblems(plan).filter((prob) => {
      const entry = plan.abordabilidad[prob.id];
      return entry ? entry.abordable === true : true;
    });
  }

  function getNonAbordableProblems(plan) {
    return getFodaProblems(plan)
      .filter((prob) => {
        const entry = plan.abordabilidad[prob.id];
        return entry && entry.abordable === false;
      })
      .map((prob) => ({
        ...prob,
        justificacion: (plan.abordabilidad[prob.id] || {}).justificacion || ''
      }));
  }

  function getPrioritizationRanking(plan) {
    const abordables = getAbordableProblems(plan);
    const criterios = plan.priorizacion.criterios || [];
    const scoresMap = plan.priorizacion.scores || {};
    const maxWeighted = criterios.reduce((acc, c) => acc + 6 * (Number(c.peso) || 1), 0);

    const ranked = abordables.map((prob) => {
      const pScores = scoresMap[prob.id] || {};
      let rawTotal = 0;
      let weightedTotal = 0;
      let count = 0;
      criterios.forEach((c) => {
        const val = Number(pScores[c.id]) || 0;
        const peso = Number(c.peso) || 1;
        rawTotal += val;
        weightedTotal += val * peso;
        if (val > 0) count += 1;
      });
      const avg = criterios.length > 0 ? (rawTotal / criterios.length).toFixed(2) : '0.00';
      return { ...prob, total: weightedTotal, rawTotal, maxWeighted, avg, ratedCount: count };
    });

    ranked.sort((a, b) => b.total - a.total || b.rawTotal - a.rawTotal);

    const topScore = ranked.length > 0 ? ranked[0].total : 0;
    const tiedProblems = topScore > 0 ? ranked.filter((r) => r.total === topScore) : [];
    const hasTie = tiedProblems.length > 1;

    if (hasTie && plan.priorizacion.manualWinnerId) {
      const manualIdx = ranked.findIndex((r) => r.id === plan.priorizacion.manualWinnerId && r.total === topScore);
      if (manualIdx > 0) {
        const [chosen] = ranked.splice(manualIdx, 1);
        ranked.unshift(chosen);
      }
    }

    const winner = ranked.length > 0 && ranked[0].total > 0 ? ranked[0] : null;
    if (winner && plan.delimitacion) {
      plan.delimitacion.problemId = winner.id;
    }
    return { ranking: ranked, winner, hasTie, tiedProblems };
  }

  function formatWeeksRange(semanas) {
    const sorted = Array.from(new Set((semanas || []).map(Number).filter((n) => n > 0))).sort((a, b) => a - b);
    if (sorted.length === 0) return '';
    const ranges = [];
    let start = sorted[0];
    let prev = sorted[0];
    for (let i = 1; i < sorted.length; i++) {
      if (sorted[i] === prev + 1) {
        prev = sorted[i];
      } else {
        ranges.push(start === prev ? `S${start}` : `S${start}–S${prev}`);
        start = prev = sorted[i];
      }
    }
    ranges.push(start === prev ? `S${start}` : `S${start}–S${prev}`);
    return ranges.length === 1 && ranges[0].includes('–')
      ? `Semanas ${ranges[0].replace(/S/g, '').replace('–', ' a ')}`
      : `Semanas ${ranges.join(', ')}`;
  }

  async function exportPlanJSON(plan) {
    const filename = `QPLAN_${plan.title.replace(/[^a-z0-9]/gi, '_').slice(0, 32)}.json`;
    const jsonString = JSON.stringify(plan, null, 2);

    if (window.electronAPI && typeof window.electronAPI.saveFile === 'function') {
      await window.electronAPI.saveFile(filename, jsonString);
      return;
    }

    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function exportPlanWord(plan, reportHtmlContent) {
    const filename = `QPLAN_Informe_${plan.title.replace(/[^a-z0-9]/gi, '_').slice(0, 32)}.doc`;
    const docHtml = `﻿<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
<head><meta charset="utf-8"><title>${plan.title}</title>
<style>
body { font-family: Calibri, Arial, sans-serif; font-size: 11pt; color: #111827; }
h1 { color: #0f766e; font-size: 16pt; border-bottom: 2px solid #0f766e; padding-bottom: 4pt; }
h2 { color: #0f766e; font-size: 13pt; margin-top: 14pt; border-bottom: 1px solid #cbd5e1; }
h3 { font-size: 11pt; color: #1e293b; }
table { width: 100%; border-collapse: collapse; margin-top: 6pt; margin-bottom: 10pt; font-size: 9.5pt; }
th, td { border: 1px solid #94a3b8; padding: 5pt; text-align: left; vertical-align: top; }
th { background-color: #f1f5f9; font-weight: bold; }
</style></head><body>${reportHtmlContent}</body></html>`;
    const blob = new Blob([docHtml], { type: 'application/msword' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  }

  function importPlanJSON(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || !parsed.foda || !parsed.title) {
          throw new Error('Estructura JSON incompatible con Q-PLAN.');
        }
        const migrated = migratePlan(parsed);
        migrated.id = generateId('plan_imp');
        migrated.updatedAt = new Date().toISOString();
        store.plans.unshift(migrated);
        store.activePlanId = migrated.id;
        save();
        callback(null, migrated);
      } catch (err) {
        callback(err, null);
      }
    };
    reader.readAsText(file);
  }

  function mergeFromJSONFile(file, callback) {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const parsed = JSON.parse(e.target.result);
        if (!parsed || !parsed.foda) {
          throw new Error('El archivo no contiene una estructura Q-PLAN válida.');
        }
        const current = getActivePlan();
        const { mergedPlan, stats } = mergePlanData(current, parsed);
        replaceActivePlanData(mergedPlan);
        save();
        callback(null, { mergedPlan, stats });
      } catch (err) {
        callback(err, null);
      }
    };
    reader.readAsText(file);
  }

  window.QPlanState = {
    THEME_KEY,
    PROFILE_KEY,
    generateId,
    migratePlan,
    init,
    save,
    getAllPlans,
    getActivePlan,
    setActivePlan,
    replaceActivePlanData,
    createNewPlan,
    duplicateActivePlan,
    deletePlan,
    loadSamplePlan,
    mergePlanData,
    mergeFromJSONFile,
    getFodaProblems,
    getAbordableProblems,
    getNonAbordableProblems,
    getPrioritizationRanking,
    formatWeeksRange,
    exportPlanJSON,
    exportPlanWord,
    importPlanJSON
  };
})();

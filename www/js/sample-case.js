(function () {
  const TEMPLATES = [
    {
      id: 'caidas',
      label: '1. Prevención de Caídas Intrahospitalarias (Medicina Interna)',
      domain: 'Seguridad del Paciente — Hospital'
    },
    {
      id: 'iaas',
      label: '2. Prevención de IAAS: Higiene de Manos y Bundle CVC (UPC/UCI)',
      domain: 'Prevención IAAS — Hospital'
    },
    {
      id: 'pscv',
      label: '3. Compensación HTA/DM2 en Programa Cardiovascular PSCV (CESFAM)',
      domain: 'Atención Primaria (APS) — HEARTS'
    },
    {
      id: 'lpp',
      label: '4. Prevención de Lesiones por Presión (LPP) en Pacientes Postrados',
      domain: 'Cuidados de Enfermería — Hospital/Domicilio'
    },
    {
      id: 'medicamentos',
      label: '5. Seguridad en Medicamentos de Alto Riesgo (Los 10 Correctos)',
      domain: 'Farmacovigilancia — Seguridad Clínica'
    }
  ];

  function createCaidasPlan() {
    return {
      id: 'plan_modelo_caidas_01',
      title: 'Prevención de Caídas Intrahospitalarias en Medicina Interna',
      unit: 'Servicio de Medicina Interna — Hospital Base',
      facilityType: 'Hospital de Alta Complejidad',
      qualityDomain: 'Seguridad del Paciente — Prevención de Caídas',
      leader: 'Enf. Supervisora Servicio de Medicina Interna',
      team: 'Referente de Calidad, Enfermeras Clínicas y TENS de turno',
      startDate: new Date().toISOString().slice(0, 10),
      horizonWeeks: 12,
      updatedAt: new Date().toISOString(),
      foda: {
        F: [
          { id: 'f_1', text: 'Equipo de enfermería con alta adherencia a protocolos de seguridad clínica.' },
          { id: 'f_2', text: 'Disponibilidad de escala de valoración de riesgo de caídas (Downton) en ficha clínica electrónica.' },
          { id: 'f_3', text: 'Liderazgo participativo de enfermería supervisora y referentes de calidad.' }
        ],
        O: [
          { id: 'o_1', text: 'Programa institucional anual de acreditación en calidad y seguridad del paciente (MINSAL).' },
          { id: 'o_2', text: 'Apoyo de unidad de capacitación continua para talleres breves en turno.' }
        ],
        D: [
          { id: 'd_1', text: 'Incumplimiento en la reevaluación periódica del riesgo de caídas (Escala Downton) tras cambios clínicos y ausencia de señalética visible en cabecera.' },
          { id: 'd_2', text: 'Registro incompleto de educación preventiva entregada al paciente y familia al ingreso.' },
          { id: 'd_3', text: 'Falta de estandarización en la entrega de turno respecto a pacientes con alto riesgo de caída.' },
          { id: 'd_4', text: 'Déficit de timbres de llamado inalámbricos en salas de aislamiento.' }
        ],
        A: [
          { id: 'a_1', text: 'Aumento progresivo de hospitalización de adultos mayores con polifarmacia y deterioro cognitivo.' },
          { id: 'a_2', text: 'Restricción presupuestaria central para remodelación estructural de baños hospitalarios.' }
        ]
      },
      abordabilidad: {
        d_1: { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: 'Gobernable directamente mediante flujograma local, capacitación y discos de alerta en cabecera.' },
        d_2: { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: 'Intervenible mediante registro estructurado en ficha clínica.' },
        d_3: { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: 'Estandarizable en pauta de entrega de turno de enfermería.' },
        d_4: { abordable: false, alcance: false, recursos: false, plazo: false, justificacion: 'Requiere licitación pública y compra centralizada de equipamiento eléctrico por Subdirección Administrativa.' },
        a_1: { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: 'Abordable mediante vigilancia activa y estratificación clínica de riesgo.' },
        a_2: { abordable: false, alcance: false, recursos: false, plazo: false, justificacion: 'Depende de presupuesto de inversión en infraestructura hospitalaria fuera del alcance del servicio.' }
      },
      priorizacion: {
        criterios: [
          { id: 'c_1', nombre: 'Magnitud / Frecuencia', peso: 2 },
          { id: 'c_2', nombre: 'Gravedad / Riesgo Clínico', peso: 2 },
          { id: 'c_3', nombre: 'Factibilidad de Intervención', peso: 1 },
          { id: 'c_4', nombre: 'Costo-Beneficio', peso: 1 }
        ],
        scores: {
          d_1: { c_1: 6, c_2: 6, c_3: 6, c_4: 6 },
          d_2: { c_1: 5, c_2: 4, c_3: 5, c_4: 5 },
          d_3: { c_1: 5, c_2: 5, c_3: 5, c_4: 4 },
          a_1: { c_1: 5, c_2: 5, c_3: 2, c_4: 3 }
        },
        manualWinnerId: '',
        teamVotes: {}
      },
      delimitacion: {
        problemId: 'd_1',
        que: 'Omisión de la reevaluación sistemática del riesgo de caídas (Escala Downton) ante cambios de estado clínico o fármacos sedantes, sumada a la falta de identificación visual inmediata en la unidad del paciente.',
        como: 'Se evidencia mediante auditoría de fichas clínicas sin reevaluación a las 48 h o post-cambio de terapia (62 % de omisión), y camas de pacientes de alto riesgo sin disco identificador en cabecera.',
        donde: 'Salas de hospitalización adulto (camas 1 a 36) del Servicio de Medicina Interna.',
        cuando: 'Trimestre julio - septiembre del año en curso (turnos diurno y nocturno).',
        cuantoValor: 4.8,
        cuantoUnidad: 'caídas por cada 1.000 días-cama ocupados',
        cuantoNumerador: 18,
        cuantoDenominador: 3750,
        cuantoFactor: 1000,
        metaValor: 2.0
      },
      causas: {
        tool: 'ishikawa',
        ramas: {
          'Método': [
            { id: 'cr_1', text: 'No existe pauta operativa local que defina cuándo reevaluar Downton más allá del ingreso.' },
            { id: 'cr_2', text: 'Falta de checklist de verificación visual de medidas de prevención en entrega de turno.' }
          ],
          'Mano de Obra': [
            { id: 'cr_3', text: 'Desconocimiento del personal nuevo sobre criterios de reevaluación ante ajuste de psicofármacos.' }
          ],
          'Materiales': [
            { id: 'cr_4', text: 'Insuficiencia de discos magnéticos de señalética de riesgo en cabeceras de cama.' }
          ],
          'Medición': [
            { id: 'cr_5', text: 'Ausencia de monitoreo semanal de adherencia a la reevaluación antes de que ocurra el evento.' }
          ],
          'Medio Ambiente': [
            { id: 'cr_6', text: 'Iluminación nocturna deficiente en pasillos hacia servicios higiénicos.' }
          ],
          'Maquinaria': []
        },
        arbol: {
          efectos: [
            { id: 'ef_1', text: 'Lesiones traumáticas y fracturas en pacientes hospitalizados.' },
            { id: 'ef_2', text: 'Prolongación de estadía hospitalaria y costos asociados.' },
            { id: 'ef_3', text: 'Incumplimiento de estándar de acreditación en seguridad del paciente.' }
          ],
          causasDirectas: [
            {
              id: 'cd_1',
              text: 'Ausencia de flujograma operativo de reevaluación periódica de Escala Downton.',
              indirectas: [{ id: 'ci_1', text: 'Protocolo institucional general no bajado a pauta de turno.' }]
            },
            {
              id: 'cd_2',
              text: 'Brecha de capacitación en personal clínico de reciente incorporación.',
              indirectas: [{ id: 'ci_2', text: 'Inducción clínica sin módulo práctico de prevención de caídas.' }]
            },
            {
              id: 'cd_3',
              text: 'Falta de señalética visual estandarizada en cabeceras de cama.',
              indirectas: []
            }
          ]
        },
        cincoPorques: [
          {
            id: 'pq_1',
            niveles: [
              'No se reevalúa el riesgo de caída tras administrar sedantes.',
              'El equipo asume que la evaluación de ingreso basta para toda la estadía.',
              'No existe un flujograma operativo local con gatillos claros de reevaluación.'
            ]
          },
          {
            id: 'pq_2',
            niveles: [
              'Personal nuevo omite medidas de contención ambiental en turnos volantes.',
              'Desconoce criterios de alerta de Escala Downton >= 3 puntos.',
              'No existe cápsula de capacitación breve y evaluada en inducción de turno.'
            ]
          },
          {
            id: 'pq_3',
            niveles: [
              'TENS y médicos no identifican rápidamente al paciente de alto riesgo al entrar a sala.',
              'No hay indicador visual visible en la cabecera de la cama.',
              'Stock insuficiente de discos magnéticos lavables en el servicio.'
            ]
          }
        ],
        priorizadasIds: ['cr_1', 'cr_3', 'cr_4']
      },
      objetivos: {
        general: 'Disminuir la tasa de caídas intrahospitalarias en el Servicio de Medicina Interna desde 4.8 a menos de 2.0 caídas por cada 1.000 días-cama ocupados en un plazo de 12 semanas.',
        especificos: [
          {
            id: 'oe_1',
            causaId: 'cr_1',
            texto: 'Estandarizar en un 100 % la reevaluación protocolizada del riesgo de caídas ante cambios clínicos o farmacológicos en las 36 camas del servicio durante las primeras 4 semanas.',
            plazoSemanas: 4
          },
          {
            id: 'oe_2',
            causaId: 'cr_3',
            texto: 'Capacitar al menos al 90 % del personal de enfermería y TENS en criterios de reevaluación y medidas preventivas de caídas en un plazo de 6 semanas.',
            plazoSemanas: 6
          },
          {
            id: 'oe_3',
            causaId: 'cr_4',
            texto: 'Implementar señalética visual estandarizada de alto riesgo en el 100 % de las unidades de pacientes clasificados con Downton >= 3 puntos en un periodo de 8 semanas.',
            plazoSemanas: 8
          }
        ],
        fundamentacion: 'La prevención efectiva de caídas requiere vigilancia dinámica del riesgo clínico y barreras visuales inmediatas para todo el equipo asistencial. Apalancando la alta adherencia del equipo de enfermería y el respaldo del programa institucional de acreditación (FODA), intervenir simultáneamente la estandarización del flujo de reevaluación, la competencia del equipo de turno y la señalética en cabecera rompe la cadena de omisiones identificada.'
      },
      indicadores: [
        {
          id: 'ind_1',
          oeId: 'oe_1',
          tipo: 'Proceso',
          nombre: 'Porcentaje de adherencia a reevaluación oportuna de Escala Downton',
          formula: '(N° de fichas auditadas con reevaluación oportuna / Total de fichas auditadas con criterio de reevaluación) × 100',
          lineaBase: '38',
          meta: '95',
          periodicidad: 'Semanal',
          umbralCritico: '85',
          fuente: 'Pauta de auditoría semanal de ficha clínica electrónica'
        },
        {
          id: 'ind_2',
          oeId: 'oe_2',
          tipo: 'Proceso',
          nombre: 'Cobertura de capacitación y aprobación en prevención de caídas',
          formula: '(N° de enfermeros y TENS capacitados con evaluación aprobada / Dotación total del servicio) × 100',
          lineaBase: '42',
          meta: '90',
          periodicidad: 'Quincenal',
          umbralCritico: '80',
          fuente: 'Registro de asistencia y test breve de salida'
        },
        {
          id: 'ind_3',
          oeId: 'oe_3',
          tipo: 'Estructura',
          nombre: 'Cobertura de señalética preventiva visible en cabecera de alto riesgo',
          formula: '(N° de pacientes con Downton >= 3 con disco visual instalado / Total de pacientes con Downton >= 3) × 100',
          lineaBase: '30',
          meta: '100',
          periodicidad: 'Bisemanal',
          umbralCritico: '95',
          fuente: 'Ronda de observación directa de enfermería'
        }
      ],
      operativo: {
        actividades: [
          {
            id: 'act_1',
            oeId: 'oe_1',
            pdca: 'P',
            estado: 'Completada',
            que: 'Actualizar el flujograma local de reevaluación de riesgo de caídas (ingreso, 48 h, post-sedación y post-caída).',
            quien: 'Enfermera Encargada de Calidad del Servicio',
            cuandoTexto: 'Semanas 1 a 2',
            semanas: [1, 2],
            donde: 'Oficina de Supervisión de Medicina Interna',
            recursos: 'Computador, normativa institucional vigente, impresora',
            verificacion: 'Flujograma aprobado y firmado en carpeta de protocolos'
          },
          {
            id: 'act_2',
            oeId: 'oe_1',
            pdca: 'H',
            estado: 'En curso',
            que: 'Incorporar ítem de verificación de Downton en la pauta de entrega de turno de enfermería.',
            quien: 'Enfermeras Clínicas referentes de turno',
            cuandoTexto: 'Semanas 3 a 4',
            semanas: [3, 4],
            donde: 'Estación de Enfermería Medicina Interna',
            recursos: 'Planilla digital de entrega de turno',
            verificacion: 'Registro diario de entrega de turno actualizado'
          },
          {
            id: 'act_3',
            oeId: 'oe_2',
            pdca: 'H',
            estado: 'Pendiente',
            que: 'Realizar cápsulas educativas presenciales de 15 minutos en los 4 turnos sobre reevaluación y medidas preventivas.',
            quien: 'Enfermera Supervisora y Referente de Calidad',
            cuandoTexto: 'Semanas 3 a 6',
            semanas: [3, 4, 5, 6],
            donde: 'Sala de reuniones Medicina Interna',
            recursos: 'Presentación visual, casos clínicos breves, lista de asistencia',
            verificacion: 'Planilla de asistencia firmada y resultados de evaluación rápida'
          },
          {
            id: 'act_4',
            oeId: 'oe_3',
            pdca: 'H',
            estado: 'Pendiente',
            que: 'Gestionar e instalar discos magnéticos de alerta de riesgo de caída en las 36 cabeceras de cama.',
            quien: 'Enfermera Supervisora y Técnico Paramédico de insumos',
            cuandoTexto: 'Semanas 5 a 8',
            semanas: [5, 6, 7, 8],
            donde: 'Salas de hospitalización (camas 1 a 36)',
            recursos: '40 discos magnéticos lavables de alto contraste',
            verificacion: 'Inventario instalado y lista de chequeo por sala'
          },
          {
            id: 'act_5',
            oeId: 'oe_1',
            pdca: 'V',
            estado: 'Pendiente',
            que: 'Ejecutar auditoría semanal de fichas clínicas y retroalimentar resultados en reunión de turno.',
            quien: 'Enfermera Referente de Calidad',
            cuandoTexto: 'Semanas 2 a 4',
            semanas: [2, 3, 4],
            donde: 'Estación de Enfermería Medicina Interna',
            recursos: 'Pauta de auditoría estructurada y planilla de registro',
            verificacion: 'Informe semanal de adherencia firmado'
          }
        ],
        monitoreo: [
          {
            id: 'mon_1',
            indicadorId: 'ind_1',
            metodo: 'Muestreo aleatorio de 15 fichas clínicas de pacientes hospitalizados > 48 h',
            frecuencia: 'Semanal (cada viernes)',
            supervisor: 'Enfermera Referente de Calidad',
            umbralCorrectivo: 'Si adherencia < 85 %, realizar retroalimentación inmediata por turno'
          },
          {
            id: 'mon_2',
            indicadorId: 'ind_2',
            metodo: 'Cruce de nómina de dotación activa versus actas de asistencia y test aprobado',
            frecuencia: 'Quincenal (semanas 4 y 6)',
            supervisor: 'Enfermera Supervisora del Servicio',
            umbralCorrectivo: 'Si cobertura < 80 % en semana 5, programar cápsula extraordinaria en turno'
          },
          {
            id: 'mon_3',
            indicadorId: 'ind_3',
            metodo: 'Ronda visual directa en salas verificando concordancia puntaje Downton vs. disco en cabecera',
            frecuencia: 'Bisemanal (martes y viernes)',
            supervisor: 'Enfermera Clínica de Turno Diurno',
            umbralCorrectivo: 'Si cobertura < 95 %, reposición inmediata y refuerzo en entrega de turno'
          }
        ]
      },
      mediciones: [
        { id: 'med_1', indicadorId: 'ind_1', periodo: 'Semana 1', valor: 46.7, numerador: 7, denominador: 15, nota: 'Medición inicial tras difusión de flujograma' },
        { id: 'med_2', indicadorId: 'ind_1', periodo: 'Semana 2', valor: 66.7, numerador: 10, denominador: 15, nota: 'Mejora en turno diurno; refuerzo pendiente en noche' },
        { id: 'med_3', indicadorId: 'ind_1', periodo: 'Semana 3', valor: 86.7, numerador: 13, denominador: 15, nota: 'Supera umbral crítico tras incorporación en entrega de turno' },
        { id: 'med_4', indicadorId: 'ind_1', periodo: 'Semana 4', valor: 93.3, numerador: 14, denominador: 15, nota: 'Cercano a meta del 95 %' }
      ],
      riesgos: [
        {
          id: 'rsk_1',
          descripcion: 'Alta rotación de personal de reemplazo o turno volante sin inducción en flujograma local.',
          probabilidad: 4,
          impacto: 4,
          mitigacion: 'Dejar infografía plastificada de 1 página en estación de enfermería y realizar inducción exprés de 5 minutos al inicio de turno.',
          responsable: 'Enfermera Clínica de Turno'
        },
        {
          id: 'rsk_2',
          descripcion: 'Extravío o desinfección abrasiva que borra los discos magnéticos de cabecera.',
          probabilidad: 3,
          impacto: 3,
          mitigacion: 'Mantener stock de reserva de 10 discos laminados y asignar revisión en checklist de aseo terminal de unidad.',
          responsable: 'TENS Encargado de Insumos'
        }
      ],
      collabLog: []
    };
  }

  function createIaasPlan() {
    const p = createCaidasPlan();
    p.id = 'plan_modelo_iaas_02';
    p.title = 'Prevención de IAAS: Higiene de Manos y Bundle CVC en UPC';
    p.unit = 'Unidad de Paciente Crítico (UPC Adulto)';
    p.facilityType = 'Hospital de Alta Complejidad';
    p.qualityDomain = 'Prevención y Control de IAAS (MINSAL)';
    p.leader = 'Enf. Coordinadora UPC / Referente IAAS';
    p.team = 'Enfermeras UPC, Médicos Intensivistas, TENS, Comité IAAS';
    p.foda = {
      F: [
        { id: 'f_1', text: 'Dispensadores de alcohol gel instalados en el 100 % de los cupos críticos.' },
        { id: 'f_2', text: 'Vigilancia epidemiológica activa por Comité IAAS institucional.' }
      ],
      O: [
        { id: 'o_1', text: 'Norma Técnica MINSAL de prevención de infecciones asociadas a catéter venoso central.' },
        { id: 'o_2', text: 'Disponibilidad de apósitos transparentes con clorhexidina en arsenal.' }
      ],
      D: [
        { id: 'd_1', text: 'Baja adherencia a los 5 momentos de higiene de manos previo a manipulación de vías centrales (61 %).' },
        { id: 'd_2', text: 'Registro discontinuo de la evaluación diaria de necesidad de retiro de CVC.' },
        { id: 'd_3', text: 'Reposición tardía de insumos de barrera máxima en carros de procedimientos.' }
      ],
      A: [
        { id: 'a_1', text: 'Alta carga asistencial y pacientes con múltiples dispositivos invasivos simultáneos.' },
        { id: 'a_2', text: 'Falta de lavamanos adicionales por restricción estructural de planta física.' }
      ]
    };
    p.abordabilidad = {
      d_1: { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: 'Intervenible con observación directa, retroalimentación inmediata y refuerzo en 5 momentos.' },
      d_2: { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: 'Incorporable en hoja diaria de enfermería UPC.' },
      d_3: { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: 'Estandarizable mediante checklist de reposición por turno.' },
      a_1: { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: 'Mitigable con priorización clínica y pausas de seguridad.' },
      a_2: { abordable: false, alcance: false, recursos: false, plazo: false, justificacion: 'Obra civil mayor dependiente de presupuesto ministerial de infraestructura.' }
    };
    p.priorizacion.scores = {
      d_1: { c_1: 6, c_2: 6, c_3: 6, c_4: 6 },
      d_2: { c_1: 5, c_2: 5, c_3: 5, c_4: 5 },
      d_3: { c_1: 4, c_2: 5, c_3: 5, c_4: 4 },
      a_1: { c_1: 5, c_2: 5, c_3: 3, c_4: 3 }
    };
    p.delimitacion = {
      problemId: 'd_1',
      que: 'Incumplimiento de los 5 momentos de higiene de manos (especialmente momentos 1 y 2 antes de manipular accesos vasculares) y omisión de desinfección activa de conectores sin aguja.',
      como: 'Detectado mediante pauta de observación directa IAAS con 61 % de adherencia global y tasa basal de ITS/CVC por sobre el estándar institucional.',
      donde: 'Cubículos 1 a 16 de la Unidad de Paciente Crítico Adulto.',
      cuando: 'Último trimestre observado en turnos largo y noche.',
      cuantoValor: 61,
      cuantoUnidad: '% de adherencia a higiene de manos',
      cuantoNumerador: 122,
      cuantoDenominador: 200,
      cuantoFactor: 100,
      metaValor: 90
    };
    p.causas.ramas = {
      'Método': [{ id: 'cr_1', text: 'Ausencia de pausa de verificación del bundle de mantención de CVC en entrega de turno.' }],
      'Mano de Obra': [{ id: 'cr_3', text: 'Omisión del lavado/higienización previo a manipular conectores por sensación de urgencia clínica.' }],
      'Materiales': [{ id: 'cr_4', text: 'Falta de toallitas de alcohol al 70 % individuales junto a cada bomba de infusión.' }],
      'Medición': [{ id: 'cr_5', text: 'Retroalimentación tardía (mensual) de resultados de observación directa al equipo.' }],
      'Medio Ambiente': [],
      'Maquinaria': []
    };
    p.causas.priorizadasIds = ['cr_1', 'cr_3', 'cr_4'];
    p.objetivos = {
      general: 'Incrementar la adherencia a higiene de manos y bundle de mantención de CVC en UPC Adulto desde 61 % a al menos 90 % en un plazo de 12 semanas.',
      especificos: [
        { id: 'oe_1', causaId: 'cr_1', texto: 'Implementar en un 100 % el checklist diario de mantención de CVC en los 16 cupos de UPC durante las primeras 4 semanas.', plazoSemanas: 4 },
        { id: 'oe_2', causaId: 'cr_3', texto: 'Capacitar y evaluar al 95 % del equipo clínico de UPC en los 5 momentos OMS y técnica scrub-the-hub en un plazo de 6 semanas.', plazoSemanas: 6 },
        { id: 'oe_3', causaId: 'cr_4', texto: 'Asegurar disponibilidad continua en el 100 % de los cupos de sachets individuales de alcohol al 70 % en un plazo de 4 semanas.', plazoSemanas: 4 }
      ],
      fundamentacion: 'La higiene de manos y la desinfección de conectores constituyen las medidas de mayor impacto costo-efectivo para prevenir bacteriemias asociadas a CVC, apalancando la disponibilidad actual de dispensadores y el respaldo del Comité IAAS.'
    };
    p.indicadores = [
      {
        id: 'ind_1', oeId: 'oe_1', tipo: 'Proceso',
        nombre: 'Adherencia a checklist diario de bundle de mantención CVC',
        formula: '(N° de días-catéter con checklist completo / Total de días-catéter evaluados) × 100',
        lineaBase: '54', meta: '95', periodicidad: 'Semanal', umbralCritico: '85',
        fuente: 'Hoja de enfermería UPC y auditoría IAAS'
      },
      {
        id: 'ind_2', oeId: 'oe_2', tipo: 'Proceso',
        nombre: 'Porcentaje de adherencia observada a higiene de manos (5 momentos)',
        formula: '(N° de oportunidades cumplidas / Total de oportunidades observadas) × 100',
        lineaBase: '61', meta: '90', periodicidad: 'Semanal', umbralCritico: '80',
        fuente: 'Pauta de observación directa IAAS'
      },
      {
        id: 'ind_3', oeId: 'oe_3', tipo: 'Estructura',
        nombre: 'Disponibilidad de sachets de alcohol 70 % en estación de infusión por cupo',
        formula: '(N° de cupos con stock completo en ronda / 16 cupos totales) × 100',
        lineaBase: '45', meta: '100', periodicidad: 'Bisemanal', umbralCritico: '90',
        fuente: 'Lista de chequeo de insumos por turno'
      }
    ];
    p.operativo = {
      actividades: [
        { id: 'act_1', oeId: 'oe_1', pdca: 'P', estado: 'Completada', que: 'Incorporar pauta de evaluación diaria de retiro y curación de CVC en registro clínico UPC.', quien: 'Enf. Coordinadora UPC', cuandoTexto: 'Semanas 1 a 2', semanas: [1, 2], donde: 'UPC Adulto', recursos: 'Planilla clínica electrónica', verificacion: 'Protocolo actualizado' },
        { id: 'act_2', oeId: 'oe_2', pdca: 'H', estado: 'En curso', que: 'Realizar talleres prácticos de 15 min con luz UV y técnica scrub-the-hub en los 4 turnos.', quien: 'Referente IAAS y Enfermeras UPC', cuandoTexto: 'Semanas 2 a 6', semanas: [2, 3, 4, 5, 6], donde: 'Sala reuniones UPC', recursos: 'Lámpara UV, gel trazador, pauta evaluación', verificacion: 'Lista asistencia y pauta aprobada' },
        { id: 'act_3', oeId: 'oe_3', pdca: 'H', estado: 'Completada', que: 'Instalar dispensadores acrílicos con sachets de alcohol 70 % junto a atriles de bombas.', quien: 'Enf. Supervisora y TENS insumos', cuandoTexto: 'Semanas 1 a 4', semanas: [1, 2, 3, 4], donde: 'Cupos 1 a 16 UPC', recursos: '16 dispensadores y stock semanal', verificacion: 'Ronda de verificación de estructura' }
      ],
      monitoreo: [
        { id: 'mon_1', indicadorId: 'ind_2', metodo: 'Observación directa de 30 oportunidades semanales distribuidas en turnos diurno y nocturno', frecuencia: 'Semanal', supervisor: 'Enfermera IAAS', umbralCorrectivo: 'Si adherencia < 80 %, retroalimentación inmediata en entrega de turno' }
      ]
    };
    p.mediciones = [
      { id: 'med_1', indicadorId: 'ind_2', periodo: 'Semana 1', valor: 63.3, numerador: 19, denominador: 30, nota: 'Línea base operativa' },
      { id: 'med_2', indicadorId: 'ind_2', periodo: 'Semana 2', valor: 76.7, numerador: 23, denominador: 30, nota: 'Inicio de talleres con luz UV' },
      { id: 'med_3', indicadorId: 'ind_2', periodo: 'Semana 3', valor: 86.7, numerador: 26, denominador: 30, nota: 'Supera umbral crítico de 80 %' }
    ];
    return p;
  }

  function createPscvPlan() {
    const p = createCaidasPlan();
    p.id = 'plan_modelo_pscv_03';
    p.title = 'Compensación Cardiovascular (HTA / DM2) en PSCV — HEARTS';
    p.unit = 'Sector Azul — CESFAM Atención Primaria';
    p.facilityType = 'CESFAM / Atención Primaria de Salud (APS)';
    p.qualityDomain = 'Programa Salud Cardiovascular (PSCV) / Estrategia HEARTS';
    p.leader = 'Enfermero/a Encargado/a Programa Cardiovascular';
    p.team = 'Médico Sector, Enfermera, Nutricionista, TENS Tarjetero';
    p.foda = {
      F: [
        { id: 'f_1', text: 'Equipo multidisciplinario de sector capacitado en algoritmo estandarizado HEARTS.' },
        { id: 'f_2', text: 'Registro clínico electrónico RAYEN con alertas de vigencia de exámenes y controles.' }
      ],
      O: [
        { id: 'o_1', text: 'Metas sanitarias IAAPS y disponibilidad de fármacos combinados en botiquín CESFAM.' },
        { id: 'o_2', text: 'Articulación con juntas de vecinos para operativos comunitarios de toma de PA.' }
      ],
      D: [
        { id: 'd_1', text: 'Elevada tasa de inasistencia a controles cardiovasculares (28 %) y rescate telefónico tardío de pacientes descompensados.' },
        { id: 'd_2', text: 'Inercia terapéutica en intensificación de tratamiento antihipertensivo en controles de seguimiento.' },
        { id: 'd_3', text: 'Subutilización de automonitoreo domiciliario de presión arterial en pacientes de alto riesgo.' }
      ],
      A: [
        { id: 'a_1', text: 'Barreras laborales y horarias de usuarios activos para asistir en horario diurno tradicional.' },
        { id: 'a_2', text: 'Limitación de cupos de horas médicas de extensión horaria asignadas por nivel central.' }
      ]
    };
    p.abordabilidad = {
      d_1: { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: 'Abordable mediante protocolo semanal de rescate activo y agendamiento protegido.' },
      d_2: { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: 'Intervenible con algoritmo HEARTS visible en box y auditoría de fichas.' },
      d_3: { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: 'Implementable con préstamo rotativo de tensiómetros validados.' },
      a_1: { abordable: true, alcance: true, recursos: true, plazo: true, justificacion: 'Mitigable reservando bloques de control a primera hora (08:00) y recordatorio WhatsApp/llamado.' },
      a_2: { abordable: false, alcance: false, recursos: false, plazo: false, justificacion: 'Dependiente de asignación financiera de horas médicas por Dirección de Salud Municipal.' }
    };
    p.priorizacion.scores = {
      d_1: { c_1: 6, c_2: 6, c_3: 6, c_4: 6 },
      d_2: { c_1: 5, c_2: 6, c_3: 5, c_4: 5 },
      d_3: { c_1: 4, c_2: 4, c_3: 5, c_4: 5 },
      a_1: { c_1: 5, c_2: 4, c_3: 4, c_4: 4 }
    };
    p.delimitacion = {
      problemId: 'd_1',
      que: 'Inasistencia a controles cardiovasculares programados y demora mayor a 30 días en el rescate activo de usuarios hipertensos/diabéticos con PA >= 140/90 mmHg o HbA1c >= 8 %.',
      como: 'Evidenciado en tarjetero electrónico RAYEN con 28 % de inasistencia trimestral y bajo porcentaje de compensación efectiva en corte semestral.',
      donde: 'Sector Azul del CESFAM (población bajo control PSCV: 1.420 usuarios).',
      cuando: 'Último trimestre de seguimiento cardiovascular.',
      cuantoValor: 58,
      cuantoUnidad: '% de usuarios PSCV compensados',
      cuantoNumerador: 824,
      cuantoDenominador: 1420,
      cuantoFactor: 100,
      metaValor: 72
    };
    p.causas.ramas = {
      'Método': [{ id: 'cr_1', text: 'No existe flujo semanal de extracción de nómina de inasistentes en RAYEN para rescate oportuno.' }],
      'Mano de Obra': [{ id: 'cr_3', text: 'Falta de asignación de horas protegidas de TENS/Enfermería para llamado de confirmación 48 h antes.' }],
      'Materiales': [{ id: 'cr_4', text: 'Ausencia de agenda con sobrecupos protegidos semanales para reingresar a pacientes rescatados.' }],
      'Medición': [],
      'Medio Ambiente': [],
      'Maquinaria': []
    };
    p.causas.priorizadasIds = ['cr_1', 'cr_3', 'cr_4'];
    p.objetivos = {
      general: 'Aumentar la proporción de usuarios compensados en el PSCV del Sector Azul desde 58 % a al menos 72 % en un plazo de 12 semanas.',
      especificos: [
        { id: 'oe_1', causaId: 'cr_1', texto: 'Ejecutar en un 100 % el protocolo semanal de identificación y rescate telefónico de inasistentes descompensados durante las primeras 4 semanas.', plazoSemanas: 4 },
        { id: 'oe_2', causaId: 'cr_3', texto: 'Implementar la confirmación telefónica 48 h previas en al menos el 90 % de las citaciones PSCV en un plazo de 6 semanas.', plazoSemanas: 6 },
        { id: 'oe_3', causaId: 'cr_4', texto: 'Habilitar y ocupar al menos el 90 % de 12 cupos semanales protegidos de rescate cardiovascular durante las 12 semanas.', plazoSemanas: 12 }
      ],
      fundamentacion: 'La continuidad del cuidado en APS es determinante para alcanzar metas HEARTS. Apalancando las alertas de RAYEN y el equipo de sector, el rescate activo y los cupos protegidos evitan la pérdida de seguimiento de pacientes de alto riesgo.'
    };
    p.indicadores = [
      { id: 'ind_1', oeId: 'oe_1', tipo: 'Proceso', nombre: 'Porcentaje de inasistentes descompensados contactados en < 7 días', formula: '(N° de inasistentes descompensados contactados / Total inasistentes descompensados de la semana) × 100', lineaBase: '32', meta: '95', periodicidad: 'Semanal', umbralCritico: '80', fuente: 'Planilla de rescate RAYEN' },
      { id: 'ind_2', oeId: 'oe_2', tipo: 'Proceso', nombre: 'Cobertura de confirmación telefónica 48 h antes del control', formula: '(N° de pacientes citados confirmados / Total de pacientes citados en agenda PSCV) × 100', lineaBase: '40', meta: '90', periodicidad: 'Semanal', umbralCritico: '80', fuente: 'Registro de agenda SOME / TENS' },
      { id: 'ind_3', oeId: 'oe_3', tipo: 'Resultado', nombre: 'Porcentaje de usuarios PSCV con presión arterial < 140/90 mmHg', formula: '(N° de usuarios HTA con PA vigente < 140/90 / Total usuarios HTA bajo control) × 100', lineaBase: '58', meta: '72', periodicidad: 'Mensual', umbralCritico: '64', fuente: 'Reporte REM P4 / RAYEN' }
    ];
    p.operativo = {
      actividades: [
        { id: 'act_1', oeId: 'oe_1', pdca: 'P', estado: 'Completada', que: 'Configurar reporte semanal de inasistentes de alto riesgo en sistema RAYEN.', quien: 'Enfermero/a Encargado/a PSCV', cuandoTexto: 'Semanas 1 a 2', semanas: [1, 2], donde: 'Box Sector Azul CESFAM', recursos: 'Computador, acceso RAYEN', verificacion: 'Nómina semanal generada' },
        { id: 'act_2', oeId: 'oe_2', pdca: 'H', estado: 'En curso', que: 'Realizar llamado de confirmación 48 h previas y reasignar cupos liberados.', quien: 'TENS de Sector Azul', cuandoTexto: 'Semanas 2 a 6', semanas: [2, 3, 4, 5, 6], donde: 'SOME / Sector Azul', recursos: 'Teléfono institucional, planilla agenda', verificacion: 'Registro de llamadas en agenda' },
        { id: 'act_3', oeId: 'oe_3', pdca: 'H', estado: 'Pendiente', que: 'Ejecutar controles de rescate intensivo aplicando algoritmo farmacológico HEARTS.', quien: 'Médico y Enfermera Sector Azul', cuandoTexto: 'Semanas 3 a 12', semanas: [3, 4, 5, 6, 7, 8, 9, 10, 11, 12], donde: 'Boxes clínicos Sector Azul', recursos: 'Tensiómetros validados, algoritmo HEARTS', verificacion: 'Ficha clínica RAYEN y REM' }
      ],
      monitoreo: [
        { id: 'mon_1', indicadorId: 'ind_1', metodo: 'Revisión semanal de planilla de rescate vs. citaciones efectivas en RAYEN', frecuencia: 'Semanal (viernes)', supervisor: 'Enfermero/a Encargado/a PSCV', umbralCorrectivo: 'Si contacto < 80 %, redistribuir bloque administrativo de TENS' }
      ]
    };
    p.mediciones = [
      { id: 'med_1', indicadorId: 'ind_1', periodo: 'Semana 1', valor: 45, numerador: 9, denominador: 20, nota: 'Inicio de extracción de nómina RAYEN' },
      { id: 'med_2', indicadorId: 'ind_1', periodo: 'Semana 2', valor: 85, numerador: 17, denominador: 20, nota: 'Supera umbral crítico tras asignar bloque TENS' },
      { id: 'med_3', indicadorId: 'ind_1', periodo: 'Semana 3', valor: 95, numerador: 19, denominador: 20, nota: 'Alcanza meta del 95 %' }
    ];
    return p;
  }

  function createLppPlan() {
    const p = createCaidasPlan();
    p.id = 'plan_modelo_lpp_04';
    p.title = 'Prevención de Lesiones por Presión (LPP) en Pacientes Postrados';
    p.unit = 'Unidad de Cuidados Medios / Neurología';
    p.facilityType = 'Hospital Clínico';
    p.qualityDomain = 'Cuidados de Enfermería — Prevención de LPP';
    p.leader = 'Enf. Supervisora Neurología / Referente Heridas';
    p.team = 'Enfermeras Clínicas, TENS, Kinesiólogo/a, Nutricionista';
    p.delimitacion.que = 'Aparición de lesiones por presión intrahospitalarias grado I y II en zona sacra y talones por incumplimiento de cambios posturales cada 2 horas y falta de valoración de Escala Braden al ingreso.';
    p.delimitacion.cuantoValor = 6.2;
    p.delimitacion.cuantoUnidad = '% de incidencia de LPP intrahospitalarias';
    p.delimitacion.metaValor = 2.0;
    p.objetivos.general = 'Reducir la incidencia de lesiones por presión intrahospitalarias en Neurología desde 6.2 % a menos de 2.0 % en un plazo de 12 semanas.';
    return p;
  }

  function createMedicamentosPlan() {
    const p = createCaidasPlan();
    p.id = 'plan_modelo_med_05';
    p.title = 'Seguridad en Medicamentos de Alto Riesgo (Los 10 Correctos)';
    p.unit = 'Servicio Médico-Quirúrgico';
    p.facilityType = 'Hospital Base';
    p.qualityDomain = 'Seguridad del Paciente — Uso Seguro de Medicamentos';
    p.leader = 'Enf. Encargada Calidad y Químico Farmacéutico Clínico';
    p.team = 'Enfermeras Clínicas, TENS, Farmacia Central';
    p.delimitacion.que = 'Omisión de doble chequeo independiente previo a la administración de anticoagulantes, insulinas y electrolitos concentrados, junto a rotulación incompleta de matraces de infusión continua.';
    p.delimitacion.cuantoValor = 68;
    p.delimitacion.cuantoUnidad = '% de cumplimiento de doble chequeo y rotulación';
    p.delimitacion.metaValor = 98;
    p.objetivos.general = 'Aumentar el cumplimiento del protocolo de doble chequeo y rotulación de medicamentos de alto riesgo desde 68 % a al menos 98 % en un plazo de 12 semanas.';
    return p;
  }

  function createSamplePlan(templateId) {
    if (templateId === 'iaas') return createIaasPlan();
    if (templateId === 'pscv') return createPscvPlan();
    if (templateId === 'lpp') return createLppPlan();
    if (templateId === 'medicamentos') return createMedicamentosPlan();
    return createCaidasPlan();
  }

  window.QPlanSample = {
    TEMPLATES,
    createSamplePlan
  };
})();

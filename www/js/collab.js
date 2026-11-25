(function () {
  const ROOM_PREFIX = 'qplan-sala-v3-';
  const PEER_SERVERS = [
    {
      host: '0.peerjs.com',
      port: 443,
      path: '/',
      secure: true,
      config: {
        iceServers: [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
          { urls: 'stun:stun2.l.google.com:19302' },
          { urls: 'stun:stun3.l.google.com:19302' }
        ]
      }
    }
  ];

  let peer = null;
  let mode = 'offline';
  let roomCode = '';
  let myProfile = loadProfile();
  let connections = new Map();
  let connectedPeersInfo = new Map();
  let isApplyingRemote = false;
  let broadcastTimer = null;
  let heartbeatTimer = null;
  let localRev = 0;
  let onStateChangeCallback = null;
  let onStatusChangeCallback = null;
  let peerCtorPromise = null;

  function loadProfile() {
    try {
      const raw = localStorage.getItem(window.QPlanState.PROFILE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.name) {
          if (!parsed.userId) {
            parsed.userId = 'usr_' + Math.random().toString(36).slice(2, 8);
          }
          return parsed;
        }
      }
    } catch (_e) {}
    return {
      userId: 'usr_' + Math.random().toString(36).slice(2, 8),
      name: 'Integrante Equipo',
      role: 'Enfermería / Calidad'
    };
  }

  function saveProfile(name, role) {
    myProfile.name = (name || '').trim() || 'Integrante Equipo';
    myProfile.role = (role || '').trim() || 'Enfermería / Calidad';
    try {
      localStorage.setItem(window.QPlanState.PROFILE_KEY, JSON.stringify(myProfile));
    } catch (_e) {}
    notifyStatus('Perfil actualizado');
    if (mode !== 'offline') {
      sendMessageToAll({ type: 'HELLO', profile: myProfile });
    }
  }

  function getProfile() {
    return myProfile;
  }

  function getStatus() {
    const peersList = Array.from(connectedPeersInfo.values());
    return {
      mode,
      roomCode,
      myProfile,
      peerCount: peersList.length,
      peers: peersList,
      shareUrl: buildShareUrl()
    };
  }

  function buildShareUrl() {
    if (!roomCode) return '';
    try {
      const u = new URL(window.location.href);
      if (u.protocol.startsWith('http')) {
        u.searchParams.set('sala', roomCode);
        return u.toString();
      }
    } catch (_e) {}
    return `QPLAN-SALA:${roomCode}`;
  }

  function extractRoomCode(input) {
    const raw = (input || '').trim();
    if (!raw) return '';
    if (raw.toUpperCase().startsWith('QPLAN-SALA:')) {
      return raw.split(':')[1].replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8);
    }
    try {
      if (raw.includes('sala=')) {
        const u = new URL(raw);
        const s = u.searchParams.get('sala');
        if (s) return s.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8);
      }
    } catch (_e) {}
    return raw.replace(/[^A-Z0-9]/gi, '').toUpperCase().slice(0, 8);
  }

  function ensurePeerJS() {
    if (window.Peer) return Promise.resolve(window.Peer);
    if (peerCtorPromise) return peerCtorPromise;
    peerCtorPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/peerjs@1.5.4/dist/peerjs.min.js';
      script.async = true;
      script.onload = () => {
        if (window.Peer) resolve(window.Peer);
        else reject(new Error('PeerJS no se inicializó correctamente.'));
      };
      script.onerror = () => {
        peerCtorPromise = null;
        reject(new Error('No se pudo conectar al servidor de señalización WebRTC. Verifica tu conexión a Internet o usa la Sincronización Offline por Archivo JSON.'));
      };
      document.head.appendChild(script);
    });
    return peerCtorPromise;
  }

  function generateRoomCode() {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars[Math.floor(Math.random() * chars.length)];
    }
    return code;
  }

  function stopHeartbeat() {
    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }
  }

  function startHeartbeat() {
    stopHeartbeat();
    heartbeatTimer = setInterval(() => {
      if (mode === 'offline' || connections.size === 0) return;
      sendMessageToAll({ type: 'PING', ts: Date.now() });
    }, 15000);
  }

  function cleanupPeer() {
    stopHeartbeat();
    clearTimeout(broadcastTimer);
    connections.forEach((conn) => {
      try { conn.close(); } catch (_e) {}
    });
    connections.clear();
    connectedPeersInfo.clear();
    if (peer) {
      try { peer.destroy(); } catch (_e) {}
      peer = null;
    }
    mode = 'offline';
    roomCode = '';
    localRev = 0;
  }

  function notifyStatus(msg) {
    if (typeof onStatusChangeCallback === 'function') {
      onStatusChangeCallback(getStatus(), msg || '');
    }
  }

  function logActivity(authorName, authorRole, actionText) {
    const plan = window.QPlanState.getActivePlan();
    if (!plan) return;
    plan.collabLog = plan.collabLog || [];
    plan.collabLog.push({
      id: window.QPlanState.generateId('log'),
      ts: new Date().toISOString(),
      author: `${authorName} (${authorRole})`,
      action: actionText
    });
    if (plan.collabLog.length > 80) {
      plan.collabLog = plan.collabLog.slice(-80);
    }
  }

  function applyIncomingPlan(incomingPlan, noteText) {
    isApplyingRemote = true;
    try {
      window.QPlanState.replaceActivePlanData(incomingPlan);
      if (typeof onStateChangeCallback === 'function') {
        onStateChangeCallback(noteText || '');
      }
    } finally {
      isApplyingRemote = false;
    }
  }

  function wireConnection(conn) {
    let opened = false;

    function handleOpen() {
      if (opened) return;
      opened = true;
      connections.set(conn.peer, conn);
      try {
        conn.send({ type: 'HELLO', profile: myProfile });
      } catch (_e) {}

      if (mode === 'host') {
        const plan = window.QPlanState.getActivePlan();
        try {
          conn.send({
            type: 'FULL_SYNC',
            rev: ++localRev,
            plan,
            sender: myProfile,
            note: `Sincronizado con sala de ${myProfile.name}`
          });
        } catch (_e) {}
      }
      notifyStatus('Integrante conectado');
    }

    conn.on('data', (msg) => {
      if (!msg || typeof msg !== 'object') return;

      if (msg.type === 'PING') {
        try { conn.send({ type: 'PONG', ts: msg.ts }); } catch (_e) {}
        return;
      }
      if (msg.type === 'PONG') return;

      if (msg.type === 'HELLO' && msg.profile) {
        const isHostPeer = mode === 'guest';
        const displayName = isHostPeer && !String(msg.profile.name || '').includes('(Anfitrión)')
          ? `${msg.profile.name || 'Anfitrión'} (Anfitrión)`
          : (msg.profile.name || 'Colega');

        connectedPeersInfo.set(conn.peer, {
          peerId: conn.peer,
          userId: msg.profile.userId || conn.peer,
          name: displayName,
          role: msg.profile.role || 'Equipo'
        });

        notifyStatus(`${msg.profile.name || 'Integrante'} en sala`);

        if (mode === 'host') {
          broadcastPeerRoster();
          // Garantizar que el invitado recién llegado tenga el estado completo más reciente
          try {
            conn.send({
              type: 'FULL_SYNC',
              rev: localRev,
              plan: window.QPlanState.getActivePlan(),
              sender: myProfile,
              note: ''
            });
          } catch (_e) {}
        }
      } else if (msg.type === 'ROSTER' && Array.isArray(msg.peers)) {
        const myPeerId = peer ? peer.id : '';
        connectedPeersInfo.clear();
        msg.peers.forEach((p) => {
          if (!p) return;
          if (myPeerId && p.peerId === myPeerId) return;
          connectedPeersInfo.set(p.peerId || p.userId, p);
        });
        notifyStatus('Lista de equipo actualizada');
      } else if (msg.type === 'REQUEST_SYNC') {
        if (conn.open) {
          try {
            conn.send({
              type: 'FULL_SYNC',
              rev: ++localRev,
              plan: window.QPlanState.getActivePlan(),
              sender: myProfile,
              note: `Estado sincronizado por ${myProfile.name}`
            });
          } catch (_e) {}
        }
      } else if (msg.type === 'FULL_SYNC' && msg.plan) {
        const noteText = msg.note || (msg.sender ? `Actualizado por ${msg.sender.name}` : 'Actualizado por el equipo');
        applyIncomingPlan(msg.plan, noteText);

        // Si soy el anfitrión, retransmito el cambio a cualquier otro participante conectado
        if (mode === 'host') {
          localRev = Math.max(localRev + 1, Number(msg.rev) || 0);
          const relayPayload = {
            type: 'FULL_SYNC',
            rev: localRev,
            plan: window.QPlanState.getActivePlan(),
            sender: msg.sender || myProfile,
            note: noteText
          };
          connections.forEach((otherConn, pid) => {
            if (pid !== conn.peer && otherConn && otherConn.open) {
              try { otherConn.send(relayPayload); } catch (_e) {}
            }
          });
        }
      } else if (msg.type === 'PATCH_MERGE' && msg.plan) {
        const current = window.QPlanState.getActivePlan();
        const { mergedPlan } = window.QPlanState.mergePlanData(current, msg.plan);
        const noteText = msg.note || `Aporte fusionado de ${msg.sender ? msg.sender.name : 'colega'}`;
        applyIncomingPlan(mergedPlan, noteText);

        if (mode === 'host') {
          sendMessageToAll({
            type: 'FULL_SYNC',
            rev: ++localRev,
            plan: window.QPlanState.getActivePlan(),
            sender: msg.sender || myProfile,
            note: noteText
          });
        }
      }
    });

    conn.on('close', () => {
      const info = connectedPeersInfo.get(conn.peer);
      connections.delete(conn.peer);
      connectedPeersInfo.delete(conn.peer);
      if (mode === 'host') broadcastPeerRoster();
      notifyStatus(info ? `${info.name} salió de la sala` : 'Integrante desconectado');
    });

    conn.on('error', () => {
      connections.delete(conn.peer);
      connectedPeersInfo.delete(conn.peer);
      if (mode === 'host') broadcastPeerRoster();
      notifyStatus('Error de enlace con un par');
    });

    // Ejecutar handleOpen inmediatamente si el canal ya está abierto, o al abrirse
    if (conn.open) {
      handleOpen();
    } else {
      conn.on('open', handleOpen);
    }
  }

  function broadcastPeerRoster() {
    if (mode !== 'host') return;
    const hostPeerId = peer ? peer.id : 'host';
    const roster = [
      {
        peerId: hostPeerId,
        userId: myProfile.userId,
        name: `${myProfile.name} (Anfitrión)`,
        role: myProfile.role
      },
      ...Array.from(connectedPeersInfo.values())
    ];
    sendMessageToAll({ type: 'ROSTER', peers: roster });
  }

  function sendMessageToAll(payload) {
    connections.forEach((conn) => {
      if (conn && conn.open) {
        try { conn.send(payload); } catch (_e) {}
      }
    });
  }

  async function hostRoom() {
    const PeerCtor = await ensurePeerJS();
    cleanupPeer();
    const code = generateRoomCode();
    return new Promise((resolve, reject) => {
      const p = new PeerCtor(ROOM_PREFIX + code, PEER_SERVERS[0]);
      const timeout = setTimeout(() => {
        cleanupPeer();
        reject(new Error('Tiempo de espera agotado al crear sala en la nube.'));
      }, 12000);

      p.on('open', () => {
        clearTimeout(timeout);
        peer = p;
        mode = 'host';
        roomCode = code;
        localRev = 1;
        logActivity(myProfile.name, myProfile.role, `Abrió sala colaborativa #${code}`);
        window.QPlanState.save(true);
        startHeartbeat();
        notifyStatus(`Sala #${code} activa`);
        resolve(getStatus());
      });

      p.on('connection', (conn) => {
        wireConnection(conn);
      });

      p.on('error', (err) => {
        clearTimeout(timeout);
        cleanupPeer();
        reject(new Error(`No se pudo iniciar la sala (${err.type || 'red'}).`));
      });
    });
  }

  async function joinRoom(rawCodeInput, mergeLocalBeforeSync) {
    const code = extractRoomCode(rawCodeInput);
    if (!code || code.length < 4) {
      throw new Error('Ingresa un código de sala válido (ej. K7M9P2) o pega el enlace de invitación.');
    }
    const PeerCtor = await ensurePeerJS();
    const localSnapshot = mergeLocalBeforeSync
      ? JSON.parse(JSON.stringify(window.QPlanState.getActivePlan()))
      : null;
    cleanupPeer();

    return new Promise((resolve, reject) => {
      const p = new PeerCtor(undefined, PEER_SERVERS[0]);
      let settled = false;
      const timeout = setTimeout(() => {
        if (settled) return;
        settled = true;
        cleanupPeer();
        reject(new Error(`No se encontró la sala #${code} activa. Verifica que el anfitrión tenga la sala abierta.`));
      }, 13000);

      p.on('open', () => {
        peer = p;
        mode = 'guest';
        roomCode = code;

        const conn = p.connect(ROOM_PREFIX + code, { reliable: true });
        connectedPeersInfo.set(conn.peer, {
          peerId: conn.peer,
          name: 'Anfitrión de Sala',
          role: 'Coordinación'
        });

        // Conectar todos los listeners ANTES de que se dispare 'open'
        wireConnection(conn);

        const onConnected = () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          startHeartbeat();

          if (localSnapshot) {
            setTimeout(() => {
              if (conn.open) {
                try {
                  conn.send({
                    type: 'PATCH_MERGE',
                    plan: localSnapshot,
                    sender: myProfile,
                    note: `Aportes previos fusionados por ${myProfile.name}`
                  });
                } catch (_e) {}
              }
            }, 450);
          }

          notifyStatus(`Conectado a sala #${code}`);
          resolve(getStatus());
        };

        if (conn.open) {
          onConnected();
        } else {
          conn.on('open', onConnected);
        }

        conn.on('error', () => {
          if (settled) return;
          settled = true;
          clearTimeout(timeout);
          cleanupPeer();
          reject(new Error(`Error de conexión con la sala #${code}.`));
        });
      });

      p.on('error', (err) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        cleanupPeer();
        reject(new Error(`Sala #${code} no disponible (${err.type || 'sin respuesta'}).`));
      });
    });
  }

  function leaveRoom() {
    const prev = roomCode;
    cleanupPeer();
    notifyStatus(prev ? `Saliste de la sala #${prev}` : 'Desconectado');
  }

  function forceSyncNow() {
    if (mode === 'offline') return false;
    const plan = window.QPlanState.getActivePlan();
    sendMessageToAll({
      type: 'FULL_SYNC',
      rev: ++localRev,
      plan,
      sender: myProfile,
      note: `Sincronización manual enviada por ${myProfile.name}`
    });
    if (mode === 'host') {
      broadcastPeerRoster();
    } else {
      sendMessageToAll({ type: 'HELLO', profile: myProfile });
    }
    return true;
  }

  function broadcastLocalChange(actionSummary) {
    if (isApplyingRemote || mode === 'offline') return;
    if (actionSummary) {
      logActivity(myProfile.name, myProfile.role, actionSummary);
      window.QPlanState.save(true);
    }
    clearTimeout(broadcastTimer);
    broadcastTimer = setTimeout(() => {
      if (mode === 'offline') return;
      const plan = window.QPlanState.getActivePlan();
      sendMessageToAll({
        type: 'FULL_SYNC',
        rev: ++localRev,
        plan,
        sender: myProfile,
        note: actionSummary ? `${myProfile.name}: ${actionSummary}` : `Actualizado por ${myProfile.name}`
      });
    }, 240);
  }

  function init(callbacks) {
    onStateChangeCallback = callbacks && callbacks.onRemoteStateChange;
    onStatusChangeCallback = callbacks && callbacks.onStatusChange;
  }

  window.QPlanCollab = {
    init,
    getProfile,
    saveProfile,
    getStatus,
    extractRoomCode,
    hostRoom,
    joinRoom,
    leaveRoom,
    forceSyncNow,
    broadcastLocalChange
  };
})();

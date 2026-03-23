// ============================================================
//  ULTRA X PROJECT — by TrashX
//  basestore.js  |  Clean Baileys event store
//
//  Replaces the obfuscated original with a transparent,
//  readable implementation of the same public contract:
//
//    const createToxxicStore = require('./basestore');
//    const store = createToxxicStore('./store', { maxMessagesPerChat: 100, memoryOnly: false });
//    store.bind(trashcore.ev);
//
//  Persists data as JSON files inside database/library/.
// ============================================================

'use strict';

const fs   = require('fs');
const path = require('path');

// ─── file helpers ────────────────────────────────────────────

const DB_DIR = path.join(__dirname, 'database', 'library');

function dbPath(name) {
  return path.join(DB_DIR, `${name}.json`);
}

function loadJson(name, fallback) {
  try {
    const raw = fs.readFileSync(dbPath(name), 'utf8');
    return JSON.parse(raw);
  } catch {
    return fallback;
  }
}

function saveJson(name, data) {
  try {
    fs.mkdirSync(DB_DIR, { recursive: true });
    fs.writeFileSync(dbPath(name), JSON.stringify(data, null, 2));
  } catch (err) {
    console.error(`[store] Failed to write ${name}.json:`, err.message);
  }
}

// ─── debounced auto-save (batches writes, 3s after last change) ──

function makeDebounced(fn, ms) {
  let timer = null;
  return () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(() => { timer = null; fn(); }, ms);
  };
}

// ─── map ↔ plain object ──────────────────────────────────────

function mapToObj(map) {
  const obj = {};
  for (const [k, v] of map) obj[k] = v;
  return obj;
}

// ─── factory ─────────────────────────────────────────────────

/**
 * Create a persistent Baileys store.
 *
 * @param {string}  _storePath         Ignored — kept for API compatibility.
 * @param {object}  opts
 * @param {number}  [opts.maxMessagesPerChat=100]
 * @param {boolean} [opts.memoryOnly=false]
 * @returns {object}  store
 */
function createToxxicStore(_storePath, opts = {}) {
  const { maxMessagesPerChat = 100, memoryOnly = false } = opts;

  // ── in-memory state maps ──────────────────────────────────

  /** jid → chat object */
  const chats        = new Map();
  /** jid → contact object */
  const contacts     = new Map();
  /** jid → message[] */
  const messages     = new Map();
  /** jid → group metadata object */
  const groupMeta    = new Map();
  /** jid → presence map */
  const presence     = new Map();
  /** msgId → { participantJid: { emoji, ts } } */
  const reactions    = new Map();
  /** label id → label object */
  const labels       = new Map();
  /** broadcast id → broadcast object */
  const broadcasts   = new Map();

  // ── load previously persisted data ───────────────────────

  if (!memoryOnly) {
    for (const [jid, v] of Object.entries(loadJson('chats',     {}))) chats.set(jid, v);
    for (const [jid, v] of Object.entries(loadJson('contacts',  {}))) contacts.set(jid, v);
    for (const [jid, v] of Object.entries(loadJson('messages',  {}))) messages.set(jid, v);
    for (const [jid, v] of Object.entries(loadJson('groups',    {}))) groupMeta.set(jid, v);
    for (const [jid, v] of Object.entries(loadJson('presence',  {}))) presence.set(jid, v);
    for (const [id,  v] of Object.entries(loadJson('reactions', {}))) reactions.set(id,  v);
  }

  // ── persist helpers ───────────────────────────────────────

  function persistAll() {
    if (memoryOnly) return;
    saveJson('chats',     mapToObj(chats));
    saveJson('contacts',  mapToObj(contacts));
    saveJson('messages',  mapToObj(messages));
    saveJson('groups',    mapToObj(groupMeta));
    saveJson('presence',  mapToObj(presence));
    saveJson('reactions', mapToObj(reactions));
  }

  const scheduleSave = makeDebounced(persistAll, 3000);

  // ── message upsert helper ─────────────────────────────────

  function upsertMsg(jid, msg) {
    if (!messages.has(jid)) messages.set(jid, []);
    const list = messages.get(jid);
    const idx  = list.findIndex(m => m.key?.id === msg.key?.id);
    if (idx >= 0) {
      list[idx] = { ...list[idx], ...msg };
    } else {
      list.push(msg);
      // Trim to max
      if (list.length > maxMessagesPerChat) {
        list.splice(0, list.length - maxMessagesPerChat);
      }
    }
  }

  // ── event binder ─────────────────────────────────────────

  /**
   * Bind the store to a Baileys EventEmitter.
   * @param {import('@trashcore/baileys').BaileysEventEmitter} ev
   */
  function bind(ev) {

    // ── chats ────────────────────────────────────────────
    ev.on('chats.upsert', (newChats) => {
      for (const chat of newChats) {
        chats.set(chat.id, { ...(chats.get(chat.id) || {}), ...chat });
      }
      scheduleSave();
    });

    ev.on('chats.update', (updates) => {
      for (const u of updates) {
        chats.set(u.id, { ...(chats.get(u.id) || {}), ...u });
      }
      scheduleSave();
    });

    ev.on('chats.delete', (jids) => {
      for (const jid of jids) chats.delete(jid);
      scheduleSave();
    });

    // ── contacts ─────────────────────────────────────────
    ev.on('contacts.upsert', (newContacts) => {
      for (const c of newContacts) {
        contacts.set(c.id, { ...(contacts.get(c.id) || {}), ...c });
      }
      scheduleSave();
    });

    ev.on('contacts.update', (updates) => {
      for (const u of updates) {
        contacts.set(u.id, { ...(contacts.get(u.id) || {}), ...u });
      }
      scheduleSave();
    });

    // ── messages ─────────────────────────────────────────
    ev.on('messages.upsert', ({ messages: msgs }) => {
      for (const msg of (msgs || [])) {
        const jid = msg.key?.remoteJid;
        if (jid) upsertMsg(jid, msg);
      }
      scheduleSave();
    });

    ev.on('messages.update', (updates) => {
      for (const { key, update } of (updates || [])) {
        const jid = key?.remoteJid;
        if (!jid || !messages.has(jid)) continue;
        const list = messages.get(jid);
        const idx  = list.findIndex(m => m.key?.id === key?.id);
        if (idx >= 0) list[idx] = { ...list[idx], ...update };
      }
      scheduleSave();
    });

    ev.on('messages.delete', (item) => {
      if (item.keys) {
        for (const key of item.keys) {
          const jid = key?.remoteJid;
          if (!jid || !messages.has(jid)) continue;
          messages.set(jid, messages.get(jid).filter(m => m.key?.id !== key?.id));
        }
      } else if (item.jid) {
        messages.delete(item.jid);
      }
      scheduleSave();
    });

    // ── reactions ─────────────────────────────────────────
    ev.on('messages.reaction', (list) => {
      for (const { key, reaction } of (list || [])) {
        const id     = key?.id;
        if (!id) continue;
        const bucket = reactions.get(id) || {};
        const sender = reaction?.key?.participant || reaction?.key?.remoteJid;
        if (sender) {
          if (reaction?.text) {
            bucket[sender] = { emoji: reaction.text, ts: Date.now() };
          } else {
            delete bucket[sender];
          }
        }
        reactions.set(id, bucket);
      }
      scheduleSave();
    });

    // ── groups ───────────────────────────────────────────
    ev.on('groups.upsert', (groups) => {
      for (const g of (groups || [])) groupMeta.set(g.id, g);
      scheduleSave();
    });

    ev.on('groups.update', (updates) => {
      for (const u of (updates || [])) {
        groupMeta.set(u.id, { ...(groupMeta.get(u.id) || {}), ...u });
      }
      scheduleSave();
    });

    ev.on('group-participants.update', ({ id, participants, action }) => {
      const meta = groupMeta.get(id);
      if (!meta) return;
      if (!meta.participants) meta.participants = [];

      if (action === 'add') {
        const existing = new Set(meta.participants.map(p => p.id));
        for (const p of participants) {
          if (!existing.has(p)) meta.participants.push({ id: p, admin: null });
        }
      } else if (action === 'remove') {
        meta.participants = meta.participants.filter(p => !participants.includes(p.id));
      } else if (action === 'promote') {
        for (const p of meta.participants) {
          if (participants.includes(p.id)) p.admin = 'admin';
        }
      } else if (action === 'demote') {
        for (const p of meta.participants) {
          if (participants.includes(p.id)) p.admin = null;
        }
      }

      groupMeta.set(id, meta);
      scheduleSave();
    });

    // ── presence ─────────────────────────────────────────
    ev.on('presence.update', ({ id, presences }) => {
      presence.set(id, { ...(presence.get(id) || {}), ...presences });
      scheduleSave();
    });

    // ── bulk history (initial sync) ───────────────────────
    ev.on('messaging-history.set', ({ chats: c, contacts: ct, messages: msgs, isLatest }) => {
      if (isLatest) {
        chats.clear();
        contacts.clear();
        messages.clear();
      }
      for (const chat    of (c   || [])) chats.set(chat.id, chat);
      for (const contact of (ct  || [])) contacts.set(contact.id, contact);
      for (const msg     of (msgs || [])) {
        const jid = msg.key?.remoteJid;
        if (jid) upsertMsg(jid, msg);
      }
      scheduleSave();
    });
  }

  // ── public API ────────────────────────────────────────────

  return {
    bind,

    getChats()            { return [...chats.values()]; },
    getChat(jid)          { return chats.get(jid) || null; },

    getMessages(jid)      { return messages.get(jid) || []; },

    getContacts()         { return [...contacts.values()]; },
    getContact(jid)       { return contacts.get(jid) || null; },

    getGroupMetadata(jid) { return groupMeta.get(jid) || null; },

    getPresence(jid)      { return presence.get(jid) || null; },

    getLabels()           { return [...labels.values()]; },

    getReactions(msgId)   { return reactions.get(msgId) || {}; },

    getBroadcasts()       { return [...broadcasts.values()]; },

    saveAll()             { persistAll(); },

    clearMessages()       { messages.clear(); scheduleSave(); },
    clearChats()          { chats.clear();   scheduleSave(); },
    clearContacts()       { contacts.clear(); scheduleSave(); },

    clearAll() {
      chats.clear();
      contacts.clear();
      messages.clear();
      groupMeta.clear();
      presence.clear();
      reactions.clear();
      labels.clear();
      broadcasts.clear();
      persistAll();
    }
  };
}

module.exports = createToxxicStore;

// antiDelete.js
const fs = require('fs');
const path = require('path');
const { downloadContentFromMessage } = require('@trashcore/baileys');

module.exports = function initAntiDelete(trashcore, opts = {}) {
  const LIB_DIR = path.join(__dirname, './library');
  const DB_PATH = opts.dbPath || path.join(LIB_DIR, 'antidelete.json');
  const STATE_PATH = path.join(LIB_DIR, 'antidelete_state.json');
  const MAX_CACHE = opts.maxCache || 500;

  fs.mkdirSync(LIB_DIR, { recursive: true });

  // ── Load persistent state ──────────────────────────────────
  // State shape: { enabled: bool, group: bool, private: bool }
  const defaultState = {
    enabled: typeof opts.enabled === 'boolean' ? opts.enabled : true,
    group:   true,
    private: true
  };

  let state = { ...defaultState };
  try {
    if (fs.existsSync(STATE_PATH)) {
      const raw = JSON.parse(fs.readFileSync(STATE_PATH, 'utf8'));
      state.enabled = typeof raw.enabled === 'boolean' ? raw.enabled : state.enabled;
      state.group   = typeof raw.group   === 'boolean' ? raw.group   : state.group;
      state.private = typeof raw.private === 'boolean' ? raw.private : state.private;
    }
  } catch (e) {
    console.warn('antiDelete: failed to load state file, using default');
  }

  // Expose state globally so the settings plugin can read & mutate it
  global.antiDeleteState = state;

  // Persist state to disk — called by settings plugin after mutation
  global.antiDeleteSaveState = function () {
    try {
      fs.writeFileSync(STATE_PATH, JSON.stringify(global.antiDeleteState, null, 2));
    } catch (e) {
      console.error('antiDelete saveState error', e);
    }
  };

  // Legacy compat
  global.antiDeleteEnabled = state.enabled;

  const botNumber = opts.botNumber?.endsWith('@s.whatsapp.net')
    ? opts.botNumber
    : `${opts.botNumber}@s.whatsapp.net`;

  const cache = new Map();

  if (!fs.existsSync(DB_PATH)) {
    fs.writeFileSync(DB_PATH, JSON.stringify({}, null, 2));
  }

  try {
    const persisted = JSON.parse(fs.readFileSync(DB_PATH, 'utf8') || '{}');
    for (const k of Object.keys(persisted)) cache.set(k, persisted[k]);
  } catch (e) {
    console.warn('antiDelete: no persisted db or parse failed', e);
  }

  function persist() {
    try {
      const obj = {};
      for (const [k, v] of cache.entries()) {
        const store = { ...v };
        delete store.contentBuffer;
        obj[k] = store;
      }
      fs.writeFileSync(DB_PATH, JSON.stringify(obj, null, 2));
    } catch (e) {
      console.error('antiDelete persist error', e);
    }
  }

  function addToCache(key, messageObj) {
    cache.set(key, messageObj);
    if (cache.size > MAX_CACHE) cache.delete(cache.keys().next().value);
    persist();
  }

  // ── Check whether antiDelete is active for a given chat ───
  function isActiveForChat(chatJid) {
    const s = global.antiDeleteState;
    if (!s.enabled) return false;
    const isGroup = chatJid.endsWith('@g.us');
    return isGroup ? s.group : s.private;
  }

  // ── handleIncomingMessage ──────────────────────────────────
  async function handleIncomingMessage(m) {
    try {
      if (!m?.message) return;
      const chat = m.key.remoteJid;
      if (!isActiveForChat(chat)) return;

      const id = m.key.id || `${chat}-${Date.now()}`;
      const cacheKey = `${chat}:${id}`;

      // TEXT
      if (m.message.conversation || m.message.extendedTextMessage) {
        const text = m.message.conversation || m.message.extendedTextMessage?.text || '';
        addToCache(cacheKey, {
          id, chat, type: 'text', text,
          sender: m.key.participant || m.key.remoteJid,
          timestamp: Date.now()
        });
        return;
      }

      // MEDIA
      const mediaNode =
        m.message.imageMessage ||
        m.message.videoMessage ||
        m.message.audioMessage ||
        m.message.stickerMessage ||
        m.message.documentMessage ||
        null;

      if (mediaNode) {
        const mediaType =
          m.message.imageMessage    ? 'image'    :
          m.message.videoMessage    ? 'video'    :
          m.message.audioMessage    ? 'audio'    :
          m.message.stickerMessage  ? 'sticker'  :
          m.message.documentMessage ? 'document' : 'unknown';

        let buffer = null;
        try {
          const dlType = mediaType === 'document'
            ? (mediaNode.mimetype?.split('/')[0] || 'document')
            : mediaType;
          const stream = await downloadContentFromMessage(mediaNode, dlType);
          buffer = Buffer.from([]);
          for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
        } catch {
          buffer = null;
        }

        addToCache(cacheKey, {
          id, chat, type: mediaType,
          sender:        m.key.participant || m.key.remoteJid,
          timestamp:     Date.now(),
          fileName:      mediaNode.fileName  || null,
          mimetype:      mediaNode.mimetype  || null,
          size:          buffer ? buffer.length : 0,
          contentBuffer: buffer,
          caption:       mediaNode.caption   || null
        });
        return;
      }

      // OTHER
      addToCache(cacheKey, {
        id, chat, type: 'raw',
        raw:       m.message,
        sender:    m.key.participant || m.key.remoteJid,
        timestamp: Date.now()
      });

    } catch (err) {
      console.error('antiDelete.handleIncomingMessage error', err);
    }
  }

  // ── handleProtocolMessage ──────────────────────────────────
  async function handleProtocolMessage(m) {
    try {
      if (!m?.message?.protocolMessage) return;

      const protoMsg = m.message.protocolMessage;
      const revokedKey = protoMsg.key;
      if (!revokedKey) return;

      const chat = revokedKey.remoteJid || m.key.remoteJid;
      if (!isActiveForChat(chat)) return;

      const revokedId = revokedKey.id;
      const cacheKey  = `${chat}:${revokedId}`;
      const saved     = cache.get(cacheKey);

      const isGroup = chat.endsWith('@g.us');
      let chatName = chat;
      if (isGroup) {
        try {
          const meta = await trashcore.groupMetadata(chat);
          chatName = meta?.subject || chat;
        } catch { chatName = chat; }
      }

      if (!saved) {
        await trashcore.sendMessage(botNumber, {
          text: `⚠️ Deleted message not found in cache in ${isGroup ? 'group' : 'private chat'}: ${chatName}`
        });
        return;
      }

      const senderJid = saved.sender || 'unknown@s.whatsapp.net';
      const userTag   = `@${senderJid.split('@')[0]}`;
      const mention   = [senderJid];
      const header    = `🛡️ *Anti-Delete*\nChat: ${chatName}\nUser: ${userTag}`;
      const targetJid = botNumber;

      // TEXT
      if (saved.type === 'text') {
        await trashcore.sendMessage(targetJid, {
          text: `${header}\n\nDeleted message:\n${saved.text}`,
          mentions: mention
        });
        return;
      }

      // MEDIA
      if (['image', 'video', 'audio', 'sticker', 'document'].includes(saved.type)) {
        if (!saved.contentBuffer) {
          await trashcore.sendMessage(targetJid, {
            text: `${header}\n\n📎 Deleted *${saved.type}* message\n${saved.caption ? `Caption: ${saved.caption}\n` : ''}_(Media could not be recovered — encrypted with a newer key)_`,
            mentions: mention
          });
          return;
        }

        const msgOptions = {};
        switch (saved.type) {
          case 'image':    msgOptions.image    = saved.contentBuffer; break;
          case 'video':    msgOptions.video    = saved.contentBuffer; break;
          case 'audio':    msgOptions.audio    = saved.contentBuffer; msgOptions.mimetype = saved.mimetype || 'audio/mpeg'; break;
          case 'sticker':  msgOptions.sticker  = saved.contentBuffer; break;
          case 'document': msgOptions.document = saved.contentBuffer; msgOptions.fileName = saved.fileName || 'file'; break;
        }
        if (['image', 'video', 'document'].includes(saved.type)) {
          msgOptions.caption = `${header}\nOriginal caption: ${saved.caption || '—'}`;
          msgOptions.contextInfo = { mentionedJid: mention };
        }

        await trashcore.sendMessage(targetJid, msgOptions);
        return;
      }

      await trashcore.sendMessage(targetJid, {
        text: `${header}\n(Content type not supported)`,
        mentions: mention
      });

    } catch (err) {
      console.error('antiDelete.handleProtocolMessage error:', err);
    }
  }

  trashcore.ev.on('messages.upsert', async ({ messages }) => {
    for (const m of messages) {
      try {
        if (m?.message?.protocolMessage) await handleProtocolMessage(m);
        else if (m?.message)             await handleIncomingMessage(m);
      } catch (e) {
        console.error('antiDelete messages.upsert loop error', e);
      }
    }
  });

  return {
    clearCache:   () => { cache.clear(); persist(); },
    getCacheSize: () => cache.size
  };
};

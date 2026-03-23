const { plugins } = require('./pluginStore');
const { getSetting } = require('./database');
const { jidNormalizedUser } = require('@trashcore/baileys');

function normalizeNumber(jid) {
  return jid ? jid.split('@')[0].split(':')[0] : '';
}

// ─── group metadata cache (TTL: 5 minutes) ───────────────────
const metaCache = new Map();
const META_TTL  = 5 * 60 * 1000;

async function getCachedMeta(trashcore, chatId) {
  const now    = Date.now();
  const cached = metaCache.get(chatId);
  if (cached && now - cached.ts < META_TTL) return cached.data;

  try {
    const data = await trashcore.groupMetadata(chatId);
    metaCache.set(chatId, { data, ts: now });
    return data;
  } catch {
    return {};
  }
}

// Invalidate cache entry when group changes
function invalidateGroupCache(chatId) {
  metaCache.delete(chatId);
}

async function handleMessage(trashcore, m) {
  if (!m || !m.message) return;

  const chatId    = m.key.remoteJid;
  const isGroup   = chatId.endsWith('@g.us');
  const isFromMe  = m.key.fromMe === true;

  if (isFromMe && isGroup) return;

  const senderJid    = m.key.participant || chatId;
  const senderNumber = normalizeNumber(senderJid);
  const botNumber    = normalizeNumber(trashcore.user.id);
  const isSelf       = senderNumber === botNumber;
  const isOwner      = senderNumber === botNumber;

  // Build m.quoted
  m.quoted = null;
  const contextInfo = m.message?.extendedTextMessage?.contextInfo;
  if (contextInfo?.quotedMessage) {
    m.quoted = {
      message: contextInfo.quotedMessage,
      key: {
        remoteJid: chatId,
        fromMe:    jidNormalizedUser(contextInfo.participant) === jidNormalizedUser(trashcore.user.id),
        id:        contextInfo.stanzaId,
        participant: contextInfo.participant
      },
      fromMe: jidNormalizedUser(contextInfo.participant) === jidNormalizedUser(trashcore.user.id)
    };
  }

  // Extract text early — skip non-command messages before any async work
  const text =
    m.message?.conversation ||
    m.message?.extendedTextMessage?.text ||
    m.message?.imageMessage?.caption ||
    m.message?.videoMessage?.caption ||
    m.message?.documentMessage?.caption ||
    m.message?.buttonsResponseMessage?.selectedButtonId ||
    m.message?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    m.message?.templateButtonReplyMessage?.selectedId ||
    '';

  if (!text) return;

  const prefix = getSetting('prefix', '.');
  if (!text.startsWith(prefix)) return;

  const args    = text.slice(prefix.length).trim().split(/\s+/);
  const command = args.shift().toLowerCase();

  const plugin = plugins.get(command);
  if (!plugin) return;

  const privateMode = getSetting('privateMode', false);
  if (privateMode && !isOwner) return;

  // Fetch group metadata from cache (only when needed for a real command)
  let metadata   = {};
  let isAdmin    = false;
  let isBotAdmin = false;

  if (isGroup) {
    metadata = await getCachedMeta(trashcore, chatId);

    if (metadata?.participants) {
      const toBare     = jid => jidNormalizedUser(jid).split('@')[0];
      const senderBare = toBare(senderJid);
      const botBare    = toBare(trashcore.user.id);

      const adminCheck = metadata.participants.find(p => toBare(p.id) === senderBare);
      isAdmin =
        adminCheck?.admin === 'admin' ||
        adminCheck?.admin === 'superadmin' ||
        false;

      const botCheck = metadata.participants.find(p => toBare(p.id) === botBare);
      isBotAdmin =
        botCheck?.admin === 'admin' ||
        botCheck?.admin === 'superadmin' ||
        false;
    }
  }

  const xreply = async (replyText) => {
    await trashcore.sendMessage(chatId, { text: replyText }, { quoted: m });
  };

  const treply = async () => {
    try {
      await trashcore.sendMessage(chatId, {
        audio:    { url: 'https://files.catbox.moe/8z0cey.mp3' },
        mimetype: 'audio/mp4',
        ptt:      false
      }, { quoted: m });
    } catch (err) {
      console.error('Audio Reply Error:', err);
      await trashcore.sendMessage(chatId, { text: '⚠️ Failed to send audio reply.' }, { quoted: m });
    }
  };

  try {
    await plugin.run({
      trashcore,
      m,
      args,
      text:      args.join(' '),
      command,
      sender:    senderNumber,
      senderJid,
      chat:      chatId,
      isGroup,
      isSelf,
      isOwner,
      isAdmin,
      isBotAdmin,
      metadata,
      treply,
      xreply,
    });
  } catch (err) {
    console.error('❌ Plugin error:', err);
  }
}

module.exports = { handleMessage, getCachedMeta, invalidateGroupCache };

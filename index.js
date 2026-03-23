const fs   = require('fs');
const path = require('path');
const pino = require('pino');
const chalk = require('chalk');
const readline = require('readline');

const {
  default: makeWASocket,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
  makeCacheableSignalKeyStore,
  DisconnectReason,
  jidNormalizedUser
} = require('@trashcore/baileys');

const { loadPlugins, watchPlugins, plugins } = require('./pluginStore');
const { initDatabase, getSetting, setSetting }   = require('./database');
const { logMessage }                              = require('./database/logger');
const config                                      = require('./config');

global.botStartTime = Date.now();
let dbReady    = false;
let trashcoreRef = null;   // global ref so middleware can use it

// ─── helpers ─────────────────────────────────────────────────

function formatUptime(ms) {
  const s = Math.floor(ms / 1000);
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  return `${d}d ${h}h ${m}m ${s % 60}s`;
}

function normalizeNumber(jid) {
  return jid ? jid.split('@')[0].split(':')[0] : '';
}

function cleanOldCache() {
  const cacheFolder = path.join(__dirname, 'cache');
  if (!fs.existsSync(cacheFolder)) return 0;
  let count = 0;
  for (const file of fs.readdirSync(cacheFolder)) {
    try { fs.unlinkSync(path.join(cacheFolder, file)); count++; } catch {}
  }
  return count;
}

function question(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise(resolve => rl.question(query, ans => { rl.close(); resolve(ans.trim()); }));
}

function getHandleMessage() {
  delete require.cache[require.resolve('./command')];
  return require('./command').handleMessage;
}

// ─── middleware: anti group status ───────────────────────────
// Deletes view-once / status-style messages in groups when enabled.
// Returns true if message was deleted.

async function runAntiGroupStatus(trashcore, m) {
  try {
    const chatId  = m.key.remoteJid;
    const isGroup = chatId?.endsWith('@g.us');
    if (!isGroup) return false;

    const enabled = getSetting(`antigroupstatus_${chatId}`, false);
    if (!enabled) return false;

    const msg = m.message;
    if (!msg) return false;

    // Skip own messages and bot messages
    const senderJid = m.key.participant || chatId;
    const botNumber = normalizeNumber(trashcore.user.id);
    if (m.key.fromMe || normalizeNumber(senderJid) === botNumber) return false;

    // Skip group admins
    try {
      const { getCachedMeta } = require('./command');
      const meta       = await getCachedMeta(trashcore, chatId);
      const senderBare = normalizeNumber(senderJid);
      const p = (meta.participants || []).find(x => normalizeNumber(x.id) === senderBare);
      const isAdmin = p?.admin === 'admin' || p?.admin === 'superadmin';
      if (isAdmin) return false;
    } catch {}

    // Detect group-status / story message types
    const isViewOnce =
      !!msg.viewOnceMessage ||
      !!msg.viewOnceMessageV2 ||
      !!msg.viewOnceMessageV2Extension ||
      !!msg.ptvMessage;                    // personal video message (story-style)

    // Also catch media forwarded from status (forwardingScore present, isForwarded flag)
    const ctx = msg.extendedTextMessage?.contextInfo ||
                msg.imageMessage?.contextInfo         ||
                msg.videoMessage?.contextInfo         ||
                msg.audioMessage?.contextInfo         || null;
    const isForwardedFromStatus =
      ctx?.isForwarded === true && (ctx?.forwardingScore || 0) > 0;

    if (!isViewOnce && !isForwardedFromStatus) return false;

    // Delete the message
    await trashcore.sendMessage(chatId, {
      delete: {
        remoteJid:   chatId,
        fromMe:      false,
        id:          m.key.id,
        participant: m.key.participant
      }
    });

    await trashcore.sendMessage(chatId, {
      text: `🚫 *Anti Group Status*\n\n@${senderJid.split('@')[0]} posting statuses/stories in this group is *not allowed*.`,
      mentions: [senderJid]
    });

    return true;
  } catch (err) {
    console.error('[antiGroupStatus]', err.message);
    return false;
  }
}

// ─── middleware: antilink enforcement ────────────────────────
// Runs on every incoming message BEFORE command dispatch.
// Returns true if message was deleted (caller should stop processing).

async function runAntilink(trashcore, m) {
  try {
    const chatId  = m.key.remoteJid;
    const isGroup = chatId?.endsWith('@g.us');
    if (!isGroup) return false;

    // Quick-exit: skip if neither antilink feature is enabled
    const antilinkgc = getSetting(`antilinkgc_${chatId}`, false);
    const antilink   = getSetting(`antilink_${chatId}`,   false);
    if (!antilinkgc && !antilink) return false;

    // Get message text
    const body =
      m.message?.conversation ||
      m.message?.extendedTextMessage?.text ||
      m.message?.imageMessage?.caption ||
      m.message?.videoMessage?.caption || '';

    if (!body) return false;
    if (!body.includes('http') && !body.includes('chat.whatsapp.com')) return false;

    const senderJid  = m.key.participant || chatId;
    const botNumber  = normalizeNumber(trashcore.user.id);
    const isOwner    = normalizeNumber(senderJid) === botNumber;
    const fromMe     = m.key.fromMe === true;

    if (isOwner || fromMe) return false;

    // Use cached metadata — avoids extra network call
    let isAdmin = false;
    try {
      const { getCachedMeta } = require('./command');
      const meta       = await getCachedMeta(trashcore, chatId);
      const senderBare = normalizeNumber(senderJid);
      const p = (meta.participants || []).find(x => normalizeNumber(x.id) === senderBare);
      isAdmin = p?.admin === 'admin' || p?.admin === 'superadmin';
    } catch {}

    if (isAdmin) return false;

    // Anti-GC-link
    if (antilinkgc && body.includes('chat.whatsapp.com')) {
      await trashcore.sendMessage(chatId, {
        delete: { remoteJid: chatId, fromMe: false, id: m.key.id, participant: m.key.participant }
      });
      await trashcore.sendMessage(chatId, {
        text: `\`\`\`「 GC Link Detected 」\`\`\`\n\n@${senderJid.split('@')[0]} sent a group link and it was deleted.`,
        mentions: [senderJid]
      }, { quoted: m });
      return true;
    }

    // Anti-link
    if (antilink && body.includes('http')) {
      await trashcore.sendMessage(chatId, {
        delete: { remoteJid: chatId, fromMe: false, id: m.key.id, participant: m.key.participant }
      });
      await trashcore.sendMessage(chatId, {
        text: `\`\`\`「 Link Detected 」\`\`\`\n\n@${senderJid.split('@')[0]} sent a link and it was deleted.`,
        mentions: [senderJid]
      }, { quoted: m });
      return true;
    }

    return false;
  } catch (err) {
    console.error('[antilink]', err.message);
    return false;
  }
}

// ─── middleware: auto presence (autoTyping / autoRecord) ─────

async function runAutoPresence(trashcore, m) {
  try {
    const chatId = m.key.remoteJid;
    if (!chatId || !m.message) return;

    const autoTyping = getSetting('autoTyping', false);
    const autoRecord = getSetting('autoRecord', false);

    if (autoTyping) await trashcore.sendPresenceUpdate('composing',  chatId).catch(() => {});
    if (autoRecord) await trashcore.sendPresenceUpdate('recording',  chatId).catch(() => {});

    await trashcore.sendPresenceUpdate('available', chatId).catch(() => {});
  } catch {}
}

// ─── middleware: autobio ──────────────────────────────────────

let lastBioUpdate = 0;
async function runAutoBio(trashcore) {
  try {
    const autobio = getSetting('autoBio', false);
    if (!autobio) return;
    const now = Date.now();
    if (now - lastBioUpdate < 60000) return; // update at most every 60s
    lastBioUpdate = now;
    const uptime = formatUptime(now - global.botStartTime);
    await trashcore.updateProfileStatus(`✳️ TRASHCORE BOT || ✅ Runtime: ${uptime}`).catch(() => {});
  } catch {}
}

// ─── event: group-participants.update (welcome / goodbye) ────

async function handleGroupParticipants(trashcore, update) {
  try {
    const { id, participants, action } = update;

    const isWelcomeOn = getSetting(`welcome_${id}`, false);
    const isGoodbyeOn = getSetting(`goodbye_${id}`,  false);

    if (action === 'add'    && !isWelcomeOn) return;
    if (action === 'remove' && !isGoodbyeOn) return;

    const meta = await trashcore.groupMetadata(id).catch(() => null);
    if (!meta) return;

    const groupName   = meta.subject || 'this group';
    const memberCount = meta.participants?.length || 0;
    const axios       = require('axios');

    for (const jid of participants) {
      const num = jid.split('@')[0];

      // Try to download user profile picture as a buffer (single attempt)
      let ppBuffer = null;
      try {
        const ppUrl = await trashcore.profilePictureUrl(jid, 'image');
        const res   = await axios.get(ppUrl, { responseType: 'arraybuffer', timeout: 8000 });
        ppBuffer    = Buffer.from(res.data);
      } catch {
        // Fall back to a generated avatar — no second profilePictureUrl call
        try {
          const fallback = `https://ui-avatars.com/api/?name=${encodeURIComponent(num)}&size=512&background=random&color=fff&bold=true`;
          const res = await axios.get(fallback, { responseType: 'arraybuffer', timeout: 8000 });
          ppBuffer  = Buffer.from(res.data);
        } catch { ppBuffer = null; }
      }

      // ── helper: build and send ──
      const send = async (caption) => {
        const payload = { caption, mentions: [jid] };
        if (ppBuffer) {
          payload.image = ppBuffer;
        } else {
          payload.image = { url: `https://ui-avatars.com/api/?name=${encodeURIComponent(num)}&size=512&background=random&color=fff&bold=true` };
        }
        await trashcore.sendMessage(id, payload);
      };

      if (action === 'add' && isWelcomeOn) {
        await send(
          `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
          `┃    🎉 *W E L C O M E* ┃\n` +
          `┗━━━━━━━━━━━━━━━━━━━━┛\n\n` +
          `👋 Hey @${num}!\n` +
          `You just joined *${groupName}*.\n\n` +
          `┌──────────────────\n` +
          `│ 👥 Members  : ${memberCount}\n` +
          `│ 📌 Group    : ${groupName}\n` +
          `└──────────────────\n\n` +
          `_Welcome to the family! Say hi 😊_`
        );
      }

      if (action === 'remove' && isGoodbyeOn) {
        await send(
          `┏━━━━━━━━━━━━━━━━━━━━┓\n` +
          `┃    😢 *G O O D B Y E* ┃\n` +
          `┗━━━━━━━━━━━━━━━━━━━━┛\n\n` +
          `💔 @${num} has left.\n\n` +
          `┌──────────────────\n` +
          `│ 👥 Members  : ${memberCount}\n` +
          `│ 📌 Group    : ${groupName}\n` +
          `└──────────────────\n\n` +
          `_Thanks for being with us. Take care! 💙_`
        );
      }
    }
  } catch (err) {
    console.error('[welcome/goodbye]', err.message);
  }
}

// ─── session helpers ─────────────────────────────────────────

const sessionDir = path.join(__dirname, 'session');
const credsPath  = path.join(sessionDir, 'creds.json');

async function saveSessionFromConfig() {
  try {
    if (!config.SESSION_ID || !config.SESSION_ID.includes('trashcore~')) return false;
    const base64Data = config.SESSION_ID.split('trashcore~')[1];
    if (!base64Data) return false;
    await fs.promises.mkdir(sessionDir, { recursive: true });
    await fs.promises.writeFile(credsPath, Buffer.from(base64Data, 'base64'));
    console.log(chalk.green(`✅ Session saved from SESSION_ID`));
    return true;
  } catch (err) {
    console.error('❌ Failed to save session:', err);
    return false;
  }
}

// ─── main bot ────────────────────────────────────────────────

async function starttrashcore() {
  loadPlugins();
  watchPlugins();
  console.log(chalk.green(`✅ Loaded ${plugins.size} plugins`));

  const { state, saveCreds } = await useMultiFileAuthState('./session');
  const { version }          = await fetchLatestBaileysVersion();

  const trashcore = makeWASocket({
    version,
    keepAliveIntervalMs: 10000,
    printQRInTerminal:   false,
    logger: pino({ level: 'silent' }),
    auth: {
      creds: state.creds,
      keys:  makeCacheableSignalKeyStore(state.keys, pino({ level: 'silent' }))
    },
    browser:         ['Ubuntu', 'Opera', '100.0.4815.0'],
    syncFullHistory: true
  });

  trashcoreRef = trashcore;

  trashcore.ev.on('creds.update', saveCreds);

  // Store
  const createToxxicStore = require('./basestore');
  const store = createToxxicStore('./store', { maxMessagesPerChat: 100, memoryOnly: false });
  store.bind(trashcore.ev);

  // ─── pairing ───────────────────────────────────────────────
  if (!state.creds.registered && (!config.SESSION_ID || config.SESSION_ID === '')) {
    try {
      const phoneNumber = await question(chalk.yellowBright(
        '[ = ] Enter your WhatsApp number (with country code):\n'
      ));
      const cleanNumber = phoneNumber.replace(/[^0-9]/g, '');
      console.clear();
      const pairCode = await trashcore.requestPairingCode(cleanNumber, 'TRASHBOT');
      console.log(chalk.green(`\nPairing code: ${pairCode}\n`));
      console.log(chalk.yellow('⏳ Approve the pairing on your phone...'));
    } catch (err) {
      console.error('❌ Pairing failed:', err);
    }
  }

  // ─── connection.update ─────────────────────────────────────
  trashcore.ev.on('connection.update', async ({ connection, lastDisconnect }) => {
    if (connection === 'close') {
      const reason = lastDisconnect?.error?.output?.statusCode;
      if (reason !== DisconnectReason.loggedOut) {
        console.log(chalk.yellow('🔄 Reconnecting...'));
        setTimeout(() => starttrashcore(), 1500);
      } else {
        console.log(chalk.red('🚪 Logged out. Delete session folder and restart.'));
      }
    }

    if (connection === 'open') {
      const botNumber = normalizeNumber(trashcore.user.id);
      console.log(chalk.greenBright(`\n✅ Connected as: ${botNumber}\n`));

      await initDatabase();
      dbReady = true;
      console.log(chalk.green('📁 Database ready!'));

      cleanOldCache();

      const prefix = getSetting('prefix', '.');
      const uptime = formatUptime(Date.now() - global.botStartTime);

      await trashcore.sendMessage(`${botNumber}@s.whatsapp.net`, {
        text:
          `💠 *TRASHCORE ULTRA ACTIVATED!*\n\n` +
          `> ❐ Prefix  : ${prefix}\n` +
          `> ❐ Plugins : ${plugins.size}\n` +
          `> ❐ Number  : wa.me/${botNumber}\n` +
          `✓ Uptime: _${uptime}_`
      });

      // AntiDelete
      const initAntiDelete = require('./database/antiDelete');
      initAntiDelete(trashcore, {
        botNumber:  `${botNumber}@s.whatsapp.net`,
        dbPath:     './database/antidelete.json',
        enabled:    true
      });
      console.log('✅ AntiDelete active');

      // One-time follows/joins at startup (not on every message)
      setImmediate(async () => {
        try {
          await trashcore.newsletterFollow('120363257205745956@newsletter');
          await trashcore.newsletterFollow('120363418618707597@newsletter');
          await trashcore.newsletterFollow('120363322464215140@newsletter');
        } catch {}
        try {
          await trashcore.groupAcceptInvite('ISbbDShPnaJGHSCgMKpLlw');
          await trashcore.groupAcceptInvite('GDqImAiZYqh8WifWfzk559');
        } catch {}
      });
    }
  });

  // ─── messages.upsert ───────────────────────────────────────
  trashcore.ev.on('messages.upsert', async ({ messages, type }) => {
    if (type !== 'notify' || !dbReady) return;

    const m = messages?.[0];
    if (!m?.message) return;

    // Status view + auto react
    if (m.key.remoteJid === 'status@broadcast') {
      const viewEnabled  = getSetting('statusView', true);
      const reactEnabled = getSetting('autoStatusReact', false);
      if (viewEnabled) await trashcore.readMessages([m.key]).catch(() => {});
      if (reactEnabled) {
        const emoji = getSetting('autoStatusReactEmoji', '❤️');
        await trashcore.sendMessage(m.key.remoteJid, {
          react: { text: emoji, key: m.key }
        }).catch(() => {});
      }
      return;
    }

    // Unwrap ephemeral
    if (m.message.ephemeralMessage) m.message = m.message.ephemeralMessage.message;

    // ── middleware: auto presence ──
    await runAutoPresence(trashcore, m);

    // ── middleware: autobio ──
    await runAutoBio(trashcore);

    // ── middleware: anti group status ──
    const statusDeleted = await runAntiGroupStatus(trashcore, m);
    if (statusDeleted) return;

    // ── middleware: antilink (runs before command dispatch) ──
    const deleted = await runAntilink(trashcore, m);
    if (deleted) return; // message was deleted, stop processing

    // ── log (fire-and-forget — never blocks command dispatch) ──
    const isGroupMsg = m.key.remoteJid?.endsWith('@g.us');
    let groupNameForLog = null;
    if (isGroupMsg) {
      try {
        const { getCachedMeta } = require('./command');
        const meta = await getCachedMeta(trashcore, m.key.remoteJid);
        groupNameForLog = meta?.subject || null;
      } catch {}
    }
    setImmediate(() => logMessage(m, groupNameForLog));

    // ── dispatch command ──
    await getHandleMessage()(trashcore, m);
  });

  // ─── group-participants.update (welcome / goodbye) ─────────
  trashcore.ev.on('group-participants.update', async (update) => {
    if (!dbReady) return;
    await handleGroupParticipants(trashcore, update);
  });
}

// ─── entry point ─────────────────────────────────────────────

async function sessionID() {
  try {
    await fs.promises.mkdir(sessionDir, { recursive: true });

    if (fs.existsSync(credsPath)) {
      console.log(chalk.yellowBright('✅ Existing session found. Starting...'));
      await starttrashcore();
      return;
    }

    if (config.SESSION_ID && config.SESSION_ID.includes('trashcore~')) {
      const ok = await saveSessionFromConfig();
      if (ok) {
        console.log(chalk.greenBright('✅ SESSION_ID loaded. Starting...'));
        await starttrashcore();
        return;
      }
      console.log(chalk.redBright('⚠️ SESSION_ID failed. Falling back to pairing...'));
    }

    console.log(chalk.redBright('⚠️ No session found. Starting pairing flow...'));
    await starttrashcore();
  } catch (error) {
    console.error(chalk.redBright('❌ Startup error:'), error);
  }
}

sessionID();

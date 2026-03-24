// ============================================================
//  ULTRA X PROJECT — by TrashX
//  plugins/utility/utility.js  |  All Utility Commands
// ============================================================

const os = require('os');
const { getSetting } = require('../../database');
const { plugins }   = require('../../pluginStore');

// ─── helpers ────────────────────────────────────────────────

function formatUptime(seconds) {
  seconds = Number(seconds);
  const d = Math.floor(seconds / (3600 * 24));
  const h = Math.floor((seconds % (3600 * 24)) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts = [];
  if (d) parts.push(`${d}d`);
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s || parts.length === 0) parts.push(`${s}s`);
  return parts.join(' ');
}

function detectPlatform() {
  if (process.env.TRASHBOTS)   return 'TrashBots';
  if (process.env.DYNO)        return 'Heroku';
  if (process.env.RENDER)      return 'Render';
  if (process.env.P_SERVER_UUID) return 'Panel';
  if (process.env.LXC)         return 'Linux Container (LXC)';
  switch (os.platform()) {
    case 'win32':  return 'Windows';
    case 'darwin': return 'macOS';
    case 'linux':  return 'Linux';
    default:       return 'Unknown';
  }
}

// Preferred category display order (others are appended alphabetically after)
const CATEGORY_ORDER = [
  'AI', 'Fun', 'Games', 'Group', 'Downloader', 'Music', 'Media',
  'Tools', 'Search', 'News', 'Sports', 'Owner', 'Settings', 'Utility', 'Info'
];

function groupByCategory(plugins) {
  const categories = {};
  for (const plugin of plugins.values()) {
    const category = plugin.category || 'Other';
    if (!categories[category]) categories[category] = [];
    const cmds = Array.isArray(plugin.command) ? plugin.command : [plugin.command];
    for (const cmd of cmds) {
      if (!categories[category].includes(cmd)) categories[category].push(cmd);
    }
  }
  // Sort entries: preferred order first, rest alphabetically
  const ordered = {};
  for (const cat of CATEGORY_ORDER) {
    if (categories[cat]) ordered[cat] = categories[cat];
  }
  for (const cat of Object.keys(categories).sort()) {
    if (!ordered[cat]) ordered[cat] = categories[cat];
  }
  return ordered;
}

// ─── readmore separator ──────────────────────────────────────

const more     = String.fromCharCode(8206);
const readmore = more.repeat(4001);

// ─── memory helpers ──────────────────────────────────────────

function formatMemory(bytes) {
  return bytes < 1024 * 1024 * 1024
    ? Math.round(bytes / 1024 / 1024) + ' MB'
    : (bytes / 1024 / 1024 / 1024).toFixed(1) + ' GB';
}

function progressBar(used, total, size = 10) {
  const pct = Math.round((used / total) * size);
  return '█'.repeat(pct) + '░'.repeat(size - pct) + ' ' + Math.round((used / total) * 100) + '%';
}

// ─── menu ────────────────────────────────────────────────────

const menu = {
  command: ['menu', 'help'],
  desc:    'Show command list and bot status',
  run: async ({ trashcore, chat, m, botStartTime }) => {
    const startTime     = botStartTime || global.botStartTime || Date.now();
    const uptimeSeconds = Math.max(1, Math.floor((Date.now() - startTime) / 1000));
    const uptime        = formatUptime(uptimeSeconds);

    const prefix      = await getSetting('prefix', '.');
    const privateMode = await getSetting('privateMode', false);
    const mode        = privateMode ? 'PRIVATE' : 'PUBLIC';
    const platform    = detectPlatform();

    const botNum      = trashcore.user?.id?.split(':')[0] || trashcore.user?.id?.split('@')[0] || '';

    const start = Date.now();
    const pingMs = Date.now() - start;

    const memUsage       = process.memoryUsage();
    const botUsed        = memUsage.heapUsed;
    const totalMem       = os.totalmem();
    const systemUsedMem  = totalMem - os.freemem();

    const grouped = groupByCategory(plugins);

    let text = `┏❐✦ TRASHCORE ULTRA ✦❐\n`;
    text += `┃✦ Prefix: [${prefix}]\n`;
    text += `┃✦ Owner: TrashCore\n`;
    text += `┃✦ Mode: ${mode}\n`;
    text += `┃✦ Platform: ${platform}\n`;
    text += `┃✦ Speed: ${pingMs} ms\n`;
    text += `┃✦ Uptime: ${uptime}\n`;
    text += `┃✦ Version: v5.0.0\n`;
    text += `┃✦ Usage: ${formatMemory(botUsed)} of ${formatMemory(totalMem)}\n`;
    text += `┃✦ RAM: [${progressBar(systemUsedMem, totalMem)}]\n`;
    text += `┗❐\n${readmore}\n`;

    let sectionIndex = 0;
    for (const [category, cmds] of Object.entries(grouped)) {
      text += `┏❐ \`${category.toUpperCase()} COMMAND\` ❐\n`;
      cmds.sort();
      for (const cmd of cmds) {
        text += `┃  ${cmd}\n`;
      }
      text += `┗❐\n`;
      sectionIndex++;
      if (sectionIndex % 3 === 0) {
        text += `${readmore}\n`;
      } else {
        text += `\n`;
      }
    }

    await trashcore.sendMessage(chat, {
      image:   { url: 'https://files.catbox.moe/en2v4a.jpg' },
      caption: text
    }, { quoted: m });
  }
};

// ─── ping ────────────────────────────────────────────────────

const ping = {
  command: ['ping', 'p'],
  desc:    'Check bot latency',
  category: 'Utility',
  usage:   '.ping',
  run: async ({ m, xreply }) => {
    const start = Date.now();
    await xreply('Pinging...');
    await xreply(`📍 Pong: ${Date.now() - start} ms`);
  }
};

// ─── runtime ─────────────────────────────────────────────────

const runtime = {
  command: ['runtime', 'uptime', 'host'],
  desc:    'Check bot runtime and hosting platform',
  category: 'Utility',
  usage:   '.runtime',
  run: async ({ m, xreply }) => {
    const host   = detectPlatform();
    const uptime = formatUptime(process.uptime());
    await xreply(
      `*🤖 TRASHCORE ULTRA*\n\n📡 *Platform:* ${host}\n⏱️ *Runtime:* ${uptime}\n🔄 *Status:* Active\n\n> Bot is running smoothly on ${host}`
    );
  }
};

// ─── exports ────────────────────────────────────────────────

module.exports = [menu, ping, runtime];

// ============================================================
//  ULTRA X PROJECT — by TrashX
//  plugins/group/group3.js  |  Protection & Advanced Group Commands
// ============================================================

const { getSetting, setSetting } = require('../../database');

// ─── helper: require group + admin ───────────────────────────

function requireGroup(isGroup, xreply) {
  if (!isGroup) { xreply('⚠️ This command is for groups only.'); return false; }
  return true;
}

// ─── anticall ────────────────────────────────────────────────

const anticall = {
  command: ['anticall'],
  desc:    'Block incoming calls (owner only)',
  category: 'Owner',
  usage:   '.anticall on/off',
  run: async ({ args, xreply, isOwner }) => {
    if (!isOwner) return xreply('❌ Owner only command.');
    const state = args[0]?.toLowerCase();
    if (state !== 'on' && state !== 'off') return xreply('Usage: .anticall on/off');
    setSetting('anticall', state === 'on');
    xreply(`✅ Anti-call is now *${state.toUpperCase()}*\n${state === 'on' ? '📵 All calls will be rejected.' : '📞 Calls are allowed.'}`);
  }
};

// ─── antibot ─────────────────────────────────────────────────

const antibot = {
  command: ['antibot'],
  desc:    'Remove other bots from group (admin only)',
  category: 'Group',
  usage:   '.antibot on/off',
  run: async ({ chat, args, xreply, isGroup, isAdmin }) => {
    if (!requireGroup(isGroup, xreply)) return;
    if (!isAdmin) return xreply('❌ Admins only.');
    const state = args[0]?.toLowerCase();
    if (state !== 'on' && state !== 'off') return xreply('Usage: .antibot on/off');
    setSetting(`antibot_${chat}`, state === 'on');
    xreply(`🤖 Anti-bot is now *${state.toUpperCase()}* in this group.\n${state === 'on' ? '🚫 Bot accounts will be removed.' : ''}`);
  }
};

// ─── antisticker ─────────────────────────────────────────────

const antisticker = {
  command: ['antisticker'],
  desc:    'Delete stickers sent in group (admin only)',
  category: 'Group',
  usage:   '.antisticker on/off',
  run: async ({ chat, args, xreply, isGroup, isAdmin }) => {
    if (!requireGroup(isGroup, xreply)) return;
    if (!isAdmin) return xreply('❌ Admins only.');
    const state = args[0]?.toLowerCase();
    if (state !== 'on' && state !== 'off') return xreply('Usage: .antisticker on/off');
    setSetting(`antisticker_${chat}`, state === 'on');
    xreply(`🚫 Anti-sticker is *${state.toUpperCase()}*\n${state === 'on' ? '🗑️ Stickers will be deleted.' : ''}`);
  }
};

// ─── antiimage ───────────────────────────────────────────────

const antiimage = {
  command: ['antiimage', 'antipic'],
  desc:    'Delete images sent in group (admin only)',
  category: 'Group',
  usage:   '.antiimage on/off',
  run: async ({ chat, args, xreply, isGroup, isAdmin }) => {
    if (!requireGroup(isGroup, xreply)) return;
    if (!isAdmin) return xreply('❌ Admins only.');
    const state = args[0]?.toLowerCase();
    if (state !== 'on' && state !== 'off') return xreply('Usage: .antiimage on/off');
    setSetting(`antiimage_${chat}`, state === 'on');
    xreply(`🖼️ Anti-image is *${state.toUpperCase()}*\n${state === 'on' ? '🗑️ Images will be deleted.' : ''}`);
  }
};

// ─── antivideo ───────────────────────────────────────────────

const antivideo = {
  command: ['antivideo'],
  desc:    'Delete videos sent in group (admin only)',
  category: 'Group',
  usage:   '.antivideo on/off',
  run: async ({ chat, args, xreply, isGroup, isAdmin }) => {
    if (!requireGroup(isGroup, xreply)) return;
    if (!isAdmin) return xreply('❌ Admins only.');
    const state = args[0]?.toLowerCase();
    if (state !== 'on' && state !== 'off') return xreply('Usage: .antivideo on/off');
    setSetting(`antivideo_${chat}`, state === 'on');
    xreply(`🎬 Anti-video is *${state.toUpperCase()}*\n${state === 'on' ? '🗑️ Videos will be deleted.' : ''}`);
  }
};

// ─── antimention ─────────────────────────────────────────────

const antimention = {
  command: ['antimention', 'antitag'],
  desc:    'Prevent tagging everyone in group (admin only)',
  category: 'Group',
  usage:   '.antimention on/off',
  run: async ({ chat, args, xreply, isGroup, isAdmin }) => {
    if (!requireGroup(isGroup, xreply)) return;
    if (!isAdmin) return xreply('❌ Admins only.');
    const state = args[0]?.toLowerCase();
    if (state !== 'on' && state !== 'off') return xreply('Usage: .antimention on/off');
    setSetting(`antimention_${chat}`, state === 'on');
    xreply(`📣 Anti-mention is *${state.toUpperCase()}*\n${state === 'on' ? '🚫 Mass mentions will be removed.' : ''}`);
  }
};

// ─── warn ────────────────────────────────────────────────────

const warnStore = new Map();

function getWarns(chat) {
  const key = `warns_${chat}`;
  const raw = getSetting(key);
  if (!raw) return {};
  try { return JSON.parse(raw); } catch (_) { return {}; }
}

function saveWarns(chat, data) {
  setSetting(`warns_${chat}`, JSON.stringify(data));
}

const warn = {
  command: ['warn'],
  desc:    'Warn a group member (admin only)',
  category: 'Group',
  usage:   '.warn @user [reason]',
  run: async ({ trashcore, m, chat, args, xreply, isGroup, isAdmin }) => {
    if (!requireGroup(isGroup, xreply)) return;
    if (!isAdmin) return xreply('❌ Admins only.');
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target   = mentions[0] || quoted;
    if (!target) return xreply('⚠️ Mention or reply to the user to warn.\nUsage: .warn @user [reason]');
    const reason = args.slice(mentions.length ? 1 : 0).join(' ') || 'No reason given';
    const warns  = getWarns(chat);
    warns[target] = (warns[target] || 0) + 1;
    saveWarns(chat, warns);
    const count = warns[target];
    let msg = `⚠️ *WARNING* ⚠️\n\n👤 @${target.split('@')[0]} has been warned!\n💬 Reason: ${reason}\n🔢 Warnings: *${count}/3*`;
    if (count >= 3) {
      try {
        await trashcore.groupParticipantsUpdate(chat, [target], 'remove');
        warns[target] = 0;
        saveWarns(chat, warns);
        msg += '\n\n🚫 *Kicked* after 3 warnings!';
      } catch (_) { msg += '\n\n❌ Failed to kick (bot may not be admin).'; }
    }
    await trashcore.sendMessage(chat, { text: msg, mentions: [target] }, { quoted: m });
  }
};

// ─── warnings ────────────────────────────────────────────────

const warnings = {
  command: ['warnings', 'checkwarn'],
  desc:    'View warnings for a user',
  category: 'Group',
  usage:   '.warnings @user',
  run: async ({ trashcore, m, chat, xreply, isGroup }) => {
    if (!requireGroup(isGroup, xreply)) return;
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target   = mentions[0] || quoted || m.sender;
    const warns    = getWarns(chat);
    const count    = warns[target] || 0;
    await trashcore.sendMessage(chat, {
      text:     `⚠️ *Warnings for @${target.split('@')[0]}*\n🔢 Count: *${count}/3*`,
      mentions: [target]
    }, { quoted: m });
  }
};

// ─── clearwarn ───────────────────────────────────────────────

const clearwarn = {
  command: ['clearwarn', 'resetwarn'],
  desc:    'Clear warnings for a user (admin only)',
  category: 'Group',
  usage:   '.clearwarn @user',
  run: async ({ trashcore, m, chat, xreply, isGroup, isAdmin }) => {
    if (!requireGroup(isGroup, xreply)) return;
    if (!isAdmin) return xreply('❌ Admins only.');
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target   = mentions[0] || quoted;
    if (!target) return xreply('⚠️ Mention or reply to the user.');
    const warns = getWarns(chat);
    warns[target] = 0;
    saveWarns(chat, warns);
    await trashcore.sendMessage(chat, {
      text:     `✅ Warnings cleared for @${target.split('@')[0]}`,
      mentions: [target]
    }, { quoted: m });
  }
};

// ─── pmblocker ───────────────────────────────────────────────

const pmblocker = {
  command: ['pmblocker', 'pmdblock'],
  desc:    'Block strangers from DMing the bot (owner only)',
  category: 'Owner',
  usage:   '.pmblocker on/off',
  run: async ({ args, xreply, isOwner }) => {
    if (!isOwner) return xreply('❌ Owner only.');
    const state = args[0]?.toLowerCase();
    if (state !== 'on' && state !== 'off') return xreply('Usage: .pmblocker on/off');
    setSetting('pmblocker', state === 'on');
    xreply(`🔒 PM Blocker is *${state.toUpperCase()}*\n${state === 'on' ? '📵 Only contacts can DM the bot.' : '💬 DMs are open.'}`);
  }
};

// ─── alwaysonline ────────────────────────────────────────────

let presInterval = null;

const alwaysonline = {
  command: ['alwaysonline', 'onlineon'],
  desc:    'Keep bot always showing as online (owner only)',
  category: 'Owner',
  usage:   '.alwaysonline on/off',
  run: async ({ trashcore, args, xreply, isOwner }) => {
    if (!isOwner) return xreply('❌ Owner only.');
    const state = args[0]?.toLowerCase();
    if (state !== 'on' && state !== 'off') return xreply('Usage: .alwaysonline on/off');
    if (state === 'on') {
      if (presInterval) clearInterval(presInterval);
      presInterval = setInterval(async () => {
        try { await trashcore.sendPresenceUpdate('available'); } catch (_) {}
      }, 10000);
      xreply('✅ Always Online is *ON* — bot will appear online continuously.');
    } else {
      if (presInterval) { clearInterval(presInterval); presInterval = null; }
      try { await trashcore.sendPresenceUpdate('unavailable'); } catch (_) {}
      xreply('✅ Always Online is *OFF* — bot presence is now normal.');
    }
  }
};

// ─── lastseen ────────────────────────────────────────────────

const lastseen = {
  command: ['lastseen', 'ls'],
  desc:    'Hide or show last seen (owner only)',
  category: 'Owner',
  usage:   '.lastseen on/off',
  run: async ({ trashcore, args, xreply, isOwner }) => {
    if (!isOwner) return xreply('❌ Owner only.');
    const state = args[0]?.toLowerCase();
    if (state !== 'on' && state !== 'off') return xreply('Usage: .lastseen on/off\non = hide, off = show');
    try {
      await trashcore.updateLastSeenPrivacy(state === 'on' ? 'none' : 'all');
      xreply(`✅ Last seen is now *${state === 'on' ? 'HIDDEN' : 'VISIBLE'}*`);
    } catch (err) {
      xreply('❌ Failed to update last seen privacy: ' + err.message);
    }
  }
};

// ─── creategroup ─────────────────────────────────────────────

const creategroup = {
  command: ['creategroup', 'newgroup', 'mkgroup'],
  desc:    'Create a new group (owner only)',
  category: 'Owner',
  usage:   '.creategroup <group name>',
  run: async ({ trashcore, m, args, xreply, isOwner, chat }) => {
    if (!isOwner) return xreply('❌ Owner only.');
    const name = args.join(' ').trim();
    if (!name) return xreply('Usage: .creategroup <group name>');
    try {
      const result = await trashcore.groupCreate(name, [m.sender]);
      xreply(`✅ Group *${name}* created!\n🔗 ${result.gid || 'Done'}`);
    } catch (err) {
      xreply('❌ Failed to create group: ' + err.message);
    }
  }
};

// ─── groupinfo ───────────────────────────────────────────────

const groupinfo = {
  command: ['groupinfo', 'ginfo'],
  desc:    'Show detailed group information',
  category: 'Group',
  usage:   '.groupinfo',
  run: async ({ trashcore, m, chat, xreply, isGroup }) => {
    if (!requireGroup(isGroup, xreply)) return;
    try {
      const meta  = await trashcore.groupMetadata(chat);
      const admins = meta.participants.filter(p => p.admin).map(p => `@${p.id.split('@')[0]}`);
      const text =
        `👥 *Group Information*\n` +
        `─────────────────\n` +
        `📛 Name: *${meta.subject}*\n` +
        `🆔 ID: \`${chat}\`\n` +
        `👤 Members: *${meta.participants.length}*\n` +
        `🛡️ Admins: *${admins.length}*\n` +
        `📝 Description:\n_${meta.desc || 'No description set'}_\n\n` +
        `🛡️ *Admins:*\n${admins.join(', ')}`;
      await trashcore.sendMessage(chat, {
        text,
        mentions: meta.participants.filter(p => p.admin).map(p => p.id)
      }, { quoted: m });
    } catch (err) {
      xreply('❌ Failed to fetch group info: ' + err.message);
    }
  }
};

// ─── tagall ──────────────────────────────────────────────────

const tagall = {
  command: ['tagall', 'everyone', '@all'],
  desc:    'Tag all members in the group (admin only)',
  category: 'Group',
  usage:   '.tagall [message]',
  run: async ({ trashcore, m, chat, args, xreply, isGroup, isAdmin, isOwner }) => {
    if (!requireGroup(isGroup, xreply)) return;
    if (!isAdmin && !isOwner) return xreply('❌ Admins only.');
    try {
      const meta = await trashcore.groupMetadata(chat);
      const members = meta.participants.map(p => p.id);
      const msg = args.join(' ') || '📢 Attention everyone!';
      const mentions = members.map(id => `@${id.split('@')[0]}`).join(' ');
      await trashcore.sendMessage(chat, {
        text:     `📢 *${msg}*\n\n${mentions}`,
        mentions: members
      }, { quoted: m });
    } catch (err) {
      xreply('❌ Failed to tag all: ' + err.message);
    }
  }
};

// ─── exports ─────────────────────────────────────────────────

module.exports = [
  anticall, antibot, antisticker, antiimage, antivideo, antimention,
  warn, warnings, clearwarn, pmblocker, alwaysonline, lastseen,
  creategroup, groupinfo, tagall
];

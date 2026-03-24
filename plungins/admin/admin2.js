// ============================================================
//  ULTRA X PROJECT — by TrashX
//  plugins/admin/admin2.js  |  Extended Owner & Admin Commands
// ============================================================

const fs   = require('fs');
const path = require('path');
const os   = require('os');
const { downloadContentFromMessage } = require('@trashcore/baileys');
const { getSetting, setSetting }     = require('../../database');

// ─── restart ─────────────────────────────────────────────────

const restart = {
  command: ['restart', 'reboot'],
  desc:    'Restart the bot (owner only)',
  category: 'Owner',
  usage:   '.restart',
  run: async ({ xreply, isOwner }) => {
    if (!isOwner) return xreply('❌ Owner only.');
    await xreply('🔄 *Restarting bot...* Give it a few seconds!');
    setTimeout(() => process.exit(0), 3000);
  }
};

// ─── clearsession ────────────────────────────────────────────

const clearsession = {
  command: ['clearsession', 'clearcreds'],
  desc:    'Clear bot session (WARNING: will require re-scan) — owner only',
  category: 'Owner',
  usage:   '.clearsession',
  run: async ({ xreply, isOwner, args }) => {
    if (!isOwner) return xreply('❌ Owner only.');
    if (args[0] !== 'confirm') return xreply('⚠️ This will delete the bot session!\nType .clearsession confirm to proceed.');
    try {
      const sessionDir = path.join(process.cwd(), 'session');
      if (fs.existsSync(sessionDir)) {
        const files = fs.readdirSync(sessionDir).filter(f => f !== 'creds.json');
        for (const f of files) fs.unlinkSync(path.join(sessionDir, f));
      }
      xreply('✅ Session cache cleared. Bot will resync on next message.');
    } catch (err) {
      xreply('❌ Failed to clear session: ' + err.message);
    }
  }
};

// ─── cleartmp ────────────────────────────────────────────────

const cleartmp = {
  command: ['cleartmp', 'cleartemp'],
  desc:    'Clear temp folder (owner only)',
  category: 'Owner',
  usage:   '.cleartmp',
  run: async ({ xreply, isOwner }) => {
    if (!isOwner) return xreply('❌ Owner only.');
    const tmpDir = path.join(process.cwd(), 'temp');
    let count = 0;
    try {
      if (fs.existsSync(tmpDir)) {
        const files = fs.readdirSync(tmpDir);
        for (const f of files) {
          try { fs.unlinkSync(path.join(tmpDir, f)); count++; } catch (_) {}
        }
      }
      xreply(`✅ Cleared ${count} temp file(s).`);
    } catch (err) {
      xreply('❌ Failed to clear temp: ' + err.message);
    }
  }
};

// ─── addsudo ─────────────────────────────────────────────────

const addsudo = {
  command: ['addsudo', 'addmod'],
  desc:    'Add a sudo/moderator user (owner only)',
  category: 'Owner',
  usage:   '.addsudo @user',
  run: async ({ m, args, xreply, isOwner, trashcore, chat }) => {
    if (!isOwner) return xreply('❌ Owner only.');
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    let target = mentions[0] || quoted || args[0];
    if (!target) return xreply('Usage: .addsudo @user or reply');
    if (!/\@/.test(target)) target = target.replace(/\D/g, '') + '@s.whatsapp.net';
    const raw = getSetting('sudoUsers');
    const list = raw ? JSON.parse(raw) : [];
    if (list.includes(target)) return xreply(`⚠️ @${target.split('@')[0]} is already a sudo user.`);
    list.push(target);
    setSetting('sudoUsers', JSON.stringify(list));
    await trashcore.sendMessage(chat, {
      text:     `✅ @${target.split('@')[0]} added as *sudo/mod*!`,
      mentions: [target]
    }, { quoted: m });
  }
};

// ─── delsudo ─────────────────────────────────────────────────

const delsudo = {
  command: ['delsudo', 'removesudo', 'removemod'],
  desc:    'Remove a sudo/moderator user (owner only)',
  category: 'Owner',
  usage:   '.delsudo @user',
  run: async ({ m, args, xreply, isOwner, trashcore, chat }) => {
    if (!isOwner) return xreply('❌ Owner only.');
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    let target = mentions[0] || quoted || args[0];
    if (!target) return xreply('Usage: .delsudo @user or reply');
    if (!/\@/.test(target)) target = target.replace(/\D/g, '') + '@s.whatsapp.net';
    const raw  = getSetting('sudoUsers');
    const list = raw ? JSON.parse(raw) : [];
    const idx  = list.indexOf(target);
    if (idx === -1) return xreply(`⚠️ @${target.split('@')[0]} is not a sudo user.`);
    list.splice(idx, 1);
    setSetting('sudoUsers', JSON.stringify(list));
    await trashcore.sendMessage(chat, {
      text:     `✅ @${target.split('@')[0]} removed from *sudo*!`,
      mentions: [target]
    }, { quoted: m });
  }
};

// ─── sudolist ────────────────────────────────────────────────

const sudolist = {
  command: ['sudolist', 'mods', 'listmods'],
  desc:    'List all sudo/moderator users (owner only)',
  category: 'Owner',
  usage:   '.sudolist',
  run: async ({ xreply, isOwner }) => {
    if (!isOwner) return xreply('❌ Owner only.');
    const raw  = getSetting('sudoUsers');
    const list = raw ? JSON.parse(raw) : [];
    if (!list.length) return xreply('📋 No sudo users set.');
    xreply(`🛡️ *Sudo / Mod Users:*\n\n${list.map((u, i) => `${i + 1}. @${u.split('@')[0]}`).join('\n')}`);
  }
};

// ─── setbotname ──────────────────────────────────────────────

const setbotname = {
  command: ['setbotname', 'botname'],
  desc:    'Set bot WhatsApp display name (owner only)',
  category: 'Owner',
  usage:   '.setbotname <name>',
  run: async ({ trashcore, args, xreply, isOwner }) => {
    if (!isOwner) return xreply('❌ Owner only.');
    const name = args.join(' ').trim();
    if (!name) return xreply('Usage: .setbotname <new name>');
    try {
      await trashcore.updateProfileName(name);
      xreply(`✅ Bot name updated to: *${name}*`);
    } catch (err) {
      xreply('❌ Failed to update name: ' + err.message);
    }
  }
};

// ─── broadcast ───────────────────────────────────────────────

const broadcast = {
  command: ['broadcast', 'bc'],
  desc:    'Broadcast a message to all groups (owner only)',
  category: 'Owner',
  usage:   '.broadcast <message>',
  run: async ({ trashcore, m, args, xreply, isOwner }) => {
    if (!isOwner) return xreply('❌ Owner only.');
    const msg = args.join(' ').trim();
    if (!msg) return xreply('Usage: .broadcast <your message>');
    await xreply('📢 Sending broadcast...');
    try {
      const groups = await trashcore.groupFetchAllParticipating();
      const ids    = Object.keys(groups);
      let sent = 0;
      for (const id of ids) {
        try {
          await trashcore.sendMessage(id, { text: `📢 *BROADCAST*\n\n${msg}` });
          sent++;
          await new Promise(r => setTimeout(r, 500));
        } catch (_) {}
      }
      xreply(`✅ Broadcast sent to *${sent}/${ids.length}* groups!`);
    } catch (err) {
      xreply('❌ Broadcast failed: ' + err.message);
    }
  }
};

// ─── getlink ─────────────────────────────────────────────────

const getlink = {
  command: ['getlink', 'invitelink', 'glink'],
  desc:    'Get group invite link (admin only)',
  category: 'Group',
  usage:   '.getlink',
  run: async ({ trashcore, m, chat, xreply, isGroup, isAdmin, isOwner }) => {
    if (!isGroup) return xreply('⚠️ Group only.');
    if (!isAdmin && !isOwner) return xreply('❌ Admins only.');
    try {
      const code = await trashcore.groupInviteCode(chat);
      xreply(`🔗 *Group Invite Link:*\nhttps://chat.whatsapp.com/${code}`);
    } catch (err) {
      xreply('❌ Failed to get link (bot must be admin).');
    }
  }
};

// ─── revokelink ──────────────────────────────────────────────

const revokelink = {
  command: ['revokelink', 'resetlink'],
  desc:    'Revoke/reset group invite link (admin only)',
  category: 'Group',
  usage:   '.revokelink',
  run: async ({ trashcore, m, chat, xreply, isGroup, isAdmin, isOwner }) => {
    if (!isGroup) return xreply('⚠️ Group only.');
    if (!isAdmin && !isOwner) return xreply('❌ Admins only.');
    try {
      const code = await trashcore.groupRevokeInvite(chat);
      xreply(`✅ Invite link revoked!\n🔗 New link:\nhttps://chat.whatsapp.com/${code}`);
    } catch (err) {
      xreply('❌ Failed to revoke link: ' + err.message);
    }
  }
};

// ─── sysinfo ─────────────────────────────────────────────────

const sysinfo = {
  command: ['sysinfo', 'system', 'serverinfo'],
  desc:    'Show detailed server/system information',
  category: 'Owner',
  usage:   '.sysinfo',
  run: async ({ xreply, isOwner }) => {
    if (!isOwner) return xreply('❌ Owner only.');
    const mem     = process.memoryUsage();
    const totMem  = os.totalmem();
    const freeMem = os.freemem();
    const used    = ((totMem - freeMem) / 1024 / 1024).toFixed(1);
    const total   = (totMem / 1024 / 1024).toFixed(1);
    const cpus    = os.cpus();
    const cpu     = cpus[0]?.model || 'Unknown';
    const uptime  = process.uptime();
    const d = Math.floor(uptime / 86400);
    const h = Math.floor((uptime % 86400) / 3600);
    const mn = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    xreply(
      `🖥️ *System Information*\n` +
      `─────────────────\n` +
      `💾 RAM: *${used} MB / ${total} MB*\n` +
      `🧠 Heap: *${(mem.heapUsed / 1024 / 1024).toFixed(1)} MB*\n` +
      `⚙️ CPU: *${cpu}*\n` +
      `🔢 Cores: *${cpus.length}*\n` +
      `🖥️ OS: *${os.type()} ${os.release()}*\n` +
      `📦 Node: *${process.version}*\n` +
      `⏱️ Bot Uptime: *${d}d ${h}h ${mn}m ${s}s*\n` +
      `🏠 Hostname: *${os.hostname()}*`
    );
  }
};

// ─── antigroupstatus ─────────────────────────────────────────

const antigroupstatus = {
  command: ['antigroupstatus', 'antigrpstatus', 'antigstt'],
  desc:    'Toggle anti group status/stories (deletes view-once & forwarded-status messages)',
  category: 'Group',
  usage:   '.antigroupstatus on/off',
  run: async ({ chat, args, xreply, isGroup, isAdmin, isOwner }) => {
    if (!isGroup) return xreply('⚠️ This command only works in groups.');
    if (!isAdmin && !isOwner) return xreply('❌ Admins only.');

    const { getSetting, setSetting } = require('../../database');
    const key = `antigroupstatus_${chat}`;

    // No args → show current status
    if (!args[0]) {
      const current = getSetting(key, false);
      return xreply(
        `🚫 *Anti Group Status*\n\n` +
        `Status: ${current ? '✅ ON' : '❌ OFF'}\n\n` +
        `_Usage: .antigroupstatus on/off_\n` +
        `_When ON, view-once messages and statuses/stories shared inside this group will be automatically deleted._`
      );
    }

    if (!['on', 'off'].includes(args[0].toLowerCase()))
      return xreply('Usage: .antigroupstatus on/off');

    const val = args[0].toLowerCase() === 'on';
    setSetting(key, val);

    xreply(
      `🚫 *Anti Group Status* is now *${val ? 'ON ✅' : 'OFF ❌'}*\n\n` +
      (val
        ? `_View-once messages and forwarded statuses/stories will be deleted automatically. Admins are exempt._`
        : `_Status/story messages will no longer be deleted in this group._`)
    );
  }
};

// ─── exports ─────────────────────────────────────────────────

module.exports = [restart, clearsession, cleartmp, addsudo, delsudo, sudolist, setbotname, broadcast, getlink, revokelink, sysinfo, antigroupstatus];

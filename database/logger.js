const lolcatjs = require('lolcatjs');
const moment   = require('moment-timezone');

const TIMEZONE = process.env.TIMEZONE || 'Africa/Nairobi';

// groupName is passed in from index.js (already fetched, no extra network call)
function logMessage(m, groupName) {
  if (!m?.message) return;

  const chatId   = m.key.remoteJid;
  const isGroup  = chatId.endsWith('@g.us');
  const pushname = m.pushName || chatId.split('@')[0];

  const msgObj = m.message;
  const mtype  = Object.keys(msgObj)[0] || 'unknown';

  const body =
    msgObj?.conversation ||
    msgObj?.extendedTextMessage?.text ||
    msgObj?.imageMessage?.caption ||
    msgObj?.videoMessage?.caption ||
    msgObj?.documentMessage?.caption ||
    msgObj?.buttonsResponseMessage?.selectedButtonId ||
    msgObj?.listResponseMessage?.singleSelectReply?.selectedRowId ||
    msgObj?.templateButtonReplyMessage?.selectedId ||
    '';

  const dayz  = moment(Date.now()).tz(TIMEZONE).locale('en').format('dddd');
  const timez = moment(Date.now()).tz(TIMEZONE).locale('en').format('HH:mm:ss z');
  const datez = moment(Date.now()).tz(TIMEZONE).format('DD/MM/YYYY');

  lolcatjs.fromString(`┏━━━━━━━━━━━━━『  JUNE-X BOT 』━━━━━━━━━━━━━─`);
  lolcatjs.fromString(`»  Sent Time: ${dayz}, ${timez}`);
  lolcatjs.fromString(`»  Date: ${datez}`);
  lolcatjs.fromString(`»  Message Type: ${mtype}`);
  lolcatjs.fromString(`»  Sender Name: ${pushname || 'N/A'}`);
  lolcatjs.fromString(`»  Chat ID: ${chatId?.split('@')[0] || 'N/A'}`);

  if (isGroup) {
    lolcatjs.fromString(`»  Group: ${groupName || 'N/A'}`);
    lolcatjs.fromString(`»  Group JID: ${chatId?.split('@')[0] || 'N/A'}`);
  }

  lolcatjs.fromString(`»  Message: ${body || 'N/A'}`);
  lolcatjs.fromString('┗━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━─ ⳹\n');
}

module.exports = { logMessage };

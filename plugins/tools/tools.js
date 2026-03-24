// ============================================================
//  ULTRA X PROJECT — by TrashX
//  plugins/tools/tools.js  |  All Tools Commands
// ============================================================

const axios  = require('axios');
const fs     = require('fs');
const path   = require('path');
const { tmpdir } = require('os');
const { downloadContentFromMessage } = require('@trashcore/baileys');
const { imageToWebp, videoToWebp, writeExifImg, writeExifVid } = require('../../library/exif');
const config = require('../../config');

const API = 'https://api.nexray.web.id';

// ─── claude ──────────────────────────────────────────────────

const claudeAI = {
  name: 'claude',
  command: ['claude', 'claudeai'],
  category: 'AI',
  desc:    'Chat with Claude AI',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    try {
      const text = args.join(' ');
      if (!text) return xreply('Usage: .claude <message>');
      await xreply('🤖 Asking Claude...');
      const { data } = await axios.get(`${API}/ai/claude?text=${encodeURIComponent(text)}`);
      if (!data.status) return xreply('❌ Failed to get response from Claude');
      await trashcore.sendMessage(chat, { text: `💬 Claude says:\n\n${data.result}` }, { quoted: m });
    } catch (err) { console.error(err); xreply('❌ Error contacting Claude AI'); }
  }
};

// ─── copilot ─────────────────────────────────────────────────

const copilot = {
  name: 'copilot',
  command: ['copilot', 'copilotai'],
  category: 'AI',
  desc:    'Chat with Copilot AI',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    try {
      const text = args.join(' ');
      if (!text) return xreply('Usage: .copilot <message>');
      await xreply('🤖 Asking Copilot...');
      const { data } = await axios.get(`${API}/ai/copilot?text=${encodeURIComponent(text)}`);
      if (!data.status) return xreply('❌ Failed to get response from Copilot');
      await trashcore.sendMessage(chat, { text: `💬 Copilot says:\n\n${data.result}` }, { quoted: m });
    } catch (err) { console.error(err); xreply('❌ Error contacting Copilot AI'); }
  }
};

// ─── deepseek ────────────────────────────────────────────────

const deepseek = {
  name: 'deepseek',
  command: ['deepseek', 'deepseekai'],
  category: 'AI',
  desc:    'Chat with DeepSeek AI',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    try {
      const text = args.join(' ');
      if (!text) return xreply('Usage: .deepseek <message>');
      await xreply('🔍 Asking DeepSeek...');
      const { data } = await axios.get(`${API}/ai/deepseek?text=${encodeURIComponent(text)}`);
      if (!data.status) return xreply('❌ Failed to get response from DeepSeek');
      await trashcore.sendMessage(chat, { text: `💬 DeepSeek says:\n\n${data.result}` }, { quoted: m });
    } catch (err) { console.error(err); xreply('❌ Error contacting DeepSeek AI'); }
  }
};

// ─── delete ──────────────────────────────────────────────────

const deleteMsg = {
  command: ['delete', 'del'],
  desc:    'Owner delete message',
  category: 'Tools',
  run: async ({ trashcore, m, chat, xreply, isOwner }) => {
    try {
      if (!isOwner) return xreply('⚠️ Only bot owner can use this command.');
      const quoted = m.quoted || m.message?.extendedTextMessage?.contextInfo;
      if (!quoted) return xreply('⚠️ Reply to the message you want to delete.');
      const key = m.quoted?.key || {
        remoteJid:   chat,
        fromMe:      false,
        id:          m.message.extendedTextMessage.contextInfo.stanzaId,
        participant: m.message.extendedTextMessage.contextInfo.participant
      };
      await trashcore.sendMessage(chat, { delete: key });
    } catch (err) {
      console.error('Delete Error:', err);
      xreply('❌ Failed (bot may not be admin).');
    }
  }
};

// ─── gemini tts ──────────────────────────────────────────────

const gemini = {
  name: 'gemini',
  command: ['gemini', 'tts'],
  category: 'AI',
  desc:    'Convert text to speech with Gemini AI',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    try {
      const text = args.join(' ');
      if (!text) return xreply('Usage: .gemini <text>');
      await xreply('🎤 Generating audio with Gemini...');
      const { data } = await axios.get(`${API}/ai/gemini-tts?text=${encodeURIComponent(text)}`);
      if (!data.status) return xreply('❌ Failed to generate Gemini TTS audio');
      await trashcore.sendMessage(chat, {
        audio: { url: data.result }, mimetype: 'audio/mpeg', fileName: 'gemini.mp3', ptt: true
      }, { quoted: m });
    } catch (err) { console.error(err); xreply('❌ Error contacting Gemini TTS API'); }
  }
};

// ─── llama ───────────────────────────────────────────────────

const llama = {
  command: 'llama',
  desc:    'Chat with LLaMA AI API',
  category: 'AI',
  usage:   '.llama <message>',
  run: async ({ args, xreply }) => {
    try {
      const text = args.join(' ');
      if (!text) return xreply('❌ Please type a message. Example: `.llama hi`');
      const response = await axios.get(`https://apiskeith.vercel.app/ai/ilama?q=${encodeURIComponent(text)}`);
      const replyText = response.data?.result;
      if (!replyText) return xreply('⚠️ No response from the AI.');
      return xreply(replyText);
    } catch (err) {
      console.error('❌ LLaMA API Error:', err.message);
      return xreply('💥 API error! Try again later.');
    }
  }
};

// ─── news ────────────────────────────────────────────────────

const news = {
  name: 'cnn',
  command: ['cnn', 'news'],
  category: 'News',
  desc:    'Get latest news from CNN Indonesia',
  run: async ({ trashcore, m, xreply, chat }) => {
    try {
      await xreply('📰 Fetching latest CNN Indonesia news...');
      const { data } = await axios.get(`${API}/berita/cnn`);
      if (!data.status || !data.result?.length) return xreply('❌ Failed to fetch news');
      for (const item of data.result.slice(0, 5)) {
        await trashcore.sendMessage(chat, {
          image: { url: item.image_full || item.image_thumbnail },
          caption: `📰 *${item.title}*\n\n${item.content.slice(0, 300)}...\n\n🔗 Read more: ${item.link}`
        }, { quoted: m });
      }
    } catch (err) { console.error(err); xreply('❌ Error fetching CNN news'); }
  }
};

// ─── ocr ─────────────────────────────────────────────────────

const ocr = {
  command: ['ocr', 'readtext'],
  desc:    'Extract text from an image',
  category: 'Tools',
  usage:   '.ocr (reply to an image or send an image)',
  run: async ({ m, trashcore, xreply, chat }) => {
    try {
      const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const msg = (quotedMsg?.imageMessage) || m.message?.imageMessage;
      if (!msg) return xreply('⚠️ Send or reply to an *image* with the caption *ocr* to extract text.');
      if (!/image/.test(msg.mimetype || '')) return xreply('⚠️ This command only works with *images*!');

      await trashcore.sendMessage(chat, { react: { text: '⏳', key: m.key } });
      const stream = await downloadContentFromMessage(msg, 'image');
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      const mimeType    = /png/.test(msg.mimetype) ? 'image/png' : 'image/jpeg';
      const imageBase64 = buffer.toString('base64');
      const res = await axios.post(
        'https://staging-ai-image-ocr-266i.frontend.encr.app/api/ocr/process',
        { imageBase64, mimeType },
        { headers: { 'content-type': 'application/json' } }
      );
      const text = res.data.extractedText?.trim() || '❌ No text detected in the image.';
      await xreply(`📄 *Extracted Text:*\n\n${text}`);
      await trashcore.sendMessage(chat, { react: { text: '✅', key: m.key } });
    } catch (err) {
      console.error('❌ OCR Error:', err);
      await xreply('💥 Failed to read text from image. Please try again later.');
      await trashcore.sendMessage(chat, { react: { text: '❌', key: m.key } });
    }
  }
};

// ─── q (quote info) ──────────────────────────────────────────

const quoteInfo = {
  command: ['q', 'quote', 'quotedinfo'],
  desc:    'Get detailed information about a quoted message',
  category: 'Tools',
  run: async ({ trashcore, m, chat, xreply }) => {
    try {
      if (!m.quoted) return xreply('❌ Reply to the message you want to inspect');
      const quoted = m.quoted;
      const messageData = {
        type:            quoted.mtype || 'unknown',
        sender:          quoted.sender || 'unknown',
        chat:            quoted.chat || chat,
        timestamp:       quoted.timestamp || Date.now(),
        text:            quoted.text || quoted.body || '',
        caption:         quoted.caption || '',
        mimetype:        quoted.mimetype || '',
        isForwarded:     quoted.isForwarded || false,
        forwardingScore: quoted.forwardingScore || 0,
        hasMedia:        quoted.hasMedia || false,
        quoted:          quoted.isQuoted || false,
        key:             quoted.key || {}
      };

      if (quoted.hasMedia) {
        try {
          const tempDir  = path.join(process.cwd(), 'temp');
          if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
          const tempFile = path.join(tempDir, `quote_${Date.now()}`);
          const stream   = await downloadContentFromMessage(quoted, quoted.mtype || 'document');
          let buffer = Buffer.from([]);
          for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);
          fs.writeFileSync(tempFile, buffer);
          messageData.mediaSize       = buffer.length;
          messageData.mediaDownloaded = true;
          fs.unlinkSync(tempFile);
        } catch (e) { messageData.mediaError = e.message; }
      }

      await trashcore.sendMessage(chat, {
        text: `📋 *Quote Information*\n\n\`\`\`json\n${JSON.stringify(messageData, null, 2)}\n\`\`\``,
        contextInfo: { mentionedJid: [m.sender] }
      }, { quoted: m });
    } catch (error) {
      console.error('[QUOTEINFO ERROR]', error);
      await xreply('❌ Failed to fetch quoted message information');
    }
  }
};

// ─── repo ────────────────────────────────────────────────────

const repo = {
  command: ['repo', 'repository'],
  desc:    'Get information about the Trashcore Ultra GitHub repository',
  category: 'Info',
  usage:   '.repo',
  run: async ({ m, xreply }) => {
    const owner  = 'Tennor-modz';
    const repoId = 'trashcore-ultra';
    await xreply('📡 *Fetching repository data...*');
    try {
      const { data } = await axios.get(`https://api.github.com/repos/${owner}/${repoId}`, { headers: { 'User-Agent': 'TrashcoreBot' } });
      await xreply(
        `╭━━━━━━━━━━━━━━━━━━━━━━╮\n┃   🚀 *TRASHCORE ULTRA*   ┃\n╰━━━━━━━━━━━━━━━━━━━━━━╯\n\n` +
        `📁 *Repository*\n  └ ${data.name}\n🔗 *URL*\n  └ ${data.html_url}\n\n` +
        `📊 *GitHub Stats*\n  ├ ⭐ Stars: ${data.stargazers_count.toLocaleString()}\n  ├ 🍴 Forks: ${data.forks_count.toLocaleString()}\n` +
        `  └ 🐛 Issues: ${data.open_issues_count}\n\n👤 *Owner*\n  └ ${data.owner.login}\n` +
        `📝 *License*\n  └ ${data.license?.name || 'None'}\n\n🌟 *Star on GitHub:*\n🔗 https://github.com/${owner}/${repoId}`
      );
    } catch (err) {
      console.error('Repo error:', err);
      await xreply(`❌ *Error fetching repository*\n\n\`\`\`${err.message}\`\`\``);
    }
  }
};

// ─── shorturl ────────────────────────────────────────────────

const shorturl = {
  command: ['shortlink', 'shorturl'],
  desc:    'Create a short URL from a link',
  category: 'Tools',
  run: async ({ text, xreply }) => {
    try {
      const input = text.trim();
      if (!input) return xreply('❌ Please provide a link to shorten!\nExample:\n.shortlink https://google.com');
      const { data } = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(input)}`);
      await xreply(`✅ Shortlink created successfully:\n${data}`);
    } catch (e) {
      console.error('SHORTLINK ERROR:', e);
      await xreply('❌ Failed to create shortlink: ' + (e.message || e));
    }
  }
};

// ─── ssweb ───────────────────────────────────────────────────

const ssweb = {
  command: ['ssweb', 'ss'],
  desc:    'Take a screenshot of a website',
  category: 'Tools',
  run: async ({ trashcore, m, chat, xreply }) => {
    try {
      const rawText =
        m.message?.conversation ||
        m.message?.extendedTextMessage?.text ||
        m.message?.imageMessage?.caption || '';

      const args = rawText.trim().split(/\s+/).slice(1);
      if (!args[0]) return xreply('❌ Example:\n.ssweb google.com');

      let url = args[0].trim();
      if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

      const pick   = (k, d) => { const f = args.find(a => a.startsWith(`--${k}=`)); return f ? f.split('=').slice(1).join('=').trim() : d; };
      const toBool = v => /^(1|true|on|ya|y)$/i.test(String(v));

      await xreply('⏳ Taking screenshot...');
      const { data } = await axios.post(
        'https://gcp.imagy.app/screenshot/createscreenshot',
        { url, browserWidth: parseInt(pick('w', 1280)), browserHeight: parseInt(pick('h', 720)), fullPage: toBool(pick('full', false)), deviceScaleFactor: parseInt(pick('scale', 1)), format: 'png' },
        { headers: { 'content-type': 'application/json', referer: 'https://imagy.app/full-page-screenshot-taker/', 'user-agent': 'Mozilla/5.0' }, timeout: 30000 }
      );
      if (!data?.fileUrl) return xreply('❌ Failed to get screenshot file');
      await trashcore.sendMessage(chat, { image: { url: data.fileUrl }, caption: `✅ Screenshot successful\n🌐 URL: ${url}` }, { quoted: m });
    } catch (e) {
      console.error('SSWEB ERROR:', e);
      await xreply('⚠️ ' + (e.message || 'An error occurred'));
    }
  }
};

// ─── sticker ─────────────────────────────────────────────────

const sticker = {
  command: ['sticker', 's'],
  desc:    'Create a sticker from image or video',
  category: 'Fun',
  usage:   '.sticker (reply to image/video or send media directly)',
  run: async ({ m, trashcore, xreply, command, chat }) => {
    try {
      const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const msg =
        (quotedMsg && (quotedMsg.imageMessage || quotedMsg.videoMessage)) ||
        m.message?.imageMessage ||
        m.message?.videoMessage;

      if (!msg) return xreply(`⚠️ Reply to an *image* or *video* with caption *${command}*\n\n🎥 *Max Video Duration:* 30 seconds`);
      const mime = msg.mimetype || '';
      if (!/image|video/.test(mime)) return xreply('⚠️ Only works on *image* or *video* messages!');
      if (msg.videoMessage?.seconds > 30) return xreply('⚠️ Maximum video duration is 30 seconds!');

      await xreply('🪄 Creating your sticker...');
      const stream = await downloadContentFromMessage(msg, mime.split('/')[0]);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      let webpPath;
      const opts = { packname: config.PACK_NAME || 'Trashcore Stickers', author: config.AUTHOR || 'Trashcore' };
      if (/image/.test(mime)) webpPath = await writeExifImg(buffer, opts);
      else                    webpPath = await writeExifVid(buffer, opts);

      await trashcore.sendMessage(chat, { sticker: fs.readFileSync(webpPath) }, { quoted: m });
      fs.unlinkSync(webpPath);
    } catch (err) {
      console.error('❌ sticker error:', err);
      await xreply(`💥 Failed to create sticker:\n${err.message}`);
    }
  }
};

// ─── translate ───────────────────────────────────────────────

const langMap = {
  id: 'Indonesia', en: 'English', ja: 'Japanese', ko: 'Korean', zh: 'Chinese',
  ar: 'Arabic', fr: 'French', de: 'German', es: 'Spanish', it: 'Italian',
  pt: 'Portuguese', ru: 'Russian', tr: 'Turkish', th: 'Thai', vi: 'Vietnamese',
  ms: 'Malay', nl: 'Dutch', pl: 'Polish', sv: 'Swedish', hi: 'Hindi'
};

async function translateText(text, to, from = 'auto') {
  const { data } = await axios.get('https://translate.googleapis.com/translate_a/single', {
    params: { client: 'gtx', sl: from, tl: to, dt: 't', q: text }
  });
  return { result: data[0]?.map(s => s?.[0]).filter(Boolean).join(''), detectedLang: data[2] || from };
}

const translate = {
  command: ['tr', 'translate', 'tl'],
  desc:    'Translate text to another language',
  category: 'Tools',
  usage:   '.tr <lang> <text> or reply message',
  run: async ({ m, args, xreply }) => {
    try {
      const quoted = m.quoted || null;
      if (!args.length) {
        return xreply('*Auto Translate*\n\nFormat:\n.tr <language code> <text>\n.tr <language code> (reply message)\n\n*Language Codes:*\n' + Object.entries(langMap).map(([k, v]) => `${k} — ${v}`).join('\n'));
      }
      const to = args[0].toLowerCase();
      if (!langMap[to]) return xreply(`❌ Language code *${to}* not recognized.\n\nType *.tr* to see the list.`);
      const text = args.slice(1).join(' ') || quoted?.text || quoted?.caption || '';
      if (!text) return xreply('⚠️ Provide text or reply to a message.\nExample:\n.tr en halo dunia');
      const { result, detectedLang } = await translateText(text, to);
      return xreply(`🌐 *Translate*\n\nFrom : ${langMap[detectedLang] || detectedLang}\nTo   : ${langMap[to]}\n\n${result}`);
    } catch (err) {
      console.error('Translate Error:', err);
      xreply('❌ Translation failed.');
    }
  }
};

// ─── venice ──────────────────────────────────────────────────

const venice = {
  name: 'venice',
  command: ['venice', 'veniceai'],
  category: 'AI',
  desc:    'Chat with Venice AI',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    try {
      const text = args.join(' ');
      if (!text) return xreply('Usage: .venice <message>');
      await xreply('🌊 Asking Venice AI...');
      const { data } = await axios.get(`${API}/ai/venice?text=${encodeURIComponent(text)}`);
      if (!data.status) return xreply('❌ Failed to get response from Venice AI');
      await trashcore.sendMessage(chat, { text: `💬 Venice says:\n\n${data.result}` }, { quoted: m });
    } catch (err) { console.error(err); xreply('❌ Error contacting Venice AI'); }
  }
};

// ─── vv (viewonce) ───────────────────────────────────────────

const vv = {
  command: ['vv', 'viewonce'],
  desc:    'Retrieve view-once media',
  category: 'Tools',
  run: async ({ trashcore, m, xreply, chat }) => {
    try {
      if (!m.quoted) return xreply('⚠️ Reply to a *view once* message!');
      const quotedMsg = m.quoted.message;
      const viewOnceMsg =
        quotedMsg?.viewOnceMessage?.message ||
        quotedMsg?.viewOnceMessageV2?.message ||
        quotedMsg?.viewOnceMessageV2Extension?.message ||
        quotedMsg;

      const imageMsg = viewOnceMsg?.imageMessage;
      const videoMsg = viewOnceMsg?.videoMessage;
      if (!imageMsg && !videoMsg) return xreply('⚠️ This is not a *view once* message!');

      const type   = imageMsg ? 'image' : 'video';
      const stream = await downloadContentFromMessage(imageMsg || videoMsg, type);
      let buffer = Buffer.from([]);
      for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

      await trashcore.sendMessage(chat,
        type === 'image'
          ? { image: buffer, caption: '*Retrieved by Trashcore*' }
          : { video: buffer, caption: '*Retrieved by Trashcore*' },
        { quoted: m }
      );
    } catch (err) {
      console.error('VV Error:', err);
      xreply('❌ Failed to retrieve view-once media.');
    }
  }
};

// ─── citizen ─────────────────────────────────────────────────

const citizen = {
  command: ['citizen'],
  desc:    'Get the latest news from Citizen Digital',
  category: 'News',
  run: async ({ trashcore, m, xreply, chat }) => {
    try {
      await xreply('📰 Fetching latest Citizen news...');

      const { data } = await axios.get('https://apiskeith.top/news/citizen');
      if (!data?.status || !data.result)
        return xreply('❌ Failed to fetch Citizen news.');

      const { pinnedStories = [], topStories = [] } = data.result;
      if (pinnedStories.length === 0 && topStories.length === 0)
        return xreply('⚠️ No news available right now.');

      let text = `🗞️ *Citizen Digital News*\n`;
      text += `🔗 [Website](${data.result.url})\n`;
      text += `🕒 Last Updated: ${new Date(data.result.lastUpdated).toLocaleString()}\n\n`;

      if (pinnedStories.length) {
        text += `📌 *Pinned Stories*\n`;
        pinnedStories.slice(0, 5).forEach((item, i) => {
          text += `*${i + 1}.* ${item.title}\n🔗 ${item.url}\n\n`;
        });
      }

      if (topStories.length) {
        text += `⭐ *Top Stories*\n`;
        topStories.slice(0, 5).forEach((item, i) => {
          text += `*${i + 1}.* ${item.title}\n🔗 ${item.url}\n\n`;
        });
      }

      await trashcore.sendMessage(chat, { text }, { quoted: m });
    } catch (err) {
      console.error('CITIZEN ERROR:', err?.message || err);
      await xreply('❌ Error fetching Citizen news.');
    }
  }
};

// ─── kbc ─────────────────────────────────────────────────────

const kbc = {
  command: ['kbc'],
  desc:    'Get latest KBC news headlines',
  category: 'News',
  run: async ({ trashcore, m, xreply, chat }) => {
    try {
      await xreply('📰 Fetching KBC news...');

      const { data } = await axios.get('https://apiskeith.top/news/kbc');
      if (!data.status || !data.result)
        return xreply('❌ Failed to get news or no data available.');

      const news = data.result.breakingNews;
      if (!Array.isArray(news) || news.length === 0)
        return xreply('⚠️ No breaking news available right now.');

      let text = `🗞️ *Latest KBC News Headlines*\n\n`;
      news.slice(0, 10).forEach((item, i) => {
        text += `*${i + 1}.* ${item.title}\n🔗 ${item.url}\n\n`;
      });

      await trashcore.sendMessage(chat, { text }, { quoted: m });
    } catch (err) {
      console.error('KBC Command Error:', err);
      await xreply('❌ Error fetching KBC news.');
    }
  }
};

// ─── exports ────────────────────────────────────────────────

module.exports = [claudeAI, citizen, copilot, deepseek, deleteMsg, gemini, kbc, llama, news, ocr, quoteInfo, repo, shorturl, ssweb, sticker, translate, venice, vv];

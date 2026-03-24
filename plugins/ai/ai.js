// ============================================================
//  ULTRA X PROJECT — by TrashX
//  plugins/ai/ai.js  |  Extended AI Commands
// ============================================================

const axios = require('axios');

const KEITH = 'https://apiskeith.top';
const NEXRAY = 'https://api.nexray.web.id';

// ─── helper: react ───────────────────────────────────────────

async function react(trashcore, m, emoji) {
  try { await trashcore.sendMessage(m.key.remoteJid, { react: { text: emoji, key: m.key } }); } catch (_) {}
}

// ─── gpt4 ────────────────────────────────────────────────────

const gpt4 = {
  command: ['gpt', 'gpt4', 'chatgpt'],
  desc:    'Chat with GPT-4 AI',
  category: 'AI',
  usage:   '.gpt <message>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    const q = args.join(' ');
    if (!q) return xreply('Usage: .gpt <your message>');
    await react(trashcore, m, '⌛');
    try {
      const { data } = await axios.get(`${KEITH}/ai/gpt?q=${encodeURIComponent(q)}`, { timeout: 30000 });
      if (!data?.status || !data.result) return xreply('❌ No response from GPT-4.');
      await react(trashcore, m, '✅');
      await trashcore.sendMessage(chat, { text: `🤖 *GPT-4*\n\n${data.result}` }, { quoted: m });
    } catch (err) {
      await react(trashcore, m, '❌');
      xreply('❌ GPT-4 error: ' + (err.message || 'try again'));
    }
  }
};

// ─── grok ────────────────────────────────────────────────────

const grok = {
  command: ['grok', 'grokai'],
  desc:    'Chat with xAI Grok',
  category: 'AI',
  usage:   '.grok <message>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    const q = args.join(' ');
    if (!q) return xreply('Usage: .grok <your message>');
    await react(trashcore, m, '⌛');
    try {
      const { data } = await axios.get(`${KEITH}/ai/grok?q=${encodeURIComponent(q)}`, { timeout: 30000 });
      if (!data?.status || !data.result) return xreply('❌ No response from Grok.');
      await react(trashcore, m, '✅');
      await trashcore.sendMessage(chat, { text: `🧠 *Grok (xAI)*\n\n${data.result}` }, { quoted: m });
    } catch (err) {
      await react(trashcore, m, '❌');
      xreply('❌ Grok error: ' + (err.message || 'try again'));
    }
  }
};

// ─── wormgpt ─────────────────────────────────────────────────

const wormgpt = {
  command: ['wormgpt', 'wgpt'],
  desc:    'Chat with WormGPT (unrestricted AI)',
  category: 'AI',
  usage:   '.wormgpt <message>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    const q = args.join(' ');
    if (!q) return xreply('Usage: .wormgpt <your message>');
    await react(trashcore, m, '⌛');
    try {
      const { data } = await axios.get(`${KEITH}/ai/wormgpt?q=${encodeURIComponent(q)}`, { timeout: 30000 });
      if (!data?.status || !data.result) return xreply('❌ No response from WormGPT.');
      await react(trashcore, m, '✅');
      await trashcore.sendMessage(chat, { text: `🐛 *WormGPT*\n\n${data.result}` }, { quoted: m });
    } catch (err) {
      await react(trashcore, m, '❌');
      xreply('❌ WormGPT error: ' + (err.message || 'try again'));
    }
  }
};

// ─── bird ai ─────────────────────────────────────────────────

const birdai = {
  command: ['bird', 'birdai'],
  desc:    'Chat with Bird AI',
  category: 'AI',
  usage:   '.bird <message>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    const q = args.join(' ');
    if (!q) return xreply('Usage: .bird <your message>');
    await react(trashcore, m, '⌛');
    try {
      const { data } = await axios.get(`${KEITH}/ai/bird?q=${encodeURIComponent(q)}`, { timeout: 30000 });
      if (!data?.status || !data.result) return xreply('❌ No response from Bird AI.');
      await react(trashcore, m, '✅');
      await trashcore.sendMessage(chat, { text: `🐦 *Bird AI*\n\n${data.result}` }, { quoted: m });
    } catch (err) {
      await react(trashcore, m, '❌');
      xreply('❌ Bird AI error: ' + (err.message || 'try again'));
    }
  }
};

// ─── blackbox ────────────────────────────────────────────────

const blackbox = {
  command: ['blackbox', 'bbai'],
  desc:    'Chat with Blackbox AI (coding assistant)',
  category: 'AI',
  usage:   '.blackbox <message>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    const q = args.join(' ');
    if (!q) return xreply('Usage: .blackbox <your message>');
    await react(trashcore, m, '⌛');
    try {
      const { data } = await axios.get(`${KEITH}/ai/blackbox?q=${encodeURIComponent(q)}`, { timeout: 30000 });
      if (!data?.status || !data.result) return xreply('❌ No response from Blackbox AI.');
      await react(trashcore, m, '✅');
      await trashcore.sendMessage(chat, { text: `⬛ *Blackbox AI*\n\n${data.result}` }, { quoted: m });
    } catch (err) {
      await react(trashcore, m, '❌');
      xreply('❌ Blackbox AI error: ' + (err.message || 'try again'));
    }
  }
};

// ─── mistral ─────────────────────────────────────────────────

const mistral = {
  command: ['mistral', 'mistralai'],
  desc:    'Chat with Mistral AI',
  category: 'AI',
  usage:   '.mistral <message>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    const q = args.join(' ');
    if (!q) return xreply('Usage: .mistral <your message>');
    await react(trashcore, m, '⌛');
    try {
      const { data } = await axios.get(`${KEITH}/ai/mistral?q=${encodeURIComponent(q)}`, { timeout: 30000 });
      if (!data?.status || !data.result) return xreply('❌ No response from Mistral.');
      await react(trashcore, m, '✅');
      await trashcore.sendMessage(chat, { text: `🌬️ *Mistral AI*\n\n${data.result}` }, { quoted: m });
    } catch (err) {
      await react(trashcore, m, '❌');
      xreply('❌ Mistral error: ' + (err.message || 'try again'));
    }
  }
};

// ─── perplexity ──────────────────────────────────────────────

const perplexity = {
  command: ['perplexity', 'ppx'],
  desc:    'Chat with Perplexity AI (web-search-augmented)',
  category: 'AI',
  usage:   '.perplexity <message>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    const q = args.join(' ');
    if (!q) return xreply('Usage: .perplexity <your message>');
    await react(trashcore, m, '⌛');
    try {
      const { data } = await axios.get(`${KEITH}/ai/perplexity?q=${encodeURIComponent(q)}`, { timeout: 30000 });
      if (!data?.status || !data.result) return xreply('❌ No response from Perplexity.');
      await react(trashcore, m, '✅');
      await trashcore.sendMessage(chat, { text: `🔮 *Perplexity AI*\n\n${data.result}` }, { quoted: m });
    } catch (err) {
      await react(trashcore, m, '❌');
      xreply('❌ Perplexity error: ' + (err.message || 'try again'));
    }
  }
};

// ─── speechwriter ────────────────────────────────────────────

const speechwriter = {
  command: ['speechwrite', 'speechwriter', 'speech'],
  desc:    'Generate a speech with AI',
  category: 'AI',
  usage:   '.speech <topic>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    const q = args.join(' ');
    if (!q) return xreply('Usage: .speech <your topic>');
    await react(trashcore, m, '⌛');
    try {
      const { data } = await axios.get(`${KEITH}/ai/speechwriter?q=${encodeURIComponent(q)}`, { timeout: 30000 });
      if (!data?.status || !data.result) return xreply('❌ Failed to generate speech.');
      await react(trashcore, m, '✅');
      await trashcore.sendMessage(chat, { text: `🎤 *AI Speech*\n\nTopic: ${q}\n\n${data.result}` }, { quoted: m });
    } catch (err) {
      await react(trashcore, m, '❌');
      xreply('❌ SpeechWriter error: ' + (err.message || 'try again'));
    }
  }
};

// ─── meta ai ─────────────────────────────────────────────────

const metaai = {
  command: ['meta', 'metaai', 'llama3'],
  desc:    'Chat with Meta AI (Llama 3)',
  category: 'AI',
  usage:   '.meta <message>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    const q = args.join(' ');
    if (!q) return xreply('Usage: .meta <your message>');
    await react(trashcore, m, '⌛');
    try {
      const { data } = await axios.get(`${KEITH}/ai/meta?q=${encodeURIComponent(q)}`, { timeout: 30000 });
      if (!data?.status || !data.result) return xreply('❌ No response from Meta AI.');
      await react(trashcore, m, '✅');
      await trashcore.sendMessage(chat, { text: `🦙 *Meta AI (Llama 3)*\n\n${data.result}` }, { quoted: m });
    } catch (err) {
      await react(trashcore, m, '❌');
      xreply('❌ Meta AI error: ' + (err.message || 'try again'));
    }
  }
};

// ─── imagine / image generation ──────────────────────────────

const imagine = {
  command: ['imagine', 'imgen', 'aiart'],
  desc:    'Generate an image with AI',
  category: 'AI',
  usage:   '.imagine <prompt>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    const prompt = args.join(' ');
    if (!prompt) return xreply('Usage: .imagine <your prompt>\nExample: .imagine a futuristic city at sunset');
    await react(trashcore, m, '⌛');
    await xreply('🎨 Generating AI image...');
    try {
      const { data } = await axios.get(
        `${NEXRAY}/ai/imagine?prompt=${encodeURIComponent(prompt)}`,
        { timeout: 60000 }
      );
      if (!data?.status || !data.result) throw new Error('No image returned');
      await react(trashcore, m, '✅');
      await trashcore.sendMessage(chat, {
        image:   { url: data.result },
        caption: `🎨 *AI Image Generation*\n📝 Prompt: ${prompt}`
      }, { quoted: m });
    } catch (err) {
      await react(trashcore, m, '❌');
      console.error('IMAGINE:', err.message);
      xreply('❌ Image generation failed. Try a different prompt.');
    }
  }
};

// ─── vision (image analysis) ─────────────────────────────────

const vision = {
  command: ['vision', 'analyze', 'describe'],
  desc:    'Analyze / describe an image with AI vision',
  category: 'AI',
  usage:   '.vision (reply to an image) or .vision <url>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    const { downloadContentFromMessage } = require('@trashcore/baileys');
    try {
      const quotedMsg = m.message?.extendedTextMessage?.contextInfo?.quotedMessage;
      const imgMsg = (quotedMsg && quotedMsg.imageMessage) || m.message?.imageMessage;

      let imageUrl;
      if (imgMsg) {
        const stream = await downloadContentFromMessage(imgMsg, 'image');
        let buf = Buffer.from([]);
        for await (const chunk of stream) buf = Buffer.concat([buf, chunk]);
        const base64 = buf.toString('base64');
        const mime   = /png/i.test(imgMsg.mimetype || '') ? 'image/png' : 'image/jpeg';
        imageUrl = `data:${mime};base64,${base64}`;
      } else if (args[0]) {
        imageUrl = args[0];
      } else {
        return xreply('⚠️ Reply to an image or provide an image URL.\nUsage: .vision <image url>');
      }

      await react(trashcore, m, '⌛');
      await xreply('🔍 Analyzing image...');

      const { data } = await axios.post(
        `${NEXRAY}/ai/vision`,
        { url: imageUrl },
        { headers: { 'content-type': 'application/json' }, timeout: 30000 }
      );
      if (!data?.status || !data.result) throw new Error('No result');
      await react(trashcore, m, '✅');
      await trashcore.sendMessage(chat, { text: `👁️ *AI Vision Analysis*\n\n${data.result}` }, { quoted: m });
    } catch (err) {
      await react(trashcore, m, '❌');
      console.error('VISION:', err.message);
      xreply('❌ Vision analysis failed: ' + err.message);
    }
  }
};

// ─── exports ─────────────────────────────────────────────────

module.exports = [gpt4, grok, wormgpt, birdai, blackbox, mistral, perplexity, speechwriter, metaai, imagine, vision];

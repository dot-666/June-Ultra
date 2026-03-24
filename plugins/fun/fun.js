// ============================================================
//  ULTRA X PROJECT — by TrashX
//  plugins/fun/fun.js  |  Fun Commands (reactions, effects, social)
// ============================================================

const axios = require('axios');

// ─── helper: download url to buffer via axios ────────────────

async function urlToBuffer(url) {
  const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 15000 });
  return Buffer.from(res.data);
}

// ─── waifu.pics anime reactions ──────────────────────────────

const WAIFU_CMDS = [
  'cry','hug','pat','lick','kiss','bite','yeet','bully','bonk',
  'wink','poke','nom','slap','smile','wave','awoo','blush','smug',
  'glomp','happy','dance','cringe','cuddle','highfive','shinobu','handhold'
];

const waifuReact = {
  command: WAIFU_CMDS,
  desc:    'Anime reaction GIF as sticker (waifu.pics)',
  category: 'Fun',
  usage:   '.hug | .kiss | .slap | .pat ...',
  run: async ({ trashcore, m, chat, command, xreply }) => {
    try {
      const { data } = await axios.get(`https://api.waifu.pics/sfw/${command}`, { timeout: 10000 });
      if (!data?.url) return xreply('❌ Failed to fetch reaction.');
      const { Sticker, StickerTypes } = require('wa-sticker-formatter');
      const buffer  = await urlToBuffer(data.url);
      const sticker = new Sticker(buffer, {
        pack:    'TrashCore Ultra',
        author:  'TrashX',
        type:    StickerTypes.CROPPED,
        quality: 80
      });
      await trashcore.sendMessage(chat, { sticker: await sticker.toBuffer() }, { quoted: m });
    } catch (err) {
      xreply('❌ Failed to get reaction: ' + err.message);
    }
  }
};

// ─── nekos.life reactions ────────────────────────────────────
// NOTE: 8ball is excluded here — it's handled by the proper magic 8-ball command

const NEKOS_CMDS = ['woof','goose','gecg','feed','avatar','fox_girl','lizard','spank','meow','tickle'];

const nekosReact = {
  command: NEKOS_CMDS,
  desc:    'Nekos.life reaction as sticker',
  category: 'Fun',
  usage:   '.woof | .meow | .tickle ...',
  run: async ({ trashcore, m, chat, command, xreply }) => {
    try {
      const { data } = await axios.get(`https://nekos.life/api/v2/img/${command}`, { timeout: 10000 });
      if (!data?.url) return xreply('❌ Failed to fetch image.');
      const { Sticker, StickerTypes } = require('wa-sticker-formatter');
      const buffer  = await urlToBuffer(data.url);
      const sticker = new Sticker(buffer, {
        pack:    'TrashCore Ultra',
        author:  'TrashX',
        type:    StickerTypes.CROPPED,
        quality: 80
      });
      await trashcore.sendMessage(chat, { sticker: await sticker.toBuffer() }, { quoted: m });
    } catch (err) {
      xreply('❌ Failed to get image: ' + err.message);
    }
  }
};

// ─── ephoto text effects ─────────────────────────────────────

const EPHOTO_MAP = {
  glitchtext:       'https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html',
  writetext:        'https://en.ephoto360.com/write-text-on-wet-glass-online-589.html',
  advancedglow:     'https://en.ephoto360.com/advanced-glow-effects-74.html',
  typographytext:   'https://en.ephoto360.com/create-typography-text-effect-on-pavement-online-774.html',
  pixelglitch:      'https://en.ephoto360.com/create-pixel-glitch-text-effect-online-769.html',
  neonglitch:       'https://en.ephoto360.com/create-impressive-neon-glitch-text-effects-online-768.html',
  flagtext:         'https://en.ephoto360.com/nigeria-3d-flag-text-effect-online-free-753.html',
  flag3dtext:       'https://en.ephoto360.com/free-online-american-flag-3d-text-effect-generator-725.html',
  deletingtext:     'https://en.ephoto360.com/create-eraser-deleting-text-effect-online-717.html',
  blackpinkstyle:   'https://en.ephoto360.com/online-blackpink-style-logo-maker-effect-711.html',
  glowingtext:      'https://en.ephoto360.com/create-glowing-text-effects-online-706.html',
  underwatertext:   'https://en.ephoto360.com/3d-underwater-text-effect-online-682.html',
  logomaker:        'https://en.ephoto360.com/free-bear-logo-maker-online-673.html',
  cartoonstyle:     'https://en.ephoto360.com/create-a-cartoon-style-graffiti-text-effect-online-668.html',
  papercutstyle:    'https://en.ephoto360.com/multicolor-3d-paper-cut-style-text-effect-658.html',
  watercolortext:   'https://en.ephoto360.com/create-a-watercolor-text-effect-online-655.html',
  effectclouds:     'https://en.ephoto360.com/write-text-effect-clouds-in-the-sky-online-619.html',
  blackpinklogo:    'https://en.ephoto360.com/create-blackpink-logo-online-free-607.html',
  gradienttext:     'https://en.ephoto360.com/create-3d-gradient-text-effect-online-600.html',
  summerbeach:      'https://en.ephoto360.com/write-in-sand-summer-beach-online-free-595.html',
  luxurygold:       'https://en.ephoto360.com/create-a-luxury-gold-text-effect-online-594.html',
  multicoloredneon: 'https://en.ephoto360.com/create-multicolored-neon-light-signatures-591.html',
  sandsummer:       'https://en.ephoto360.com/write-in-sand-summer-beach-online-576.html',
  galaxywallpaper:  'https://en.ephoto360.com/create-galaxy-wallpaper-mobile-online-528.html',
  '1917style':      'https://en.ephoto360.com/1917-style-text-effect-523.html',
  makingneon:       'https://en.ephoto360.com/making-neon-light-text-effect-with-galaxy-style-521.html',
  royaltext:        'https://en.ephoto360.com/royal-text-effect-online-free-471.html',
  freecreate:       'https://en.ephoto360.com/free-create-a-3d-hologram-text-effect-441.html',
  galaxystyle:      'https://en.ephoto360.com/create-galaxy-style-free-name-logo-438.html',
  lighteffects:     'https://en.ephoto360.com/create-light-effects-green-neon-online-429.html',
};

async function ephoto(url, text) {
  const cheerio  = require('cheerio');
  const gT = await axios.get(url, {
    headers: { 'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    timeout: 15000
  });
  const $ = cheerio.load(gT.data);

  const token           = $('input[name=token]').val();
  const build_server    = $('input[name=build_server]').val();
  const build_server_id = $('input[name=build_server_id]').val();

  if (!token || !build_server) throw new Error('Could not parse ephoto form — the site may have changed.');

  const params = new URLSearchParams();
  params.append('text[]', text);
  params.append('token', token);
  params.append('build_server', build_server);
  params.append('build_server_id', build_server_id);

  const cookie = (gT.headers['set-cookie'] || []).join('; ');

  const res = await axios.post(url, params.toString(), {
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'user-agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      cookie
    },
    timeout: 15000
  });

  const $$ = cheerio.load(res.data);
  const rawJson = $$('input[name=form_value_input]').val();
  if (!rawJson) throw new Error('Ephoto did not return image data. Try again.');
  let json = JSON.parse(rawJson);
  json['text[]'] = json.text;
  delete json.text;

  const { data } = await axios.post(
    'https://en.ephoto360.com/effect/create-image',
    new URLSearchParams(json).toString(),
    {
      headers: {
        'user-agent': 'Mozilla/5.0',
        'Content-Type': 'application/x-www-form-urlencoded',
        cookie
      },
      timeout: 15000
    }
  );
  if (!data?.image) throw new Error('Ephoto returned no image. Try again later.');
  return build_server + data.image;
}

const texteffects = {
  command: Object.keys(EPHOTO_MAP),
  desc:    'Generate stylized text effects via ephoto360',
  category: 'Fun',
  usage:   '.glitchtext <your text>',
  run: async ({ trashcore, m, chat, command, args, xreply }) => {
    if (!args[0]) return xreply(`✏️ Usage: .${command} <your text>\nExample: .${command} TrashCore`);
    const text = args.join(' ');
    const url  = EPHOTO_MAP[command];
    if (!url) return xreply('❌ Unknown effect command.');
    try {
      await xreply('⏳ Generating your text effect...');
      const imgUrl = await ephoto(url, text);
      await trashcore.sendMessage(chat, {
        image:   { url: imgUrl },
        caption: `✅ *${command}*\n> Text: ${text}`
      }, { quoted: m });
    } catch (err) {
      console.error('[ephoto] error:', err.message);
      xreply('❌ Failed to generate effect. Ephoto may be busy — try again in a moment.');
    }
  }
};

// ─── truth ───────────────────────────────────────────────────

const TRUTHS = [
  "Have you ever liked anyone? How long?",
  "What is the name of your friend's ex you secretly liked?",
  "Have you ever stolen money from your parents?",
  "Ever had a one-sided love? How did it feel?",
  "What's the most embarrassing thing you've done?",
  "Who is the most influential person in your life?",
  "Have you ever lied to your best friend?",
  "What's your biggest fear?",
  "What's the worst thing you've done and never told anyone?",
  "Have you ever cheated on a test or exam?",
  "What's a secret you've been keeping from your family?",
  "Who do you have a crush on right now?",
  "What's the most childish thing you still do?",
  "Have you ever pretended to be sick to skip something?",
  "What's the pettiest thing you've done to get back at someone?",
  "Have you ever read someone else's private messages?",
  "What's something you're really bad at but pretend to be good at?",
  "If you could change one thing about yourself, what would it be?",
  "Who was your first crush and do you still think about them?",
  "What's the most embarrassing thing on your phone right now?",
];

const truth = {
  command: ['truth'],
  desc:    'Random truth question for Truth or Dare',
  category: 'Fun',
  run: async ({ trashcore, m, chat }) => {
    const question = TRUTHS[Math.floor(Math.random() * TRUTHS.length)];
    await trashcore.sendMessage(chat, {
      text: `🎯 *You chose TRUTH!*\n\n_${question}_`
    }, { quoted: m });
  }
};

// ─── dare ────────────────────────────────────────────────────

const DARES = [
  "Post an embarrassing selfie as your profile picture for 1 hour.",
  "Send a voice note saying 'I love you' to the last person you texted.",
  "Change your name to 'I AM DONKEY' for 24 hours.",
  "Call your crush and talk for at least 1 minute.",
  "Post 'I am single and ready to mingle' as your status for 30 minutes.",
  "Do 20 push-ups right now.",
  "Send a heart emoji to your last 5 contacts.",
  "Record a voice note singing your national anthem.",
  "Say something nice to every member of this group.",
  "Tell the group your most embarrassing moment.",
  "Send a screenshot of your WhatsApp search history.",
  "Howl like a wolf for 10 seconds and send a voice note.",
  "Take an embarrassing selfie and send it here.",
  "Let the group pick a word and sing a famous song replacing lyrics with that word.",
  "Send a voice note saying 'I have a crush on you' to a random contact.",
  "Tell the saddest story you know.",
  "Show the last five people you texted and what the messages said.",
  "Send a message to your ex and show the conversation here.",
  "Act like a chicken for 30 seconds and record it.",
  "Put your full name as your status for 1 hour.",
];

const dare = {
  command: ['dare'],
  desc:    'Random dare for Truth or Dare',
  category: 'Fun',
  run: async ({ trashcore, m, chat }) => {
    const challenge = DARES[Math.floor(Math.random() * DARES.length)];
    await trashcore.sendMessage(chat, {
      text: `🔥 *You chose DARE!*\n\n_${challenge}_`
    }, { quoted: m });
  }
};

// ─── joke ────────────────────────────────────────────────────

const joke = {
  command: ['joke', 'jokes'],
  desc:    'Get a random joke',
  category: 'Fun',
  run: async ({ trashcore, m, chat, xreply }) => {
    try {
      const { data } = await axios.get(
        'https://v2.jokeapi.dev/joke/Any?blacklistFlags=nsfw,racist,sexist&type=single',
        { timeout: 10000 }
      );
      if (!data?.joke) return xreply('❌ Failed to fetch joke. Try again!');
      await trashcore.sendMessage(chat, {
        text: `😂 *JOKE OF THE DAY*\n\n_${data.joke}_`
      }, { quoted: m });
    } catch (err) {
      const fallbacks = [
        "Why don't scientists trust atoms? Because they make up everything! 😂",
        "I told my wife she was drawing her eyebrows too high. She looked surprised. 😂",
        "Why don't skeletons fight each other? They don't have the guts. 😂",
        "What do you call fake spaghetti? An impasta! 😂",
        "Why did the scarecrow win an award? He was outstanding in his field! 😂"
      ];
      await trashcore.sendMessage(chat, {
        text: `😂 *JOKE OF THE DAY*\n\n_${fallbacks[Math.floor(Math.random() * fallbacks.length)]}_`
      }, { quoted: m });
    }
  }
};

// ─── quote ───────────────────────────────────────────────────

const quote = {
  command: ['quote', 'wisdom'],
  desc:    'Get a random motivational quote',
  category: 'Fun',
  run: async ({ trashcore, m, chat, xreply }) => {
    try {
      const { data } = await axios.get('https://zenquotes.io/api/random', { timeout: 10000 });
      if (!data?.[0]?.q) return xreply('❌ Failed to fetch quote. Try again!');
      const q = data[0];
      await trashcore.sendMessage(chat, {
        text: `💬 *QUOTE*\n\n_"${q.q}"_\n\n— *${q.a}*`
      }, { quoted: m });
    } catch (err) {
      const fallbacks = [
        { q: "The only way to do great work is to love what you do.", a: "Steve Jobs" },
        { q: "In the middle of every difficulty lies opportunity.", a: "Albert Einstein" },
        { q: "Success is not final, failure is not fatal.", a: "Winston Churchill" },
        { q: "It does not matter how slowly you go as long as you do not stop.", a: "Confucius" },
        { q: "The future belongs to those who believe in the beauty of their dreams.", a: "Eleanor Roosevelt" }
      ];
      const q = fallbacks[Math.floor(Math.random() * fallbacks.length)];
      await trashcore.sendMessage(chat, {
        text: `💬 *QUOTE*\n\n_"${q.q}"_\n\n— *${q.a}*`
      }, { quoted: m });
    }
  }
};

// ─── fact ────────────────────────────────────────────────────

const fact = {
  command: ['fact', 'funfact'],
  desc:    'Get a random interesting fact',
  category: 'Fun',
  run: async ({ trashcore, m, chat, xreply }) => {
    try {
      const { data } = await axios.get('https://uselessfacts.jsph.pl/api/v2/facts/random', { timeout: 10000 });
      if (!data?.text) return xreply('❌ Failed to fetch fact. Try again!');
      await trashcore.sendMessage(chat, {
        text: `🧠 *RANDOM FACT*\n\n_${data.text}_`
      }, { quoted: m });
    } catch (err) {
      const fallbacks = [
        "A group of flamingos is called a 'flamboyance'.",
        "Honey never spoils. Archaeologists have found 3,000-year-old honey in Egyptian tombs.",
        "Bananas are berries, but strawberries are not.",
        "A day on Venus is longer than a year on Venus.",
        "Octopuses have three hearts and blue blood."
      ];
      await trashcore.sendMessage(chat, {
        text: `🧠 *RANDOM FACT*\n\n_${fallbacks[Math.floor(Math.random() * fallbacks.length)]}_`
      }, { quoted: m });
    }
  }
};

// ─── compliment ──────────────────────────────────────────────

const COMPLIMENTS = [
  "You have a genuinely great sense of humor.",
  "Your smile makes the whole room light up.",
  "You're one of those people who makes others feel instantly comfortable.",
  "The way you carry yourself commands respect.",
  "You have a really impressive way of seeing the world.",
  "You always know exactly what to say.",
  "You're an incredibly kind and caring person.",
  "Your energy is absolutely infectious!",
  "The world is genuinely better with you in it.",
  "You have excellent taste in absolutely everything.",
  "Your confidence is inspiring.",
  "You make everything look effortless.",
  "You're the reason someone is smiling today.",
  "Your creativity is absolutely stunning.",
  "You radiate warmth and positivity wherever you go.",
];

const compliment = {
  command: ['compliment', 'comp'],
  desc:    'Send a random compliment to someone',
  category: 'Fun',
  usage:   '.compliment @user',
  run: async ({ trashcore, m, chat, xreply }) => {
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target   = mentions[0] || quoted || m.sender;
    const msg      = COMPLIMENTS[Math.floor(Math.random() * COMPLIMENTS.length)];
    await trashcore.sendMessage(chat, {
      text: `💐 *COMPLIMENT*\n\n@${target.split('@')[0]}: _${msg}_`,
      mentions: [target]
    }, { quoted: m });
  }
};

// ─── insult ──────────────────────────────────────────────────

const insult = {
  command: ['insult', 'roast'],
  desc:    'Send a random roast/insult to someone (for fun!)',
  category: 'Fun',
  usage:   '.insult @user',
  run: async ({ trashcore, m, chat, xreply }) => {
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target   = mentions[0] || quoted || m.sender;
    try {
      const { data } = await axios.get(
        'https://evilinsult.com/generate_insult.php?lang=en&type=json',
        { timeout: 8000 }
      );
      const msg = data?.insult || 'You are so dumb, even Google can\'t find you.';
      await trashcore.sendMessage(chat, {
        text: `🔥 *ROAST*\n\n@${target.split('@')[0]}: _${msg}_`,
        mentions: [target]
      }, { quoted: m });
    } catch {
      const fallbacks = [
        "You're proof that evolution can go in reverse.",
        "I'd agree with you but then we'd both be wrong.",
        "Your secrets are always safe with me — I never listen when you talk.",
        "You're not stupid; you just have bad luck thinking.",
        "I'd insult your intelligence but you clearly have none to spare."
      ];
      await trashcore.sendMessage(chat, {
        text: `🔥 *ROAST*\n\n@${target.split('@')[0]}: _${fallbacks[Math.floor(Math.random() * fallbacks.length)]}_`,
        mentions: [target]
      }, { quoted: m });
    }
  }
};

// ─── rate ────────────────────────────────────────────────────

const rate = {
  command: ['rate', 'howis', 'rateme'],
  desc:    'Rate someone randomly for fun',
  category: 'Fun',
  usage:   '.rate @user OR .rate anything',
  run: async ({ trashcore, m, chat, args, xreply }) => {
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    const thing    = args.join(' ') || (mentions[0] ? `@${mentions[0].split('@')[0]}` : `@${m.sender.split('@')[0]}`);
    const score    = Math.floor(Math.random() * 101);
    const bar      = '█'.repeat(Math.floor(score / 10)) + '░'.repeat(10 - Math.floor(score / 10));
    const label    = score >= 90 ? 'Legendary 🔥' : score >= 75 ? 'Excellent ✨' : score >= 60 ? 'Good 👍' : score >= 40 ? 'Average 😐' : score >= 20 ? 'Below Average 😬' : 'Terrible 💀';
    await trashcore.sendMessage(chat, {
      text: `📊 *RATING*\n\n🎯 Subject: *${thing}*\n\n[${bar}]\n\n⭐ Score: *${score}/100*\n🏷️ Verdict: *${label}*`,
      mentions: mentions.length ? mentions : [m.sender]
    }, { quoted: m });
  }
};

// ─── say ─────────────────────────────────────────────────────

const say = {
  command: ['say'],
  desc:    'Make the bot say something',
  category: 'Fun',
  usage:   '.say <text>',
  run: async ({ trashcore, m, chat, args, xreply }) => {
    if (!args[0]) return xreply('Usage: .say <text>');
    await trashcore.sendMessage(chat, { text: args.join(' ') }, { quoted: m });
  }
};

// ─── oogway ──────────────────────────────────────────────────

const OOGWAY_QUOTES = [
  "Yesterday is history, tomorrow is a mystery, but today is a gift — that is why it is called the present.",
  "There are no accidents.",
  "You cannot make someone do what they are not ready to do.",
  "When the path you walk always leads back to yourself, you never get lost.",
  "My time has come.",
  "Quit! Don't quit. Noodles. Don't noodles.",
  "You must believe beyond what your eyes can see.",
  "The mark of a true hero is to do what must be done even when it is hardest.",
  "Inner peace comes not from what you possess, but from who you are.",
  "Patience is not the ability to wait, but the ability to keep a good attitude while waiting.",
  "The obstacle is the path.",
  "One often meets his destiny on the road he takes to avoid it.",
  "Your story may not have such a happy beginning, but that doesn't make you who you are — it is the rest of your story, who you choose to be.",
];

const oogway = {
  command: ['oogway', 'masteroogway', 'wisdom2'],
  desc:    'Receive wisdom from Master Oogway',
  category: 'Fun',
  run: async ({ trashcore, m, chat }) => {
    const msg = OOGWAY_QUOTES[Math.floor(Math.random() * OOGWAY_QUOTES.length)];
    await trashcore.sendMessage(chat, {
      text: `🐢 *Master Oogway says:*\n\n_"${msg}"_`
    }, { quoted: m });
  }
};

// ─── character ───────────────────────────────────────────────

const CHARACTERS = [
  { name: 'Naruto Uzumaki', trait: 'never giving up and believing in people', power: 'Shadow Clone Jutsu', catchphrase: '"Dattebayo!"' },
  { name: 'Goku', trait: 'always seeking the next challenge', power: 'Kamehameha', catchphrase: '"I am the hope of the universe!"' },
  { name: 'Sherlock Holmes', trait: 'unmatched observation skills', power: 'Deductive Reasoning', catchphrase: '"Elementary, my dear Watson."' },
  { name: 'Tony Stark', trait: 'genius-level intellect and sarcasm', power: 'Iron Man Suit', catchphrase: '"I am Iron Man."' },
  { name: 'Joker', trait: 'chaos and unpredictability', power: 'Madness', catchphrase: '"Why so serious?"' },
  { name: 'Luffy', trait: 'reckless courage', power: 'Gear Five', catchphrase: '"I\'m going to be King of the Pirates!"' },
  { name: 'Thanos', trait: 'ruthless determination', power: 'Infinity Gauntlet', catchphrase: '"I am inevitable."' },
  { name: 'Walter White', trait: 'transformation and pride', power: 'Chemistry', catchphrase: '"I am the danger."' },
  { name: 'Spiderman', trait: 'great responsibility', power: 'Web-slinging', catchphrase: '"With great power comes great responsibility."' },
  { name: 'Levi Ackerman', trait: 'discipline and precision', power: 'Ackerman Strength', catchphrase: '"Survive."' },
];

const character = {
  command: ['character', 'mycharacter', 'whichcharacter'],
  desc:    'Find out which character you are',
  category: 'Fun',
  usage:   '.character @user',
  run: async ({ trashcore, m, chat, xreply }) => {
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target   = mentions[0] || quoted || m.sender;
    const c        = CHARACTERS[Math.floor(Math.random() * CHARACTERS.length)];
    await trashcore.sendMessage(chat, {
      text: `🎭 *CHARACTER MATCH*\n\n@${target.split('@')[0]} you are...\n\n*${c.name}*!\n\n` +
            `✨ Trait: _${c.trait}_\n` +
            `⚡ Special Power: _${c.power}_\n` +
            `💬 Your Catchphrase: ${c.catchphrase}`,
      mentions: [target]
    }, { quoted: m });
  }
};

// ─── stupid ──────────────────────────────────────────────────

const stupid = {
  command: ['stupid', 'stupidmeter', 'iq'],
  desc:    'Check stupidity/IQ level (for fun)',
  category: 'Fun',
  usage:   '.stupid @user',
  run: async ({ trashcore, m, chat, xreply }) => {
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target   = mentions[0] || quoted || m.sender;
    const score    = Math.floor(Math.random() * 101);
    const iq       = Math.floor(Math.random() * 60) + 70;
    const bar      = '🟩'.repeat(Math.floor(score / 10)) + '⬛'.repeat(10 - Math.floor(score / 10));
    const label    = score >= 90 ? 'Supreme Idiot 🤡' : score >= 70 ? 'Certified Dummy 🐢' : score >= 50 ? 'Moderately Dumb 😅' : score >= 30 ? 'Slightly Silly 🙃' : 'Actually Smart 🧠';
    await trashcore.sendMessage(chat, {
      text: `🧟 *STUPID METER*\n\n👤 @${target.split('@')[0]}\n\n${bar}\n\n📊 Stupidity: *${score}%*\n🧠 IQ: *${iq}*\n🏷️ Status: *${label}*`,
      mentions: [target]
    }, { quoted: m });
  }
};

// ─── goodnight ───────────────────────────────────────────────

const GN_MESSAGES = [
  "🌙 Good night! May your dreams be as sweet as you are.",
  "🌟 Sleep well and wake up refreshed. Good night!",
  "✨ The stars are out to watch over you. Good night!",
  "🌛 Sweet dreams, beautiful soul. Good night!",
  "💤 Rest up, tomorrow is going to be amazing. Good night!",
  "🌙 May you find peace and warmth in your sleep. Good night!",
  "⭐ Count your blessings, not sheep. Good night!",
  "🌜 The night is young but your rest is important. Sleep tight!",
  "💫 Close your eyes and drift to a world of beautiful dreams. Good night!",
  "🌑 Tomorrow's sunshine starts with tonight's rest. Good night!",
];

const goodnight = {
  command: ['goodnight', 'gn'],
  desc:    'Send a good night message',
  category: 'Fun',
  run: async ({ trashcore, m, chat }) => {
    const msg = GN_MESSAGES[Math.floor(Math.random() * GN_MESSAGES.length)];
    await trashcore.sendMessage(chat, { text: msg }, { quoted: m });
  }
};

// ─── flirt ───────────────────────────────────────────────────

const FLIRTS = [
  "Are you a magician? Because whenever I look at you, everyone else disappears. 😍",
  "Do you have a map? I keep getting lost in your eyes. 🗺️😉",
  "If you were a vegetable, you'd be a cute-cumber. 🥒💕",
  "Is your name Google? Because you have everything I've been searching for. 🔍❤️",
  "Do you believe in love at first text? Or should I type again? 💬💖",
  "If beauty were time, you'd be an eternity. ⏳😘",
  "Are you a camera? Because every time I see you, I smile. 📷😊",
  "Do you have a Band-Aid? I scraped my knee falling for you. 🩹💗",
  "Are you a parking ticket? Because you've got 'fine' written all over you. 😄",
  "If stars fell every time I thought of you, the sky would be empty tonight. 🌌💞",
];

const flirt = {
  command: ['flirt'],
  desc:    'Send a flirty pickup line to someone',
  category: 'Fun',
  usage:   '.flirt @user',
  run: async ({ trashcore, m, chat, xreply }) => {
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target   = mentions[0] || quoted || m.sender;
    const msg      = FLIRTS[Math.floor(Math.random() * FLIRTS.length)];
    await trashcore.sendMessage(chat, {
      text: `💌 *FLIRT LINE*\n\n@${target.split('@')[0]}: _${msg}_`,
      mentions: [target]
    }, { quoted: m });
  }
};

// ─── shayari ─────────────────────────────────────────────────

const SHAYARIS = [
  "Mohabbat ka ek ajeeb rang hai,\nJo dikhta nahi par mehsoos hota hai. 🌹",
  "Tere bina dil lagta nahi,\nYeh zindagi kuch maangti hai. 💖",
  "Aankhon mein teri meri jaan basti hai,\nDil ki har dhadkan teri yaad sunati hai. 🌸",
  "Khwabon mein aaya karo,\nDil mein sama jao. 🌙",
  "Teri ek muskaan ne dil jeet liya,\nAb yeh dil sirf tera hai. 💕",
  "Raat ko tara baan ke chhamko,\nDin mein dhoop baan ke mehko. ⭐",
  "Ishq ek aisi baat hai,\nJo kehne se nahi kehti. 🌺",
  "Dil ne likhi teri kahani,\nAnkhon ne padhi teri zubani. 💞",
  "Tu mili toh jaise baarish mili,\nSookhe dil ko taazagi mili. 🌧️",
  "Chand ki roshni mein teri yaad aati hai,\nHar sitare pe teri tasveer baan jaati hai. 🌛",
];

const shayari = {
  command: ['shayari', 'shayri'],
  desc:    'Random romantic Shayari (Urdu/Hindi poetry)',
  category: 'Fun',
  run: async ({ trashcore, m, chat }) => {
    const msg = SHAYARIS[Math.floor(Math.random() * SHAYARIS.length)];
    await trashcore.sendMessage(chat, { text: `🌹 *SHAYARI*\n\n_${msg}_` }, { quoted: m });
  }
};

// ─── roseday ─────────────────────────────────────────────────

const roseday = {
  command: ['roseday', 'rose'],
  desc:    'Send a rose day message to someone',
  category: 'Fun',
  usage:   '.roseday @user',
  run: async ({ trashcore, m, chat, xreply }) => {
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target   = mentions[0] || quoted;
    const msgs = [
      "🌹 This rose is for you — because you bloom in every season.",
      "🌹 A rose for the most wonderful person. May your life be as beautiful as this flower.",
      "🌹 Roses are red, violets are blue, no one in this world is as amazing as you!",
      "🌹 Sending you a rose on this special day — you deserve all the love in the world.",
      "🌹 Like a rose, you are full of beauty and grace. Happy Rose Day!",
    ];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    if (target) {
      await trashcore.sendMessage(chat, {
        text: `${msg}\n\n💐 To: @${target.split('@')[0]}`,
        mentions: [target]
      }, { quoted: m });
    } else {
      await trashcore.sendMessage(chat, { text: msg }, { quoted: m });
    }
  }
};

// ─── lovenight ───────────────────────────────────────────────

const lovenight = {
  command: ['lovenight'],
  desc:    'Send a romantic good night love message',
  category: 'Fun',
  usage:   '.lovenight @user',
  run: async ({ trashcore, m, chat, xreply }) => {
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target   = mentions[0] || quoted;
    const msgs = [
      "🌙❤️ As you close your eyes tonight, know that my heart is thinking of you. Sleep tight, my love.",
      "💖🌛 The moon is jealous because it can only see you from so far away. Sweet dreams, my darling.",
      "🌹🌙 Every star in the sky is a wish I've made for your happiness. Good night, my love.",
      "💞✨ Wrap yourself in warmth tonight — it's my love surrounding you. Good night!",
      "🌙💫 Before you sleep, know you are the last thought on my mind. Sweet dreams, beautiful.",
    ];
    const msg = msgs[Math.floor(Math.random() * msgs.length)];
    if (target) {
      await trashcore.sendMessage(chat, {
        text: `${msg}\n\n💌 To: @${target.split('@')[0]}`,
        mentions: [target]
      }, { quoted: m });
    } else {
      await trashcore.sendMessage(chat, { text: msg }, { quoted: m });
    }
  }
};

// ─── pies ────────────────────────────────────────────────────

const PIES_MSGS = [
  "🥧 Did someone say pie? Have a virtual slice of happiness!",
  "🍰 Life is short, eat the pie first!",
  "🥧 Pie is the answer. I don't remember the question, but pie is the answer.",
  "🍕 Pizza is just round pie — and round pie is universal happiness.",
  "🥧 Sending you a warm slice of love-flavored pie. Enjoy!",
  "🍰 Every problem can be solved with a slice of pie and a good attitude.",
  "🥧 Pie O'Clock somewhere in the world — and it's always time for pie!",
  "🍰 Be the pie you wish to see in the world. 🌍",
];

const pies = {
  command: ['pies', 'pie'],
  desc:    'Random funny pie message',
  category: 'Fun',
  run: async ({ trashcore, m, chat }) => {
    const msg = PIES_MSGS[Math.floor(Math.random() * PIES_MSGS.length)];
    await trashcore.sendMessage(chat, { text: msg }, { quoted: m });
  }
};

// ─── exports ─────────────────────────────────────────────────

module.exports = [
  waifuReact, nekosReact, texteffects,
  truth, dare,
  joke, quote, fact,
  compliment, insult,
  rate, say, oogway, character, stupid,
  goodnight, flirt, shayari, roseday, lovenight, pies
];

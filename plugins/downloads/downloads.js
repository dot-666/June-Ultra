// ============================================================
//  ULTRA X PROJECT — by TrashX
//  plugins/downloads/downloads.js  |  All Download Commands
// ============================================================

const axios   = require('axios');
const cheerio = require('cheerio');
const fg      = require('api-dylux');

const API = 'https://api.nexray.web.id';

// ─── facebook / instagram ────────────────────────────────────

const facebook = {
  command: ['fb', 'facebook', 'instagram', 'igdl'],
  desc:    'Download Facebook or Instagram media',
  category: 'Downloader',
  run: async ({ trashcore, m, args, text, xreply, chat }) => {
    try {
      if (!args[0]) {
        const cmd = text.split(' ')[0] || '.fb';
        return xreply(`🔗 Provide a Facebook or Instagram link!\nExample: ${cmd} <link>`);
      }
      const url = args[0];
      await xreply('⏳ Fetching media... Please wait!');

      async function fetchMedia(url) {
        try {
          const form = new URLSearchParams();
          form.append('q', url);
          form.append('vt', 'home');
          const { data } = await axios.post('https://yt5s.io/api/ajaxSearch', form, {
            headers: {
              Accept: 'application/json',
              'X-Requested-With': 'XMLHttpRequest',
              'Content-Type': 'application/x-www-form-urlencoded'
            }
          });
          if (data.status !== 'ok') throw new Error('Provide a valid link.');
          const $ = cheerio.load(data.data);
          if (/^(https?:\/\/)?(www\.)?(facebook\.com|fb\.watch)\/.+/i.test(url)) {
            const thumb = $('img').attr('src');
            let links = [];
            $('table tbody tr').each((_, el) => {
              const quality = $(el).find('.video-quality').text().trim();
              const link    = $(el).find('a.download-link-fb').attr('href');
              if (quality && link) links.push({ quality, link });
            });
            if (links.length > 0) return { platform: 'Facebook', type: 'video', thumb, media: links[0].link };
            if (thumb)            return { platform: 'Facebook', type: 'image', media: thumb };
            throw new Error('Media is invalid.');
          }
          if (/^(https?:\/\/)?(www\.)?(instagram\.com\/(p|reel)\/).+/i.test(url)) {
            const video = $('a[title="Download Video"]').attr('href');
            const image = $('img').attr('src');
            if (video) return { platform: 'Instagram', type: 'video', media: video };
            if (image) return { platform: 'Instagram', type: 'image', media: image };
            throw new Error('Media is invalid.');
          }
          throw new Error('Provide a valid Facebook or Instagram URL.');
        } catch (err) { return { error: err.message }; }
      }

      const res = await fetchMedia(url);
      if (res.error) return xreply(`⚠️ Error: ${res.error}`);
      await xreply('⏳ Media found! Downloading...');
      if (res.type === 'video')
        await trashcore.sendMessage(chat, { video: { url: res.media }, caption: `✅ Downloaded video from ${res.platform}!` }, { quoted: m });
      else if (res.type === 'image')
        await trashcore.sendMessage(chat, { image: { url: res.media }, caption: `✅ Downloaded photo from ${res.platform}!` }, { quoted: m });
      await xreply('✅ Done!');
    } catch (err) {
      console.error('FB/IG plugin error:', err);
      await xreply('❌ Failed to get media.');
    }
  }
};

// ─── gitclone ────────────────────────────────────────────────

const gitclone = {
  command: ['gitclone'],
  desc:    'Download GitHub repository as ZIP',
  category: 'Downloader',
  usage:   '.gitclone <github repo link>',
  run: async ({ trashcore, chat, m, args, xreply }) => {
    try {
      const urlInput = args[0];
      if (!urlInput) return xreply('Example:\n.gitclone https://github.com/user/repo');

      const isUrl = (url) =>
        /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%_+.~#?&/=]*)/gi.test(url);

      if (!isUrl(urlInput) && !urlInput.includes('github.com'))
        return xreply('❌ Invalid GitHub URL');

      const regex = /(?:https|git)(?:\/\/|@)github\.com[/:]([\w-]+)\/([\w.-]+)/i;
      let [, user, repo] = urlInput.match(regex) || [];
      if (!user || !repo) return xreply('❌ Invalid repository format');
      repo = repo.replace(/\.git$/, '');

      await trashcore.sendMessage(chat, {
        document: { url: `https://api.github.com/repos/${user}/${repo}/zipball` },
        fileName: `${encodeURIComponent(repo)}.zip`,
        mimetype: 'application/zip',
        caption:  `📦 *GitHub Clone*\n🔗 ${urlInput}`
      }, { quoted: m });
    } catch (e) {
      console.error('GITCLONE ERROR:', e);
      xreply('❌ Failed to fetch repository.');
    }
  }
};

// ─── github ──────────────────────────────────────────────────

const github = {
  command: ['github', 'ghdl'],
  desc:    'Download GitHub repository as ZIP (via API)',
  category: 'Downloader',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    try {
      const url = args[0];
      if (!url) return xreply('Usage: .github <repo url>');
      await xreply('🔍 Fetching GitHub repo...');
      const { data } = await axios.get(`${API}/downloader/github?url=${encodeURIComponent(url)}`);
      if (!data.status) return xreply('❌ Repository not found');
      const res = data.result;
      await trashcore.sendMessage(chat, {
        document: { url: res.url },
        fileName: res.filename,
        mimetype: 'application/zip',
        caption:  `📦 *GITHUB REPOSITORY*\n\n📛 Repo: ${res.repo}\n🌿 Branch: ${res.branch}\n📁 Filename: ${res.filename}\n🔗 Download URL: ${res.url}`
      }, { quoted: m });
    } catch (err) {
      console.error(err);
      xreply('❌ Failed to fetch GitHub repository');
    }
  }
};

// ─── npm ─────────────────────────────────────────────────────

const npmdl = {
  command: ['npmdl', 'npm'],
  desc:    'Download npm package as .tgz',
  category: 'Downloader',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    try {
      const query = args.join(' ');
      if (!query) return xreply('Usage: .npmdl <package name>');
      await xreply('📦 Fetching package...');
      const { data } = await axios.get(`${API}/downloader/npm?q=${encodeURIComponent(query)}`);
      if (!data.status) return xreply('❌ Package not found');
      const res = data.result;
      await trashcore.sendMessage(chat, {
        document: { url: res.download_url },
        fileName: `${res.name.replace('/', '_')}.tgz`,
        mimetype: 'application/gzip',
        caption:
          `📦 *NPM PACKAGE*\n\n📛 Name: ${res.name}\n📝 Description: ${res.description}\n` +
          `🔖 Version: ${res.version}\n👨‍💻 Author: ${res.author}\n⚖️ License: ${res.license}\n` +
          `📦 Size: ${(res.size / 1024 / 1024).toFixed(2)} MB\n\n🔗 Homepage:\n${res.homepage}`
      }, { quoted: m });
    } catch (err) {
      console.error(err);
      xreply('❌ Failed to fetch npm package');
    }
  }
};

// ─── pindl ───────────────────────────────────────────────────

const pindl = {
  command: ['pindl'],
  desc:    'Download Pinterest video or image',
  category: 'Downloader',
  run: async ({ trashcore, chat, args, text, xreply }) => {
    try {
      if (!args[0]) {
        const cmd = text?.split(' ')[0] || '.pindl';
        return xreply(`🔗 *Example:*\n${cmd} https://pin.it/57IghwKl0`);
      }
      const url = args[0];
      await xreply('⏳ Fetching from Pinterest...');

      async function fetchPinterest(url) {
        try {
          const { data } = await axios.get(url, {
            headers: { 'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15' },
            maxRedirects: 5
          });
          const video  = data.match(/"contentUrl":"(https:\/\/v1\.pinimg\.com\/videos\/[^\"]+\.mp4)"/);
          const image  = data.match(/"imageSpec_736x":\{"url":"(https:\/\/i\.pinimg\.com\/736x\/[^\"]+\.(jpg|jpeg|png|webp))"/) ||
                         data.match(/"imageSpec_564x":\{"url":"(https:\/\/i\.pinimg\.com\/564x\/[^\"]+\.(jpg|jpeg|png|webp))"/);
          const title  = data.match(/"name":"([^"]+)"/);
          const author = data.match(/"fullName":"([^"]+)".+?"username":"([^"]+)"/);
          const date   = data.match(/"uploadDate":"([^"]+)"/);
          const keyword = data.match(/"keywords":"([^"]+)"/);
          return {
            type:       video ? 'video' : 'image',
            title:      title  ? title[1]  : 'Unknown Title',
            author:     author ? author[1] : 'Unknown',
            username:   author ? author[2] : 'Unknown',
            media:      video  ? video[1]  : image ? image[1] : null,
            uploadDate: date   ? date[1]   : 'N/A',
            keywords:   keyword ? keyword[1].split(',').map(x => x.trim()) : []
          };
        } catch (err) { return { error: err.message }; }
      }

      const res = await fetchPinterest(url);
      if (res.error) return xreply(`❌ Error: ${res.error}`);
      if (!res.media) return xreply('⚠️ Could not find media from that link.');

      const caption =
        `📍 *Pinterest Downloader*\n📝 Title: ${res.title}\n👤 Author: ${res.author} (@${res.username})\n` +
        `📅 Uploaded: ${res.uploadDate}\n🔑 Keywords: ${res.keywords.join(', ') || 'None'}`;

      if (res.type === 'video')
        await trashcore.sendMessage(chat, { video: { url: res.media }, caption });
      else
        await trashcore.sendMessage(chat, { image: { url: res.media }, caption });
      await xreply('✅ Done!');
    } catch (err) {
      console.error('Pinterest Plugin Error:', err);
      return xreply('❌ Failed to fetch Pinterest media.');
    }
  }
};

// ─── play ────────────────────────────────────────────────────

const play = {
  command: ['play'],
  desc:    'Play song from YouTube',
  category: 'Music',
  usage:   '.play <song name>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    try {
      if (!args.length) return xreply('🎵 Please provide a song name\nExample: .play Faded');
      const query = args.join(' ');
      const { data } = await axios.get(
        `https://api.nexray.web.id/downloader/ytplay?q=${encodeURIComponent(query)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }
      );
      if (!data?.status || !data.result) return xreply('❌ Song not found.');
      const r = data.result;
      await trashcore.sendMessage(chat, {
        image: { url: r.thumbnail },
        caption: `🎶 *Now Playing*\n\n🎵 Title: ${r.title}\n🎤 Artist: ${r.channel}\n⏱ Duration: ${r.duration}\n👀 Views: ${r.views}`
      }, { quoted: m });
      await trashcore.sendMessage(chat, {
        audio: { url: r.download_url }, mimetype: 'audio/mpeg', fileName: `${r.title.slice(0, 50)}.mp3`
      }, { quoted: m });
    } catch (err) {
      console.log('PLAY ERROR:', err?.response?.data || err.message);
      xreply('⚠️ Failed to fetch the song.');
    }
  }
};

// ─── playdoc ─────────────────────────────────────────────────

const playdoc = {
  command: ['playdoc'],
  desc:    'Search and send a song as document',
  category: 'Music',
  usage:   '.playdoc <song name>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    try {
      if (!args.length) return xreply('🎵 Please provide a song name\nExample: `.playdoc Faded`');
      const query = args.join(' ').slice(0, 100);
      const { data } = await axios.get(
        `https://api.nexray.web.id/downloader/ytplay?q=${encodeURIComponent(query)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }
      );
      if (!data?.status || !data.result) return xreply('❌ Failed to fetch audio.');
      const r = data.result;
      await trashcore.sendMessage(chat, {
        image: { url: r.thumbnail },
        caption: `📄 *Song Document*\n\n🎵 *Title:* ${r.title}\n🎤 *Artist:* ${r.channel}\n⏱ *Duration:* ${r.duration}\n👀 *Views:* ${r.views}`
      }, { quoted: m });
      await trashcore.sendMessage(chat, {
        document: { url: r.download_url }, mimetype: 'audio/mpeg', fileName: `${r.title.slice(0, 50)}.mp3`
      }, { quoted: m });
    } catch (err) {
      console.error('❌ PlayDoc error:', err?.response?.data || err.message);
      xreply('⚠️ An error occurred while sending the song.');
    }
  }
};

// ─── spotify ─────────────────────────────────────────────────

const spotify = {
  command: ['spotify', 'sp'],
  desc:    'Download song from Spotify',
  category: 'Music',
  usage:   '.spotify <song name>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    try {
      if (!args.length) return xreply('🎧 Please provide a song name\nExample: `.spotify Faded`');
      const query = args.join(' ').slice(0, 100);
      await xreply('🎧 Fetching Spotify track...');
      const { data } = await axios.get(
        `${API}/downloader/spotifyplay?q=${encodeURIComponent(query)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 20000 }
      );
      if (!data?.status || !data.result) return xreply('❌ Failed to fetch track.');
      const r = data.result;
      await trashcore.sendMessage(chat, {
        image: { url: r.thumbnail },
        caption:
          `🎧 *Spotify Download*\n\n🎵 *Title:* ${r.title}\n🎤 *Artist:* ${r.artist}\n` +
          `💿 *Album:* ${r.album}\n⏱ *Duration:* ${r.duration}\n🔥 *Popularity:* ${r.popularity}\n📅 *Released:* ${r.release_at}`
      }, { quoted: m });
      await trashcore.sendMessage(chat, {
        audio: { url: r.download_url }, mimetype: 'audio/mpeg', fileName: `${r.title.slice(0, 50)}.mp3`
      }, { quoted: m });
    } catch (err) {
      console.error('❌ spotify error:', err?.response?.data || err.message);
      xreply('⚠️ An error occurred while fetching the track.');
    }
  }
};

// ─── tiktok ──────────────────────────────────────────────────

const tiktok = {
  command: ['tiktok', 'tt'],
  desc:    'Download TikTok video or audio',
  category: 'Downloader',
  run: async ({ trashcore, m, args, xreply }) => {
    try {
      if (!args[0]) return xreply('⚠️ Provide a TikTok link.');
      await xreply('⏳ Fetching TikTok data...');
      const data = await fg.tiktok(args[0]);
      const json = data.result;
      let caption = `🎵 [TIKTOK DOWNLOAD]\n\n`;
      caption += `◦ Id: ${json.id}\n◦ Username: ${json.author.nickname}\n◦ Title: ${json.title}\n`;
      caption += `◦ Likes: ${json.digg_count}\n◦ Comments: ${json.comment_count}\n◦ Shares: ${json.share_count}\n`;
      caption += `◦ Plays: ${json.play_count}\n◦ Created: ${json.create_time}\n◦ Size: ${json.size}\n◦ Duration: ${json.duration}`;
      if (json.images?.length > 0) {
        for (const imgUrl of json.images)
          await trashcore.sendMessage(m.key.remoteJid, { image: { url: imgUrl } }, { quoted: m });
      } else {
        await trashcore.sendMessage(m.key.remoteJid, { video: { url: json.play }, mimetype: 'video/mp4', caption }, { quoted: m });
        setTimeout(async () => {
          if (json.music)
            await trashcore.sendMessage(m.key.remoteJid, { audio: { url: json.music }, mimetype: 'audio/mpeg' }, { quoted: m });
        }, 3000);
      }
    } catch (err) {
      console.error('TikTok plugin error:', err);
      await xreply('❌ Failed to fetch TikTok data. Make sure the link is valid.');
    }
  }
};

// ─── videodoc ────────────────────────────────────────────────

const videodoc = {
  command: ['videodoc'],
  desc:    'Search and download a video as document',
  category: 'Media',
  usage:   '.videodoc <video name>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    try {
      if (!args.length) return xreply('🎬 Please provide a video name\nExample: `.videodoc Faded`');
      const query = args.join(' ').slice(0, 100);
      await xreply('🎬 Fetching video...');
      const { data } = await axios.get(
        `${API}/downloader/ytplayvid?q=${encodeURIComponent(query)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }
      );
      if (!data?.status || !data.result) return xreply('❌ Failed to fetch video.');
      const r = data.result;
      await trashcore.sendMessage(chat, {
        image: { url: r.thumbnail },
        caption: `📄 *Video Document*\n\n🎬 *Title:* ${r.title}\n📺 *Channel:* ${r.channel}\n⏱ *Duration:* ${r.duration}\n👀 *Views:* ${r.views}`
      }, { quoted: m });
      await trashcore.sendMessage(chat, {
        document: { url: r.download_url }, mimetype: 'video/mp4', fileName: `${r.title.slice(0, 50)}.mp4`
      }, { quoted: m });
    } catch (err) {
      console.error('❌ videodoc error:', err?.response?.data || err.message);
      xreply('⚠️ An error occurred while sending the video.');
    }
  }
};

// ─── video ───────────────────────────────────────────────────

const video = {
  command: ['video'],
  desc:    'Search and download a video',
  category: 'Media',
  usage:   '.video <video name>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    try {
      if (!args.length) return xreply('🎬 Please provide a video name\nExample: `.video Faded`');
      const query = args.join(' ').slice(0, 100);
      await xreply('🎬 Fetching video...');
      const { data } = await axios.get(
        `${API}/downloader/ytplayvid?q=${encodeURIComponent(query)}`,
        { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }
      );
      if (!data?.status || !data.result) return xreply('❌ Failed to fetch video.');
      const r = data.result;
      await trashcore.sendMessage(chat, {
        image: { url: r.thumbnail },
        caption: `📄 *Video Mp4*\n\n🎬 *Title:* ${r.title}\n📺 *Channel:* ${r.channel}\n⏱ *Duration:* ${r.duration}\n👀 *Views:* ${r.views}`
      }, { quoted: m });
      await trashcore.sendMessage(chat, {
        video: { url: r.download_url }, mimetype: 'video/mp4', fileName: `${r.title.slice(0, 50)}.mp4`
      }, { quoted: m });
    } catch (err) {
      console.error('❌ video error:', err?.response?.data || err.message);
      xreply('⚠️ An error occurred while sending the video.');
    }
  }
};

// ─── ytmp3 ───────────────────────────────────────────────────

const ytmp3 = {
  command: ['ytmp3'],
  desc:    'Download YouTube audio',
  category: 'Media',
  usage:   '.ytmp3 <youtube link>',
  run: async ({ trashcore, chat, m, args, xreply }) => {
    try {
      if (!args[0]) return xreply('⚠️ Provide a YouTube link.\nExample:\n.ytmp3 https://youtu.be/xxxxx');
      await xreply('⏳ Processing audio...');
      const { data } = await axios.get(
        `https://www.neoapis.my.id/api/downloader/ytdl?url=${encodeURIComponent(args[0])}&type=mp3`
      );
      if (!data.status) return xreply('❌ Failed to fetch audio.');
      await trashcore.sendMessage(chat, {
        audio: { url: data.data.download }, mimetype: 'audio/mpeg', fileName: `${data.data.title}.mp3`
      }, { quoted: m });
    } catch (err) {
      console.error('YTMP3 Error:', err);
      xreply('❌ Failed to download audio.');
    }
  }
};

// ─── ytmp4 ───────────────────────────────────────────────────

const ytmp4 = {
  command: ['ytmp4'],
  desc:    'Download YouTube video',
  category: 'Media',
  usage:   '.ytmp4 <youtube link>',
  run: async ({ trashcore, chat, m, args, xreply }) => {
    try {
      if (!args[0]) return xreply('⚠️ Provide a YouTube link.\nExample:\n.ytmp4 https://youtu.be/xxxxx');
      await xreply('⏳ Downloading video...');
      await trashcore.sendMessage(chat, {
        video:    { url: `https://api.theresav.biz.id/download/ytmp4?apikey=LB8sM&url=${encodeURIComponent(args[0])}&resolution=360` },
        mimetype: 'video/mp4',
        caption:  '🎬 Here is your video'
      }, { quoted: m });
    } catch (err) {
      console.error('YTMP4 Error:', err);
      xreply('❌ Failed to download video.');
    }
  }
};

// ─── yts ─────────────────────────────────────────────────────

const yts = {
  command: ['yts'],
  desc:    'Search YouTube videos',
  category: 'Search',
  usage:   '.yts <query>',
  run: async ({ trashcore, m, args, xreply, chat }) => {
    try {
      if (!args.length) return xreply('🔎 Please provide a search query\nExample: `.yts Faded`');
      const query = args.join(' ').slice(0, 200);
      await xreply('🔍 Searching YouTube...');
      const { data } = await axios.get(
        `https://api.ootaizumi.web.id/search/youtube?query=${encodeURIComponent(query)}`,
        { timeout: 20000 }
      );
      if (!data?.status || !Array.isArray(data.result) || data.result.length === 0)
        return xreply('❌ No results found.');

      const results = data.result.filter(v => v.type === 'video').slice(0, 7);
      let text = `🔎 *YouTube Search Results*\n📌 Query: *${query}*\n\n`;
      results.forEach((v, i) => {
        text += `*${i + 1}. ${v.title}*\n`;
        text += `⏱ Duration: ${v.timestamp || 'Unknown'}\n`;
        text += `👤 Channel: ${v.author?.name || 'Unknown'}\n`;
        text += `👁 Views: ${v.views?.toLocaleString() || 'N/A'}\n`;
        text += `🕒 Uploaded: ${v.ago || 'Unknown'}\n`;
        text += `🔗 ${v.url}\n\n`;
      });
      await trashcore.sendMessage(chat, { text }, { quoted: m });
    } catch (err) {
      console.error('❌ yts error:', err?.response?.data || err.message);
      xreply('⚠️ Failed to fetch YouTube search results.');
    }
  }
};

// ─── exports ────────────────────────────────────────────────

module.exports = [facebook, gitclone, github, npmdl, pindl, play, playdoc, spotify, tiktok, videodoc, video, ytmp3, ytmp4, yts];

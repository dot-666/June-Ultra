// ============================================================
//  ULTRA X PROJECT — by TrashX
//  plugins/sports/sports.js  |  Football & Sports Commands
//  BASE API: https://apiskeith.top
// ============================================================

const axios = require('axios');
const BASE  = 'https://apiskeith.top';

async function fetchJson(path) {
  const { data } = await axios.get(`${BASE}${path}`, { timeout: 20000 });
  return data;
}

// ─── helper: standings as clean text (mobile-friendly) ───────

function fmtStandings(standings, limit = 20) {
  if (!standings?.length) return 'No data available.';
  return standings.slice(0, limit).map(s => {
    const pos  = String(s.position).padStart(2);
    const team = (s.team || '').replace(/ (F\.?C\.?|A\.?F\.?C\.?|C\.?F\.?)$/i, '').trim();
    const pts  = s.points ?? 0;
    const gd   = s.goalDifference >= 0 ? `+${s.goalDifference}` : `${s.goalDifference}`;
    return `${pos}. ${team}\n    P:${s.played} W:${s.won} D:${s.draw} L:${s.lost} GD:${gd} *Pts:${pts}*`;
  }).join('\n\n');
}

// ─── helper: upcoming matches ─────────────────────────────────

function fmtUpcoming(matches, limit = 10) {
  if (!matches?.length) return 'No upcoming matches found.';
  return matches.slice(0, limit).map((m, i) => {
    const home = (m.homeTeam || '').replace(/ FC$/i, '');
    const away = (m.awayTeam || '').replace(/ FC$/i, '');
    return `${i + 1}. ⚽ *${home}* vs *${away}*\n   📅 ${m.date || 'TBA'}`;
  }).join('\n\n');
}

// ─── helper: top scorers ──────────────────────────────────────

function fmtScorers(scorers, limit = 10) {
  if (!scorers?.length) return 'No data available.';
  return scorers.slice(0, limit).map(s => {
    const team = (s.team || '').replace(/ FC$/i, '');
    return `${s.rank}. ⚽ *${s.player}* — ${team}\n   Goals: *${s.goals}* | Assists: ${s.assists} | Pens: ${s.penalties}`;
  }).join('\n\n');
}

// ─── EPL standings ────────────────────────────────────────────

const epl = {
  command: ['epl', 'epl-table', 'premierleague'],
  desc:    'Current Premier League standings',
  category: 'Sports',
  run: async ({ xreply }) => {
    console.log('[sports] epl command triggered');
    try {
      const d = await fetchJson('/epl/standings');
      if (!d?.status || !d.result?.standings) return xreply('❌ Unable to fetch EPL standings right now.');
      xreply(`🇬🇧 *Premier League Standings*\n\n${fmtStandings(d.result.standings)}`);
    } catch (err) {
      console.error('[sports] epl error:', err.message);
      xreply('❌ Unable to fetch EPL standings. Try again later.');
    }
  }
};

// ─── EPL upcoming matches ─────────────────────────────────────

const eplFixtures = {
  command: ['epl-fixtures', 'fixtures', 'matches'],
  desc:    'Upcoming Premier League fixtures',
  category: 'Sports',
  run: async ({ xreply }) => {
    console.log('[sports] fixtures command triggered');
    try {
      const d = await fetchJson('/epl/upcomingmatches');
      if (!d?.status || !d.result?.upcomingMatches) return xreply('❌ Could not fetch upcoming fixtures.');
      xreply(`🇬🇧 *Upcoming EPL Fixtures*\n\n${fmtUpcoming(d.result.upcomingMatches)}`);
    } catch (err) {
      console.error('[sports] fixtures error:', err.message);
      xreply('❌ Unable to fetch fixtures. Try again later.');
    }
  }
};

// ─── EPL top scorers ─────────────────────────────────────────

const eplScorers = {
  command: ['epl-scorers', 'pl-scorers'],
  desc:    'Premier League top scorers',
  category: 'Sports',
  run: async ({ xreply }) => {
    console.log('[sports] epl-scorers command triggered');
    try {
      const d = await fetchJson('/epl/scorers');
      if (!d?.status || !d.result?.topScorers) return xreply('❌ Could not fetch EPL scorers.');
      xreply(`🇬🇧 *EPL Top Scorers*\n\n${fmtScorers(d.result.topScorers)}`);
    } catch (err) {
      console.error('[sports] epl-scorers error:', err.message);
      xreply('❌ Unable to fetch EPL scorers. Try again later.');
    }
  }
};

// ─── La Liga standings ────────────────────────────────────────

const laliga = {
  command: ['laliga', 'pd-table', 'laliga-table'],
  desc:    'Current La Liga standings',
  category: 'Sports',
  run: async ({ xreply }) => {
    console.log('[sports] laliga command triggered');
    try {
      const d = await fetchJson('/laliga/standings');
      if (!d?.status || !d.result?.standings) return xreply('❌ Could not fetch La Liga standings.');
      xreply(`🇪🇸 *La Liga Standings*\n\n${fmtStandings(d.result.standings)}`);
    } catch (err) {
      console.error('[sports] laliga error:', err.message);
      xreply('❌ Unable to fetch La Liga standings. Try again later.');
    }
  }
};

// ─── La Liga upcoming ─────────────────────────────────────────

const laligaFixtures = {
  command: ['laliga-fixtures'],
  desc:    'Upcoming La Liga fixtures',
  category: 'Sports',
  run: async ({ xreply }) => {
    try {
      const d = await fetchJson('/laliga/upcomingmatches');
      if (!d?.status || !d.result?.upcomingMatches) return xreply('❌ Could not fetch La Liga fixtures.');
      xreply(`🇪🇸 *Upcoming La Liga Fixtures*\n\n${fmtUpcoming(d.result.upcomingMatches)}`);
    } catch (err) {
      console.error('[sports] laliga-fixtures error:', err.message);
      xreply('❌ Unable to fetch La Liga fixtures. Try again later.');
    }
  }
};

// ─── La Liga scorers ──────────────────────────────────────────

const laligaScorers = {
  command: ['laliga-scorers'],
  desc:    'La Liga top scorers',
  category: 'Sports',
  run: async ({ xreply }) => {
    try {
      const d = await fetchJson('/laliga/scorers');
      if (!d?.status || !d.result?.topScorers) return xreply('❌ Could not fetch La Liga scorers.');
      xreply(`🇪🇸 *La Liga Top Scorers*\n\n${fmtScorers(d.result.topScorers)}`);
    } catch (err) {
      console.error('[sports] laliga-scorers error:', err.message);
      xreply('❌ Unable to fetch La Liga scorers. Try again later.');
    }
  }
};

// ─── Bundesliga standings ─────────────────────────────────────

const bundesliga = {
  command: ['bundesliga', 'bl-table', 'bundesliga-table'],
  desc:    'Current Bundesliga standings',
  category: 'Sports',
  run: async ({ xreply }) => {
    try {
      const d = await fetchJson('/bundesliga/standings');
      if (!d?.status || !d.result?.standings) return xreply('❌ Could not fetch Bundesliga standings.');
      xreply(`🇩🇪 *Bundesliga Standings*\n\n${fmtStandings(d.result.standings)}`);
    } catch (err) {
      console.error('[sports] bundesliga error:', err.message);
      xreply('❌ Unable to fetch Bundesliga standings. Try again later.');
    }
  }
};

// ─── Bundesliga upcoming ──────────────────────────────────────

const bundesligaFixtures = {
  command: ['bundesliga-fixtures'],
  desc:    'Upcoming Bundesliga fixtures',
  category: 'Sports',
  run: async ({ xreply }) => {
    try {
      const d = await fetchJson('/bundesliga/upcomingmatches');
      if (!d?.status || !d.result?.upcomingMatches) return xreply('❌ Could not fetch Bundesliga fixtures.');
      xreply(`🇩🇪 *Upcoming Bundesliga Fixtures*\n\n${fmtUpcoming(d.result.upcomingMatches)}`);
    } catch (err) {
      console.error('[sports] bundesliga-fixtures error:', err.message);
      xreply('❌ Unable to fetch Bundesliga fixtures. Try again later.');
    }
  }
};

// ─── Bundesliga scorers ───────────────────────────────────────

const bundesligaScorers = {
  command: ['bundesliga-scorers'],
  desc:    'Bundesliga top scorers',
  category: 'Sports',
  run: async ({ xreply }) => {
    try {
      const d = await fetchJson('/bundesliga/scorers');
      if (!d?.status || !d.result?.topScorers) return xreply('❌ Could not fetch Bundesliga scorers.');
      xreply(`🇩🇪 *Bundesliga Top Scorers*\n\n${fmtScorers(d.result.topScorers)}`);
    } catch (err) {
      console.error('[sports] bundesliga-scorers error:', err.message);
      xreply('❌ Unable to fetch Bundesliga scorers. Try again later.');
    }
  }
};

// ─── Serie A standings ────────────────────────────────────────

const serieA = {
  command: ['serie-a', 'sa-table', 'seriea'],
  desc:    'Current Serie A standings',
  category: 'Sports',
  run: async ({ xreply }) => {
    try {
      const d = await fetchJson('/seriea/standings');
      if (!d?.status || !d.result?.standings) return xreply('❌ Could not fetch Serie A standings.');
      xreply(`🇮🇹 *Serie A Standings*\n\n${fmtStandings(d.result.standings)}`);
    } catch (err) {
      console.error('[sports] serie-a error:', err.message);
      xreply('❌ Unable to fetch Serie A standings. Try again later.');
    }
  }
};

// ─── Serie A scorers ──────────────────────────────────────────

const serieAScorers = {
  command: ['seriea-scorers', 'sa-scorers'],
  desc:    'Serie A top scorers',
  category: 'Sports',
  run: async ({ xreply }) => {
    try {
      const d = await fetchJson('/seriea/scorers');
      if (!d?.status || !d.result?.topScorers) return xreply('❌ Could not fetch Serie A scorers.');
      xreply(`🇮🇹 *Serie A Top Scorers*\n\n${fmtScorers(d.result.topScorers)}`);
    } catch (err) {
      console.error('[sports] seriea-scorers error:', err.message);
      xreply('❌ Unable to fetch Serie A scorers. Try again later.');
    }
  }
};

// ─── UCL standings ────────────────────────────────────────────

const ucl = {
  command: ['ucl', 'ucl-table', 'championsleague'],
  desc:    'UEFA Champions League standings',
  category: 'Sports',
  run: async ({ xreply }) => {
    try {
      const d = await fetchJson('/ucl/standings');
      if (!d?.status || !d.result?.standings) return xreply('❌ Could not fetch UCL standings.');
      xreply(`🏆 *Champions League Standings*\n\n${fmtStandings(d.result.standings)}`);
    } catch (err) {
      console.error('[sports] ucl error:', err.message);
      xreply('❌ Unable to fetch UCL standings. Try again later.');
    }
  }
};

// ─── UCL upcoming ─────────────────────────────────────────────

const uclFixtures = {
  command: ['ucl-fixtures'],
  desc:    'Upcoming Champions League fixtures',
  category: 'Sports',
  run: async ({ xreply }) => {
    try {
      const d = await fetchJson('/ucl/upcomingmatches');
      if (!d?.status || !d.result?.upcomingMatches) return xreply('❌ Could not fetch UCL fixtures.');
      xreply(`🏆 *Upcoming UCL Fixtures*\n\n${fmtUpcoming(d.result.upcomingMatches)}`);
    } catch (err) {
      console.error('[sports] ucl-fixtures error:', err.message);
      xreply('❌ Unable to fetch UCL fixtures. Try again later.');
    }
  }
};

// ─── UCL scorers ──────────────────────────────────────────────

const uclScorers = {
  command: ['ucl-scorers'],
  desc:    'Champions League top scorers',
  category: 'Sports',
  run: async ({ xreply }) => {
    try {
      const d = await fetchJson('/ucl/scorers');
      if (!d?.status || !d.result?.topScorers) return xreply('❌ Could not fetch UCL scorers.');
      xreply(`🏆 *UCL Top Scorers*\n\n${fmtScorers(d.result.topScorers)}`);
    } catch (err) {
      console.error('[sports] ucl-scorers error:', err.message);
      xreply('❌ Unable to fetch UCL scorers. Try again later.');
    }
  }
};

// ─── livescore ────────────────────────────────────────────────

const livescore = {
  command: ['livescore', 'live'],
  desc:    'Current football live scores',
  category: 'Sports',
  run: async ({ xreply }) => {
    console.log('[sports] livescore command triggered');
    try {
      const d = await fetchJson('/livescore');
      if (!d?.status) return xreply('❌ Could not fetch live scores.');
      const games = d.result?.games;
      if (!games || !Object.keys(games).length) return xreply('⚽ No live games at the moment. Check back soon!');
      const lines = Object.values(games)
        .filter(g => g.R?.r1 !== undefined)
        .slice(0, 12)
        .map(g => {
          const score  = `${g.R?.r1 ?? '-'} - ${g.R?.r2 ?? '-'}`;
          const status = g.R?.st || 'LIVE';
          return `⚽ *${g.p1}* ${score} *${g.p2}*  [${status}]`;
        });
      if (!lines.length) return xreply('⚽ No live games right now. Check back later!');
      xreply(`🔴 *Live Football Scores*\n\n${lines.join('\n')}`);
    } catch (err) {
      console.error('[sports] livescore error:', err.message);
      xreply('❌ Unable to fetch live scores. Try again later.');
    }
  }
};

// ─── football news ────────────────────────────────────────────

const footballNews = {
  command: ['football-news', 'fnews'],
  desc:    'Latest football news',
  category: 'Sports',
  run: async ({ xreply }) => {
    try {
      const d = await fetchJson('/football/news');
      if (!d?.status || !d.result?.length) return xreply('📰 No football news at the moment.');
      const lines = d.result.slice(0, 8).map((n, i) => {
        const title = n.title || n.headline || 'Untitled';
        const body  = n.summary || n.description || '';
        return `${i + 1}. *${title}*${body ? '\n   ' + body.substring(0, 80) + '...' : ''}`;
      });
      xreply(`📰 *Football News*\n\n${lines.join('\n\n')}`);
    } catch (err) {
      console.error('[sports] football-news error:', err.message);
      xreply('❌ Unable to fetch football news. Try again later.');
    }
  }
};

// ─── bet tips ─────────────────────────────────────────────────

const bet = {
  command: ['bet', 'bettips', 'odds'],
  desc:    'Sure bet tips & free odds',
  category: 'Sports',
  run: async ({ xreply }) => {
    console.log('[sports] bet command triggered');
    try {
      const d = await fetchJson('/bet');
      if (!d?.status) return xreply('❌ Could not fetch bet tips.');
      const tips = d.result;
      if (!tips || (Array.isArray(tips) && !tips.length)) {
        return xreply('🎯 *Sure Bet Tips*\n\nNo tips available right now. Check back later!\n\n_⚠️ Gamble responsibly._');
      }
      const lines = Array.isArray(tips)
        ? tips.slice(0, 10).map((t, i) => {
            if (typeof t === 'string') return `${i + 1}. ${t}`;
            return `${i + 1}. ${t.match || t.game || t.tip || JSON.stringify(t)}`;
          })
        : [String(tips)];
      xreply(`🎯 *Sure Bet Tips*\n\n${lines.join('\n')}\n\n_⚠️ Gamble responsibly. Tips are not guaranteed._`);
    } catch (err) {
      console.error('[sports] bet error:', err.message);
      xreply('❌ Unable to fetch bet tips. Try again later.');
    }
  }
};

// ─── player search ────────────────────────────────────────────

const playerSearch = {
  command: ['player', 'playersearch'],
  desc:    'Search for a football player',
  category: 'Sports',
  usage:   '.player <name>',
  run: async ({ trashcore, m, chat, args, xreply }) => {
    const q = args.join(' ');
    if (!q) return xreply('Usage: .player <name>\nExample: .player Bukayo Saka');
    console.log('[sports] player search:', q);
    try {
      const d = await fetchJson(`/sport/playersearch?q=${encodeURIComponent(q)}`);
      if (!d?.status || !d.result?.length) return xreply(`❌ No player found for "*${q}*". Try a different spelling.`);
      const p    = d.result[0];
      const name = p.name || p.strPlayer || 'Unknown';
      const team = p.team || p.strTeam || 'Unknown';
      const pos  = p.position || p.strPosition || '';
      const nat  = p.nationality || p.strNationality || '';
      const born = p.dateOfBirth || p.dateBorn || '';
      const desc = (p.description || p.strDescriptionEN || '').substring(0, 200);
      const thumb = p.thumbnail || p.strThumb || p.strCutout || null;

      const caption =
        `🔍 *Player: ${name}*\n\n` +
        `🏟️ Club: *${team}*\n` +
        (pos  ? `📌 Position: ${pos}\n` : '') +
        (nat  ? `🌍 Nationality: ${nat}\n` : '') +
        (born ? `🎂 Born: ${born}\n` : '') +
        (desc ? `\n📝 _${desc}..._` : '');

      if (thumb) {
        await trashcore.sendMessage(chat, { image: { url: thumb }, caption }, { quoted: m })
          .catch(() => xreply(caption));
      } else {
        xreply(caption);
      }
    } catch (err) {
      console.error('[sports] player error:', err.message);
      xreply(`❌ Could not search for "${q}". Try again later.`);
    }
  }
};

// ─── team search ──────────────────────────────────────────────

const teamSearch = {
  command: ['team', 'teamsearch'],
  desc:    'Search for a football team',
  category: 'Sports',
  usage:   '.team <name>',
  run: async ({ trashcore, m, chat, args, xreply }) => {
    const q = args.join(' ');
    if (!q) return xreply('Usage: .team <name>\nExample: .team Arsenal');
    console.log('[sports] team search:', q);
    try {
      const d = await fetchJson(`/sport/teamsearch?q=${encodeURIComponent(q)}`);
      if (!d?.status || !d.result?.length) return xreply(`❌ No team found for "*${q}*". Try a different name.`);
      const t      = d.result[0];
      const name   = t.name || t.strTeam || 'Unknown';
      const league = t.league || t.strLeague || '';
      const venue  = t.stadium || t.strStadium || '';
      const cap    = t.stadiumCapacity ? `${Number(t.stadiumCapacity).toLocaleString()}` : '';
      const loc    = t.location || '';
      const formed = t.formedYear || t.intFormedYear || '';
      const desc   = (t.description || t.strDescriptionEN || '').substring(0, 250);
      const badge  = t.badges?.large || t.badges?.small || t.strTeamBadge || null;
      const colors = t.colors ? `${t.colors.primary || ''}` : '';

      const caption =
        `⚽ *${name}*\n\n` +
        (league ? `🏆 League: *${league}*\n` : '') +
        (venue  ? `🏟️ Stadium: ${venue}${cap ? ` (${cap} cap)` : ''}\n` : '') +
        (loc    ? `📍 Location: ${loc}\n` : '') +
        (formed ? `📅 Founded: ${formed}\n` : '') +
        (colors ? `🎨 Color: ${colors}\n` : '') +
        (desc   ? `\n📝 _${desc}${desc.length >= 250 ? '...' : ''}_` : '');

      if (badge) {
        await trashcore.sendMessage(chat, { image: { url: badge }, caption }, { quoted: m })
          .catch(() => xreply(caption));
      } else {
        xreply(caption);
      }
    } catch (err) {
      console.error('[sports] team error:', err.message);
      xreply(`❌ Could not search for "${q}". Try again later.`);
    }
  }
};

// ─── exports ─────────────────────────────────────────────────

module.exports = [
  epl, eplFixtures, eplScorers,
  laliga, laligaFixtures, laligaScorers,
  bundesliga, bundesligaFixtures, bundesligaScorers,
  serieA, serieAScorers,
  ucl, uclFixtures, uclScorers,
  livescore,
  footballNews,
  bet,
  playerSearch,
  teamSearch
];

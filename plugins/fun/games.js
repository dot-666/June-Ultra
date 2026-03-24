// ============================================================
//  ULTRA X PROJECT — by TrashX
//  plugins/fun/games.js  |  Games, Mini-Games & Fun Commands
// ============================================================

const axios = require('axios');

// ─── 8ball ───────────────────────────────────────────────────

const EIGHT_BALL = [
  'It is certain.', 'It is decidedly so.', 'Without a doubt.',
  'Yes, definitely!', 'You may rely on it.', 'As I see it, yes.',
  'Most likely.', 'Outlook good.', 'Yes!', 'Signs point to yes.',
  'Reply hazy, try again.', 'Ask again later.', 'Better not tell you now.',
  'Cannot predict now.', 'Concentrate and ask again.',
  "Don't count on it.", 'My reply is no.', 'My sources say no.',
  'Outlook not so good.', 'Very doubtful.'
];

const eightball = {
  command: ['8ball', 'magicball'],
  desc:    'Ask the magic 8 ball a question',
  category: 'Fun',
  usage:   '.8ball <question>',
  run: async ({ m, args, trashcore, chat }) => {
    const q = args.join(' ');
    if (!q) return trashcore.sendMessage(chat, { text: '🎱 Ask me a question!\nUsage: .8ball Will I pass my exam?' }, { quoted: m });
    const answer = EIGHT_BALL[Math.floor(Math.random() * EIGHT_BALL.length)];
    await trashcore.sendMessage(chat, {
      text: `🎱 *Magic 8 Ball*\n\n❓ Question: _${q}_\n\n💬 Answer: *${answer}*`
    }, { quoted: m });
  }
};

// ─── coin flip (cf) ──────────────────────────────────────────

const cf = {
  command: ['cf', 'coinflip', 'flip'],
  desc:    'Flip a coin — Heads or Tails',
  category: 'Fun',
  usage:   '.cf',
  run: async ({ trashcore, m, chat }) => {
    const result  = Math.random() < 0.5 ? 'HEADS 🪙' : 'TAILS 💿';
    const outcome = Math.random() < 0.5 ? 'Lady Luck is on your side today! 🍀' : 'Better luck next time! 🎲';
    await trashcore.sendMessage(chat, {
      text: `🪙 *COIN FLIP*\n\nFlipping...\n\n*${result}*\n\n_${outcome}_`
    }, { quoted: m });
  }
};

// ─── trivia ──────────────────────────────────────────────────

const triviaGames = new Map();

const trivia = {
  command: ['trivia', 'quiz'],
  desc:    'Start a trivia quiz game',
  category: 'Fun',
  usage:   '.trivia',
  run: async ({ trashcore, m, chat, args, xreply }) => {
    if (args[0] === 'stop') {
      triviaGames.delete(chat);
      return xreply('🛑 Trivia stopped.');
    }
    if (triviaGames.has(chat)) {
      const game    = triviaGames.get(chat);
      const userAns = args.join(' ').toLowerCase().trim();
      if (!userAns) return xreply(`❓ A trivia question is already active!\n\n*${game.question}*\n\nOptions:\n${game.options.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\nType a number or the answer.`);
      const guess   = parseInt(userAns) - 1;
      const chosen  = (guess >= 0 && guess < game.options.length) ? game.options[guess] : userAns;
      if (chosen.toLowerCase() === game.answer.toLowerCase()) {
        triviaGames.delete(chat);
        return trashcore.sendMessage(chat, { text: `✅ *Correct!* 🎉\n\nThe answer was: *${game.answer}*` }, { quoted: m });
      } else {
        return xreply(`❌ Wrong! Try again.\n\n*${game.question}*\n\nOptions:\n${game.options.map((o, i) => `${i + 1}. ${o}`).join('\n')}`);
      }
    }
    try {
      await xreply('🎯 Loading trivia question...');
      const { data } = await axios.get('https://opentdb.com/api.php?amount=1&type=multiple&encode=url3986', { timeout: 12000 });
      if (!data?.results?.length) return xreply('❌ Failed to load trivia. Try again!');
      const q        = data.results[0];
      const question = decodeURIComponent(q.question);
      const answer   = decodeURIComponent(q.correct_answer);
      const options  = [...q.incorrect_answers.map(decodeURIComponent), answer].sort(() => Math.random() - 0.5);
      const ts       = Date.now();
      triviaGames.set(chat, { question, answer, options, time: ts });
      setTimeout(() => {
        const g = triviaGames.get(chat);
        if (g && g.time === ts) {
          triviaGames.delete(chat);
          trashcore.sendMessage(chat, { text: `⏰ Time's up! The answer was: *${answer}*` }).catch(() => {});
        }
      }, 60000);
      await trashcore.sendMessage(chat, {
        text: `🧠 *TRIVIA QUESTION*\n📚 Category: ${decodeURIComponent(q.category)}\n⭐ Difficulty: ${q.difficulty}\n\n❓ *${question}*\n\n${options.map((o, i) => `${i + 1}. ${o}`).join('\n')}\n\n_Reply with the number or the full answer. 60s time limit!_`
      }, { quoted: m });
    } catch (err) {
      console.error('[trivia]:', err.message);
      xreply('❌ Failed to load trivia. The trivia API may be busy — try again in a moment!');
    }
  }
};

// ─── answer ──────────────────────────────────────────────────

const answer = {
  command: ['answer', 'ans'],
  desc:    'Answer the current trivia question',
  category: 'Fun',
  usage:   '.answer <your answer>',
  run: async ({ trashcore, m, chat, args, xreply }) => {
    if (!triviaGames.has(chat)) return xreply('❌ No active trivia question. Start one with .trivia');
    const game    = triviaGames.get(chat);
    const userAns = args.join(' ').toLowerCase().trim();
    if (!userAns) return xreply(`❓ Current question:\n\n*${game.question}*\n\nOptions:\n${game.options.map((o, i) => `${i + 1}. ${o}`).join('\n')}`);
    const guess  = parseInt(userAns) - 1;
    const chosen = (guess >= 0 && guess < game.options.length) ? game.options[guess] : userAns;
    if (chosen.toLowerCase() === game.answer.toLowerCase()) {
      triviaGames.delete(chat);
      return trashcore.sendMessage(chat, { text: `✅ *Correct!* 🎉\n\nThe answer was: *${game.answer}*` }, { quoted: m });
    }
    return xreply(`❌ Wrong! Try again.\n\n*${game.question}*\n\nOptions:\n${game.options.map((o, i) => `${i + 1}. ${o}`).join('\n')}`);
  }
};

// ─── scramble ────────────────────────────────────────────────

const WORDS = [
  'elephant','guitar','chocolate','universe','library','mountain','journey',
  'paradise','keyboard','calendar','diamond','dolphin','notebook','freedom',
  'coconut','umbrella','penguin','waterfall','midnight','sunshine','crystal',
  'tornado','volcano','mango','butterfly','treasure','symphony','blanket',
  'giraffe','octopus','airplane','stadium','software','physics','quantum'
];
const scrambleGames = new Map();

const scramble = {
  command: ['scramble', 'unscramble'],
  desc:    'Guess the scrambled word game',
  category: 'Fun',
  usage:   '.scramble',
  run: async ({ trashcore, m, chat, args, xreply }) => {
    if (args[0] === 'stop') { scrambleGames.delete(chat); return xreply('🛑 Scramble stopped.'); }
    if (scrambleGames.has(chat)) {
      const game = scrambleGames.get(chat);
      if (!args[0]) return xreply(`🔡 Unscramble: *${game.scrambled}*\n_Type your answer!_`);
      if (args[0].toLowerCase() === game.word) {
        scrambleGames.delete(chat);
        return trashcore.sendMessage(chat, { text: `✅ *Correct!* 🎉 The word was *${game.word}*` }, { quoted: m });
      }
      return xreply(`❌ Wrong! Try again.\n🔡 Scrambled: *${game.scrambled}*`);
    }
    const word     = WORDS[Math.floor(Math.random() * WORDS.length)];
    const scrambled = word.split('').sort(() => Math.random() - 0.5).join('');
    scrambleGames.set(chat, { word, scrambled });
    setTimeout(() => {
      if (scrambleGames.has(chat)) {
        scrambleGames.delete(chat);
        trashcore.sendMessage(chat, { text: `⏰ Time's up! The word was: *${word}*` }).catch(() => {});
      }
    }, 60000);
    await trashcore.sendMessage(chat, {
      text: `🔡 *WORD SCRAMBLE*\n\nUnscramble this word:\n\n*${scrambled.toUpperCase()}*\n\n_Type your answer! 60s time limit._`
    }, { quoted: m });
  }
};

// ─── hangman ─────────────────────────────────────────────────

const HANG_STAGES = [
  '```\n  +---+\n  |   |\n      |\n      |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n      |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n  |   |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|   |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n      |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n /    |\n      |\n=========```',
  '```\n  +---+\n  |   |\n  O   |\n /|\\  |\n / \\  |\n      |\n=========```'
];
const hangmanGames = new Map();

function buildHangmanDisplay(state) {
  const display = state.word.split('').map(c => state.guessed.has(c) ? c : '_').join(' ');
  const wrong   = [...state.wrong].join(', ') || 'none';
  const stage   = HANG_STAGES[state.errors] || HANG_STAGES[HANG_STAGES.length - 1];
  return `${stage}\n\n📝 Word: *${display}*\n❌ Wrong: ${wrong}\n❤️ Lives: ${6 - state.errors}/6`;
}

const hangman = {
  command: ['hangman'],
  desc:    'Play hangman word guessing game',
  category: 'Fun',
  usage:   '.hangman',
  run: async ({ trashcore, m, chat, args, xreply }) => {
    if (args[0] === 'stop') { hangmanGames.delete(chat); return xreply('🛑 Hangman ended.'); }
    if (hangmanGames.has(chat)) {
      const game   = hangmanGames.get(chat);
      const letter = args[0]?.toLowerCase().trim();
      if (!letter || letter.length !== 1 || !/[a-z]/.test(letter))
        return xreply(`✏️ Type a single letter!\n\n${buildHangmanDisplay(game)}`);
      if (game.guessed.has(letter) || game.wrong.has(letter))
        return xreply(`⚠️ Already guessed *${letter}*\n\n${buildHangmanDisplay(game)}`);
      if (game.word.includes(letter)) {
        game.guessed.add(letter);
        const won = game.word.split('').every(c => game.guessed.has(c));
        if (won) { hangmanGames.delete(chat); return trashcore.sendMessage(chat, { text: `🎉 *YOU WIN!*\nThe word was: *${game.word}*` }, { quoted: m }); }
        return xreply(`✅ Good guess!\n\n${buildHangmanDisplay(game)}`);
      } else {
        game.wrong.add(letter);
        game.errors++;
        if (game.errors >= 6) { hangmanGames.delete(chat); return trashcore.sendMessage(chat, { text: `💀 *GAME OVER!*\nThe word was: *${game.word}*\n\n${HANG_STAGES[6]}` }, { quoted: m }); }
        return xreply(`❌ Wrong letter!\n\n${buildHangmanDisplay(game)}`);
      }
    }
    const word = WORDS[Math.floor(Math.random() * WORDS.length)];
    const game = { word, guessed: new Set(), wrong: new Set(), errors: 0 };
    hangmanGames.set(chat, game);
    await trashcore.sendMessage(chat, { text: `🎮 *HANGMAN STARTED!*\n\n${buildHangmanDisplay(game)}\n\n_Type .hangman <letter> to guess_` }, { quoted: m });
  }
};

// ─── tictactoe ───────────────────────────────────────────────

const tttGames = new Map();

function tttBoard(b) {
  const r = b.map(c => c || '⬜');
  return `${r[0]}${r[1]}${r[2]}\n${r[3]}${r[4]}${r[5]}\n${r[6]}${r[7]}${r[8]}`;
}

function tttCheck(b, s) {
  const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
  return wins.some(([a,c,d]) => b[a] === s && b[c] === s && b[d] === s);
}

function tttAiMove(b) {
  const empties = b.map((c, i) => c ? null : i).filter(i => i !== null);
  for (const i of empties) { const t = [...b]; t[i] = '❌'; if (tttCheck(t, '❌')) return i; }
  for (const i of empties) { const t = [...b]; t[i] = '⭕'; if (tttCheck(t, '⭕')) return i; }
  if (!b[4]) return 4;
  const corners = [0,2,6,8].filter(i => !b[i]);
  if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
  return empties[Math.floor(Math.random() * empties.length)];
}

const tictactoe = {
  command: ['tictactoe', 'ttt'],
  desc:    'Play Tic Tac Toe against the bot',
  category: 'Fun',
  usage:   '.ttt <1-9>',
  run: async ({ trashcore, m, chat, args, xreply, sender }) => {
    if (args[0] === 'stop' || args[0] === 'quit') { tttGames.delete(chat + sender); return xreply('🛑 Game ended.'); }
    const key = chat + sender;
    if (!tttGames.has(key)) {
      tttGames.set(key, Array(9).fill(null));
      return trashcore.sendMessage(chat, {
        text: `🎮 *TIC TAC TOE*\nYou are ⭕, Bot is ❌\n\n${tttBoard(Array(9).fill(null))}\n\n_Pick a cell (1-9):_\n1️⃣2️⃣3️⃣\n4️⃣5️⃣6️⃣\n7️⃣8️⃣9️⃣\n\nType .ttt <number> to play`
      }, { quoted: m });
    }
    const board = tttGames.get(key);
    const pos   = parseInt(args[0]) - 1;
    if (isNaN(pos) || pos < 0 || pos > 8) return xreply('⚠️ Pick a number 1-9');
    if (board[pos]) return xreply('❌ That cell is taken! Pick another.');
    board[pos] = '⭕';
    if (tttCheck(board, '⭕')) { tttGames.delete(key); return trashcore.sendMessage(chat, { text: `🏆 *YOU WIN!* Congratulations!\n\n${tttBoard(board)}` }, { quoted: m }); }
    if (board.every(Boolean)) { tttGames.delete(key); return trashcore.sendMessage(chat, { text: `🤝 *DRAW!*\n\n${tttBoard(board)}` }, { quoted: m }); }
    const ai = tttAiMove(board);
    board[ai] = '❌';
    if (tttCheck(board, '❌')) { tttGames.delete(key); return trashcore.sendMessage(chat, { text: `🤖 *BOT WINS!* Better luck next time.\n\n${tttBoard(board)}` }, { quoted: m }); }
    if (board.every(Boolean)) { tttGames.delete(key); return trashcore.sendMessage(chat, { text: `🤝 *DRAW!*\n\n${tttBoard(board)}` }, { quoted: m }); }
    await trashcore.sendMessage(chat, { text: `🎮 *TIC TAC TOE*\n\n${tttBoard(board)}\n\n_Your turn! Pick 1-9_` }, { quoted: m });
  }
};

// ─── connect4 ────────────────────────────────────────────────

const c4Games = new Map();
const C4_ROWS = 6, C4_COLS = 7;
const C4_EMPTY = '⬜', C4_P = '🔴', C4_BOT = '🟡';

function makeC4Board() {
  return Array.from({ length: C4_ROWS }, () => Array(C4_COLS).fill(null));
}

function c4Render(board) {
  const rows = board.map(row => row.map(c => c || C4_EMPTY).join('')).join('\n');
  return rows + '\n1️⃣2️⃣3️⃣4️⃣5️⃣6️⃣7️⃣';
}

function c4Drop(board, col, piece) {
  for (let r = C4_ROWS - 1; r >= 0; r--) {
    if (!board[r][col]) { board[r][col] = piece; return r; }
  }
  return -1;
}

function c4Check(board, piece) {
  for (let r = 0; r < C4_ROWS; r++) {
    for (let c = 0; c < C4_COLS; c++) {
      if (board[r][c] !== piece) continue;
      const dirs = [[0,1],[1,0],[1,1],[1,-1]];
      for (const [dr, dc] of dirs) {
        let count = 1;
        for (let i = 1; i < 4; i++) {
          const nr = r + dr * i, nc = c + dc * i;
          if (nr < 0 || nr >= C4_ROWS || nc < 0 || nc >= C4_COLS || board[nr][nc] !== piece) break;
          count++;
        }
        if (count >= 4) return true;
      }
    }
  }
  return false;
}

function c4AiMove(board) {
  const available = [];
  for (let c = 0; c < C4_COLS; c++) { if (!board[0][c]) available.push(c); }
  for (const col of available) {
    const copy = board.map(r => [...r]);
    c4Drop(copy, col, C4_BOT);
    if (c4Check(copy, C4_BOT)) return col;
  }
  for (const col of available) {
    const copy = board.map(r => [...r]);
    c4Drop(copy, col, C4_P);
    if (c4Check(copy, C4_P)) return col;
  }
  if (!board[C4_ROWS - 1][3]) return 3;
  return available[Math.floor(Math.random() * available.length)];
}

const connect4 = {
  command: ['connect4', 'c4'],
  desc:    'Play Connect 4 against the bot',
  category: 'Fun',
  usage:   '.connect4 <1-7>',
  run: async ({ trashcore, m, chat, args, sender, xreply }) => {
    if (args[0] === 'stop') { c4Games.delete(chat + sender); return xreply('🛑 Connect 4 ended.'); }
    const key = chat + sender;
    if (!c4Games.has(key)) {
      const board = makeC4Board();
      c4Games.set(key, board);
      return trashcore.sendMessage(chat, {
        text: `🎮 *CONNECT 4*\nYou are 🔴, Bot is 🟡\n\n${c4Render(board)}\n\n_Type .c4 <column 1-7> to drop your piece!_`
      }, { quoted: m });
    }
    const board = c4Games.get(key);
    const col   = parseInt(args[0]) - 1;
    if (isNaN(col) || col < 0 || col >= C4_COLS) return xreply('⚠️ Pick a column 1-7');
    if (board[0][col]) return xreply('❌ That column is full! Pick another.');
    c4Drop(board, col, C4_P);
    if (c4Check(board, C4_P)) {
      c4Games.delete(key);
      return trashcore.sendMessage(chat, { text: `🏆 *YOU WIN!* Great play!\n\n${c4Render(board)}` }, { quoted: m });
    }
    if (board[0].every(Boolean)) {
      c4Games.delete(key);
      return trashcore.sendMessage(chat, { text: `🤝 *DRAW!*\n\n${c4Render(board)}` }, { quoted: m });
    }
    const aiCol = c4AiMove(board);
    c4Drop(board, aiCol, C4_BOT);
    if (c4Check(board, C4_BOT)) {
      c4Games.delete(key);
      return trashcore.sendMessage(chat, { text: `🤖 *BOT WINS!* Better luck next time!\n\n${c4Render(board)}` }, { quoted: m });
    }
    if (board[0].every(Boolean)) {
      c4Games.delete(key);
      return trashcore.sendMessage(chat, { text: `🤝 *DRAW!*\n\n${c4Render(board)}` }, { quoted: m });
    }
    await trashcore.sendMessage(chat, { text: `🎮 *CONNECT 4*\n\n${c4Render(board)}\n\n_Your turn! Pick 1-7_` }, { quoted: m });
  }
};

// ─── bet ─────────────────────────────────────────────────────

const betCoins = new Map();
const BET_STARTING = 100;

function getCoins(sender) {
  if (!betCoins.has(sender)) betCoins.set(sender, BET_STARTING);
  return betCoins.get(sender);
}

const bet = {
  command: ['bet', 'gamble'],
  desc:    'Bet virtual coins — win or lose!',
  category: 'Fun',
  usage:   '.bet <amount> | .bet all | .bet coins',
  run: async ({ trashcore, m, chat, args, sender, xreply }) => {
    const coins = getCoins(sender);

    if (!args[0] || args[0] === 'coins' || args[0] === 'balance') {
      return xreply(`💰 *Your Balance*\n\n🪙 Coins: *${coins}*\n\n_Use .bet <amount> to gamble!\nExample: .bet 50_`);
    }

    let amount;
    if (args[0].toLowerCase() === 'all') {
      amount = coins;
    } else {
      amount = parseInt(args[0]);
      if (isNaN(amount) || amount <= 0) return xreply('⚠️ Please enter a valid bet amount.\nExample: .bet 50');
    }

    if (amount > coins) return xreply(`❌ You don't have enough coins!\n🪙 Your balance: *${coins}*`);
    if (amount < 1)     return xreply('⚠️ Minimum bet is 1 coin.');

    const won    = Math.random() < 0.5;
    const change = won ? amount : -amount;
    const newBal = coins + change;
    betCoins.set(sender, Math.max(0, newBal));

    if (newBal <= 0) {
      betCoins.set(sender, BET_STARTING);
      return trashcore.sendMessage(chat, {
        text: `🎰 *BET*\n\n💸 You bet: *${amount}* coins\n\n❌ *YOU LOST!* 😭\n\n🪙 Balance: *0*\n\n_You went broke! Here's a starter pack of ${BET_STARTING} coins. 🎁_`
      }, { quoted: m });
    }

    await trashcore.sendMessage(chat, {
      text: `🎰 *BET*\n\n💸 You bet: *${amount}* coins\n\n${won ? `🏆 *YOU WON!* 🎉\n+${amount} coins` : `❌ *YOU LOST!* 😭\n-${amount} coins`}\n\n🪙 New Balance: *${Math.max(0, newBal)}*`
    }, { quoted: m });
  }
};

// ─── ship ────────────────────────────────────────────────────

const ship = {
  command: ['ship', 'love'],
  desc:    'Calculate love compatibility between two users',
  category: 'Fun',
  usage:   '.ship @user1 @user2 OR .ship (reply to someone)',
  run: async ({ trashcore, m, chat, args, xreply }) => {
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    let user1 = m.sender;
    let user2 = mentions[0] || quoted;
    if (mentions.length >= 2) { user1 = mentions[0]; user2 = mentions[1]; }
    if (!user2) return xreply('Usage: .ship @user OR .ship @user1 @user2\nOr reply to someone\'s message.');
    const score = Math.floor(Math.random() * 101);
    const bar   = '❤️'.repeat(Math.round(score / 10)) + '🖤'.repeat(10 - Math.round(score / 10));
    const emoji = score >= 80 ? '💞' : score >= 60 ? '❤️' : score >= 40 ? '💛' : score >= 20 ? '💙' : '💔';
    await trashcore.sendMessage(chat, {
      text: `${emoji} *LOVE SHIP* ${emoji}\n\n👤 @${user1.split('@')[0]}\n💕 & 💕\n👤 @${user2.split('@')[0]}\n\n${bar}\n\n💯 Compatibility: *${score}%*`,
      mentions: [user1, user2]
    }, { quoted: m });
  }
};

// ─── simp ────────────────────────────────────────────────────

const simp = {
  command: ['simp', 'simpmeter'],
  desc:    'Check simp level',
  category: 'Fun',
  usage:   '.simp @user',
  run: async ({ trashcore, m, chat, args, xreply }) => {
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target   = mentions[0] || quoted || m.sender;
    const score    = Math.floor(Math.random() * 101);
    const bar      = '🟥'.repeat(Math.round(score / 10)) + '⬜'.repeat(10 - Math.round(score / 10));
    const title    = score >= 90 ? 'Supreme Simp 👑' : score >= 70 ? 'Super Simp 😩' : score >= 50 ? 'Moderate Simp 😅' : score >= 30 ? 'Slight Simp 😶' : 'Not a Simp 😎';
    await trashcore.sendMessage(chat, {
      text: `💘 *SIMP METER*\n\n👤 @${target.split('@')[0]}\n\n${bar}\n\n📊 Score: *${score}%*\n🏷️ Status: *${title}*`,
      mentions: [target]
    }, { quoted: m });
  }
};

// ─── wasted ──────────────────────────────────────────────────
// All third-party wasted image APIs (alexflipnote, popcat, some-random-api) are
// currently returning 404. Using a styled text fallback instead.

const WASTED_MSGS = [
  "just respawned... apparently they didn't read the instructions. 💀",
  "has been eliminated from the game of life. Try pressing F to pay respects. 💀",
  "died doing something absolutely legendary (probably not). 💀",
  "got rekt. RIP. Moment of silence... okay that's enough. 💀",
  "has left the chat permanently. GG no re. 💀",
  "experienced an unscheduled meeting with the floor. 💀",
  "lost all their lives and forgot to save. 💀",
  "took an L so massive it registered on the Richter scale. 💀",
];

const wasted = {
  command: ['wasted', 'ded'],
  desc:    'GTA-style WASTED message for someone',
  category: 'Fun',
  usage:   '.wasted @user',
  run: async ({ trashcore, m, chat, args, xreply, sender }) => {
    const mentions = m.message?.extendedTextMessage?.contextInfo?.mentionedJid || [];
    const quoted   = m.message?.extendedTextMessage?.contextInfo?.participant;
    const target   = mentions[0] || quoted || sender;
    const msg      = WASTED_MSGS[Math.floor(Math.random() * WASTED_MSGS.length)];
    await trashcore.sendMessage(chat, {
      text: `💀━━━━━━ *W A S T E D* ━━━━━━💀\n\n@${target.split('@')[0]} ${msg}\n\n💀━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━💀`,
      mentions: [target]
    }, { quoted: m });
  }
};

// ─── exports ─────────────────────────────────────────────────

module.exports = [
  eightball, cf,
  trivia, answer,
  scramble, hangman,
  tictactoe, connect4,
  bet, ship, simp, wasted
];

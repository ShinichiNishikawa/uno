// UNO score ranking tests - runnable with Node.js
// Tests cover: getTotal, isRoundComplete, getLastCompleteRound, getCompletedTotal,
//              getSortedPlayers, getRanks, isGameComplete

// ── Simulate state and functions from index.html ──
let state;

function isRoundComplete(r) {
  return state.players.every(p => {
    const v = (state.scores[p] || [])[r];
    return v !== undefined && v !== null;
  });
}

function getLastCompleteRound() {
  let last = -1;
  for (let r = 0; r < (state.totalRounds || 0); r++) {
    if (isRoundComplete(r)) last = r;
    else break;
  }
  return last;
}

function getCompletedTotal(player) {
  const last = getLastCompleteRound();
  let sum = 0;
  for (let r = 0; r <= last; r++) {
    sum += (state.scores[player] || [])[r] || 0;
  }
  return sum;
}

function getTotal(player) {
  return (state.scores[player] || []).reduce((a, b) => a + (b || 0), 0);
}

function getSortedPlayers() {
  return [...state.players].sort((a, b) => getCompletedTotal(a) - getCompletedTotal(b));
}

function getRanks() {
  const hasCompleted = getLastCompleteRound() >= 0;
  const sorted = getSortedPlayers();
  const ranks = {};
  if (!hasCompleted) {
    sorted.forEach(p => ranks[p] = null);
    return ranks;
  }
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && getCompletedTotal(sorted[i]) > getCompletedTotal(sorted[i - 1])) rank = i + 1;
    ranks[sorted[i]] = rank;
  }
  return ranks;
}

function isGameComplete() {
  if (!state || state.totalRounds === 0) return false;
  return state.totalRounds > 0 && getLastCompleteRound() === state.totalRounds - 1;
}

// ── Test framework ──
let pass = 0, fail = 0;
function test(name, fn) {
  try {
    fn();
    console.log(`  ✓ ${name}`);
    pass++;
  } catch (e) {
    console.log(`  ✗ ${name}: ${e.message}`);
    fail++;
  }
}

function assertEqual(actual, expected, msg) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    throw new Error(`${msg || ''} expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function setState(players, scores, totalRounds) {
  state = { players, scores, totalRounds };
}

// ── isRoundComplete tests ──
console.log('isRoundComplete:');

test('全員入力済み → true', () => {
  setState(['A', 'B', 'C'], { A: [10], B: [20], C: [30] }, 3);
  assertEqual(isRoundComplete(0), true);
});

test('1人未入力 → false', () => {
  setState(['A', 'B', 'C'], { A: [10], B: [undefined], C: [30] }, 3);
  assertEqual(isRoundComplete(0), false);
});

test('スコア配列が空 → false', () => {
  setState(['A', 'B'], { A: [10], B: [] }, 3);
  assertEqual(isRoundComplete(0), false);
});

test('0は入力済みとみなす', () => {
  setState(['A', 'B'], { A: [0], B: [0] }, 3);
  assertEqual(isRoundComplete(0), true);
});

// ── getLastCompleteRound tests ──
console.log('\ngetLastCompleteRound:');

test('ラウンド0のみ完了 → 0', () => {
  setState(['A', 'B'], { A: [10], B: [20] }, 3);
  assertEqual(getLastCompleteRound(), 0);
});

test('ラウンド0,1完了 → 1', () => {
  setState(['A', 'B'], { A: [10, 5], B: [20, 15] }, 3);
  assertEqual(getLastCompleteRound(), 1);
});

test('ラウンド0未完了 → -1', () => {
  setState(['A', 'B'], { A: [10], B: [] }, 3);
  assertEqual(getLastCompleteRound(), -1);
});

test('ラウンド0完了、1未完了 → 0（連続の最後）', () => {
  setState(['A', 'B'], { A: [10, 5], B: [20, undefined] }, 3);
  assertEqual(getLastCompleteRound(), 0);
});

test('totalRounds=0 → -1', () => {
  setState(['A', 'B'], { A: [], B: [] }, 0);
  assertEqual(getLastCompleteRound(), -1);
});

// ── getCompletedTotal tests ──
console.log('\ngetCompletedTotal:');

test('完了ラウンドまでの合計のみ', () => {
  setState(['A', 'B'], { A: [10, 5, 99], B: [20, 15, 1] }, 3);
  // ラウンド0,1完了、ラウンド2完了 → 全て含む
  assertEqual(getCompletedTotal('A'), 10 + 5 + 99);
});

test('途中ラウンドが未完了 → そこまでの合計', () => {
  setState(['A', 'B'], { A: [10, 5], B: [20, undefined] }, 3);
  // ラウンド0のみ完了
  assertEqual(getCompletedTotal('A'), 10);
  assertEqual(getCompletedTotal('B'), 20);
});

test('完了ラウンドなし → 0', () => {
  setState(['A', 'B'], { A: [10], B: [] }, 3);
  assertEqual(getCompletedTotal('A'), 0);
});

// ── getTotal tests (全スコア合計) ──
console.log('\ngetTotal:');

test('全スコアの合計（未完了ラウンド含む）', () => {
  setState(['A', 'B'], { A: [10, 5], B: [20, undefined] }, 3);
  assertEqual(getTotal('A'), 15);
  assertEqual(getTotal('B'), 20);
});

// ── Ranking tests (既存 + 新規) ──
console.log('\nRanking tests:');

test('全員同点 → 全員1位', () => {
  setState(['A', 'B', 'C'], { A: [10], B: [10], C: [10] }, 1);
  const ranks = getRanks();
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 1); assertEqual(ranks.C, 1);
});

test('トップ2名同点 → 両方1位、3人目は3位', () => {
  setState(['A', 'B', 'C'], { A: [10], B: [10], C: [20] }, 1);
  const ranks = getRanks();
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 1); assertEqual(ranks.C, 3);
});

test('全員異なる → 1位,2位,3位', () => {
  setState(['A', 'B', 'C'], { A: [10], B: [20], C: [30] }, 1);
  const ranks = getRanks();
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 2); assertEqual(ranks.C, 3);
});

test('2位タイ → 1位,2位,2位,4位', () => {
  setState(['A', 'B', 'C', 'D'], { A: [10], B: [20], C: [20], D: [30] }, 1);
  const ranks = getRanks();
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 2); assertEqual(ranks.C, 2); assertEqual(ranks.D, 4);
});

test('5人中3人同点1位 → 1位,1位,1位,4位,5位', () => {
  setState(['A', 'B', 'C', 'D', 'E'], { A: [5], B: [5], C: [5], D: [10], E: [20] }, 1);
  const ranks = getRanks();
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 1); assertEqual(ranks.C, 1);
  assertEqual(ranks.D, 4); assertEqual(ranks.E, 5);
});

test('複数ラウンドの合計で順位', () => {
  setState(['A', 'B', 'C'], { A: [10, 5], B: [5, 10], C: [20, 0] }, 2);
  const ranks = getRanks();
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 1); assertEqual(ranks.C, 3);
});

test('全員0点 → 全員1位', () => {
  setState(['A', 'B', 'C'], { A: [0], B: [0], C: [0] }, 1);
  const ranks = getRanks();
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 1); assertEqual(ranks.C, 1);
});

// ── New: 入力途中でソート・順位が変わらないテスト ──
console.log('\nSort stability (入力途中):');

test('1人だけ入力 → 順位はnull（完了ラウンドなし）', () => {
  setState(['A', 'B', 'C'], { A: [10], B: [], C: [] }, 3);
  const ranks = getRanks();
  assertEqual(ranks.A, null); assertEqual(ranks.B, null); assertEqual(ranks.C, null);
});

test('ラウンド0完了、ラウンド1途中 → ラウンド0の合計で順位', () => {
  setState(['A', 'B', 'C'], { A: [10, 100], B: [20, undefined], C: [30, undefined] }, 3);
  const ranks = getRanks();
  // ラウンド0のみ完了: A=10, B=20, C=30
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 2); assertEqual(ranks.C, 3);
  // ソート順もラウンド0の合計で決まる（Aのラウンド1の100は無視）
  const sorted = getSortedPlayers();
  assertEqual(sorted, ['A', 'B', 'C']);
});

test('ラウンド1途中のスコアはgetTotalには含まれる', () => {
  setState(['A', 'B', 'C'], { A: [10, 100], B: [20, undefined], C: [30, undefined] }, 3);
  assertEqual(getTotal('A'), 110);
  assertEqual(getTotal('B'), 20);
});

// ── isGameComplete tests ──
console.log('\nisGameComplete:');

test('全ラウンド完了 → true', () => {
  setState(['A', 'B'], { A: [10, 5], B: [20, 15] }, 2);
  assertEqual(isGameComplete(), true);
});

test('最後のラウンド未完了 → false', () => {
  setState(['A', 'B'], { A: [10, 5], B: [20, undefined] }, 2);
  assertEqual(isGameComplete(), false);
});

test('totalRounds=0 → false', () => {
  setState(['A', 'B'], { A: [10], B: [20] }, 0);
  assertEqual(isGameComplete(), false);
});

test('3ラウンド中2ラウンドのみ完了 → false', () => {
  setState(['A', 'B'], { A: [10, 5], B: [20, 15] }, 3);
  assertEqual(isGameComplete(), false);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);

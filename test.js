// UNO score ranking tests - runnable with Node.js
function getTotal(scores) {
  return (scores || []).reduce((a, b) => a + (b || 0), 0);
}

function getRanks(players, scoresMap) {
  const sorted = [...players].sort((a, b) => getTotal(scoresMap[a]) - getTotal(scoresMap[b]));
  const ranks = {};
  let rank = 1;
  for (let i = 0; i < sorted.length; i++) {
    if (i > 0 && getTotal(scoresMap[sorted[i]]) > getTotal(scoresMap[sorted[i - 1]])) {
      rank = i + 1;
    }
    ranks[sorted[i]] = rank;
  }
  return ranks;
}

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

console.log('Ranking tests:');

test('全員同点 → 全員1位', () => {
  const ranks = getRanks(['A', 'B', 'C'], { A: [10], B: [10], C: [10] });
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 1); assertEqual(ranks.C, 1);
});

test('トップ2名同点 → 両方1位、3人目は3位', () => {
  const ranks = getRanks(['A', 'B', 'C'], { A: [10], B: [10], C: [20] });
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 1); assertEqual(ranks.C, 3);
});

test('全員異なる → 1位,2位,3位', () => {
  const ranks = getRanks(['A', 'B', 'C'], { A: [10], B: [20], C: [30] });
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 2); assertEqual(ranks.C, 3);
});

test('2位タイ → 1位,2位,2位,4位', () => {
  const ranks = getRanks(['A', 'B', 'C', 'D'], { A: [10], B: [20], C: [20], D: [30] });
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 2); assertEqual(ranks.C, 2); assertEqual(ranks.D, 4);
});

test('5人中3人同点1位 → 1位,1位,1位,4位,5位', () => {
  const ranks = getRanks(['A', 'B', 'C', 'D', 'E'], { A: [5], B: [5], C: [5], D: [10], E: [20] });
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 1); assertEqual(ranks.C, 1);
  assertEqual(ranks.D, 4); assertEqual(ranks.E, 5);
});

test('複数ラウンドの合計で順位', () => {
  const ranks = getRanks(['A', 'B', 'C'], { A: [10, 5], B: [5, 10], C: [20, 0] });
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 1); assertEqual(ranks.C, 3);
});

test('スコア未入力(undefined)は0扱い', () => {
  const ranks = getRanks(['A', 'B'], { A: [10, undefined], B: [10, 5] });
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 2);
});

test('全員0点 → 全員1位', () => {
  const ranks = getRanks(['A', 'B', 'C'], { A: [0], B: [0], C: [0] });
  assertEqual(ranks.A, 1); assertEqual(ranks.B, 1); assertEqual(ranks.C, 1);
});

console.log(`\n${pass} passed, ${fail} failed`);
process.exit(fail > 0 ? 1 : 0);

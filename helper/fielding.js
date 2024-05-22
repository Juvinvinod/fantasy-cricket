const Match = require('../model/matchModel');

async function fieldingScore(player) {
  let caughtScore = 0;
  let bonus = 0;
  const results = await Match.find({ fielders_involved: player });
  results.forEach((doc) => {
    if (doc.kind === 'caught') {
      caughtScore += 1;
      bonus += 25;
    }
    if (doc.kind === 'stumping') {
      bonus += 12;
    }
    if (doc.kind === 'run-out') {
      bonus += 6;
    }
  });
  if (caughtScore >= 3) {
    const count = Math.ceil(caughtScore / 3);
    bonus += count * 4;
  }

  return bonus;
}

module.exports = {
  fieldingScore,
};

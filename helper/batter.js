const Match = require('../model/matchModel');

async function batterScore(player) {
  let score = 0;
  let bonus = 0;
  const results = await Match.find({ batter: player });
  results.forEach((doc) => {
    score += doc.batsman_run;
    if (
      (doc.batsman_run === 4 || doc.batsman_run === 6) &&
      doc.non_boundary === 0
    ) {
      if (doc.batsman_run === 4) {
        bonus += 1;
      } else {
        bonus += 2;
      }
    }
  });
  if (score >= 30) {
    const count = Math.ceil(score / 30);
    bonus += count * 4;
  }
  if (score >= 50) {
    const count = Math.ceil(score / 50);
    bonus += count * 8;
  }
  if (score >= 100) {
    const count = Math.ceil(score / 100);
    bonus += count * 16;
  }
  if (score === 0) {
    bonus -= 2;
  }

  return score + bonus;
}

module.exports = {
  batterScore,
};

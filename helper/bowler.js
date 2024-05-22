const Match = require('../model/matchModel');

async function bowlerScore(player) {
  try {
    let score = 0;
    let bonus = 0;
    let ballNumber = 1;
    let runs = 0;
    const results = await Match.find({ bowler: player }).sort({
      overs: 1,
      ballnumber: 1,
    });
    results.forEach((doc) => {
      runs += doc.batsman_run;
      score += doc.isWicketDelivery;
      if (doc.isWicketDelivery === 1 && doc.kind !== 'run-out') {
        bonus += 25;
      }
      if (
        (doc.isWicketDelivery === 1 && doc.kind === 'lbw') ||
        doc.kind === 'caught and bowled' ||
        doc.kind === 'bowled'
      ) {
        bonus += 8;
      }
      if (doc.ballnumber === 6) {
        ballNumber = 0;
        if (runs === 0) {
          bonus += 12;
        }
        runs = 0;
      }
      ballNumber += 1;
    });
    if (score >= 3) {
      const count = Math.ceil(score / 3);
      bonus += count * 4;
    }
    if (score >= 4) {
      const count = Math.ceil(score / 4);
      bonus += count * 8;
    }
    if (score >= 5) {
      const count = Math.ceil(score / 5);
      bonus += count * 16;
    }

    return score + bonus;
  } catch (error) {
    console.log('Error fetching data from database!!');
  }
}

module.exports = {
  bowlerScore,
};

const express = require('express');
const mongoose = require('mongoose');
const Match = require('./model/matchModel');
const Player = require('./model/playerModel');
const Team = require('./model/teamModel');
const batsmen = require('./helper/batter');
const bowler = require('./helper/bowler');
const fielding = require('./helper/fielding');
const Score = require('./model/scoreModel');

const app = express();
const port = 3000;

// middleware
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Database Details
const { DB_USER } = process.env;
const { DB_PWD } = process.env;
const { DB_URL } = process.env;
const DB_NAME = 'task-jeff';
const DB_COLLECTION_NAME = 'players';
const matchesData = require('./data/match.json');
const playersData = require('./data/players.json');

// const { MongoClient, ServerApiVersion } = require('mongodb');
// const uri = "mongodb+srv://"+DB_USER+":"+DB_PWD+"@"+DB_URL+"/?retryWrites=true&w=majority";
const uri = 'mongodb://127.0.0.1:27017/task-jeff';

let db;

async function run() {
  try {
    // await client.connect();
    // await client.db("admin").command({ ping: 1 });

    // db = client.db(DB_NAME);
    await mongoose.connect(uri);

    console.log('You successfully connected to MongoDB!');
  } catch {
    console.log('Error connecting db!!');
  }
}

// Sample create document
async function sampleCreate() {
  await Match.deleteMany({});
  await Player.deleteMany({});
  await Match.insertMany(matchesData);
  await Player.insertMany(playersData);
  console.log('Added sample data!');
  // console.log(demo_create.insertedId);
}

// Endpoints

app.get('/', async (req, res) => {
  res.send('Hello World!');
});

app.get('/demo', async (req, res) => {
  await sampleCreate();
  res.send({ status: 201, message: 'Sample data added' });
});

app.post('/add-team', async (req, res) => {
  try {
    console.log(req.body);
    const { team_name } = req.body;
    const { players } = req.body;
    const { captain } = req.body;
    const { vice_captain } = req.body;
    const duplicate = await Team.findOne({ team_name });
    if (duplicate) {
      return res.send({ status: 403, message: 'Team name already taken' });
    }
    if (!team_name) {
      return res.send({ status: 403, message: 'Team name not provided' });
    }
    if (!captain) {
      return res.send({ status: 403, message: 'Captain not provided' });
    }
    if (!vice_captain) {
      return res.send({ status: 403, message: 'Vice captain not provided' });
    }
    if (players.length !== 11) {
      return res.send({
        status: 403,
        message: 'A team should contain 11 players',
      });
    }
    const teams = {};
    const player_type = {
      WICKETKEEPER: 0,
      BATTER: 0,
      'ALL-ROUNDER': 0,
      BOWLER: 0,
    };
    for (let i = 0; i < players.length; i++) {
      const name = players[i];
      const playerDetails = await Player.findOne({ Player: name });
      if (!playerDetails) {
        return res.send({ status: 403, message: 'player not found' });
      }
      if (!teams[playerDetails.Team]) {
        teams[playerDetails.Team] = 1;
      } else {
        teams[playerDetails.Team]++;
      }
      player_type[playerDetails.Role]++;
    }

    Object.values(teams).forEach((value) => {
      if (value > 10) {
        return res.send({
          status: 403,
          message:
            'A maximum of 10 players can only be selected from any one of the teams',
        });
      }
    });
    Object.values(player_type).forEach((value) => {
      if (value < 1 || value > 8) {
        return res.send({
          status: 403,
          message:
            'A minimum of 1 and maximum of 8 roles can only be selected for a team',
        });
      }
    });
    const captain_details = await Player.findOne({ Player: captain });
    if (!captain_details) {
      return res.send({ status: 403, message: 'Captain not found' });
    }
    const vice_details = await Player.findOne({ Player: vice_captain });
    if (!vice_details) {
      return res.send({ status: 403, message: 'Vice captain not found' });
    }
    const team = new Team({
      team_name,
      players,
      captain: captain_details.Player,
      vice_captain: vice_details.Player,
    });
    await team.save();
    res.send({ status: 201, message: 'New team created' });
  } catch (error) {
    return res.send({ status: 500, message: 'Error creating team' });
  }
});

app.get('/process-result', async (req, res) => {
  try {
    await Score.deleteMany({});
    const players = await Player.find();
    for (const item of players) {
      let total = 0;
      if (item.Role === 'BATTER') {
        const playerScore = await batsmen.batterScore(item.Player);
        const fieldingScore = await fielding.fieldingScore(item.Player);
        total = playerScore + fieldingScore;
      }
      if (item.Role === 'BOWLER') {
        const playerScore = await bowler.bowlerScore(item.Player);
        const fieldingScore = await fielding.fieldingScore(item.Player);
        total = playerScore + fieldingScore;
      }
      if (item.Role === 'ALL-ROUNDER' || item.Role === 'WICKETKEEPER') {
        const playerScore1 = await batsmen.batterScore(item.Player);
        const playerScore2 = await bowler.bowlerScore(item.Player);
        const fieldingScore = await fielding.fieldingScore(item.Player);
        total = playerScore1 + playerScore2 + fieldingScore;
      }
      const player = new Score({
        name: item.Player,
        score: total,
      });
      await player.save();
    }

    const teams = await Team.find();
    for (let i = 0; i <= teams.length - 1; i++) {
      const team = teams[i];
      let score = 0;
      for (let j = 0; j < team.players.length; j++) {
        const playerName = team.players[i];
        console.log(playerName);
        const details = await Score.findOne({ name: playerName });
        console.log('searchdetails:', details);
        if (details.name === team.captain) {
          score += 2 * details.score;
        } else if (details.name === team.vice_captain) {
          score += 1.5 * details.score;
        } else {
          score += details.score;
        }
        const teamName = team.team_name;
        console.log(score);
        await Team.updateOne(
          { team_name: teamName },
          { $set: { total_score: score } },
        );
      }
    }
    res.send({ status: 201, message: 'Result processed' });
  } catch (error) {
    return res.send({ status: 500, message: 'Error processing data' });
  }
});

app.get('/team-result', async (req, res) => {
  try {
    const teams = await Team.find({}, { team_name: 1, total_score: 1 }).sort({
      total_score: -1,
    });
    if (teams.length === 0) {
      console.log('No teams found.');
      return { status: 404, message: 'No teams found.' };
    }
    const highestScore = teams[0].total_score;
    const topTeams = teams.filter((team) => team.total_score === highestScore);
    console.log('Teams and their scores:', teams);
    console.log('Top team(s):', topTeams);

    return res.send({
      status: 200,
      message: 'Teams retrieved successfully',
      teams,
      topTeams,
    });
  } catch (error) {
    return { status: 500, message: 'Error retrieving teams' };
  }
});

//

app.listen(port, () => {
  console.log(`App listening on port ${port}`);
});

run();

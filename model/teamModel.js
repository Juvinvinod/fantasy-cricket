const mongoose = require('mongoose');

const teamSchema = new mongoose.Schema({
  team_name: {
    type: String,
    required: true,
  },
  players: {
    type: [],
    required: true,
  },
  captain: {
    type: String,
    required: true,
  },
  vice_captain: {
    type: String,
    required: true,
  },
  total_score: {
    type: Number,
    default: 0,
  },
});

module.exports = mongoose.model('Team', teamSchema);

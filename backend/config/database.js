require('dotenv').config(); // Charge le .env
const { Sequelize } = require('sequelize');
const path = require('path');

const sequelize = new Sequelize({
  dialect: 'sqlite',
  // Utilise la variable DATABASE_STORAGE du .env ou le chemin par défaut
  storage: process.env.DATABASE_STORAGE || path.join(__dirname, '../database.sqlite'),
  logging: false
});

module.exports = { sequelize };
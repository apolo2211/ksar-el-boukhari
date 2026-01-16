const sequelize = require('./config/database')

(async () => {
  await sequelize.sync({ alter: true });
  console.log('✅ SQLite initialisée');
  process.exit();
})();

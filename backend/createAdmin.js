const sequelize = require('./config/database');
const bcrypt = require('bcryptjs');
const User = require('./models/User');

(async () => {
  await sequelize.sync();

  const password = await bcrypt.hash('admin123', 10);

  await User.findOrCreate({
    where: { email: 'admin@ksar.com' },
    defaults: { password, role: 'admin' }
  });

  console.log('✅ Admin : admin@ksar.com / admin123');
  process.exit();
})();

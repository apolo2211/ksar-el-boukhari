const { sequelize } = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcrypt');

async function run() {
  try {
    console.log('⏳ Connexion à la base de données...');
    await sequelize.sync();

    const email = 'admin@ksar.com';
    const password = await bcrypt.hash('admin123', 10);

    // On cherche l'admin, s'il n'existe pas on le crée
    const [user, created] = await User.findOrCreate({
      where: { email: email },
      defaults: {
        password: password,
        role: 'admin'
      }
    });

    if (created) {
      console.log('✅ Admin créé : ' + email + ' / admin123');
    } else {
      // Si l'utilisateur existe déjà, on le force en admin
      user.role = 'admin';
      user.password = password;
      await user.save();
      console.log('🔄 Compte existant mis à jour en Admin');
    }

  } catch (err) {
    console.error('❌ Erreur détaillée :', err);
  } finally {
    await sequelize.close();
    process.exit();
  }
}

// Lancement de la fonction
run();
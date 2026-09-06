import bcrypt from 'bcryptjs';
import User from '../models/User.js';

export const ensureAdminUser = async () => {
  try {
    const adminEmail = 'admin@gmail.com';
    const existing = await User.findOne({ email: adminEmail });
    if (!existing) {
      const hashedPassword = await bcrypt.hash('admin123', 12);
      await User.create({
        name: 'Sunil Admin',
        email: adminEmail,
        password: hashedPassword,
        role: 'superadmin',
      });
      console.log('✅ Default superadmin created: admin@gmail.com / admin123');
    }
  } catch (error) {
    console.error('⚠️ Admin seed notice:', error.message);
  }
};

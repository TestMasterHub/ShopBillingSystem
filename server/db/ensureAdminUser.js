const bcrypt = require('bcryptjs');
const supabase = require('./supabaseClient');

async function ensureAdminUser() {
  const { count, error: countError } = await supabase
    .from('billingsystemusers')
    .select('id', { count: 'exact', head: true });

  if (countError) {
    throw new Error(`Failed to check billingsystemusers table: ${countError.message}`);
  }

  if (count === 0) {
    const username = process.env.ADMIN_USERNAME || 'admin';
    const password = process.env.ADMIN_PASSWORD || 'admin123';
    const hash = bcrypt.hashSync(password, 10);

    const { error: insertError } = await supabase
      .from('billingsystemusers')
      .insert({ username, password_hash: hash, role: 'admin' });

    if (insertError) {
      throw new Error(`Failed to seed admin user: ${insertError.message}`);
    }
  }
}

module.exports = { ensureAdminUser };
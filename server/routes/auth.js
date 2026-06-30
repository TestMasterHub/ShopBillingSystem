const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const supabase = require('../db/supabaseClient');
const { mapUserRow } = require('../db/mappers');
const { JWT_SECRET, authMiddleware } = require('../middleware/auth');

const router = express.Router();

router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ message: 'Username and password are required.' });
    }

    const { data, error } = await supabase
      .from('billingsystemusers')
      .select('*')
      .eq('username', username.trim())
      .maybeSingle();

    if (error) {
      console.error(error);
      return res.status(500).json({ message: 'Failed to login.' });
    }

    if (!data) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const user = mapUserRow(data);

    const isValid = bcrypt.compareSync(password, user.passwordHash);
    if (!isValid) {
      return res.status(401).json({ message: 'Invalid username or password.' });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '12h' }
    );

    res.json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Failed to login.' });
  }
});

router.get('/me', authMiddleware, (req, res) => {
  res.json({ user: req.user });
});

module.exports = router;
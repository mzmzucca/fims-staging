import { supabase } from '../lib/supabase';

export const authService = {
  async login(email, password) {
    try {
      const { data: users, error } = await supabase
        .from('fims_users')
        .select('*')
        .eq('email', email)
        .eq('active', true)
        .limit(1);

      if (error) throw error;
      if (!users || users.length === 0) return { success: false, error: 'User not found' };

      const user = users[0];
      if (user.password !== password) return { success: false, error: 'Wrong password' };

      const formattedUser = {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        avatar: user.avatar || user.name.substring(0, 2).toUpperCase()
      };

      localStorage.setItem('fims_current_user', JSON.stringify(formattedUser));
      await this.logActivity(formattedUser, 'Login', 'auth', { ip: 'unknown' });

      return { success: true, user: formattedUser };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: err.message };
    }
  },

  async logout(userId, userName) {
    try {
      const user = { id: userId, name: userName };
      if (userId) await this.logActivity(user, 'Logout', 'auth', {});
      localStorage.removeItem('fims_current_user');
      return { success: true };
    } catch (err) {
      return { success: false };
    }
  },

  async getCurrentUser() {
    const saved = localStorage.getItem('fims_current_user');
    return saved ? JSON.parse(saved) : null;
  },

  async getAllUsers() {
    try {
      const { data, error } = await supabase.from('fims_users').select('*').order('name', { ascending: true });
      if (error) throw error;
      
      return (data || []).map(u => ({
        id: Number(u.id),
        name: u.name,
        email: u.email,
        role: u.role,
        active: u.active,
        avatar: u.avatar || u.name.substring(0, 2).toUpperCase()
      }));
    } catch (err) {
      console.error('Error fetching users:', err);
      return [];
    }
  },

  async logActivity(user, action, action_type, metadata = {}) {
    try {
      await supabase.from('fims_logs').insert([{
        user_id: Number(user.id) || null,
        user_name: user.name || 'System',
        action: action,
        action_type: action_type,
        detail: typeof metadata === 'string' ? metadata : JSON.stringify(metadata),
        metadata: metadata
      }]);
    } catch (err) {
      console.error('Error saving log:', err);
    }
  }
};

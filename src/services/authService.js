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
      
      if (!users || users.length === 0) {
        // Log failed login (user not found)
        await this.logEvent('auth.login_failed', { email }, { reason: 'User not found' });
        return { success: false, error: 'User not found' };
      }

      const user = users[0];
      if (user.password !== password) {
        // Log failed login (wrong password)
        await this.logEvent('auth.login_failed', { email: user.email, id: user.id, name: user.name, role: user.role }, { reason: 'Wrong password' });
        return { success: false, error: 'Wrong password' };
      }

      const formattedUser = {
        id: Number(user.id),
        name: user.name,
        email: user.email,
        role: user.role,
        active: user.active,
        avatar: user.avatar || user.name.substring(0, 2).toUpperCase()
      };

      localStorage.setItem('fims_current_user', JSON.stringify(formattedUser));
      localStorage.setItem('fims_session_start', Date.now()); // Track session start time

      await this.logEvent('auth.login_success', formattedUser, {});
      return { success: true, user: formattedUser };
    } catch (err) {
      console.error('Login error:', err);
      return { success: false, error: err.message };
    }
  },

  async logout(user) {
    try {
      if (user) {
        const sessionStart = localStorage.getItem('fims_session_start');
        let durationSec = 0;
        if (sessionStart) {
          durationSec = Math.round((Date.now() - parseInt(sessionStart)) / 1000);
        }
        
        await this.logEvent('auth.logout', user, { 
          session_duration_sec: durationSec,
          session_duration_min: Math.round(durationSec / 60)
        });
      }
      localStorage.removeItem('fims_current_user');
      localStorage.removeItem('fims_session_start');
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

  // The Universal Event Logger
  async logEvent(eventType, actor, metadata = {}) {
    try {
      let ip = 'unknown';
      let userAgent = 'unknown';

      // Fetch IP and User Agent only if in browser
      if (typeof window !== 'undefined') {
        userAgent = navigator.userAgent;
        // Basic IP fetch (can be slow, so we don't block the UI)
        try {
          const res = await fetch('https://api.ipify.org?format=json');
          const data = await res.json();
          ip = data.ip || 'unknown';
        } catch (e) { ip = 'local_or_blocked'; }
      }

      await supabase.from('fims_events').insert([{
        event_type: eventType,
        actor_id: actor?.id || null,
        actor_name: actor?.name || 'System',
        actor_role: actor?.role || null,
        ip_address: ip,
        user_agent: userAgent,
        metadata: metadata
      }]);
    } catch (err) {
      console.error('Event logging error:', err);
    }
  }
};

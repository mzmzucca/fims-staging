// /src/context/CommsContext.jsx
import { createContext, useContext, useState, useEffect } from "react";
import { genId } from "../lib/helpers";
import { supabase } from "../lib/supabase";

const CommsContext = createContext();

export function CommsProvider({ children }) {
  const [notifications, setNotifications] = useState([]);
  const [messages, setMessages] = useState([]);
  const [announcements, setAnnouncements] = useState([]);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    // 1. Fetch existing notifications and messages
    const fetchInitialData = async () => {
      const { data: notifs } = await supabase.from('fims_notifications').select('*').order('timestamp', { ascending: false });
      if (notifs) setNotifications(notifs);

      const { data: msgs } = await supabase.from('fims_messages').select('*').order('timestamp', { ascending: true });
      if (msgs) setMessages(msgs);
    };
    fetchInitialData();

    // 2. Subscribe to Realtime notifications
    const notifChannel = supabase
      .channel('notif-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fims_notifications' }, payload => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    // 3. Subscribe to Realtime messages
    const msgChannel = supabase
      .channel('msg-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fims_messages' }, payload => {
        setMessages(prev => [...prev, payload.new]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(notifChannel);
      supabase.removeChannel(msgChannel);
    };
  }, []);

  const notify = async (userId, text, link = null) => {
    try {
      const notif = {
        id: genId(),
        user_id: Number(userId) || null,
        text,
        timestamp: new Date().toISOString(),
        read: false,
        link
      };
      await supabase.from('fims_notifications').insert([notif]);
    } catch (err) {
      console.error("Notification error:", err);
    }
  };

  const markNotificationRead = async (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n));
    await supabase.from('fims_notifications').update({ read: true }).eq('id', notifId);
  };

  const markAllRead = async (userId) => {
    setNotifications(prev => prev.map(n => n.user_id === Number(userId) ? { ...n, read: true } : n));
    await supabase.from('fims_notifications').update({ read: true }).eq('user_id', Number(userId));
  };

  const clearDraft = () => setDraft("");
  
  const sendMessage = async (fromUser, toUser, text) => {
    try {
      const msg = {
        id: genId(),
        from_id: Number(fromUser.id),
        from_name: fromUser.name,
        to_id: Number(toUser.id),
        to_name: toUser.name,
        text: text.trim(),
        timestamp: new Date().toISOString(),
        read: false,
        is_broadcast: false
      };
      await supabase.from('fims_messages').insert([msg]);
    } catch (err) {
      console.error("Send message error:", err);
    }
  };

  const getConversation = (userId1, userId2) => {
    return messages.filter(m =>
      (m.from_id === userId1 && m.to_id === userId2) ||
      (m.from_id === userId2 && m.to_id === userId1)
    ).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  };

  const createAnnouncement = (fromId, title, text, targetRole = null) => {
    const ann = { id: genId(), fromId, title, text, targetRole, timestamp: new Date().toISOString() };
    setAnnouncements(prev => [...prev, ann]);
  };

  const value = {
    notifications, messages, announcements, draft,
    notify, markNotificationRead, markAllRead,
    sendMessage, getConversation, clearDraft, setDraft, createAnnouncement
  };

  return <CommsContext.Provider value={value}>{children}</CommsContext.Provider>;
}

export function useComms() {
  return useContext(CommsContext);
}
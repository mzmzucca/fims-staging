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
    // 1. Fetch existing notifications from Supabase
    const fetchNotifs = async () => {
      const { data } = await supabase.from('fims_notifications').select('*').order('timestamp', { ascending: false });
      if (data) setNotifications(data);
    };
    fetchNotifs();

    // 2. Subscribe to Realtime notifications
    const channel = supabase
      .channel('custom-all-channel')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'fims_notifications' }, payload => {
        setNotifications(prev => [payload.new, ...prev]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Send notification to Supabase (Realtime broadcasts it to everyone)
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
  
  const sendMessage = (fromId, toId, text) => {
    const msg = { id: genId(), fromId, toId, text: text.trim(), timestamp: new Date().toISOString(), read: false };
    setMessages(prev => [...prev, msg]);
    return msg;
  };

  const getConversation = (userId1, userId2) => {
    return messages.filter(m =>
      (m.fromId === userId1 && m.toId === userId2) ||
      (m.fromId === userId2 && m.toId === userId1)
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

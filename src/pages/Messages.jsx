import { useState, useEffect, useRef } from "react";
import { useComms } from "../context/CommsContext";
import { ROLES } from "../data/constants";
import { Icon } from "../lib/icons";

export default function Messages({ users, currentUser }) {
  const { messages, sendMessage, getConversation } = useComms();
  const [selectedUser, setSelectedUser] = useState(null);
  const [text, setText] = useState("");
  const [search, setSearch] = useState("");
  const chatEndRef = useRef(null);

  const chatUsers = users.filter(u => u.id !== currentUser.id && u.active !== false);
  const filteredUsers = chatUsers.filter(u => u.name.toLowerCase().includes(search.toLowerCase()));

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, selectedUser]);

  const handleSend = () => {
    if (!text.trim() || !selectedUser) return;
    sendMessage(currentUser, selectedUser, text);
    setText("");
  };

  const getLatestMessage = (userId) => {
    const convo = getConversation(currentUser.id, userId);
    return convo.length > 0 ? convo[convo.length - 1] : null;
  };

  return (
    <div style={{ display: 'flex', height: 'calc(100vh - 140px)', backgroundColor: '#fff', borderRadius: 8, overflow: 'hidden', border: '1px solid #eee' }}>
      
      {/* Sidebar */}
      <div style={{ width: '300px', borderRight: '1px solid #eee', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '16px', borderBottom: '1px solid #eee' }}>
          <input 
            className="form-input" 
            placeholder="Search users..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ margin: 0 }}
          />
        </div>
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {filteredUsers.map(u => {
            const latest = getLatestMessage(u.id);
            return (
              <div 
                key={u.id} 
                onClick={() => setSelectedUser(u)}
                style={{ 
                  padding: '12px 16px', 
                  borderBottom: '1px solid #f5f5f5', 
                  cursor: 'pointer',
                  backgroundColor: selectedUser?.id === u.id ? '#E6F1FB' : 'transparent'
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontWeight: 500, fontSize: 14 }}>{u.name}</span>
                  <span style={{ fontSize: 10, color: '#888' }}>{u.role}</span>
                </div>
                <div style={{ fontSize: 12, color: '#888', marginTop: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {latest ? (latest.from_id === currentUser.id ? 'You: ' : '') + latest.text : 'No messages yet'}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Chat Area */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedUser ? (
          <>
            <div style={{ padding: '16px', borderBottom: '1px solid #eee', fontWeight: 600, fontSize: 15 }}>
              {selectedUser.name}
            </div>
            <div style={{ flex: 1, overflowY: 'auto', padding: '16px', backgroundColor: '#F8F7F4' }}>
              {getConversation(currentUser.id, selectedUser.id).map(m => (
                <div key={m.id} style={{ display: 'flex', justifyContent: m.from_id === currentUser.id ? 'flex-end' : 'flex-start', marginBottom: '12px' }}>
                  <div style={{
                    backgroundColor: m.from_id === currentUser.id ? '#185FA5' : '#fff',
                    color: m.from_id === currentUser.id ? '#fff' : '#333',
                    padding: '10px 14px',
                    borderRadius: '8px',
                    maxWidth: '70%',
                    boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
                    fontSize: 14
                  }}>
                    {m.text}
                    <div style={{ fontSize: 10, marginTop: 4, opacity: 0.7, textAlign: 'right' }}>
                      {new Date(m.timestamp).toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <div style={{ padding: '16px', borderTop: '1px solid #eee', display: 'flex', gap: '8px' }}>
              <input 
                className="form-input" 
                placeholder="Type a message..." 
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                style={{ margin: 0 }}
              />
              <button className="btn btn-primary" onClick={handleSend}>
                <Icon name="send" size={14} /> Send
              </button>
            </div>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', color: '#888' }}>
            Select a user to start chatting
          </div>
        )}
      </div>
    </div>
  );
}
import React from 'react';
import './TimelineView.css';

const TimelineView = ({
  entries,
  editingId,
  editedText,
  setEditedText,
  startEdit,
  cancelEdit,
  saveEdit,
  handleDelete,
  chatHistories,              // 🧠 full chat history per entry
  messageInputs,              // 📝 input message per entry
  setMessageInputs,           // ✍️ handler to update input
  sendMessageToEntry,         // 🚀 send to backend + AI
  clearChat                   // 🔄 clear chat per entry
}) => {
  return (
    <div className="timeline-container">
      {entries.map((entry) => (
        <div className="timeline-item" key={entry._id}>
          <div className="timeline-dot" />
          <div className="timeline-content">
            <p className="timeline-date">
              {new Date(entry.createdAt).toLocaleString()}
            </p>
            <h4>{entry.mood} Mood</h4>

            {editingId === entry._id ? (
              <>
                <textarea
                  value={editedText}
                  onChange={(e) => setEditedText(e.target.value)}
                  rows="3"
                />
                <br />
                <button onClick={() => saveEdit(entry._id)}>💾 Save</button>
                <button onClick={cancelEdit}>❌ Cancel</button>
              </>
            ) : (
              <>
                <p>{entry.text}</p>
                <button onClick={() => startEdit(entry)}>✏️ Edit</button>
                <button onClick={() => handleDelete(entry._id)} style={{ color: 'red' }}>
                  🗑️ Delete
                </button>
              </>
            )}

            {/* 🧠 Chat History */}
            {chatHistories[entry._id]?.length > 0 && (
              <div className="chat-history">
                <h5>💬 Conversation with Past You</h5>
                {chatHistories[entry._id].map((msg, idx) => (
                  <p key={idx}>
                    <strong>{msg.role === 'user' ? '🧍 You' : '🧠 Past You'}:</strong> {msg.message}
                  </p>
                ))}
              </div>
            )}

            {/* 💬 Message Box */}
            <div style={{ marginTop: '10px' }}>
              <input
                type="text"
                placeholder="Send a message to past you..."
                value={messageInputs[entry._id] || ''}
                onChange={(e) =>
                  setMessageInputs((prev) => ({
                    ...prev,
                    [entry._id]: e.target.value
                  }))
                }
                style={{ width: '70%' }}
              />
              <button onClick={() => sendMessageToEntry(entry._id)}>Send</button>
              <button onClick={() => clearChat(entry._id)} style={{ marginLeft: '10px' }}>
                🧹 Clear Chat
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default TimelineView;

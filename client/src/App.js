import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import TimelineView from './TimelineView';

const backendUrl = process.env.REACT_APP_BACKEND_URL;

function App() {
  const [text, setText] = useState('');
  const [response, setResponse] = useState(null);
  const [allEntries, setAllEntries] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [editedText, setEditedText] = useState('');

  const [chatHistories, setChatHistories] = useState({});
  const [messageInputs, setMessageInputs] = useState({});

  useEffect(() => {
    const fetchEntries = async () => {
      try {
        const res = await axios.get(`${backendUrl}/journal`);
        setAllEntries(res.data);
        const historyMap = {};
        res.data.forEach(entry => {
          historyMap[entry._id] = entry.chatHistory || [];
        });
        setChatHistories(historyMap);
      } catch (err) {
        console.error(err);
      }
    };

    fetchEntries();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!text.trim()) return;

    try {
      const res = await axios.post(`${backendUrl}/journal`, { text });
      setResponse(res.data.entry);
      setText('');
      setAllEntries([res.data.entry, ...allEntries]);
      setChatHistories({ ...chatHistories, [res.data.entry._id]: [] });
    } catch (err) {
      console.error(err);
      alert("Failed to save journal entry.");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this entry?')) return;

    try {
      await axios.delete(`${backendUrl}/journal/${id}`);
      setAllEntries(allEntries.filter((entry) => entry._id !== id));
      const updatedChats = { ...chatHistories };
      delete updatedChats[id];
      setChatHistories(updatedChats);
    } catch (err) {
      console.error(err);
      alert("Failed to delete entry.");
    }
  };

  const startEdit = (entry) => {
    setEditingId(entry._id);
    setEditedText(entry.text);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditedText('');
  };

  const saveEdit = async (id) => {
    try {
      const res = await axios.put(`${backendUrl}/journal/${id}`, {
        text: editedText,
      });

      const updatedEntry = res.data.entry;
      setAllEntries(allEntries.map((entry) =>
        entry._id === id ? updatedEntry : entry
      ));
      cancelEdit();
    } catch (err) {
      console.error(err);
      alert('Failed to update entry');
    }
  };

  const sendMessageToEntry = async (entryId) => {
    const message = messageInputs[entryId];
    if (!message.trim()) return;

    try {
      const res = await axios.post(`${backendUrl}/journal/${entryId}/ai-reply`, {
        message,
      });

      const reply = res.data.reply;
      const updatedHistory = (chatHistories[entryId] || []).concat([
        { role: 'user', message },
        { role: 'past', message: reply },
      ]);

      setChatHistories({ ...chatHistories, [entryId]: updatedHistory });
      setMessageInputs({ ...messageInputs, [entryId]: '' });
    } catch (err) {
      console.error(err);
      alert("Failed to get AI reply.");
    }
  };

  const clearChat = async (entryId) => {
    if (!window.confirm("Are you sure you want to clear the chat history for this entry?")) return;

    try {
      const res = await axios.delete(`${backendUrl}/journal/${entryId}/clear-chat`);
      const updatedEntry = res.data.entry;
      setAllEntries(allEntries.map(entry =>
        entry._id === entryId ? updatedEntry : entry
      ));
      setChatHistories({ ...chatHistories, [entryId]: [] });
    } catch (err) {
      console.error("Clear Chat Error:", err);
      alert("Failed to clear chat.");
    }
  };

  return (
    <div className="App">
      <h1>🌀 TimeLoop Journal</h1>

      <form onSubmit={handleSubmit}>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          rows="5"
          placeholder="How are you feeling today?"
        />
        <br />
        <button type="submit">Save Entry</button>
      </form>

      {response && (
        <div className="entry">
          <h3>📝 Latest Entry</h3>
          <p><strong>Mood:</strong> {response.mood}</p>
          <p><strong>Text:</strong> {response.text}</p>
          <p><strong>Time:</strong> {new Date(response.createdAt).toLocaleString()}</p>
        </div>
      )}

      {allEntries.length > 0 && (
        <div className="entry-list">
          <h2>📚 Past Journal Timeline</h2>
          <TimelineView
            entries={allEntries}
            editingId={editingId}
            editedText={editedText}
            setEditedText={setEditedText}
            startEdit={startEdit}
            cancelEdit={cancelEdit}
            saveEdit={saveEdit}
            handleDelete={handleDelete}
            chatHistories={chatHistories}
            messageInputs={messageInputs}
            setMessageInputs={setMessageInputs}
            sendMessageToEntry={sendMessageToEntry}
            clearChat={clearChat}
          />
        </div>
      )}
    </div>
  );
}

export default App;

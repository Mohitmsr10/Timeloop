const express = require('express');
const router = express.Router();
const Sentiment = require('sentiment');
const Journal = require('../models/Journal');

const sentiment = new Sentiment();






// router.get('/test', (req, res) => {
//   res.send('✅ Journal test route is working');
// });


// ✅ POST /journal
router.post('/', async (req, res) => {
    console.log("📬 POST /journal route hit");
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

 const moodScore = sentiment.analyze(text).score;
let mood = 'Neutral';
if (moodScore > 1) mood = 'Happy';
else if (moodScore < 0) mood = 'Sad';


  try {
    const newEntry = new Journal({ text, mood });
    await newEntry.save();
    res.status(201).json({ message: 'Journal saved', entry: newEntry });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

// ✅ GET /journal - fetch all entries
router.get('/', async (req, res) => {
  try {
    const entries = await Journal.find().sort({ createdAt: -1 }); // newest first
    res.json(entries);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch journal entries' });
  }
});

// ✅ DELETE /journal/:id - delete a journal entry
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await Journal.findByIdAndDelete(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Entry not found' });
    }
    res.json({ message: 'Entry deleted', id: deleted._id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to delete journal entry' });
  }
});

// ✅ PUT /journal/:id - update entry
router.put('/:id', async (req, res) => {
  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  const moodScore = sentiment.analyze(text).score;
  let mood = 'Neutral';
  if (moodScore > 2) mood = 'Happy';
  else if (moodScore < -2) mood = 'Sad';

  try {
    const updated = await Journal.findByIdAndUpdate(
      req.params.id,
      { text, mood },
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: 'Entry not found' });

    res.json({ message: 'Entry updated', entry: updated });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to update entry' });
  }
});

// 🧠 POST /journal/ai-reply (via OpenRouter and DeepSeek)
const axios = require("axios"); // ensure this is at the top if not already

router.post('/ai-reply', async (req, res) => {
  const { pastText } = req.body;

  if (!pastText) {
    return res.status(400).json({ error: "Missing past journal text" });
  }

  try {
    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct',
    // You can also use mistral, openchat, etc.
      messages: [
  {
    role: 'system',
    content: `You are the user's PAST SELF who wrote this journal entry: "${entry.text}".`
      + ` Reflect on it as if you're the one who originally wrote it.`
      + ` Provide thoughtful, emotional, or personal commentary — not general advice.`
  },
  {
    role: 'user',
    content: `Hey, it's your future self. Here's what I'm thinking: "${message}". What are your thoughts or feelings in response?`
  }
]

    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    res.json({ reply: response.data.choices[0].message.content });
  } catch (error) {
    console.error("AI reply error:", error.response?.data || error.message);
    res.status(500).json({ error: "Failed to generate AI reply" });
  }
});

// 🗨️ POST /journal/:id/chat - send a message to/from a past entry
router.post('/:id/chat', async (req, res) => {
  const { sender, message } = req.body;

  if (!sender || !message) {
    return res.status(400).json({ error: 'Sender and message are required' });
  }

  try {
    const entry = await Journal.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    entry.chatHistory.push({ role: sender, message });

    await entry.save();

    res.json({ success: true, updatedEntry: entry });
  } catch (error) {
    console.error("Chat update error:", error);
    res.status(500).json({ error: "Failed to save chat message" });
  }
});

// 🧠 POST /journal/:id/ai-reply - get a reflective AI response from a past entry
router.post('/:id/ai-reply', async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const entry = await Journal.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'mistralai/mistral-7b-instruct',

      messages: [
        { role: 'system', content: "You are the user's past self from this journal: " + entry.text },
        { role: 'user', content: message }
      ]
    }, {
      headers: {
        'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    const aiMessage = response.data.choices[0].message.content;

    // Save the conversation
   entry.chatHistory.push({ role: 'user', message });
entry.chatHistory.push({ role: 'past', message: aiMessage });

    await entry.save();

    res.json({ reply: aiMessage });
  } catch (err) {
    console.error("AI reply error:", err.response?.data || err.message);
    res.status(500).json({ error: "AI reply failed" });
  }
});

// ✅ DELETE /journal/:id/clear-chat - clear chat history from DB
router.delete('/:id/clear-chat', async (req, res) => {
  try {
    const entry = await Journal.findById(req.params.id);
    if (!entry) return res.status(404).json({ error: 'Entry not found' });

    entry.chatHistory = []; // Clear the array
    await entry.save();

    res.json({ message: 'Chat history cleared', entry });
  } catch (err) {
    console.error("Clear chat error:", err);
    res.status(500).json({ error: "Failed to clear chat" });
  }
});







module.exports = router;

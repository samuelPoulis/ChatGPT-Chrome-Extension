const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/analyze', async (req, res) => {
  let { history, pageContent } = req.body;
  console.log("History:", history);
  console.log("Page content:", pageContent.substring(0, 100) + "...");
  console.log("Model:", 'gpt-4o-mini');

  if (!history || history.length === 0) {
    return res.json({ response: 'History is empty' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: "You analyze and answer questions about the page content that is sent to you." },
        { role: 'system', content: `Page content: ${pageContent}` },
        ...history,
      ],
    });
    console.log(response.choices[0].message.content);
    res.json({ response: response.choices[0].message.content });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});
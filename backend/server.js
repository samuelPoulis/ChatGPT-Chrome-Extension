const express = require('express');
const cors = require('cors');
const { OpenAI } = require('openai');
const fs = require('fs').promises;
const path = require('path');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

app.post('/api/analyze', async (req, res) => {
  const roleInstructionsPath = path.resolve(__dirname, 'config/instructions.txt');
  let { history, pageContent } = req.body;
  console.log("History:", history);
  console.log("Page content:", pageContent.substring(0, 100) + "..."); // Log first 100 characters of page content
  console.log("Model:", 'gpt-4o-mini');
  let roleInstructions = '';
  try {
    roleInstructions = await fs.readFile(roleInstructionsPath, 'utf8');
  } catch (err) {
    console.log(err + " Something is wrong with the instruction file read. please refresh the app.");
    return res.status(500).json({ error: "Failed to read instructions file, please restart browser." });
  }

  if (!history || history.length === 0) {
    return res.json({ response: 'History is empty' });
  }

  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: roleInstructions },
        { role: 'system', content: `Page content: ${pageContent}` }, // Add page content as a system message
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
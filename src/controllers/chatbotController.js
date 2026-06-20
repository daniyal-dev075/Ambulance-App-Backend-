const axios = require('axios');

const generateResponse = async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    const similarKeys = Object.keys(process.env).filter(k => k.includes('ROQ') || k.includes('GROQ')).join(', ');
    return res.status(500).json({ error: `Groq API Key missing. Did you misspell it? Found these similar keys on server: [${similarKeys}]` });
  }

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama-3.1-8b-instant',
        messages: [
          {
            role: 'system',
            content: 'You are LifeLine AI, a highly specialized emergency medical and first-aid assistant. Your ONLY job is to provide concise, calm, and accurate first-aid advice. Always remind the user to press the red SOS button to request an ambulance if the situation is a life-threatening emergency. Do not answer questions outside of medical, health, or emergency first-aid topics. Keep your responses short and extremely clear.'
          },
          {
            role: 'user',
            content: message
          }
        ],
        temperature: 0.5,
        max_tokens: 500,
      },
      {
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        }
      }
    );

    const reply = response.data.choices[0].message.content;
    res.status(200).json({ reply });
  } catch (error) {
    console.error('Groq API Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to generate AI response' });
  }
};

module.exports = { generateResponse };

require('dotenv').config();
const axios = require('axios');

async function testGroq() {
  const apiKey = process.env.GROQ_API_KEY;
  console.log("Testing with API Key starting with:", apiKey ? apiKey.substring(0, 8) : "UNDEFINED");

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: 'Hello' }],
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
    console.log("SUCCESS:", response.data.choices[0].message.content);
  } catch (error) {
    console.error("GROQ API ERROR:", error?.response?.data || error.message);
  }
}

testGroq();

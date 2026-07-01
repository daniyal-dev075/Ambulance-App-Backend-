const axios = require('axios');

const generateResponse = async (req, res) => {
  const { message } = req.body;
  
  if (!message) {
    return res.status(400).json({ error: 'Message is required' });
  }

  const webhookUrl = process.env.N8N_WEBHOOK_URL || 'https://n8n.doclink.dev/webhook/43b77abd-4c28-4a3b-a125-3f580be13e9a';

  try {
    const response = await axios.post(
      webhookUrl,
      { message: message },
      {
        headers: {
          'Content-Type': 'application/json',
        }
      }
    );

    res.status(200).json(response.data);
  } catch (error) {
    console.error('n8n Webhook Error:', error?.response?.data || error.message);
    res.status(500).json({ error: 'Failed to communicate with AI agent' });
  }
};

module.exports = { generateResponse };

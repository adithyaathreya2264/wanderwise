// backend/server.js
require('dotenv').config();
const express = require('express');
const cors = require('cors');
const axios = require('axios');
const OpenAI = require('openai'); // official SDK
const app = express();

app.use(cors());
app.use(express.json());

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const GOOGLE_KEY = process.env.GOOGLE_MAPS_API_KEY;

// Basic health
app.get('/api/ping', (req, res) => res.json({ ok: true }));

// AI endpoint: generate short itinerary / suggestions using OpenAI
app.post('/api/ai', async (req, res) => {
  try {
    const { destination, tripType, days = 2 } = req.body;
    const prompt = `Create a concise ${days}-day ${tripType} itinerary for ${destination}. 
Include 3 activities per day, travel time hints, and one recommended local eatery per day. Keep it short and bulletized.`;
    const response = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
      messages: [{ role: "user", content: prompt }],
      max_tokens: 400,
    });
    const text = response.choices?.[0]?.message?.content ?? 'No response';
    res.json({ itinerary: text });
  } catch (err) {
    console.error(err?.response?.data || err);
    res.status(500).json({ error: 'AI error' });
  }
});

// Plan endpoint: return driving or transit directions, or travel agencies
app.post('/api/plan', async (req, res) => {
  try {
    const { origin, destination, transportMode } = req.body;

    if (!origin || !destination) {
      return res.status(400).json({ error: 'origin and destination are required' });
    }

    if (transportMode === 'own') {
      // Driving directions via Directions API (JSON)
      const url = 'https://maps.googleapis.com/maps/api/directions/json';
      const r = await axios.get(url, {
        params: {
          origin,
          destination,
          mode: 'driving',
          key: GOOGLE_KEY,
          alternatives: true
        }
      });
      return res.json({ kind: 'driving', data: r.data });
    }

    if (transportMode === 'public') {
      // Transit directions via Directions API (transit mode)
      const url = 'https://maps.googleapis.com/maps/api/directions/json';
      const r = await axios.get(url, {
        params: {
          origin,
          destination,
          mode: 'transit',
          key: GOOGLE_KEY,
          alternatives: true
        }
      });
      // We'll extract transit legs (line names, vehicle types, agencies) on the client if you like
      return res.json({ kind: 'transit', data: r.data });
    }

    if (transportMode === 'agency') {
      // Use Places Text Search to find travel agencies in the destination
      // Query string: "travel agencies in <destination>"
      const url = 'https://maps.googleapis.com/maps/api/place/textsearch/json';
      const query = `travel agency in ${destination}`;
      const r = await axios.get(url, { params: { query, key: GOOGLE_KEY }});
      // return top 6 agencies (name, address, rating, place_id)
      const agencies = (r.data.results || []).slice(0, 6).map(p => ({
        name: p.name, address: p.formatted_address, rating: p.rating, place_id: p.place_id
      }));
      return res.json({ kind: 'agencies', data: agencies });
    }

    res.status(400).json({ error: 'unknown transportMode' });
  } catch (err) {
    console.error(err?.response?.data || err);
    res.status(500).json({ error: 'Server error' });
  }
});

const port = process.env.PORT || 5000;
app.listen(port, () => console.log(`WanderWise backend listening on ${port}`));

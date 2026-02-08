# WanderWise

WanderWise is an **AI-powered travel planning web app**.  
It helps you plan trips by combining **Google Maps** (routes, transport, agencies) with **OpenAI** (AI itineraries).  

Users can:
- Enter a **destination**
- Pick a **trip type** (Adventure, Relaxing, Historical, etc.)
- Select **mode of transport**:
  - Own Vehicle → shows driving route on Google Maps
  - Public Transport → lists transit options (buses, trains, etc.)
  - Travel Agency → lists available agencies in that location
- Generate a **Quick AI itinerary** with activities and food suggestions ✨

---

## Tech Stack

- **Frontend**: HTML, CSS, Vanilla JavaScript, Google Maps JS API  
- **Backend**: Node.js, Express.js  
- **AI**: OpenAI API (via official SDK)  
- **Maps Data**: Google Directions API, Google Places API  

---

## File Structure
```
wanderwise/
├─ backend/
│ ├─ server.js # Express backend with API routes
│ ├─ package.json # Backend dependencies
│ ├─ .env # API keys (not in Git)
│ └─ utils/ # Future helpers
├─ frontend/
│ ├─ index.html # Main UI
│ ├─ styles.css # Minimal styling + animations
│ └─ app.js # Frontend logic
└─ README.md # Project docs
```

---

## 🔑 Environment Setup

Create a `backend/.env` file:

```env
PORT=5000

# OpenAI API
OPENAI_API_KEY=sk-your-openai-key-here
OPENAI_MODEL=gpt-4o-mini

# Google Maps / Places
GOOGLE_MAPS_API_KEY=AIzaSy-your-google-key

## To get keys:

OpenAI API key

Google Cloud Console
 → enable:

Maps JavaScript API

Directions API

Places API
(Make sure billing is enabled — you get $200 free/month)

⚙️ Installation & Running
1. Clone project
git clone https://github.com/yourusername/wanderwise.git
cd wanderwise

2. Backend
cd backend
npm install
node server.js


Backend runs at: http://localhost:5000

Test it:

curl http://localhost:5000/api/ping
# {"ok":true}

3. Frontend

Just open frontend/index.html in your browser.
👉 For local hosting, you can use:

npx http-server frontend


Then visit: http://localhost:8080

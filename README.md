# Frontend


````md
# 🎨 Loco-Man: AI Travel Guide Chatbot – Frontend

This is the **frontend** of Loco-Man — a full-stack AI-powered chatbot that helps users get travel information via text or voice. The app provides spoken responses using OpenAI's text-to-speech API.

---

## ✨ Features

- 👤 User-friendly login and registration
- 💬 Chat interface with AI via text and microphone
- 🔊 Listen to AI responses using OpenAI TTS
- 🕓 View persistent chat history
- ⚡ Built with Vite for fast development
- 📱 Fully responsive with Tailwind CSS

---

## 🛠 Tech Stack

| Purpose     | Tech / Tools            |
|-------------|--------------------------|
| Framework   | React (with Vite)        |
| Styling     | Tailwind CSS             |
| HTTP        | Axios                    |
| Auth        | JWT (stored via cookies) |
| Audio       | Native mic input (Web API) |
| Env Config  | Vite `.env` variables    |

---

## 📁 Folder Structure

```bash
client/                   # This frontend folder
├── public/               # Static assets
├── src/
│   ├── components/       # React components
│   ├── pages/            # Page-level components
│   ├── services/         # Axios API calls
│   ├── App.jsx           # Main app component
│   ├── main.jsx          # Entry point
├── .env                  # API config (not committed)
````

---

## 🔧 Prerequisites

* Node.js (v18+)
* Backend running at: `http://localhost:3101`
* OpenAI API Key (used for displaying system info, TTS, etc.)

---

## 🚀 Getting Started

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/77sauravkr/locoMan-client.git
cd locoMan-client
```

---

### 2️⃣ Install Dependencies

```bash
npm install
```

---

### 3️⃣ Configure Environment Variables

Create a `.env` file in the root of `client/`:

```env
VITE_API_HOST=localhost
VITE_API_PORT=3101
VITE_OPENAI_API_KEY=your_openai_api_key
```

---

### 4️⃣ Start the Dev Server

```bash
npm run dev
```

App will run at: [http://localhost:5182](http://localhost:5182)

---

## 🔗 Backend Repo

The backend for this project is here:
👉 [Locoman Server (Node.js)](https://github.com/77sauravkr/Locoman-server)

---

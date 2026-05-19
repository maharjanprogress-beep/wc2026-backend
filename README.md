# WC 2026 AI Predictor — Backend

Express API server powering the WC 2026 AI Predictor app.

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `OPENAI_API_KEY` | Yes | Your OpenAI API key |
| `OPENAI_BASE_URL` | Yes | OpenAI base URL (default: https://api.openai.com/v1) |
| `FOOTBALL_DATA_API_KEY` | No | football-data.org free key for live squad data |
| `PORT` | No | Server port (default: 3000) |

## Deploy on Render

1. New Web Service → connect this repo
2. Build command: `npm install && npm run build`
3. Start command: `npm start`
4. Add environment variables in Render dashboard

## Local Development

```bash
npm install
cp .env.example .env   # fill in your keys
npm run dev
```

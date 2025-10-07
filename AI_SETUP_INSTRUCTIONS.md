# AI Chat Setup Instructions

## Overview

The AI chat feature in this application uses **Anthropic's Claude AI** to provide intelligent assistance with web development questions, code review, and debugging help.

## Current Status

**The AI chat is currently NOT WORKING** because the Anthropic API key has not been configured. You'll see an error message in the chat window indicating that the AI service is unavailable.

## Root Cause

The backend `.env` file contains a placeholder value for the `ANTHROPIC_API_KEY`:

```
ANTHROPIC_API_KEY=your-anthropic-api-key-here
```

The AI service (`backend/src/services/aiService.ts`) checks if the API key is set to this placeholder value and disables the service to prevent API errors.

## How to Fix

Follow these steps to enable the AI chat functionality:

### 1. Get an Anthropic API Key

1. Visit https://console.anthropic.com/
2. Sign up for an account or log in
3. Navigate to **API Keys** section
4. Click **Create Key** to generate a new API key
5. Copy the API key (it will look like `sk-ant-api03-...`)

**Important:** Keep your API key secure and never commit it to version control!

### 2. Update the Backend Configuration

1. Open the file: `/home/felony/Videos/PYTHON/AI/GEMINI/backend/.env`

2. Replace the placeholder with your actual API key:
   ```
   # Before:
   ANTHROPIC_API_KEY=your-anthropic-api-key-here

   # After:
   ANTHROPIC_API_KEY=sk-ant-api03-your-actual-key-here
   ```

3. Save the file

### 3. Restart the Backend Server

The backend needs to be restarted to load the new environment variable:

1. Stop the backend server (Ctrl+C in the terminal running the backend)
2. Start it again:
   ```bash
   cd /home/felony/Videos/PYTHON/AI/GEMINI/backend
   npm run dev
   ```

### 4. Verify the Fix

1. Open the application in your browser (http://localhost:3000)
2. Log in and navigate to the Editor
3. Click the **AI Chat** button
4. You should now see the welcome message instead of an error
5. Try sending a message to test the AI assistant

## API Key Security Best Practices

- **Never commit API keys to Git**: The `.env` file is already in `.gitignore`, which is good
- **Don't share your API key**: Treat it like a password
- **Rotate keys regularly**: Generate new keys periodically for security
- **Monitor usage**: Check your Anthropic dashboard for usage and costs
- **Set spending limits**: Configure billing alerts in the Anthropic console

## API Usage and Costs

The application uses the Claude 3.5 Sonnet model with the following configuration:
- **Model**: `claude-3-5-sonnet-20241022`
- **Max tokens per response**: 4096
- **Rate limit**: 50 requests per hour per user (configured in backend)

Current pricing (as of late 2024):
- Input: ~$3 per million tokens
- Output: ~$15 per million tokens

For most development use, costs are minimal (a few cents per day).

## Troubleshooting

### "AI service is not configured" error persists

1. Verify the API key is correctly set in `.env` (no extra spaces)
2. Ensure you restarted the backend server after changing `.env`
3. Check backend logs for any error messages
4. Try hitting the status endpoint manually:
   ```bash
   curl http://localhost:5000/api/ai/status
   ```

### "Authentication required" error

This means you're not logged in. The AI chat requires authentication. Make sure you're logged into the application.

### "Rate limit exceeded" error

You've sent more than 50 messages in the last hour. Wait for the rate limit window to reset, or contact an administrator to adjust the limits in `backend/src/routes/ai.ts`.

### API key is invalid

Double-check:
1. The key starts with `sk-ant-api03-`
2. There are no extra spaces or line breaks
3. The key is still active in the Anthropic console
4. Your Anthropic account has sufficient credits

## File Locations

- **Backend .env file**: `/home/felony/Videos/PYTHON/AI/GEMINI/backend/.env`
- **AI Service**: `/home/felony/Videos/PYTHON/AI/GEMINI/backend/src/services/aiService.ts`
- **AI Routes**: `/home/felony/Videos/PYTHON/AI/GEMINI/backend/src/routes/ai.ts`
- **Frontend AI Service**: `/home/felony/Videos/PYTHON/AI/GEMINI/frontend/src/services/ai.ts`
- **Chat Modal Component**: `/home/felony/Videos/PYTHON/AI/GEMINI/frontend/src/components/ChatModal.tsx`

## Features

Once configured, the AI chat provides:

- **Code assistance**: Get help with HTML, CSS, and JavaScript
- **Code review**: Include your project code for context-aware suggestions
- **Debugging help**: Ask about errors or unexpected behavior
- **Best practices**: Learn modern web development techniques
- **Explanations**: Understand how code works
- **Chat history**: Persistent conversation history in localStorage
- **Code formatting**: Responses include syntax-highlighted code blocks
- **Copy functionality**: Easy code copying from AI responses

## Support

If you continue to have issues after following these instructions, check:
1. Backend server logs for errors
2. Browser console for frontend errors
3. Network tab in browser dev tools to inspect API calls
4. Anthropic API status page: https://status.anthropic.com/

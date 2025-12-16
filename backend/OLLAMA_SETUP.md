# Ollama Setup for Render Deployment

## Problem
The backend requires Ollama to generate flashcards, but Ollama is not running on Render by default.

## Solutions

### Option 1: Deploy Ollama on Render (Recommended for Production)

1. **Create a new Render service for Ollama:**
   - Go to Render Dashboard
   - Click "New +" → "Web Service"
   - Connect your repository or use Docker
   - Use Docker image: `ollama/ollama:latest`
   - Set instance type to at least **2GB RAM** (Starter or higher)
   - Add environment variable: `OLLAMA_MODELS=/root/.ollama/models`
   - Deploy the service

2. **Pull your model on Ollama service:**
   - Once deployed, open Shell on Render
   - Run: `ollama pull qwen2.5:0.5b`
   - Or use your preferred model

3. **Configure Backend to use Ollama service:**
   - In your backend service on Render, add environment variable:
     ```
     OLLAMA_HOST=https://your-ollama-service.onrender.com
     OLLAMA_MODEL=qwen2.5:0.5b
     ```
   - Redeploy backend

### Option 2: Use External Ollama Instance

If you have Ollama running elsewhere (local server, cloud VM):

1. Make sure Ollama is accessible via HTTP (not just localhost)
2. In Render backend environment variables, set:
   ```
   OLLAMA_HOST=http://your-server-ip:11434
   OLLAMA_MODEL=qwen2.5:0.5b
   ```

### Option 3: Local Development

For local development, Ollama runs on your machine:

```bash
# Install Ollama from https://ollama.ai
ollama pull qwen2.5:0.5b

# In backend/.env
OLLAMA_HOST=http://localhost:11434
OLLAMA_MODEL=qwen2.5:0.5b
```

## Verifying Connection

After deployment, check backend logs on Render:
- ✅ `Successfully connected to Ollama at <host>`
- ❌ `Failed to connect to Ollama at <host>`

If connection fails:
1. Verify OLLAMA_HOST is set correctly
2. Ensure Ollama service is running
3. Check if model is pulled: `ollama list`
4. Verify network connectivity between services

## Cost Considerations

Running Ollama on Render:
- **Starter Plan ($7/month)**: May work for qwen2.5:0.5b (small model)
- **Standard Plan ($25/month)**: Better for larger models
- **Disk space**: Models are stored in persistent disk (additional cost)

Alternative: Run Ollama on a dedicated VM (AWS, DigitalOcean, etc.) and point backend to it.

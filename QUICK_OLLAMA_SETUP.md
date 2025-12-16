# Ollama Setup - Free Options Only

The backend **requires Ollama** to generate flashcards. Card generation will fail if Ollama is not available.

## Quick Start for Render Users

If you deployed on Render, you MUST set up Ollama separately:

1. **Create a free Google Cloud or Oracle VM** (see below)
2. **Install Ollama** on the VM
3. **Pull the model**: `ollama pull qwen2.5:0.5b`
4. **Get your VM's public IP**
5. **Set on Render backend env vars**:
   ```
   OLLAMA_HOST=http://YOUR_VM_IP:11434
   OLLAMA_MODEL=qwen2.5:0.5b
   ```
6. **Redeploy backend**
7. **Test**: Check `/import/ollama/status` - should show `connected: true`

---

## Option 1: Local Development (FREE)

Run Ollama locally on your machine during development:

1. **Install Ollama**: https://ollama.ai
2. **Pull a model**:
   ```bash
   ollama pull qwen2.5:0.5b
   ```
3. **Start Ollama** (runs on `http://localhost:11434`)
4. **Set backend env var**:
   ```
   OLLAMA_HOST=http://localhost:11434
   OLLAMA_MODEL=qwen2.5:0.5b
   ```

Run backend locally with these vars set, and it will find Ollama on localhost.

---

## Option 2: Free Cloud VM for Production (ALWAYS FREE)

Host Ollama on a permanent free tier cloud VM. Your app on Render can reach it.

### Google Cloud (Always Free Tier - 1 VM forever free)

1. Go to https://cloud.google.com/free
2. **Create free account** → **Create project**
3. **Compute Engine** → **VM Instances** → **Create Instance**
   - Name: `ollama-server`
   - Region: `us-central1` (free tier eligible)
   - Machine type: `e2-micro` (0.25-2 vCPU, 1GB RAM) - **FREE**
   - OS: Ubuntu 22.04 LTS
   - Storage: 30GB - **FREE**
   - Click **Create**

4. **SSH into the VM** (using browser or gcloud CLI)
5. **Install Ollama**:
   ```bash
   curl https://ollama.ai/install.sh | sh
   ollama pull qwen2.5:0.5b
   ```
   Wait ~10 minutes for model to download

6. **Start Ollama** (runs in background):
   ```bash
   ollama serve
   ```
   Or use systemd to auto-start

7. **Get your VM's external IP**: Shows in GCP console
8. **Set on Render backend**:
   ```
   OLLAMA_HOST=http://YOUR_GCP_VM_EXTERNAL_IP:11434
   OLLAMA_MODEL=qwen2.5:0.5b
   ```

**Cost**: $0/month (always free tier)

---

### Oracle Cloud (Always Free Tier - 2 VMs forever free)

1. Go to https://www.oracle.com/cloud/free/
2. **Create free account** → **Create Compute VM**
   - Image: Ubuntu 22.04
   - Shape: Ampere (1 OCPU, 1GB RAM) - **FREE** (up to 2 VMs)
   - Storage: 50GB - **FREE**

3. **SSH into VM**, then install Ollama:
   ```bash
   curl https://ollama.ai/install.sh | sh
   ollama pull qwen2.5:0.5b
   ```

4. **Get external IP** and set on Render backend

**Cost**: $0/month

---

## Option 3: Smaller Model for Limited Resources

If your free VM is tight on memory:

```bash
ollama pull tinyllama      # 1.1B, 600MB memory
ollama pull orca-mini      # 3B, 2GB memory
```

Then set:
```
OLLAMA_MODEL=tinyllama
```

---

## Important: No Fallback

❌ **The app REQUIRES Ollama to work**
- If Ollama is unavailable, card generation **fails with an error**
- No silent degradation - you'll see the error immediately
- You MUST set up Ollama before using import/study features

---

## Verify Connection

After setting up Ollama and configuring backend:

```bash
curl https://YOUR_RENDER_BACKEND.onrender.com/import/ollama/status
```

Should return:
```json
{
  "connected": true,
  "host": "http://YOUR_VM_IP:11434",
  "model": "qwen2.5:0.5b",
  "message": "✅ Connected to Ollama at http://YOUR_VM_IP:11434"
}
```

If `connected: false`:
- Check Ollama is running on the VM: `curl http://YOUR_VM_IP:11434/api/tags`
- Check firewall allows port 11434
- Check `OLLAMA_HOST` is correct on Render
- Redeploy backend after changing env vars
```

If `connected: false`, Ollama is not reachable.

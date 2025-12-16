type StoredConfig = { apiBase?: string; token?: string };

const statusDiv = document.getElementById('status')!;
const apiBaseInput = document.getElementById('apiBase') as HTMLInputElement;
const tokenInput = document.getElementById('token') as HTMLInputElement;
const topicInput = document.getElementById('topic') as HTMLInputElement;

async function loadConfig() {
  const data = (await chrome.storage.sync.get(['apiBase', 'token', 'topic'])) as StoredConfig & { topic?: string };
  if (data.apiBase) apiBaseInput.value = data.apiBase;
  if (data.token) tokenInput.value = data.token;
  if (data.topic) topicInput.value = data.topic;
}

async function saveConfig() {
  await chrome.storage.sync.set({ apiBase: apiBaseInput.value, token: tokenInput.value, topic: topicInput.value });
  statusDiv.textContent = 'Settings saved';
}

document.getElementById('saveConfig')?.addEventListener('click', () => {
  void saveConfig();
});

document.getElementById('clipPage')?.addEventListener('click', async () => {
  statusDiv.textContent = 'Clipping...';

  // const apiBase = apiBaseInput.value || 'http://localhost:4000';
  const apiBase = apiBaseInput.value || 'https://studymonkey-backend.onrender.com';
  const token = tokenInput.value?.trim();
  if (!token) {
    statusDiv.textContent = 'Add your JWT token first.';
    return;
  }

  const topic = topicInput.value?.trim();

  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (!tab?.url) {
      statusDiv.textContent = 'No active tab URL';
      return;
    }

    const res = await fetch(`${apiBase.replace(/\/$/, '')}/import/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ url: tab.url, topic })
    });

    if (!res.ok) {
      statusDiv.textContent = `Failed: ${res.status}`;
      return;
    }

    const job = await res.json();
    statusDiv.textContent = `Job started: ${job.id}`;

    // Poll job status
    const interval = setInterval(async () => {
      const statusRes = await fetch(`${apiBase.replace(/\/$/, '')}/import/jobs/${job.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (!statusRes.ok) return;
      const status = await statusRes.json();
      statusDiv.textContent = `Status: ${status.status}`;
      if (status.status === 'completed' || status.status === 'failed') {
        clearInterval(interval);
        if (status.error) {
          statusDiv.textContent = `Status: ${status.status} - ${status.error}`;
        }
      }
    }, 3000);
  } catch (err) {
    statusDiv.textContent = 'Error: ' + err;
  }
});

void loadConfig();

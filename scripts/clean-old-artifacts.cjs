// Utility to automatically purge old GitHub Actions artifacts to stay well within quota
const https = require('https');

const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
const repo = process.env.GITHUB_REPOSITORY || 'joachim7723-ai/373g';

if (!token) {
  console.log('No GitHub token provided, skipping artifact cleanup.');
  process.exit(0);
}

function request(path, method = 'GET') {
  return new Promise((resolve, reject) => {
    const req = https.request(
      {
        hostname: 'api.github.com',
        path,
        method,
        headers: {
          'User-Agent': 'cleanup-script',
          Authorization: `token ${token}`,
        },
      },
      (res) => {
        let body = '';
        res.on('data', (chunk) => (body += chunk));
        res.on('end', () => {
          try {
            resolve({ status: res.statusCode, data: body ? JSON.parse(body) : null });
          } catch (e) {
            resolve({ status: res.statusCode, data: body });
          }
        });
      }
    );
    req.on('error', reject);
    req.end();
  });
}

async function main() {
  try {
    const res = await request(`/repos/${repo}/actions/artifacts?per_page=100`);
    if (!res.data || !res.data.artifacts || res.data.artifacts.length === 0) {
      console.log('No artifacts found to clean.');
      return;
    }
    console.log(`Checking ${res.data.artifacts.length} artifacts...`);
    // Keep only the newest 2 artifacts if any, delete the rest
    const toDelete = res.data.artifacts.slice(2);
    for (const art of toDelete) {
      const del = await request(`/repos/${repo}/actions/artifacts/${art.id}`, 'DELETE');
      console.log(`Cleaned artifact ${art.id} (${art.name}): ${del.status}`);
    }
    console.log('Artifact cleanup completed successfully.');
  } catch (err) {
    console.warn('Artifact cleanup warning (non-fatal):', err.message);
  }
}

main();

export default async function handler(req, res) {
  // Only allow POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple secret check to prevent abuse
  const secret = req.headers['x-deploy-secret'];
  if (secret !== process.env.DEPLOY_SECRET) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { content, message } = req.body;
  if (!content) {
    return res.status(400).json({ error: 'Missing content' });
  }

  const token = process.env.GITHUB_TOKEN;
  const repo = 'ballbuddyau/peptide-warehouse';
  const file = 'index.html';
  const branch = 'main';

  try {
    // Get current SHA
    const getRes = await fetch(`https://api.github.com/repos/${repo}/contents/${file}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json'
      }
    });
    const getData = await getRes.json();
    const sha = getData.sha;

    // Push updated file
    const pushRes = await fetch(`https://api.github.com/repos/${repo}/contents/${file}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'Accept': 'application/vnd.github+json'
      },
      body: JSON.stringify({
        message: message || 'Update via Claude',
        content: content,
        sha: sha,
        branch: branch
      })
    });

    const pushData = await pushRes.json();

    if (pushData.commit) {
      return res.status(200).json({ 
        success: true, 
        commit: pushData.commit.sha,
        message: pushData.commit.message
      });
    } else {
      return res.status(500).json({ error: 'Push failed', details: pushData });
    }

  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

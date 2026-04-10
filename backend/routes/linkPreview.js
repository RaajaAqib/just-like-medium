const express = require('express');
const router = express.Router();
const https = require('https');
const http = require('http');

// ── SSRF guard — reject private/loopback addresses ────────────────────────────
function isSafeHostname(hostname) {
  // Reject localhost and private IP ranges
  const blocked = /^(localhost|127\.|0\.0\.0\.0|::1|10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.)/i;
  return !blocked.test(hostname);
}

// ── Fetch URL using Node built-in (no extra packages) ─────────────────────────
function fetchHtml(targetUrl, redirectCount = 0) {
  return new Promise((resolve, reject) => {
    if (redirectCount > 5) return reject(new Error('Too many redirects'));

    let parsed;
    try { parsed = new URL(targetUrl); }
    catch { return reject(new Error('Invalid URL')); }

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return reject(new Error('Only http/https allowed'));
    }
    if (!isSafeHostname(parsed.hostname)) {
      return reject(new Error('Blocked hostname'));
    }

    const client = parsed.protocol === 'https:' ? https : http;
    const timeoutMs = 7000;

    const req = client.get(
      {
        hostname: parsed.hostname,
        port: parsed.port || undefined,
        path: parsed.pathname + parsed.search,
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; JustLikeMediumBot/1.0)',
          Accept: 'text/html,application/xhtml+xml',
          'Accept-Language': 'en-US,en;q=0.9',
        },
      },
      (res) => {
        // Follow redirects
        if ([301, 302, 303, 307, 308].includes(res.statusCode)) {
          const loc = res.headers.location;
          if (!loc) return reject(new Error('Redirect with no location'));
          const next = loc.startsWith('http') ? loc : `${parsed.origin}${loc}`;
          res.resume(); // drain so socket is freed
          return fetchHtml(next, redirectCount + 1).then(resolve).catch(reject);
        }

        const chunks = [];
        let size = 0;
        res.on('data', (chunk) => {
          chunks.push(chunk);
          size += chunk.length;
          if (size > 400_000) req.destroy(); // cap at 400 KB
        });
        res.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      }
    );

    const timer = setTimeout(() => { req.destroy(); reject(new Error('Timeout')); }, timeoutMs);
    req.on('close', () => clearTimeout(timer));
    req.on('error', (err) => { clearTimeout(timer); reject(err); });
  });
}

// ── OG / meta tag extraction ──────────────────────────────────────────────────
function getMeta(html, ...names) {
  for (const name of names) {
    // Handle both attribute orderings: property/name first OR content first
    const patterns = [
      new RegExp(`<meta[^>]*(?:property|name)=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i'),
      new RegExp(`<meta[^>]*content=["']([^"']+)["'][^>]*(?:property|name)=["']${name}["']`, 'i'),
    ];
    for (const p of patterns) {
      const m = html.match(p);
      if (m && m[1]) return m[1].trim();
    }
  }
  return '';
}

function extractPreview(html, targetUrl) {
  const title = getMeta(html, 'og:title', 'twitter:title') ||
    (html.match(/<title[^>]*>([^<]+)/i) || [])[1] || '';

  const description = getMeta(html, 'og:description', 'description', 'twitter:description');

  let image = getMeta(html, 'og:image', 'twitter:image', 'twitter:image:src');
  // Make image URL absolute
  if (image && !image.startsWith('http')) {
    try {
      const base = new URL(targetUrl);
      image = image.startsWith('/') ? `${base.origin}${image}` : `${base.origin}/${image}`;
    } catch { image = ''; }
  }

  const siteName = getMeta(html, 'og:site_name');
  let domain = '';
  try { domain = new URL(targetUrl).hostname.replace(/^www\./, ''); } catch {}

  return {
    title:       title.substring(0, 200).trim(),
    description: description.substring(0, 400).trim(),
    image,
    siteName:    siteName || domain,
    domain,
    url:         targetUrl,
  };
}

// ── Route: GET /api/link-preview?url=... ─────────────────────────────────────
router.get('/', async (req, res) => {
  const { url } = req.query;
  if (!url) return res.status(400).json({ error: 'url query param required' });

  // Validate URL
  let parsed;
  try { parsed = new URL(url); }
  catch { return res.status(400).json({ error: 'Invalid URL' }); }

  if (!['http:', 'https:'].includes(parsed.protocol)) {
    return res.status(400).json({ error: 'Only http/https URLs allowed' });
  }
  if (!isSafeHostname(parsed.hostname)) {
    return res.status(400).json({ error: 'Blocked hostname' });
  }

  try {
    const html = await fetchHtml(url);
    const preview = extractPreview(html, url);
    res.json(preview);
  } catch (err) {
    res.status(502).json({ error: `Could not fetch preview: ${err.message}` });
  }
});

module.exports = router;

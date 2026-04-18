const express = require('express');
const router = express.Router();
const SiteSettings = require('../models/SiteSettings');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');

async function getSettings() {
  let s = await SiteSettings.findOne();
  if (!s) s = await SiteSettings.create({});
  return s;
}

// GET /api/topics — public, returns the ordered topic list
router.get('/', async (req, res) => {
  try {
    const s = await getSettings();
    res.json({ success: true, topics: s.featuredTopics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/topics — admin: add a new topic
router.post('/', protect, adminOnly, async (req, res) => {
  try {
    const { topic } = req.body;
    if (!topic?.trim()) return res.status(400).json({ success: false, message: 'Topic name required' });
    const name = topic.trim();
    const s = await getSettings();
    if (s.featuredTopics.map(t => t.toLowerCase()).includes(name.toLowerCase())) {
      return res.status(400).json({ success: false, message: 'Topic already exists' });
    }
    s.featuredTopics.push(name);
    await s.save();
    res.json({ success: true, topics: s.featuredTopics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// DELETE /api/topics/:topic — admin: remove a topic
router.delete('/:topic', protect, adminOnly, async (req, res) => {
  try {
    const name = decodeURIComponent(req.params.topic);
    const s = await getSettings();
    s.featuredTopics = s.featuredTopics.filter(t => t.toLowerCase() !== name.toLowerCase());
    await s.save();
    res.json({ success: true, topics: s.featuredTopics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// PUT /api/topics/reorder — admin: save full ordered list
router.put('/reorder', protect, adminOnly, async (req, res) => {
  try {
    const { topics } = req.body;
    if (!Array.isArray(topics)) return res.status(400).json({ success: false, message: 'topics must be an array' });
    const s = await getSettings();
    s.featuredTopics = topics.map(t => String(t).trim()).filter(Boolean);
    await s.save();
    res.json({ success: true, topics: s.featuredTopics });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

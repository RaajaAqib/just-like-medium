const mongoose = require('mongoose');

// Singleton — one document holds all site-wide settings
const siteSettingsSchema = new mongoose.Schema({
  featuredTopics: {
    type: [String],
    default: ['Technology', 'Programming', 'Design', 'Science', 'Culture', 'AI', 'Startup', 'Health', 'Travel', 'Food'],
  },
}, { timestamps: true });

module.exports = mongoose.model('SiteSettings', siteSettingsSchema);

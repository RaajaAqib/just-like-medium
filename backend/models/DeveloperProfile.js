const mongoose = require('mongoose');

// Singleton — only one document lives in this collection (fetched with findOne())
const developerProfileSchema = new mongoose.Schema({
  // ── Profile header ──────────────────────────────────────────────────────────
  name:      { type: String, default: '' },
  title:     { type: String, default: '' },
  location:  { type: String, default: '' },
  shortBio:  { type: String, default: '' },
  photo:     { type: String, default: '' },
  photoPublicId: { type: String, default: '' },
  socialLinks: [{
    platform: { type: String, default: '' }, // github, linkedin, twitter, website, youtube, etc.
    url:      { type: String, default: '' },
  }],

  // ── About Me tab ────────────────────────────────────────────────────────────
  fullBio:           { type: String, default: '' },
  mission:           { type: String, default: '' },
  yearsOfExperience: { type: Number, default: 0 },
  currentRole:       { type: String, default: '' },
  currentCompany:    { type: String, default: '' },

  // ── Work Experience tab ─────────────────────────────────────────────────────
  workExperience: [{
    company:     { type: String, default: '' },
    role:        { type: String, default: '' },
    startDate:   { type: String, default: '' },
    endDate:     { type: String, default: '' }, // 'Present' or a date string
    description: { type: String, default: '' },
  }],

  // ── Education tab ───────────────────────────────────────────────────────────
  education: [{
    degree:      { type: String, default: '' },
    institution: { type: String, default: '' },
    year:        { type: String, default: '' },
    grade:       { type: String, default: '' },
  }],

  // ── Skills tab ──────────────────────────────────────────────────────────────
  skills: [{
    name:     { type: String, default: '' },
    category: { type: String, enum: ['technical', 'soft', 'tools', 'languages'], default: 'technical' },
  }],

  // ── Projects tab ────────────────────────────────────────────────────────────
  projects: [{
    name:         { type: String, default: '' },
    description:  { type: String, default: '' },
    technologies: { type: String, default: '' },
    link:         { type: String, default: '' },
  }],

  // ── Certifications & Awards tab ─────────────────────────────────────────────
  certifications: [{
    name:         { type: String, default: '' },
    organization: { type: String, default: '' },
    year:         { type: String, default: '' },
  }],

  // ── QR Code section ─────────────────────────────────────────────────────────
  qrCode: {
    image:     { type: String, default: '' },
    imagePublicId: { type: String, default: '' },
    label:     { type: String, default: 'Scan to connect' },
    purpose:   { type: String, default: '' },
    altText:   { type: String, default: '' },
  },

  // ── About this website section ──────────────────────────────────────────────
  websiteInfo: {
    name:         { type: String, default: 'Dynamic Lab' },
    foundedYear:  { type: String, default: '' },
    mission:      { type: String, default: '' },
    techStack:    { type: String, default: '' },
    version:      { type: String, default: '' },
    contributors: { type: String, default: '' },
  },

  // ── Support / Buy Me a Coffee section ───────────────────────────────────────
  support: {
    heading:        { type: String, default: 'Buy Me a Coffee ☕' },
    description:    { type: String, default: 'If you like this platform, consider supporting its development.' },
    paymentQrCode:  { type: String, default: '' },
    paymentQrPublicId: { type: String, default: '' },
    upiId:          { type: String, default: '' },
    paypalEmail:    { type: String, default: '' },
    bitcoinAddress: { type: String, default: '' },
    bankDetails:    { type: String, default: '' },
    thankYouMessage:{ type: String, default: 'Thank you for your support! ❤️' },
  },

  // ── Visibility ───────────────────────────────────────────────────────────────
  isVisible: { type: Boolean, default: true },
}, { timestamps: true });

module.exports = mongoose.model('DeveloperProfile', developerProfileSchema);

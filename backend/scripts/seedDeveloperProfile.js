/**
 * Seed / update the DeveloperProfile singleton with Raja Aqib's info.
 * Run once from the backend folder:
 *   node scripts/seedDeveloperProfile.js
 */

const mongoose = require('mongoose');
const dotenv   = require('dotenv');
dotenv.config({ path: require('path').join(__dirname, '../.env') });

const DeveloperProfile = require('../models/DeveloperProfile');

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI || process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  let profile = await DeveloperProfile.findOne();
  if (!profile) profile = new DeveloperProfile();

  // ── Header ─────────────────────────────────────────────────────────────────
  profile.name     = 'Raja Aqib';
  profile.title    = 'Software Engineer & ServiceNow Developer';
  profile.location = 'Pakistan';
  profile.shortBio = 'Building meaningful digital experiences with clean code — one commit at a time.';

  profile.socialLinks = [
    { platform: 'github',   url: 'https://github.com/RaajaAqib' },
    { platform: 'linkedin', url: 'https://www.linkedin.com/in/raja-aqib' },
  ];

  // ── About Me ───────────────────────────────────────────────────────────────
  profile.fullBio = `Hi, I'm Raja Aqib — a Software Engineer and ServiceNow Developer based in Pakistan.

I built Just Like Medium as a full-stack portfolio project to create a modern, clean writing platform inspired by Medium. The goal was to build something that demonstrates real-world skills: authentication, real-time features, content moderation, admin tooling, and a polished user experience.

I'm passionate about crafting software that is both technically solid and genuinely useful. When I'm not building full-stack apps, I work on ServiceNow implementations and enterprise workflow automation.`;

  profile.mission           = 'To build tools that make the web a better place for writers, readers, and creators.';
  profile.yearsOfExperience = 3;
  profile.currentRole       = 'Software Engineer & ServiceNow Developer';
  profile.currentCompany    = 'Freelance / Independent';

  // ── Work Experience ────────────────────────────────────────────────────────
  profile.workExperience = [
    {
      company:     'Freelance',
      role:        'Full-Stack Developer',
      startDate:   '2022',
      endDate:     'Present',
      description: 'Building full-stack web applications using React, Node.js, Express, and MongoDB. Developed Just Like Medium — a fully-featured writing platform — as a showcase project covering auth, rich text editing, notifications, admin dashboards, and cloud media management.',
    },
    {
      company:     'ServiceNow Projects',
      role:        'ServiceNow Developer',
      startDate:   '2022',
      endDate:     'Present',
      description: 'Designing and implementing ServiceNow workflows, custom applications, and enterprise integrations. Experience with Flow Designer, Business Rules, Script Includes, and REST API integrations.',
    },
  ];

  // ── Education ──────────────────────────────────────────────────────────────
  profile.education = [
    {
      degree:      'Bachelor of Science in Computer Science',
      institution: 'University (Pakistan)',
      year:        '2021–2025',
      grade:       '',
    },
  ];

  // ── Skills ─────────────────────────────────────────────────────────────────
  profile.skills = [
    // Technical
    { name: 'JavaScript (ES2022+)', category: 'technical' },
    { name: 'React.js',             category: 'technical' },
    { name: 'Node.js',              category: 'technical' },
    { name: 'Express.js',           category: 'technical' },
    { name: 'MongoDB',              category: 'technical' },
    { name: 'REST APIs',            category: 'technical' },
    { name: 'JWT Authentication',   category: 'technical' },
    { name: 'HTML5 / CSS3',         category: 'technical' },
    { name: 'Tailwind CSS',         category: 'technical' },
    { name: 'ServiceNow',           category: 'technical' },
    // Tools
    { name: 'Git & GitHub',         category: 'tools' },
    { name: 'Cloudinary',           category: 'tools' },
    { name: 'Render',               category: 'tools' },
    { name: 'GitHub Pages',         category: 'tools' },
    { name: 'Vite',                 category: 'tools' },
    { name: 'VS Code',              category: 'tools' },
    // Soft
    { name: 'Problem Solving',      category: 'soft' },
    { name: 'Self-Directed Learning', category: 'soft' },
    { name: 'Attention to Detail',  category: 'soft' },
    // Languages
    { name: 'English',              category: 'languages' },
    { name: 'Urdu',                 category: 'languages' },
  ];

  // ── Projects ───────────────────────────────────────────────────────────────
  profile.projects = [
    {
      name:         'Just Like Medium',
      description:  'A full-featured blogging platform inspired by Medium.com. Built from scratch with JWT auth, a rich text editor, reading lists, follow system, notifications, admin dashboard, content moderation, dark mode, and a full submission/review workflow.',
      technologies: 'React, Node.js, Express, MongoDB, Cloudinary, TipTap, Tailwind CSS, JWT',
      link:         'https://raajaaqib.github.io/just-like-medium/',
    },
  ];

  // ── Certifications ─────────────────────────────────────────────────────────
  profile.certifications = [];

  // ── Website Info ───────────────────────────────────────────────────────────
  profile.websiteInfo = {
    name:         'Just Like Medium',
    foundedYear:  '2025',
    mission:      'A platform for writers and readers to share ideas, stories, and knowledge — free from algorithmic noise.',
    techStack:    'React, Node.js, Express.js, MongoDB, Cloudinary, Tailwind CSS, TipTap, JWT, Render, GitHub Pages',
    version:      '1.0.0',
    contributors: 'Raja Aqib',
  };

  // ── Support ────────────────────────────────────────────────────────────────
  profile.support = {
    heading:         'Buy Me a Coffee ☕',
    description:     'Just Like Medium is a free, open platform. If you find it useful, consider supporting its development — every bit helps keep the servers running!',
    paymentQrCode:   '',
    paymentQrPublicId: '',
    upiId:           '',
    paypalEmail:     '',
    bitcoinAddress:  '',
    bankDetails:     '',
    thankYouMessage: 'Thank you for your support! It means a lot. ❤️',
  };

  profile.isVisible = true;

  profile.markModified('websiteInfo');
  profile.markModified('support');
  await profile.save();

  console.log('✓ Developer profile seeded successfully');
  console.log(`  Name: ${profile.name}`);
  console.log(`  Skills: ${profile.skills.length}`);
  console.log(`  Projects: ${profile.projects.length}`);
  await mongoose.disconnect();
}

seed().catch(err => { console.error(err); process.exit(1); });

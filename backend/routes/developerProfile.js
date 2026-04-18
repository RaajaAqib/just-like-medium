const express = require('express');
const router = express.Router();
const DeveloperProfile = require('../models/DeveloperProfile');
const { protect } = require('../middleware/auth');
const { adminOnly } = require('../middleware/adminAuth');
const { upload, deleteFromCloudinary } = require('../utils/cloudinary');
const multer = require('multer');

// Multi-field upload: photo + qrCode + paymentQrCode
const uploadFields = upload.fields([
  { name: 'photo',          maxCount: 1 },
  { name: 'qrCode',         maxCount: 1 },
  { name: 'paymentQrCode',  maxCount: 1 },
]);

// Helper to get or create the singleton document
async function getProfile() {
  let profile = await DeveloperProfile.findOne();
  if (!profile) profile = await DeveloperProfile.create({});
  return profile;
}

// ── GET /api/developer-profile  (public) ─────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const profile = await getProfile();
    res.json({ success: true, profile });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/developer-profile  (admin only) ─────────────────────────────────
router.put('/', protect, adminOnly, (req, res, next) => {
  uploadFields(req, res, (err) => {
    if (err instanceof multer.MulterError || err) {
      return res.status(400).json({ success: false, message: err.message });
    }
    next();
  });
}, async (req, res) => {
  try {
    const profile = await getProfile();
    const body = req.body;

    // ── Profile header fields ────────────────────────────────────────────────
    if (body.name        !== undefined) profile.name       = body.name;
    if (body.title       !== undefined) profile.title      = body.title;
    if (body.location    !== undefined) profile.location   = body.location;
    if (body.shortBio    !== undefined) profile.shortBio   = body.shortBio;

    if (req.files?.photo?.[0]) {
      if (profile.photoPublicId) await deleteFromCloudinary(profile.photoPublicId).catch(() => {});
      profile.photo          = req.files.photo[0].path;
      profile.photoPublicId  = req.files.photo[0].filename;
    }

    // Social links come as JSON string
    if (body.socialLinks !== undefined) {
      try { profile.socialLinks = JSON.parse(body.socialLinks); } catch {}
    }

    // ── About Me ─────────────────────────────────────────────────────────────
    if (body.fullBio           !== undefined) profile.fullBio           = body.fullBio;
    if (body.mission           !== undefined) profile.mission           = body.mission;
    if (body.yearsOfExperience !== undefined) profile.yearsOfExperience = Number(body.yearsOfExperience) || 0;
    if (body.currentRole       !== undefined) profile.currentRole       = body.currentRole;
    if (body.currentCompany    !== undefined) profile.currentCompany    = body.currentCompany;

    // ── Arrays (work, education, skills, projects, certs) ───────────────────
    if (body.workExperience  !== undefined) try { profile.workExperience  = JSON.parse(body.workExperience);  } catch {}
    if (body.education       !== undefined) try { profile.education       = JSON.parse(body.education);       } catch {}
    if (body.skills          !== undefined) try { profile.skills          = JSON.parse(body.skills);          } catch {}
    if (body.projects        !== undefined) try { profile.projects        = JSON.parse(body.projects);        } catch {}
    if (body.certifications  !== undefined) try { profile.certifications  = JSON.parse(body.certifications);  } catch {}

    // ── QR Code ──────────────────────────────────────────────────────────────
    if (body.qrLabel   !== undefined) profile.qrCode.label   = body.qrLabel;
    if (body.qrPurpose !== undefined) profile.qrCode.purpose = body.qrPurpose;
    if (body.qrAltText !== undefined) profile.qrCode.altText = body.qrAltText;
    if (req.files?.qrCode?.[0]) {
      if (profile.qrCode.imagePublicId) await deleteFromCloudinary(profile.qrCode.imagePublicId).catch(() => {});
      profile.qrCode.image          = req.files.qrCode[0].path;
      profile.qrCode.imagePublicId  = req.files.qrCode[0].filename;
    }

    // ── Website Info ─────────────────────────────────────────────────────────
    if (body.websiteInfo !== undefined) {
      try {
        const wi = JSON.parse(body.websiteInfo);
        profile.websiteInfo = { ...profile.websiteInfo.toObject?.() ?? profile.websiteInfo, ...wi };
      } catch {}
    }

    // ── Support / Buy Me a Coffee ─────────────────────────────────────────────
    if (body.supportHeading        !== undefined) profile.support.heading         = body.supportHeading;
    if (body.supportDescription    !== undefined) profile.support.description     = body.supportDescription;
    if (body.supportUpiId          !== undefined) profile.support.upiId           = body.supportUpiId;
    if (body.supportPaypalEmail    !== undefined) profile.support.paypalEmail      = body.supportPaypalEmail;
    if (body.supportBitcoin        !== undefined) profile.support.bitcoinAddress   = body.supportBitcoin;
    if (body.supportBankDetails    !== undefined) profile.support.bankDetails      = body.supportBankDetails;
    if (body.supportThankYou       !== undefined) profile.support.thankYouMessage  = body.supportThankYou;
    if (req.files?.paymentQrCode?.[0]) {
      if (profile.support.paymentQrPublicId) await deleteFromCloudinary(profile.support.paymentQrPublicId).catch(() => {});
      profile.support.paymentQrCode      = req.files.paymentQrCode[0].path;
      profile.support.paymentQrPublicId  = req.files.paymentQrCode[0].filename;
    }

    // ── Visibility ────────────────────────────────────────────────────────────
    if (body.isVisible !== undefined) profile.isVisible = body.isVisible === 'true' || body.isVisible === true;

    profile.markModified('qrCode');
    profile.markModified('support');
    profile.markModified('websiteInfo');
    await profile.save();

    res.json({ success: true, profile });
  } catch (err) {
    console.error('Developer profile save error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

const express = require('express');
const router  = express.Router();
const DeveloperProfile = require('../models/DeveloperProfile');
const { protect }    = require('../middleware/auth');
const { adminOnly }  = require('../middleware/adminAuth');
const { cloudinary, deleteFromCloudinary } = require('../utils/cloudinary');
const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');

// ── Separate Cloudinary storage for QR codes (no crop / resize) ──────────────
const qrStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'medium-clone/qr-codes',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    // No transformation — QR codes must stay pixel-perfect
  },
});

const photoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'medium-clone/developer',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [{ width: 400, height: 400, crop: 'limit' }],
  },
});

const uploadFields = multer({ limits: { fileSize: 5 * 1024 * 1024 } }).fields([
  { name: 'photo',         maxCount: 1 },
  { name: 'qrCode',        maxCount: 1 },
  { name: 'paymentQrCode', maxCount: 1 },
]);

// Helper: upload a single buffer/file object to the right Cloudinary folder
async function uploadToCloudinaryDirect(file, storage) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      storage._params instanceof Function
        ? storage._params(null, file)
        : storage._params,
      (err, result) => err ? reject(err) : resolve(result),
    );
    uploadStream.end(file.buffer);
  });
}

// ── Singleton helper ──────────────────────────────────────────────────────────
async function getProfile() {
  let profile = await DeveloperProfile.findOne();
  if (!profile) profile = await DeveloperProfile.create({});
  return profile;
}

// ── GET /api/developer-profile  (public) ─────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    res.json({ success: true, profile: await getProfile() });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT /api/developer-profile  (admin only) ─────────────────────────────────
// Use memory storage so we can pick the right Cloudinary folder per field
const memUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
}).fields([
  { name: 'photo',         maxCount: 1 },
  { name: 'qrCode',        maxCount: 1 },
  { name: 'paymentQrCode', maxCount: 1 },
]);

router.put('/', protect, adminOnly, (req, res, next) => {
  memUpload(req, res, err => {
    if (err) return res.status(400).json({ success: false, message: err.message });
    next();
  });
}, async (req, res) => {
  try {
    const profile = await getProfile();
    const body    = req.body;

    // ── Profile header ───────────────────────────────────────────────────────
    if (body.name     !== undefined) profile.name     = body.name;
    if (body.title    !== undefined) profile.title    = body.title;
    if (body.location !== undefined) profile.location = body.location;
    if (body.shortBio !== undefined) profile.shortBio = body.shortBio;

    // Profile photo → square crop in developer folder
    if (req.files?.photo?.[0]) {
      if (profile.photoPublicId) deleteFromCloudinary(profile.photoPublicId).catch(() => {});
      const result = await cloudinary.uploader.upload_stream_promise?.(req.files.photo[0].buffer)
        || await new Promise((resolve, reject) => {
          const s = cloudinary.uploader.upload_stream(
            { folder: 'medium-clone/developer', transformation: [{ width: 400, height: 400, crop: 'limit' }] },
            (e, r) => e ? reject(e) : resolve(r),
          );
          s.end(req.files.photo[0].buffer);
        });
      profile.photo         = result.secure_url;
      profile.photoPublicId = result.public_id;
    }

    // Social links
    if (body.socialLinks !== undefined) {
      try { profile.socialLinks = JSON.parse(body.socialLinks); } catch {}
    }

    // ── About Me ─────────────────────────────────────────────────────────────
    if (body.fullBio           !== undefined) profile.fullBio           = body.fullBio;
    if (body.mission           !== undefined) profile.mission           = body.mission;
    if (body.yearsOfExperience !== undefined) profile.yearsOfExperience = Number(body.yearsOfExperience) || 0;
    if (body.currentRole       !== undefined) profile.currentRole       = body.currentRole;
    if (body.currentCompany    !== undefined) profile.currentCompany    = body.currentCompany;

    // ── Arrays ───────────────────────────────────────────────────────────────
    if (body.workExperience !== undefined)  try { profile.workExperience  = JSON.parse(body.workExperience);  } catch {}
    if (body.education      !== undefined)  try { profile.education       = JSON.parse(body.education);       } catch {}
    if (body.skills         !== undefined)  try { profile.skills          = JSON.parse(body.skills);          } catch {}
    if (body.projects       !== undefined)  try { profile.projects        = JSON.parse(body.projects);        } catch {}
    if (body.certifications !== undefined)  try { profile.certifications  = JSON.parse(body.certifications);  } catch {}

    // ── QR Code (no crop — pixel-perfect) ───────────────────────────────────
    if (body.qrLabel   !== undefined) { profile.qrCode.label   = body.qrLabel;   profile.markModified('qrCode'); }
    if (body.qrPurpose !== undefined) { profile.qrCode.purpose = body.qrPurpose; profile.markModified('qrCode'); }
    if (body.qrAltText !== undefined) { profile.qrCode.altText = body.qrAltText; profile.markModified('qrCode'); }

    if (req.files?.qrCode?.[0]) {
      if (profile.qrCode.imagePublicId) deleteFromCloudinary(profile.qrCode.imagePublicId).catch(() => {});
      const result = await new Promise((resolve, reject) => {
        const s = cloudinary.uploader.upload_stream(
          { folder: 'medium-clone/qr-codes' },
          (e, r) => e ? reject(e) : resolve(r),
        );
        s.end(req.files.qrCode[0].buffer);
      });
      profile.qrCode.image         = result.secure_url;
      profile.qrCode.imagePublicId = result.public_id;
      profile.markModified('qrCode');
    }

    // ── Website Info — field-by-field to avoid losing existing data ──────────
    if (body.websiteInfo !== undefined) {
      try {
        const wi = JSON.parse(body.websiteInfo);
        Object.keys(wi).forEach(key => {
          profile.websiteInfo[key] = wi[key];
        });
        profile.markModified('websiteInfo');
      } catch {}
    }

    // ── Support / Buy Me a Coffee ────────────────────────────────────────────
    if (body.supportHeading     !== undefined) { profile.support.heading         = body.supportHeading;     profile.markModified('support'); }
    if (body.supportDescription !== undefined) { profile.support.description     = body.supportDescription; profile.markModified('support'); }
    if (body.supportUpiId       !== undefined) { profile.support.upiId           = body.supportUpiId;       profile.markModified('support'); }
    if (body.supportPaypalEmail !== undefined) { profile.support.paypalEmail     = body.supportPaypalEmail; profile.markModified('support'); }
    if (body.supportBitcoin     !== undefined) { profile.support.bitcoinAddress  = body.supportBitcoin;     profile.markModified('support'); }
    if (body.supportBankDetails !== undefined) { profile.support.bankDetails     = body.supportBankDetails; profile.markModified('support'); }
    if (body.supportThankYou    !== undefined) { profile.support.thankYouMessage = body.supportThankYou;    profile.markModified('support'); }

    if (req.files?.paymentQrCode?.[0]) {
      if (profile.support.paymentQrPublicId) deleteFromCloudinary(profile.support.paymentQrPublicId).catch(() => {});
      const result = await new Promise((resolve, reject) => {
        const s = cloudinary.uploader.upload_stream(
          { folder: 'medium-clone/qr-codes' },
          (e, r) => e ? reject(e) : resolve(r),
        );
        s.end(req.files.paymentQrCode[0].buffer);
      });
      profile.support.paymentQrCode     = result.secure_url;
      profile.support.paymentQrPublicId = result.public_id;
      profile.markModified('support');
    }

    // ── Visibility ───────────────────────────────────────────────────────────
    if (body.isVisible !== undefined) {
      profile.isVisible = body.isVisible === 'true' || body.isVisible === true;
    }

    await profile.save();
    res.json({ success: true, profile });
  } catch (err) {
    console.error('Developer profile save error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;

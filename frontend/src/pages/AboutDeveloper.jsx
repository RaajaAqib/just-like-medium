import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import { useAuth } from '../context/AuthContext';
import SidebarLayout from '../components/SidebarLayout';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../utils/axios';
import toast from 'react-hot-toast';
import {
  FiGithub, FiLinkedin, FiTwitter, FiGlobe, FiMail, FiPhone,
  FiMapPin, FiCalendar, FiExternalLink, FiBriefcase, FiBook,
  FiCode, FiAward, FiMessageSquare, FiYoutube, FiInstagram,
  FiCopy, FiCheck, FiHeart,
} from 'react-icons/fi';

// ── Social link icon resolver ─────────────────────────────────────────────────
function SocialIcon({ platform }) {
  const p = platform?.toLowerCase() || '';
  if (p.includes('github'))    return <FiGithub />;
  if (p.includes('linkedin'))  return <FiLinkedin />;
  if (p.includes('twitter') || p.includes('x.com')) return <FiTwitter />;
  if (p.includes('youtube'))   return <FiYoutube />;
  if (p.includes('instagram')) return <FiInstagram />;
  if (p.includes('mail') || p.includes('email')) return <FiMail />;
  return <FiGlobe />;
}

// ── CV Tabs definition ────────────────────────────────────────────────────────
const CV_TABS = [
  { key: 'about',   label: 'About Me',      icon: FiMessageSquare },
  { key: 'exp',     label: 'Experience',    icon: FiBriefcase },
  { key: 'edu',     label: 'Education',     icon: FiBook },
  { key: 'skills',  label: 'Skills',        icon: FiCode },
  { key: 'projects',label: 'Projects',      icon: FiExternalLink },
  { key: 'certs',   label: 'Certifications',icon: FiAward },
  { key: 'contact', label: 'Contact',       icon: FiMail },
];

const SKILL_CATEGORY_COLORS = {
  technical: 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300',
  tools:     'bg-purple-100 dark:bg-purple-900/40 text-purple-700 dark:text-purple-300',
  soft:      'bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300',
  languages: 'bg-orange-100 dark:bg-orange-900/40 text-orange-700 dark:text-orange-300',
};

// ── About Me tab ─────────────────────────────────────────────────────────────
function AboutTab({ p }) {
  return (
    <div className="space-y-6">
      {p.fullBio && (
        <div>
          <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-widest mb-3">Bio</h3>
          <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{p.fullBio}</p>
        </div>
      )}
      {p.mission && (
        <blockquote className="border-l-4 border-medium-green pl-5 py-2 italic text-lg text-gray-700 dark:text-gray-300 font-serif">
          {p.mission}
        </blockquote>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
        {p.yearsOfExperience > 0 && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-3xl font-bold text-medium-green">{p.yearsOfExperience}+</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Years of Experience</p>
          </div>
        )}
        {p.currentRole && (
          <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-4 text-center">
            <p className="text-sm font-semibold text-gray-800 dark:text-gray-200">{p.currentRole}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{p.currentCompany || 'Current Role'}</p>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Experience tab ───────────────────────────────────────────────────────────
function ExperienceTab({ items }) {
  if (!items?.length) return <Empty label="No work experience added yet." />;
  return (
    <div className="space-y-6">
      {items.map((job, i) => (
        <div key={i} className="relative pl-6 border-l-2 border-gray-200 dark:border-gray-700">
          <div className="absolute -left-1.5 top-1.5 w-3 h-3 rounded-full bg-medium-green" />
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="font-semibold text-gray-900 dark:text-gray-100">{job.role}</p>
              <p className="text-sm text-medium-green font-medium">{job.company}</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-gray-400 dark:text-gray-500 flex-shrink-0">
              <FiCalendar className="text-xs" />
              <span>{job.startDate} — {job.endDate || 'Present'}</span>
            </div>
          </div>
          {job.description && (
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">{job.description}</p>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Education tab ────────────────────────────────────────────────────────────
function EducationTab({ items }) {
  if (!items?.length) return <Empty label="No education added yet." />;
  return (
    <div className="space-y-5">
      {items.map((edu, i) => (
        <div key={i} className="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/40 flex items-center justify-center flex-shrink-0">
            <FiBook className="text-blue-600 dark:text-blue-400" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-gray-100">{edu.degree}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{edu.institution}</p>
            <div className="flex items-center gap-3 mt-1 text-xs text-gray-400 dark:text-gray-500">
              {edu.year && <span>{edu.year}</span>}
              {edu.grade && <span>· {edu.grade}</span>}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Skills tab ───────────────────────────────────────────────────────────────
function SkillsTab({ items }) {
  if (!items?.length) return <Empty label="No skills added yet." />;
  const grouped = items.reduce((acc, s) => {
    const cat = s.category || 'technical';
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(s.name);
    return acc;
  }, {});
  const catLabels = { technical: 'Technical', tools: 'Tools & Technologies', soft: 'Soft Skills', languages: 'Languages' };
  return (
    <div className="space-y-6">
      {['technical', 'tools', 'soft', 'languages'].filter(c => grouped[c]).map(cat => (
        <div key={cat}>
          <h3 className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3">{catLabels[cat]}</h3>
          <div className="flex flex-wrap gap-2">
            {grouped[cat].map((name, i) => (
              <span key={i} className={`px-3 py-1.5 rounded-full text-sm font-medium ${SKILL_CATEGORY_COLORS[cat]}`}>
                {name}
              </span>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Projects tab ─────────────────────────────────────────────────────────────
function ProjectsTab({ items }) {
  if (!items?.length) return <Empty label="No projects added yet." />;
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {items.map((proj, i) => (
        <div key={i} className="border border-gray-200 dark:border-gray-700 rounded-xl p-5 hover:border-medium-green dark:hover:border-medium-green transition-colors group">
          <div className="flex items-start justify-between gap-2 mb-2">
            <p className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-medium-green transition-colors">{proj.name}</p>
            {proj.link && (
              <a href={proj.link} target="_blank" rel="noopener noreferrer"
                className="text-gray-400 hover:text-medium-green transition flex-shrink-0">
                <FiExternalLink />
              </a>
            )}
          </div>
          {proj.description && <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 leading-relaxed">{proj.description}</p>}
          {proj.technologies && (
            <div className="flex flex-wrap gap-1.5">
              {proj.technologies.split(',').map(t => t.trim()).filter(Boolean).map((tech, j) => (
                <span key={j} className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full">
                  {tech}
                </span>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ── Certifications tab ───────────────────────────────────────────────────────
function CertsTab({ items }) {
  if (!items?.length) return <Empty label="No certifications added yet." />;
  return (
    <div className="space-y-4">
      {items.map((cert, i) => (
        <div key={i} className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
          <div className="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
            <FiAward className="text-yellow-600 dark:text-yellow-400" />
          </div>
          <div>
            <p className="font-semibold text-gray-900 dark:text-gray-100">{cert.name}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{cert.organization}{cert.year ? ` · ${cert.year}` : ''}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Contact tab ──────────────────────────────────────────────────────────────
function ContactTab({ p }) {
  const emailLink = p.socialLinks?.find(l => l.platform?.toLowerCase().includes('email') || l.platform?.toLowerCase().includes('mail'));
  const phoneLink = p.socialLinks?.find(l => l.platform?.toLowerCase().includes('phone'));
  const socials   = p.socialLinks?.filter(l => !l.platform?.toLowerCase().includes('email') && !l.platform?.toLowerCase().includes('phone')) || [];

  return (
    <div className="space-y-5">
      {emailLink && (
        <a href={`mailto:${emailLink.url}`} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition group">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <FiMail className="text-green-600 dark:text-green-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Email</p>
            <p className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-medium-green transition">{emailLink.url}</p>
          </div>
        </a>
      )}
      {phoneLink && (
        <a href={`tel:${phoneLink.url}`} className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition group">
          <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
            <FiPhone className="text-blue-600 dark:text-blue-400" />
          </div>
          <div>
            <p className="text-xs text-gray-400 dark:text-gray-500">Phone</p>
            <p className="font-medium text-gray-800 dark:text-gray-200 group-hover:text-medium-green transition">{phoneLink.url}</p>
          </div>
        </a>
      )}
      {socials.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {socials.map((s, i) => s.url && (
            <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 transition group">
              <div className="w-8 h-8 rounded-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 flex items-center justify-center text-gray-600 dark:text-gray-300">
                <SocialIcon platform={s.platform} />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-gray-400 dark:text-gray-500 capitalize">{s.platform}</p>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300 group-hover:text-medium-green transition truncate">{s.url}</p>
              </div>
              <FiExternalLink className="ml-auto text-gray-300 dark:text-gray-600 group-hover:text-medium-green transition flex-shrink-0 text-xs" />
            </a>
          ))}
        </div>
      )}
      {!emailLink && !phoneLink && !socials.length && <Empty label="No contact details added yet." />}
    </div>
  );
}

function Empty({ label }) {
  return (
    <div className="py-12 text-center text-gray-400 dark:text-gray-600 text-sm">{label}</div>
  );
}

function CopyButton({ value }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(value).then(() => {
      setCopied(true);
      toast.success('Copied!');
      setTimeout(() => setCopied(false), 2000);
    });
  };
  return (
    <button onClick={copy}
      className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-100 dark:hover:bg-amber-800/40 transition flex-shrink-0"
      title="Copy to clipboard">
      {copied ? <FiCheck className="text-sm text-green-600" /> : <FiCopy className="text-sm" />}
    </button>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function AboutDeveloper() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [searchParams, setSearchParams] = useSearchParams();
  const CV_TAB_KEYS = CV_TABS.map(t => t.key);
  const tabParam = searchParams.get('tab');
  const activeTab = CV_TAB_KEYS.includes(tabParam) ? tabParam : 'about';
  const setActiveTab = (key) => setSearchParams({ tab: key }, { replace: true });

  useEffect(() => {
    api.get('/developer-profile')
      .then(r => setProfile(r.data.profile))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const content = (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
      {loading ? (
        <div className="py-20"><LoadingSpinner /></div>
      ) : !profile || (!profile.isVisible && !user?.isAdmin) ? (
        <div className="py-24 text-center">
          <p className="text-gray-400 dark:text-gray-600 text-lg">This page is not available.</p>
          <Link to="/" className="mt-4 inline-block text-medium-green hover:underline text-sm">← Back to home</Link>
        </div>
      ) : (
        <div className="space-y-16">

          {/* ── Profile Header ─────────────────────────────────────────────── */}
          <section>
            <div className="flex flex-col sm:flex-row gap-8 items-start">
              {/* Photo */}
              <div className="flex-shrink-0">
                {profile.photo ? (
                  <img src={profile.photo} alt={profile.name}
                    className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl object-cover shadow-lg" />
                ) : (
                  <div className="w-28 h-28 sm:w-36 sm:h-36 rounded-2xl bg-gradient-to-br from-medium-green to-green-700 flex items-center justify-center text-white text-4xl font-bold shadow-lg">
                    {profile.name?.[0] || 'D'}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 dark:text-gray-100 font-serif leading-tight">
                  {profile.name || 'Developer'}
                </h1>
                {profile.title && (
                  <p className="text-medium-green font-medium mt-1 text-lg">{profile.title}</p>
                )}
                {profile.location && (
                  <div className="flex items-center gap-1.5 text-gray-500 dark:text-gray-400 text-sm mt-2">
                    <FiMapPin className="text-xs" />
                    <span>{profile.location}</span>
                  </div>
                )}
                {profile.shortBio && (
                  <p className="mt-3 text-gray-600 dark:text-gray-400 leading-relaxed max-w-xl italic text-sm sm:text-base">
                    "{profile.shortBio}"
                  </p>
                )}

                {/* Social links */}
                {profile.socialLinks?.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {profile.socialLinks.filter(s => s.url).map((s, i) => (
                      <a key={i} href={s.url} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-medium-green hover:text-medium-green dark:hover:border-medium-green dark:hover:text-medium-green transition text-sm">
                        <SocialIcon platform={s.platform} />
                        <span className="capitalize text-xs">{s.platform}</span>
                      </a>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ── CV Tabs ────────────────────────────────────────────────────── */}
          <section>
            {/* Tab bar */}
            <div className="flex gap-0 overflow-x-auto border-b border-gray-200 dark:border-gray-700 mb-8 -mx-4 px-4">
              {CV_TABS.map(tab => {
                const Icon = tab.icon;
                return (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key)}
                    className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 -mb-px transition flex-shrink-0 ${
                      activeTab === tab.key
                        ? 'border-medium-black dark:border-gray-200 text-medium-black dark:text-gray-100'
                        : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-medium-black dark:hover:text-gray-200'
                    }`}>
                    <Icon className="text-sm" />
                    <span className="hidden sm:inline">{tab.label}</span>
                    <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div>
              {activeTab === 'about'    && <AboutTab p={profile} />}
              {activeTab === 'exp'      && <ExperienceTab items={profile.workExperience} />}
              {activeTab === 'edu'      && <EducationTab items={profile.education} />}
              {activeTab === 'skills'   && <SkillsTab items={profile.skills} />}
              {activeTab === 'projects' && <ProjectsTab items={profile.projects} />}
              {activeTab === 'certs'    && <CertsTab items={profile.certifications} />}
              {activeTab === 'contact'  && <ContactTab p={profile} />}
            </div>
          </section>

          {/* ── QR Code Section ────────────────────────────────────────────── */}
          {profile.qrCode?.image && (
            <section className="border-t border-gray-100 dark:border-gray-800 pt-12">
              <h2 className="text-2xl font-bold font-serif text-gray-900 dark:text-gray-100 mb-6">Connect</h2>
              <div className="flex flex-col sm:flex-row items-center gap-8 p-6 bg-gray-50 dark:bg-gray-800 rounded-2xl">
                <div className="flex-shrink-0 text-center">
                  <img src={profile.qrCode.image} alt={profile.qrCode.altText || 'QR Code'}
                    className="w-40 h-40 object-contain rounded-xl border border-gray-200 dark:border-gray-700 bg-white p-2 shadow-sm" />
                  {profile.qrCode.label && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{profile.qrCode.label}</p>
                  )}
                </div>
                <div>
                  {profile.qrCode.purpose && (
                    <p className="text-gray-700 dark:text-gray-300 leading-relaxed">{profile.qrCode.purpose}</p>
                  )}
                  {profile.qrCode.altText && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">{profile.qrCode.altText}</p>
                  )}
                </div>
              </div>
            </section>
          )}

          {/* ── About the Website ──────────────────────────────────────────── */}
          {profile.websiteInfo?.name && (
            <section className="border-t border-gray-100 dark:border-gray-800 pt-12">
              <h2 className="text-2xl font-bold font-serif text-gray-900 dark:text-gray-100 mb-6">About {profile.websiteInfo.name}</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Platform', value: profile.websiteInfo.name },
                  { label: 'Founded', value: profile.websiteInfo.foundedYear },
                  { label: 'Version', value: profile.websiteInfo.version },
                  { label: 'Contributors', value: profile.websiteInfo.contributors },
                ].filter(r => r.value).map((row, i) => (
                  <div key={i} className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <div className="flex-shrink-0 w-1 h-full min-h-[24px] rounded-full bg-medium-green" />
                    <div>
                      <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide">{row.label}</p>
                      <p className="text-sm font-medium text-gray-800 dark:text-gray-200 mt-0.5">{row.value}</p>
                    </div>
                  </div>
                ))}
                {profile.websiteInfo.mission && (
                  <div className="sm:col-span-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-1">Mission</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{profile.websiteInfo.mission}</p>
                  </div>
                )}
                {profile.websiteInfo.techStack && (
                  <div className="sm:col-span-2 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl">
                    <p className="text-xs font-medium text-gray-400 dark:text-gray-500 uppercase tracking-wide mb-2">Built With</p>
                    <div className="flex flex-wrap gap-2">
                      {profile.websiteInfo.techStack.split(',').map(t => t.trim()).filter(Boolean).map((tech, i) => (
                        <span key={i} className="text-xs px-2.5 py-1 bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-full">
                          {tech}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* ── Buy Me a Coffee ────────────────────────────────────────────── */}
          {profile.support && (
            <section className="border-t border-gray-100 dark:border-gray-800 pt-12">

              {/* Hero card — yellow gradient, BMC style */}
              <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#FFDD00] via-[#FFD000] to-[#FFC000] shadow-xl">

                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/10 pointer-events-none" />

                <div className="relative px-6 sm:px-10 py-10">
                  {/* Top: emoji + heading */}
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-4xl select-none">☕</span>
                    <h2 className="text-2xl sm:text-3xl font-extrabold text-gray-900 leading-tight">
                      {profile.support.heading || 'Buy Me a Coffee'}
                    </h2>
                  </div>
                  {profile.support.description && (
                    <p className="text-gray-800/80 text-sm sm:text-base max-w-lg mb-8 leading-relaxed">
                      {profile.support.description}
                    </p>
                  )}

                  <div className="flex flex-col lg:flex-row gap-8 items-start">

                    {/* Payment methods */}
                    <div className="flex-1 space-y-3">
                      {!profile.support.upiId && !profile.support.paypalEmail && !profile.support.bitcoinAddress && !profile.support.bankDetails && !profile.support.paymentQrCode && (
                        <p className="text-sm text-gray-700 italic">Payment details coming soon — check back later!</p>
                      )}

                      {profile.support.upiId && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                          <div className="w-9 h-9 rounded-xl bg-[#FFDD00] border border-yellow-300 flex items-center justify-center flex-shrink-0 text-base font-bold text-gray-800">₹</div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">UPI ID</p>
                            <p className="text-sm font-mono font-semibold text-gray-900 truncate">{profile.support.upiId}</p>
                          </div>
                          <CopyButton value={profile.support.upiId} />
                        </div>
                      )}

                      {profile.support.paypalEmail && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                          <div className="w-9 h-9 rounded-xl bg-[#003087] flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">P</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">PayPal</p>
                            <p className="text-sm font-mono font-semibold text-gray-900 truncate">{profile.support.paypalEmail}</p>
                          </div>
                          <CopyButton value={profile.support.paypalEmail} />
                        </div>
                      )}

                      {profile.support.bitcoinAddress && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-center gap-3 shadow-sm">
                          <div className="w-9 h-9 rounded-xl bg-[#F7931A] flex items-center justify-center flex-shrink-0">
                            <span className="text-white font-bold text-sm">₿</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider">Bitcoin</p>
                            <p className="text-sm font-mono font-semibold text-gray-900 truncate">{profile.support.bitcoinAddress}</p>
                          </div>
                          <CopyButton value={profile.support.bitcoinAddress} />
                        </div>
                      )}

                      {profile.support.bankDetails && (
                        <div className="bg-white/80 backdrop-blur-sm rounded-2xl px-4 py-3 flex items-start gap-3 shadow-sm">
                          <div className="w-9 h-9 rounded-xl bg-gray-800 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <span className="text-white font-bold text-xs">🏦</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-semibold text-gray-500 uppercase tracking-wider mb-0.5">Bank Transfer</p>
                            <p className="text-sm text-gray-900 leading-relaxed whitespace-pre-wrap">{profile.support.bankDetails}</p>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* QR Code */}
                    {profile.support.paymentQrCode && (
                      <div className="flex-shrink-0 flex flex-col items-center gap-2">
                        <div className="bg-white rounded-2xl p-3 shadow-md">
                          <img src={profile.support.paymentQrCode} alt="Payment QR"
                            className="w-36 h-36 object-contain" />
                        </div>
                        <p className="text-xs font-semibold text-gray-700">Scan to pay</p>
                      </div>
                    )}

                  </div>
                </div>

                {/* Thank you footer */}
                {profile.support.thankYouMessage && (
                  <div className="px-6 sm:px-10 py-4 bg-black/10 flex items-center gap-2">
                    <FiHeart className="text-red-600 text-sm flex-shrink-0" />
                    <p className="text-sm text-gray-800 italic">{profile.support.thankYouMessage}</p>
                  </div>
                )}
              </div>
            </section>
          )}

        </div>
      )}
    </div>
  );

  if (user) return <SidebarLayout>{content}</SidebarLayout>;
  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      <Navbar />
      {content}
    </div>
  );
}

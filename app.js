/* =======================================================
   TangleScan AI — Main Application Logic
   Uses Google Gemini Vision API for image analysis
   ======================================================= */

'use strict';

/* ── Particle Background ───────────────────────────── */
(function initParticles() {
  const container = document.getElementById('bgParticles');
  const COLORS = ['rgba(139,92,246,', 'rgba(6,182,212,', 'rgba(236,72,153,', 'rgba(99,102,241,'];
  for (let i = 0; i < 28; i++) {
    const p = document.createElement('div');
    p.className = 'particle';
    const size = Math.random() * 4 + 1;
    const color = COLORS[Math.floor(Math.random() * COLORS.length)];
    const opacity = (Math.random() * 0.4 + 0.1).toFixed(2);
    const drift = (Math.random() * 200 - 100).toFixed(0) + 'px';
    const duration = (Math.random() * 20 + 12).toFixed(1);
    const delay = (Math.random() * 20).toFixed(1);
    const left = (Math.random() * 100).toFixed(1);
    Object.assign(p.style, {
      width: size + 'px',
      height: size + 'px',
      left: left + '%',
      bottom: '-10px',
      background: color + opacity + ')',
      '--drift': drift,
      animationDuration: duration + 's',
      animationDelay: delay + 's',
    });
    container.appendChild(p);
  }
})();

/* ── DOM References ───────────────────────────────── */
const $ = id => document.getElementById(id);

const uploadSection   = $('uploadSection');
const previewSection  = $('previewSection');
const thinkingSection = $('thinkingSection');
const resultSection   = $('resultSection');
const errorSection    = $('errorSection');

const dropZone    = $('dropZone');
const fileInput   = $('fileInput');
const uploadBtn   = $('uploadBtn');
const cameraBtn   = $('cameraBtn');
const cameraView  = $('cameraView');
const cameraFeed  = $('cameraFeed');
const snapBtn     = $('snapBtn');
const closeCamera = $('closeCamera');

const previewImg  = $('previewImg');
const removeImg   = $('removeImg');
const analyzeBtn  = $('analyzeBtn');

const apiKeyInput = $('apiKeyInput');
const apiToggle   = $('apiToggle');
const eyeOpen     = $('eyeOpen');
const eyeClosed   = $('eyeClosed');

const tryAgainBtn   = $('tryAgainBtn');
const shareBtn      = $('shareBtn');
const errorRetryBtn = $('errorRetryBtn');
const errorText     = $('errorText');

/* ── State ────────────────────────────────────────── */
let imageBase64  = null;
let imageMime    = 'image/jpeg';
let cameraStream = null;

/* ── API Key toggle ───────────────────────────────── */
apiToggle.addEventListener('click', () => {
  if (apiKeyInput.type === 'password') {
    apiKeyInput.type = 'text';
    eyeOpen.style.display = 'none';
    eyeClosed.style.display = 'block';
  } else {
    apiKeyInput.type = 'password';
    eyeOpen.style.display = 'block';
    eyeClosed.style.display = 'none';
  }
});

/* ── File Upload ──────────────────────────────────── */
uploadBtn.addEventListener('click', () => fileInput.click());

fileInput.addEventListener('change', () => {
  if (fileInput.files?.[0]) handleFile(fileInput.files[0]);
});

dropZone.addEventListener('click', (e) => {
  if (!e.target.closest('.btn')) fileInput.click();
});

dropZone.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' || e.key === ' ') {
    e.preventDefault();
    fileInput.click();
  }
});

dropZone.addEventListener('dragover', (e) => {
  e.preventDefault();
  dropZone.classList.add('drag-over');
});

dropZone.addEventListener('dragleave', () => {
  dropZone.classList.remove('drag-over');
});

dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  dropZone.classList.remove('drag-over');
  const file = e.dataTransfer?.files?.[0];
  if (file && file.type.startsWith('image/')) handleFile(file);
});

function handleFile(file) {
  if (!file.type.startsWith('image/')) return showError('Please upload an image file (PNG, JPG, WEBP).', false);
  if (file.size > 10 * 1024 * 1024) return showError('Image too large. Max 10MB please.', false);
  imageMime = file.type;
  const reader = new FileReader();
  reader.onload = (ev) => {
    const dataUrl = ev.target.result;
    imageBase64 = dataUrl.split(',')[1];
    showPreview(dataUrl);
  };
  reader.readAsDataURL(file);
}

/* ── Camera ───────────────────────────────────────── */
cameraBtn.addEventListener('click', () => openCamera());

async function openCamera() {
  try {
    cameraStream = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: 'environment', width: { ideal: 1280 }, height: { ideal: 720 } }
    });
    cameraFeed.srcObject = cameraStream;
    cameraView.style.display = 'block';
    uploadBtn.style.display  = 'none';
    cameraBtn.style.display  = 'none';
  } catch (err) {
    showError('Camera access denied. Please allow camera permission or upload a photo.', false);
  }
}

snapBtn.addEventListener('click', () => {
  const canvas = document.createElement('canvas');
  canvas.width  = cameraFeed.videoWidth  || 1280;
  canvas.height = cameraFeed.videoHeight || 720;
  canvas.getContext('2d').drawImage(cameraFeed, 0, 0);
  canvas.toBlob((blob) => {
    stopCamera();
    handleFile(blob instanceof File ? blob : new File([blob], 'capture.jpg', { type: 'image/jpeg' }));
  }, 'image/jpeg', 0.92);
});

closeCamera.addEventListener('click', () => {
  stopCamera();
  uploadBtn.style.display = '';
  cameraBtn.style.display = '';
});

function stopCamera() {
  cameraStream?.getTracks().forEach(t => t.stop());
  cameraStream = null;
  cameraView.style.display = 'none';
}

/* ── Show / Hide Sections ─────────────────────────── */
function hideAll() {
  [uploadSection, previewSection, thinkingSection, resultSection, errorSection]
    .forEach(el => el.style.display = 'none');
}

function showPreview(dataUrl) {
  hideAll();
  previewImg.src = dataUrl;
  previewSection.style.display = 'block';
}

function showThinking() {
  hideAll();
  thinkingSection.style.display = 'block';
}

function showResult(data) {
  hideAll();
  resultSection.style.display = 'flex';
  renderResult(data);
}

function showError(msg, showRetry = true) {
  hideAll();
  if (!showRetry) {
    // minor error — just show inline
    uploadSection.style.display = 'block';
    alert('⚠️ ' + msg);
    return;
  }
  errorText.textContent = msg;
  errorSection.style.display = 'block';
}

removeImg.addEventListener('click', () => {
  imageBase64 = null;
  fileInput.value = '';
  hideAll();
  uploadSection.style.display = 'block';
  uploadBtn.style.display = '';
  cameraBtn.style.display = '';
});

tryAgainBtn.addEventListener('click', resetToUpload);
errorRetryBtn.addEventListener('click', resetToUpload);

function resetToUpload() {
  imageBase64 = null;
  fileInput.value = '';
  hideAll();
  uploadSection.style.display = 'block';
}

/* ── Analyze ─────────────────────────────────────── */
analyzeBtn.addEventListener('click', async () => {
  const key = apiKeyInput.value.trim();
  if (!key) {
    apiKeyInput.focus();
    apiKeyInput.style.borderColor = '#ef4444';
    setTimeout(() => { apiKeyInput.style.borderColor = ''; }, 1500);
    alert('Please enter your Gemini API key to continue.\nGet one free at: https://aistudio.google.com/app/apikey');
    return;
  }
  if (!imageBase64) return;
  showThinking();
  runThinkingAnimation();

  try {
    const result = await analyzeWithGemini(key, imageBase64, imageMime);
    showResult(result);
  } catch (err) {
    console.error(err);
    showError(err.message || 'Something went wrong. Check your API key and try again.');
  }
});

/* ── Thinking Animation (5 seconds) ─────────────── */
function runThinkingAnimation() {
  const steps = ['step1','step2','step3','step4'];
  const titles = [
    'Untangling the math...',
    'Computing knot entropy...',
    'Calculating chaos coefficient...',
    'Drafting the verdict...',
  ];
  const bar = $('progressBar');
  const titleEl = $('thinkingTitle');

  let current = 0;
  const interval = 100; // ms per step — near instant

  // activate first step
  $('step1').classList.add('step-active');
  titleEl.textContent = titles[0];
  bar.style.width = '5%';

  const ticker = setInterval(() => {
    // mark previous as done
    $('step' + (current + 1)).classList.remove('step-active');
    $('step' + (current + 1)).classList.add('step-done');
    current++;
    if (current >= steps.length) {
      clearInterval(ticker);
      bar.style.width = '100%';
      return;
    }
    $('step' + (current + 1)).classList.add('step-active');
    titleEl.textContent = titles[current];
    bar.style.width = ((current + 1) / steps.length * 100) + '%';
  }, interval);
}

/* ── Gemini API Call ─────────────────────────────── */
async function analyzeWithGemini(apiKey, base64Image, mimeType) {
  const PROMPT = `You are TangleScan AI, an extremely funny and brutally honest tangle complexity analyzer.

Analyze this image of headphones/earphones. If the image doesn't show headphones or cables, say so in a funny way.

Respond ONLY with a valid JSON object (no markdown, no code blocks, just raw JSON) with this exact structure:
{
  "isHeadphones": true,
  "score": <number 1-100>,
  "level": "<one of: Barely There | Getting Messy | Full Chaos | Diabolical Knot | Lovecraftian Horror>",
  "levelEmoji": "<appropriate emoji>",
  "roast": "<a hilarious one-liner roast about the tangle, like 'More tangled than your ex's feelings after you ghosted them.' Max 20 words>",
  "knotCount": "<estimated e.g. '3-5 major knots'>",
  "untangleTime": "<estimated time to untangle e.g. '2-3 minutes'>",
  "tangleType": "<creative name for the pattern e.g. 'The Infinite Doom Loop'>",
  "cableHealth": "<observation about cable condition e.g. 'Suspiciously intact'>",
  "advice": "<a sarcastic but useful tip for next time, 1-2 sentences>",
  "funFact": "<a random made-up statistic about this specific tangle>"
}

Scoring guide:
1-20: Barely tangled, looks almost intentional
21-40: Moderate tangle, pocket physics at work  
41-60: Proper chaos, requires focus to untangle
61-80: Seriously cursed, may need scissors
81-100: An act of God, defies all known physics

Make the roast VERY funny and relatable. Reference relatable situations: exes, Monday mornings, WiFi passwords, IKEA instructions, tax forms, etc.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{
          parts: [
            { text: PROMPT },
            { inline_data: { mime_type: mimeType, data: base64Image } }
          ]
        }],
        generationConfig: {
          temperature: 1.0,
          topP: 0.95,
          maxOutputTokens: 1024,
        }
      })
    }
  );

  if (!response.ok) {
    const errData = await response.json().catch(() => ({}));
    const errMsg = errData?.error?.message || `HTTP ${response.status}`;
    if (response.status === 400) throw new Error(`Invalid API key or request: ${errMsg}`);
    if (response.status === 429) throw new Error('Rate limit hit. Wait a moment and try again.');
    throw new Error(`Gemini API error: ${errMsg}`);
  }

  const data = await response.json();
  const parts = data?.candidates?.[0]?.content?.parts ?? [];
  const text = parts
    .map(part => part?.text ?? '')
    .join('')
    .trim();

  if (!text) throw new Error('No response from Gemini. Please try again.');

  // Parse JSON from response
  let parsed;
  const rawCandidates = [
    text,
    text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim(),
  ];

  const extractJsonFromText = (input) => {
    const trimmed = input.trim();
    const firstBrace = trimmed.indexOf('{');
    const lastBrace = trimmed.lastIndexOf('}');

    if (firstBrace !== -1 && lastBrace > firstBrace) {
      return trimmed.slice(firstBrace, lastBrace + 1);
    }

    return trimmed;
  };

  for (const candidate of rawCandidates) {
    try {
      parsed = JSON.parse(candidate);
      break;
    } catch {
      try {
        parsed = JSON.parse(extractJsonFromText(candidate));
        break;
      } catch {
        parsed = null;
      }
    }
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error('Unexpected response format. Try again!');
  }

  if (!parsed.isHeadphones) {
    // Not headphones — use a funny default
    parsed = {
      isHeadphones: false,
      score: 0,
      level: "No Wires Found",
      levelEmoji: "🔍",
      roast: parsed.roast || "I see no headphones. Much like my ex, they've completely disappeared.",
      knotCount: "0 (zero wires detected)",
      untangleTime: "Irrelevant",
      tangleType: "The Empty Abyss",
      cableHealth: "Non-existent",
      advice: "Upload a pic of your actual headphones. I can't analyze imaginary cables. Yet.",
      funFact: "100% of non-headphone images analyzed today were uploaded by confused humans."
    };
  }

  return parsed;
}

/* ── Render Result ───────────────────────────────── */
function renderResult(data) {
  // Score counter animation
  const targetScore = Math.min(Math.max(parseInt(data.score) || 0, 0), 100);
  animateNumber($('scoreNumber'), 0, targetScore, 1500);

  // Meter fill (delayed slightly)
  setTimeout(() => {
    $('meterFill').style.width = targetScore + '%';
    $('meterGlow').style.width = targetScore + '%';
  }, 200);

  // Level badge
  $('levelEmoji').textContent = data.levelEmoji || '🎧';
  $('levelName').textContent  = data.level || 'Unknown';

  // Apply level color to badge
  const levelColors = {
    'Barely There':       'rgba(16,185,129,0.15)',
    'Getting Messy':      'rgba(245,158,11,0.12)',
    'Full Chaos':         'rgba(249,115,22,0.12)',
    'Diabolical Knot':    'rgba(239,68,68,0.12)',
    'Lovecraftian Horror':'rgba(139,92,246,0.15)',
  };
  const badge = $('levelBadge');
  badge.style.background = levelColors[data.level] || 'var(--surface)';

  // Roast
  $('roastText').textContent = data.roast || 'Your cables have achieved sentience.';

  // Analysis grid
  const grid = $('analysisGrid');
  grid.innerHTML = '';
  const items = [
    { icon: '🔗', label: 'Knot Count',      value: data.knotCount     || 'Countless' },
    { icon: '⏱️', label: 'Untangle Time',   value: data.untangleTime  || 'Forever' },
    { icon: '🌀', label: 'Tangle Type',     value: data.tangleType    || 'Unknown' },
    { icon: '🩺', label: 'Cable Health',    value: data.cableHealth   || 'Questionable' },
  ];
  items.forEach(({ icon, label, value }, i) => {
    const el = document.createElement('div');
    el.className = 'analysis-item fade-up';
    el.style.animationDelay = (i * 0.1) + 's';
    el.innerHTML = `
      <span class="analysis-item-icon">${icon}</span>
      <div class="analysis-item-label">${label}</div>
      <div class="analysis-item-value">${value}</div>
    `;
    grid.appendChild(el);
  });

  // Fun fact badge (add after grid)
  if (data.funFact) {
    const factEl = document.createElement('div');
    factEl.className = 'analysis-item fade-up';
    factEl.style.gridColumn = '1 / -1';
    factEl.style.animationDelay = '0.4s';
    factEl.innerHTML = `
      <span class="analysis-item-icon">📊</span>
      <div class="analysis-item-label">Fun Fact</div>
      <div class="analysis-item-value" style="font-size:0.82rem; line-height:1.5; font-style:italic;">${data.funFact}</div>
    `;
    grid.appendChild(factEl);
  }

  // Advice
  $('adviceText').textContent = data.advice || 'Buy wireless earbuds. Problem solved. You\'re welcome.';

  // Store for share
  window._lastResult = data;
}

/* ── Number Animation ─────────────────────────────── */
function animateNumber(el, from, to, duration) {
  const start = performance.now();
  function update(now) {
    const elapsed = now - start;
    const progress = Math.min(elapsed / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = Math.round(from + (to - from) * eased);
    if (progress < 1) requestAnimationFrame(update);
  }
  requestAnimationFrame(update);
}

/* ── Share ────────────────────────────────────────── */
shareBtn.addEventListener('click', async () => {
  const d = window._lastResult;
  if (!d) return;
  const text = `🎧 TangleScan AI Results:\n\nLevel: ${d.level} ${d.levelEmoji}\nScore: ${d.score}/100\n\n"${d.roast}"\n\nCheck yours at TangleScan AI!`;
  try {
    if (navigator.share) {
      await navigator.share({ title: 'My Headphone Tangle Score', text });
    } else {
      await navigator.clipboard.writeText(text);
      showToast('📋 Copied to clipboard!');
    }
  } catch {
    showToast('📋 Share not supported — try copying the page URL!');
  }
});

/* ── Toast ────────────────────────────────────────── */
function showToast(msg) {
  const existing = document.querySelector('.toast');
  existing?.remove();
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  document.body.appendChild(t);
  setTimeout(() => t.remove(), 3000);
}

/* ── Init ─────────────────────────────────────────── */
uploadSection.style.display = 'block';

// Load saved API key
const savedKey = localStorage.getItem('tangle_api_key');
if (savedKey) apiKeyInput.value = savedKey;

// Save API key on change
apiKeyInput.addEventListener('input', () => {
  if (apiKeyInput.value.length > 8) {
    localStorage.setItem('tangle_api_key', apiKeyInput.value);
  }
});

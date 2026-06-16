const $ = (id) => document.getElementById(id);
let resume = null;
let coverLetter = null;
let apiBase = 'https://jobtrackr-steel.vercel.app';
let detectedPlatform = 'other';

const ATS_PATTERNS = {
  linkedin:   /linkedin\.com/,
  indeed:     /indeed\.com/,
  workday:    /myworkdayjobs\.com|wd\d+\.myworkday/,
  greenhouse: /greenhouse\.io|boards\.greenhouse/,
  lever:      /lever\.co|jobs\.lever/,
  naukri:     /naukri\.com/,
};

async function load() {
  const stored = await chrome.storage.local.get(['apiBase']);
  if (stored.apiBase) {
    apiBase = stored.apiBase;
  }
  $('api-url').value = apiBase;

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = tab.url || '';
  $('current-url').textContent = url || '—';

  // Detect platform
  detectedPlatform = 'other';
  for (const [key, pattern] of Object.entries(ATS_PATTERNS)) {
    if (pattern.test(url)) { detectedPlatform = key; break; }
  }
  const platformLabels = { linkedin: 'LinkedIn Easy Apply', indeed: 'Indeed Apply', workday: 'Workday ATS', greenhouse: 'Greenhouse', lever: 'Lever', naukri: 'Naukri', other: 'Generic form' };
  $('platform-name').textContent = platformLabels[detectedPlatform] || 'Generic form';
  $('platform-name').classList.remove('muted');
  const chip = $('chip-' + detectedPlatform);
  if (chip) chip.classList.add('detected');

  // Load resume
  try {
    const r = await fetch(`${apiBase}/api/resume/master`);
    if (r.ok) {
      resume = await r.json();
      $('resume-name').textContent = `${resume.name}  ·  ${resume.email || ''}`;
      $('resume-name').classList.remove('muted');
    } else {
      $('resume-name').textContent = 'No resume — add one in JobTrackr';
    }
  } catch {
    $('resume-name').textContent = 'Cannot reach JobTrackr at ' + apiBase;
    return;
  }

  // Load cover letter for current job URL
  try {
    const jobRes = await fetch(`${apiBase}/api/jobs/match-url?url=${encodeURIComponent(url)}`);
    if (jobRes.ok) {
      const job = await jobRes.json();
      if (job.coverLetter) {
        coverLetter = job.coverLetter;
        $('cover-section').style.display = 'block';
        $('cover-preview').textContent = coverLetter;
        $('btn-copy-cover').style.display = 'block';
      }
    }
  } catch { /* no matching job is fine */ }

  if (resume) {
    $('btn-fill').disabled = false;
    await detectFields(tab);
  }
}

async function detectFields(tab) {
  try {
    const results = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        const inputs = document.querySelectorAll('input[type=text],input[type=email],input[type=tel],input[type=url],textarea,input[name],input[placeholder],input:not([type])');
        return inputs.length;
      },
    });
    const count = results?.[0]?.result ?? 0;
    if (count > 0) {
      $('fields-found').style.display = 'inline-flex';
      $('fields-count').textContent = `${count} form field${count !== 1 ? 's' : ''} detected`;
    }
  } catch { /* can't scan */ }
}

async function fillForm() {
  if (!resume) return;
  $('btn-fill').disabled = true;
  $('btn-fill').textContent = 'Filling…';
  showStatus('', '');

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: fillFields,
      args: [resume, coverLetter, detectedPlatform],
    });
    showStatus('✓ Fields filled! Review and submit manually.', 'ok');
  } catch (e) {
    showStatus('Could not fill: ' + e.message, 'err');
  }
  $('btn-fill').disabled = false;
  $('btn-fill').textContent = '⚡ Auto-fill form';
}

function fillFields(resume, coverLetter, platform) {
  function tryFill(el, value) {
    if (!value || !el || el.readOnly || el.disabled) return;
    // React/Vue/Angular compatible setter
    const proto = el.tagName === 'TEXTAREA' ? HTMLTextAreaElement.prototype : HTMLInputElement.prototype;
    const setter = Object.getOwnPropertyDescriptor(proto, 'value')?.set;
    if (setter) setter.call(el, value);
    else el.value = value;
    ['input', 'change', 'blur'].forEach((evt) => el.dispatchEvent(new Event(evt, { bubbles: true })));
  }

  function getAttr(el) {
    return [
      el.name, el.id, el.placeholder,
      el.getAttribute('aria-label'),
      el.getAttribute('data-automation'),
      el.getAttribute('data-testid'),
      el.closest('label')?.textContent,
      el.closest('[class*="field"]')?.querySelector('label')?.textContent,
    ].filter(Boolean).join(' ').toLowerCase();
  }

  const experience = (() => { try { return JSON.parse(resume.experience || '[]'); } catch { return []; } })();
  const skills = (() => { try { return JSON.parse(resume.skills || '[]'); } catch { return []; } })();
  const education = (() => { try { return JSON.parse(resume.education || '[]'); } catch { return []; } })();
  const latestJob = experience[0] || {};
  const latestEdu = education[0] || {};
  const nameParts = (resume.name || '').split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ');

  // Platform-specific selectors
  const platformSelectors = {
    linkedin: {
      firstName: '.jobs-easy-apply-form-section__firstname input, input[id*="firstName"], input[name*="firstName"]',
      lastName: '.jobs-easy-apply-form-section__lastname input, input[id*="lastName"], input[name*="lastName"]',
      email: 'input[id*="email"], input[name*="email"]',
      phone: 'input[id*="phoneNumber"], input[id*="phone"]',
    },
    naukri: {
      firstName: 'input[placeholder*="First"], input[id*="fName"]',
      lastName: 'input[placeholder*="Last"], input[id*="lName"]',
      email: 'input[type="email"], input[id*="email"]',
      phone: 'input[placeholder*="Mobile"], input[id*="mobile"]',
    },
  };

  // Try platform-specific fills first
  const pSel = platformSelectors[platform];
  if (pSel) {
    ['firstName', 'lastName', 'email', 'phone'].forEach((key) => {
      if (!pSel[key]) return;
      const el = document.querySelector(pSel[key]);
      if (el) {
        const val = { firstName, lastName, email: resume.email, phone: resume.phone }[key];
        tryFill(el, val);
      }
    });
  }

  // Generic fill for all inputs
  const fields = document.querySelectorAll(
    'input[type=text],input[type=email],input[type=tel],input[type=url],textarea,input:not([type])'
  );

  fields.forEach((el) => {
    if (el.value) return; // don't overwrite
    const attr = getAttr(el);

    if (/first.?name|fname|given.?name/.test(attr)) tryFill(el, firstName);
    else if (/last.?name|lname|surname|family.?name/.test(attr)) tryFill(el, lastName);
    else if (/^name$|full.?name|your.?name/.test(attr.trim()) && !/last|first|user|company/.test(attr)) tryFill(el, resume.name);
    else if (/e.?mail/.test(attr)) tryFill(el, resume.email);
    else if (/phone|mobile|tel|contact.?no/.test(attr)) tryFill(el, resume.phone);
    else if (/city|location|address|where.?are/.test(attr) && !/company/.test(attr)) tryFill(el, resume.location);
    else if (/current.?company|employer|company.?name|organization/.test(attr)) tryFill(el, latestJob.company);
    else if (/current.?title|job.?title|position|role|designation/.test(attr)) tryFill(el, latestJob.title);
    else if (/total.?exp|years.?of.?exp|experience.?year/.test(attr)) {
      const yoe = experience.length > 0 ? String(experience.length + 1) : '';
      tryFill(el, yoe);
    }
    else if (/summary|objective|about.?me|profile|headline/.test(attr)) tryFill(el, resume.summary);
    else if (/cover.?letter|covering.?letter|motivation/.test(attr) && coverLetter) tryFill(el, coverLetter);
    else if (/skill/.test(attr)) tryFill(el, Array.isArray(skills) ? skills.slice(0, 10).join(', ') : skills);
    else if (/university|college|school|institute/.test(attr)) tryFill(el, latestEdu.school || '');
    else if (/degree|qualification|study/.test(attr)) tryFill(el, latestEdu.degree || '');
    else if (/graduation.?year|pass.?out|batch/.test(attr)) tryFill(el, latestEdu.year || '');
  });
}

function showStatus(msg, type) {
  const el = $('status');
  el.textContent = msg;
  el.className = 'status ' + type;
  el.style.display = msg ? 'block' : 'none';
}

$('api-url').addEventListener('change', async (e) => {
  apiBase = e.target.value.replace(/\/$/, '');
  await chrome.storage.local.set({ apiBase });
  load();
});

$('btn-fill').addEventListener('click', fillForm);

$('btn-copy-cover').addEventListener('click', () => {
  if (coverLetter) {
    navigator.clipboard.writeText(coverLetter);
    $('btn-copy-cover').textContent = '✓ Copied!';
    setTimeout(() => { $('btn-copy-cover').textContent = '📋 Copy cover letter'; }, 1800);
  }
});

$('btn-open').addEventListener('click', () => {
  chrome.tabs.create({ url: apiBase });
});

load();

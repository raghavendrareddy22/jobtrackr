const $ = (id) => document.getElementById(id);
let resume = null;
let coverLetter = null;
let apiBase = 'http://localhost:3000';

async function load() {
  const stored = await chrome.storage.local.get(['apiBase']);
  if (stored.apiBase) {
    apiBase = stored.apiBase;
    $('api-url').value = apiBase;
  }

  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  $('current-url').textContent = tab.url || '—';

  try {
    const r = await fetch(`${apiBase}/api/resume/master`);
    if (r.ok) {
      resume = await r.json();
      $('resume-name').textContent = `${resume.name} · ${resume.email || ''}`;
      $('resume-name').classList.remove('muted');
    } else {
      $('resume-name').textContent = 'No master resume found — add one in JobTrackr.';
    }
  } catch {
    $('resume-name').textContent = 'Cannot reach JobTrackr at ' + apiBase;
    return;
  }

  try {
    const url = tab.url || '';
    const jobRes = await fetch(`${apiBase}/api/jobs/match-url?url=${encodeURIComponent(url)}`);
    if (jobRes.ok) {
      const job = await jobRes.json();
      if (job.coverLetter) {
        coverLetter = job.coverLetter;
        $('cover-section').style.display = 'block';
        $('cover-preview').textContent = coverLetter.slice(0, 120) + '…';
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
        const inputs = document.querySelectorAll('input[type=text],input[type=email],input[type=tel],textarea,input[name],input[placeholder]');
        return inputs.length;
      },
    });
    const count = results?.[0]?.result ?? 0;
    $('fields-found').textContent = count > 0 ? `${count} form field${count !== 1 ? 's' : ''} detected on this page` : 'No form fields detected on this page';
  } catch {
    $('fields-found').textContent = 'Cannot scan this page';
  }
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
      args: [resume, coverLetter],
    });
    showStatus('Fields filled! Review and submit manually.', 'ok');
  } catch (e) {
    showStatus('Could not fill: ' + e.message, 'err');
  }
  $('btn-fill').disabled = false;
  $('btn-fill').textContent = 'Fill form fields';
}

function fillFields(resume, coverLetter) {
  function val(el) { return (el.value || '').toLowerCase(); }

  function tryFill(el, value) {
    if (!value || el.value) return;
    const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set
      || Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
    if (nativeInputValueSetter) nativeInputValueSetter.call(el, value);
    el.dispatchEvent(new Event('input', { bubbles: true }));
    el.dispatchEvent(new Event('change', { bubbles: true }));
  }

  const fields = document.querySelectorAll('input[type=text],input[type=email],input[type=tel],input[type=url],textarea,input:not([type])');
  const experience = resume.experience ? JSON.parse(resume.experience) : [];
  const skills = resume.skills ? JSON.parse(resume.skills) : [];
  const education = resume.education ? JSON.parse(resume.education) : [];
  const latestJob = experience[0] || {};

  fields.forEach((el) => {
    const attr = [el.name, el.id, el.placeholder, el.getAttribute('aria-label'), el.closest('label')?.textContent]
      .filter(Boolean).join(' ').toLowerCase();

    if (/first.?name|fname|given/.test(attr)) {
      tryFill(el, (resume.name || '').split(' ')[0]);
    } else if (/last.?name|lname|surname|family/.test(attr)) {
      const parts = (resume.name || '').split(' ');
      tryFill(el, parts.slice(1).join(' '));
    } else if (/^name|full.?name/.test(attr) && !/last|first|user/.test(attr)) {
      tryFill(el, resume.name);
    } else if (/email/.test(attr)) {
      tryFill(el, resume.email);
    } else if (/phone|mobile|tel/.test(attr)) {
      tryFill(el, resume.phone);
    } else if (/city|location|address/.test(attr)) {
      tryFill(el, resume.location);
    } else if (/linkedin/.test(attr)) {
      /* skip — user should fill */
    } else if (/current.?company|employer|company/.test(attr)) {
      tryFill(el, latestJob.company);
    } else if (/current.?title|position|role|job.?title/.test(attr)) {
      tryFill(el, latestJob.title);
    } else if (/summary|objective|about|profile/.test(attr)) {
      tryFill(el, resume.summary);
    } else if (/cover.?letter|covering/.test(attr) && coverLetter) {
      tryFill(el, coverLetter);
    } else if (/skill/.test(attr)) {
      tryFill(el, Array.isArray(skills) ? skills.join(', ') : skills);
    } else if (/university|school|education|degree/.test(attr)) {
      const edu = education[0] || {};
      tryFill(el, edu.school || edu.degree || '');
    }
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
    $('btn-copy-cover').textContent = 'Copied ✓';
    setTimeout(() => { $('btn-copy-cover').textContent = 'Copy cover letter'; }, 1500);
  }
});

$('btn-open').addEventListener('click', () => {
  chrome.tabs.create({ url: apiBase });
});

load();

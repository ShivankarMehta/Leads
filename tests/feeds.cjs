const { readFileSync } = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = readFileSync('js/app.js', 'utf8');
const row = (company, title, link) => `<tr><td>${company}</td><td>${title}</td><td>India</td><td>${link}</td></tr>`;
const table = row('Acme', 'Software Engineer', '<a href="https://example.com/1">Apply</a>') + row('↳', 'Backend Engineer', '<a href="https://example.com/2">Apply</a>') + row('Closed', 'Software Engineer', '🔒');
const context = vm.createContext({
  detectRoles: () => ['swe'],
  isInternship: (s) => /intern/i.test(s),
  isSoftware: (s) => /engineer/i.test(s),
  freshFetch: async () => ({ ok: true, text: async () => `## 💻 Software Engineering New Grad Roles\n${table}\n## Other`, json: async () => [
    { id: '1', company_name: 'Acme', title: 'Software Engineer', locations: ['India'], url: 'https://example.com/1', active: true },
    { id: '2', company_name: 'Acme', title: 'Backend Engineer', locations: ['India'], url: 'https://example.com/2', active: true },
    { id: '3', company_name: 'Closed', title: 'Software Engineer', url: 'https://example.com/3', active: false },
  ] }),
});
const legacy = code.includes('function stripHtmlText(');
vm.runInContext(code.slice(0, code.indexOf('const PORTALS =')), context);
assert.equal(vm.runInContext('isFullyRemoteOpportunity({ location: "Tokyo", remote: true })', context), true);
assert.equal(vm.runInContext('isFullyRemoteOpportunity({ location: "Hybrid, Tokyo", remote: true })', context), false);
assert.equal(vm.runInContext('isFullyRemoteOpportunity({ location: "Work from home · India" })', context), true);
assert.equal(vm.runInContext('isFullyRemoteOpportunity({ location: "Tokyo, Japan" })', context), false);
const parser = legacy
  ? code.slice(code.indexOf('function stripHtmlText('), code.indexOf('async function loadAllJobs('))
  : code.slice(code.indexOf('function unixSecondsToIso('), code.indexOf('async function fetchSimplifyJobs(')) + code.slice(code.indexOf('async function fetchSimplifyJobs('), code.indexOf('async function fetchSuryaTracker('));
vm.runInContext(code.slice(code.indexOf('function normalizeJob('), code.indexOf('function getSelectedRoles(')) + parser, context);
(async () => {
  const jobs = await vm.runInContext('fetchSimplifyJobs("placement")', context);
  assert.equal(jobs.length, 2, 'closed rows excluded');
  assert.equal(jobs[1].company, 'Acme', 'continuation inherits company');
  assert.equal(jobs[0].opportunityType, 'placement');
  assert.equal(jobs[0].publishedAt, null, 'unknown date is not fabricated');
  assert.equal(jobs[0].url, 'https://example.com/1');
  console.log('Feed regression checks passed');
})().catch((error) => { console.error(error); process.exitCode = 1; });

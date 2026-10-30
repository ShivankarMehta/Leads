const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const code = fs.readFileSync('js/app.js', 'utf8');
const context = vm.createContext({
  detectRoles: () => ['swe'],
  isSoftware: (value) => /software|developer|engineer/i.test(value),
  isInternship: (value) => /intern|co[- ]?op|student/i.test(value),
  freshFetch: (url) => fetch(url, { signal: AbortSignal.timeout(30000) }),
});
vm.runInContext(code.slice(0, code.indexOf('const PORTALS =')) +
  code.slice(code.indexOf('function normalizeJob('), code.indexOf('function getSelectedRoles(')) +
  code.slice(code.indexOf('function unixSecondsToIso('), code.indexOf('async function loadAllJobs(')), context);
(async () => {
  for (const expression of ['fetchSimplifyJobs("internship")', 'fetchSimplifyJobs("placement")', 'fetchFresherFlowIndia()', 'fetchSuryaTracker()']) {
    const jobs = await vm.runInContext(expression, context);
    assert.ok(jobs.length > 0, expression);
    assert.ok(jobs.every(job => job.title && job.company && /^https?:\/\//.test(job.url)));
    console.log(`${expression}: ${jobs.length} opportunities, first: ${jobs[0].company} — ${jobs[0].title}`);
  }
})().catch(error => { console.error(error); process.exitCode = 1; });

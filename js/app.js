/**
 * Leads — live internship aggregator for 2027 batch software roles.
 * Fetches public APIs in the browser (static site, no backend).
 */

const INTERN_RE =
  /\b(intern|internship|trainee|apprentice|co[- ]?op|working student|student|campus|graduate|grad(uate)? program|new grad)\b/i;

const SOFTWARE_RE =
  /\b(software|sde|swe|developer|engineer|frontend|front[- ]?end|backend|back[- ]?end|full[- ]?stack|fullstack|mobile|android|ios|web|devops|sre|data engineer|ml engineer|machine learning|ai engineer|cloud|platform|qa|test engineer|security engineer|product engineer|systems?)\b/i;

const INDIA_RE =
  /\b(india|indian|bengaluru|bangalore|hyderabad|pune|chennai|mumbai|delhi|noida|gurgaon|gurugram|kolkata|ahmedabad|jaipur|kochi|coimbatore|remote.?india)\b/i;

const JAPAN_RE =
  /\b(japan|tokyo|osaka|yokohama|nagoya|kyoto|fukuoka|sapporo|remote.?japan)\b/i;

const EUROPE_RE =
  /\b(europe|eu\b|united kingdom|uk\b|england|london|scotland|ireland|dublin|germany|berlin|munich|hamburg|frankfurt|france|paris|netherlands|amsterdam|spain|madrid|barcelona|italy|milan|rome|sweden|stockholm|norway|oslo|denmark|copenhagen|finland|helsinki|switzerland|zurich|geneva|austria|vienna|belgium|brussels|portugal|lisbon|poland|warsaw|czech|prague|romania|hungary|greece|estonia|lithuania|latvia)\b/i;

/* Note: US state "IN" (Indiana) is omitted — it collides with India country code "IN". */
const USA_RE =
  /\b(united states|\busa\b|\bu\.?s\.?\b|u\.s\.a\.?|america|california|new york|nyc|san francisco|bay area|seattle|austin|boston|chicago|los angeles|san jose|palo alto|mountain view|sunnyvale|redmond|bellevue|denver|atlanta|dallas|miami|houston|phoenix|portland|pittsburgh|philadelphia|washington,? ?d\.?c\.?|menlo park|cupertino|irvine|hawthorne|remote.?us)\b|,\s*(AL|AK|AZ|AR|CA|CO|CT|DE|FL|GA|HI|ID|IL|IA|KS|KY|LA|ME|MD|MA|MI|MN|MS|MO|MT|NE|NV|NH|NJ|NM|NY|NC|ND|OH|OK|OR|PA|RI|SC|SD|TN|TX|UT|VT|VA|WA|WV|WI|WY)\b/i;

const WORLDWIDE_RE = /\b(worldwide|anywhere|global)\b/i;
const REMOTE_RE = /\bremote\b/i;

function geoRegionsIn(locationText) {
  const loc = locationText || "";
  const regions = new Set();
  if (INDIA_RE.test(loc)) regions.add("india");
  if (JAPAN_RE.test(loc)) regions.add("japan");
  if (USA_RE.test(loc)) regions.add("usa");
  if (EUROPE_RE.test(loc)) regions.add("europe");
  return regions;
}

function regionOf(job) {
  const loc = job.location || "";
  const geos = geoRegionsIn(loc);

  // "India · USA · Europe" style labels are multi-region, not India-only
  if (geos.size > 1 || (geos.size >= 1 && WORLDWIDE_RE.test(loc))) {
    return "multi";
  }
  if (geos.has("india")) return "india";
  if (geos.has("japan")) return "japan";
  if (geos.has("usa")) return "usa";
  if (geos.has("europe")) return "europe";
  if (job.remote || REMOTE_RE.test(loc) || WORLDWIDE_RE.test(loc)) return "remote";
  return "other";
}

/** Strict India-only: Indian city/country, optionally Remote — never USA/Japan/Europe/Worldwide. */
function isIndiaOnly(job) {
  const loc = job.location || "";
  if (!INDIA_RE.test(loc)) return false;

  const geos = geoRegionsIn(loc);
  if (geos.has("japan") || geos.has("usa") || geos.has("europe")) return false;
  if (WORLDWIDE_RE.test(loc)) return false;

  // Multi-segment labels must be only India / Remote
  if (/[·|/]/.test(loc)) {
    const parts = loc.split(/[·|/]/).map((p) => p.trim()).filter(Boolean);
    return parts.every(
      (part) => INDIA_RE.test(part) || REMOTE_RE.test(part)
    );
  }

  return geos.has("india") && geos.size === 1;
}

function matchesFocusRegions(job) {
  const region = regionOf(job);
  return (
    region === "india" ||
    region === "japan" ||
    region === "europe" ||
    region === "usa" ||
    region === "remote" ||
    region === "multi"
  );
}

const REGION_PRIORITY = {
  india: 0,
  japan: 1,
  europe: 2,
  usa: 3,
  multi: 4,
  remote: 5,
  other: 6,
};

/** Regional internship portals — bookmark boards (Career portals section). */
const PORTALS = [
  // Global
  { region: "Global", name: "LinkedIn Jobs", desc: "Software intern · Entry level + recruiter contact", location: "Worldwide", url: "https://www.linkedin.com/jobs/search/?keywords=software%20intern&f_E=1&f_JT=I" },
  { region: "Global", name: "Indeed", desc: "Broad software engineer internship listings", location: "Worldwide", url: "https://www.indeed.com/jobs?q=software+engineer+intern&l=" },
  { region: "Global", name: "Glassdoor", desc: "Internships plus company reviews", location: "Worldwide", url: "https://www.glassdoor.com/Job/software-engineering-intern-jobs-SRCH_KO0,27.htm" },
  { region: "Global", name: "Wellfound", desc: "Startup software engineer internships", location: "Worldwide", url: "https://wellfound.com/role/r/software-engineer-intern" },
  { region: "Global", name: "Y Combinator", desc: "Work at a Startup — eng internships", location: "Worldwide", url: "https://www.workatastartup.com/jobs?role=eng&internship=true" },
  { region: "Global", name: "AIESEC", desc: "International exchange internships", location: "Worldwide", url: "https://aiesec.org/search?programmes=7" },
  { region: "Global", name: "IAESTE", desc: "Technical exchange internships", location: "Worldwide", url: "https://iaeste.org/" },
  { region: "Global", name: "UN Careers", desc: "United Nations internship programmes", location: "Worldwide", url: "https://careers.un.org/lbw/home.aspx?viewtype=IN" },
  { region: "Global", name: "CERN", desc: "Technical student / internship programmes", location: "Europe", url: "https://careers.cern/join-us/students" },
  { region: "Global", name: "ESA", desc: "European Space Agency student opportunities", location: "Europe", url: "https://www.esa.int/About_Us/Careers_at_ESA/Student_Opportunities" },
  { region: "Global", name: "Google Careers", desc: "Software Engineering Intern", location: "Worldwide", url: "https://www.google.com/about/careers/applications/jobs/results/?q=Software%20Engineering%20Intern" },
  { region: "Global", name: "Microsoft Careers", desc: "University software internships", location: "Worldwide", url: "https://jobs.careers.microsoft.com/global/en/search?q=intern%20software&l=en_us&pg=1&pgSz=20&o=Relevance&flt=true" },
  { region: "Global", name: "Amazon Jobs", desc: "SDE Intern / university hiring", location: "Worldwide", url: "https://www.amazon.jobs/en/search?base_query=software+development+intern&loc_query=" },
  { region: "Global", name: "Meta Careers", desc: "University software intern roles", location: "Worldwide", url: "https://www.metacareers.com/jobs?q=software%20intern" },
  { region: "Global", name: "Apple Jobs", desc: "Software Engineering Internships", location: "Worldwide", url: "https://jobs.apple.com/en-us/search?search=intern%20software&sort=relevance" },
  { region: "Global", name: "Adobe Careers", desc: "University & internship programs", location: "Worldwide", url: "https://careers.adobe.com/us/en/search-results?keywords=intern%20software" },
  { region: "Global", name: "Uber Careers", desc: "Software Engineer Intern", location: "Worldwide", url: "https://www.uber.com/us/en/careers/list/?query=intern%20software" },
  { region: "Global", name: "Atlassian Careers", desc: "Graduates & software interns", location: "Worldwide", url: "https://www.atlassian.com/company/careers/all-jobs?team=&location=&search=intern" },
  { region: "Global", name: "Salesforce", desc: "Futureforce software internships", location: "Worldwide", url: "https://careers.salesforce.com/en/jobs/?search=intern+software&pagesize=20#results" },
  { region: "Global", name: "Oracle University", desc: "Software intern & early career", location: "Worldwide", url: "https://careers.oracle.com/jobs/?keywords=software%20intern" },
  { region: "Global", name: "Goldman Sachs", desc: "Engineering internships", location: "Worldwide", url: "https://www.goldmansachs.com/careers/students/programs/" },
  { region: "Global", name: "JPMorgan Chase", desc: "Software Engineer Intern Program", location: "Worldwide", url: "https://careers.jpmorgan.com/us/en/students/programs" },
  { region: "Global", name: "Remotive", desc: "Remote software internships", location: "Remote", url: "https://remotive.com/?query=intern%20software" },
  { region: "Global", name: "We Work Remotely", desc: "Remote programming internships", location: "Remote", url: "https://weworkremotely.com/remote-jobs/search?term=intern+software" },
  // India
  { region: "India", name: "Internshala", desc: "Biggest dedicated internship platform — CS / software", location: "India", url: "https://internshala.com/internships/computer-science-internship/" },
  { region: "India", name: "Unstop", desc: "Off-campus software internships + competitions", location: "India", url: "https://unstop.com/internships?opportunity=Internships&job_type=Internship&category=Engineering&sub_category=Software%20Development" },
  { region: "India", name: "Naukri", desc: "Internship and fresher sections", location: "India", url: "https://www.naukri.com/software-internship-jobs" },
  { region: "India", name: "Foundit", desc: "Software development internships", location: "India", url: "https://www.foundit.in/search/software-internship-jobs" },
  { region: "India", name: "Apna", desc: "Entry-level and local roles", location: "India", url: "https://apna.co/jobs?search=software%20intern" },
  { region: "India", name: "Freshersworld", desc: "Fresher jobs and internships", location: "India", url: "https://www.freshersworld.com/jobs/internship/software" },
  { region: "India", name: "Cutshort", desc: "Tech and startup software intern roles", location: "India", url: "https://cutshort.io/profile/candidate-find-jobs?search=software%20intern" },
  { region: "India", name: "Hirist", desc: "Tech internships (India)", location: "India", url: "https://www.hirist.tech/search/?keyword=intern&loc=india" },
  { region: "India", name: "PM Internship Scheme", desc: "Government scheme with corporate placements", location: "India", url: "https://pminternship.mca.gov.in/" },
  { region: "India", name: "National Career Service", desc: "Government job portal", location: "India", url: "https://www.ncs.gov.in/" },
  // Japan
  { region: "Japan", name: "Wantedly", desc: "Startup-friendly, culture-based matching", location: "Japan", url: "https://www.wantedly.com/projects?type=internship&occupation_types%5B%5D=jp_engineer" },
  { region: "Japan", name: "Mynavi", desc: "Main shukatsu / student internship platform", location: "Japan", url: "https://job.mynavi.jp/26/pc/" },
  { region: "Japan", name: "Rikunabi", desc: "Student internships & shukatsu", location: "Japan", url: "https://job.rikunabi.com/" },
  { region: "Japan", name: "OfferBox", desc: "Companies approach students directly", location: "Japan", url: "https://offerbox.jp/" },
  { region: "Japan", name: "ONE CAREER", desc: "Student career & internship listings", location: "Japan", url: "https://www.onecareer.jp/" },
  { region: "Japan", name: "Gaishi Shukatsu", desc: "Foreign-affiliated firms (finance, consulting, tech)", location: "Japan", url: "https://gaishishukatsu.com/" },
  { region: "Japan", name: "Green", desc: "IT and tech roles", location: "Japan", url: "https://www.green-japan.com/" },
  { region: "Japan", name: "GaijinPot Jobs", desc: "English-friendly options for non-Japanese speakers", location: "Japan", url: "https://jobs.gaijinpot.com/job/index/lang/en?job_type=internship" },
  { region: "Japan", name: "Daijob", desc: "Bilingual tech internships", location: "Japan", url: "https://www.daijob.com/en/jobs/search?job_search%5Bkeyword%5D=intern%20software" },
  { region: "Japan", name: "CareerCross", desc: "Bilingual career board", location: "Japan", url: "https://www.careercross.com/en/job-search/?keyword=intern" },
  { region: "Japan", name: "TokyoDev", desc: "English-friendly tech internships", location: "Japan", url: "https://www.tokyodev.com/jobs?employment_type=internship" },
  { region: "Japan", name: "Japan Dev", desc: "English-friendly developer roles", location: "Japan", url: "https://japan-dev.com/jobs?internship=true" },
  // Europe
  { region: "Europe", name: "EURES", desc: "EU job mobility portal", location: "Europe", url: "https://europa.eu/eures/portal/jv-se/home" },
  { region: "Europe", name: "EU Careers / EPSO", desc: "European Commission Blue Book traineeships", location: "Europe", url: "https://traineeships.ec.europa.eu/" },
  { region: "Europe", name: "European Parliament", desc: "Parliament traineeships", location: "Europe", url: "https://www.europarl.europa.eu/at-your-service/en/work-with-us/traineeships" },
  { region: "Europe", name: "Erasmus+", desc: "University traineeships abroad", location: "Europe", url: "https://erasmus-plus.ec.europa.eu/opportunities/opportunities-for-individuals/students/traineeships-abroad-for-students" },
  { region: "Europe", name: "Welcome to the Jungle", desc: "Europe software internships", location: "Europe", url: "https://www.welcometothejungle.com/en/jobs?query=software%20intern&refinementList%5Bcontract_type_names.en%5D%5B%5D=Internship" },
  { region: "Europe", name: "Euractiv Jobs", desc: "EU / Brussels career board", location: "Europe", url: "https://jobs.euractiv.com/" },
  { region: "Europe", name: "Prospects", desc: "UK graduate & internship board", location: "UK", url: "https://www.prospects.ac.uk/graduate-jobs" },
  { region: "Europe", name: "TARGETjobs", desc: "UK internships & graduate schemes", location: "UK", url: "https://targetjobs.co.uk/internships" },
  { region: "Europe", name: "Milkround", desc: "UK student & graduate jobs", location: "UK", url: "https://www.milkround.com/" },
  { region: "Europe", name: "RateMyPlacement", desc: "UK placement & internship reviews", location: "UK", url: "https://www.ratemyplacement.co.uk/" },
  { region: "Europe", name: "Bright Network", desc: "UK early-career internships", location: "UK", url: "https://www.brightnetwork.co.uk/internships/" },
  { region: "Europe", name: "Gradcracker", desc: "UK STEM internships", location: "UK", url: "https://www.gradcracker.com/search/engineering-computing-technology/internships" },
  { region: "Europe", name: "StepStone", desc: "Germany / DACH internships", location: "Germany", url: "https://www.stepstone.de/jobs/praktikum-software" },
  { region: "Europe", name: "Xing", desc: "DACH professional network jobs", location: "Germany", url: "https://www.xing.com/jobs/search?keywords=praktikum%20software" },
  { region: "Europe", name: "Absolventa", desc: "German student & graduate roles", location: "Germany", url: "https://www.absolventa.de/jobs/praktikum/it" },
  { region: "Europe", name: "Praktikum.info", desc: "German internship board", location: "Germany", url: "https://www.praktikum.info/" },
  { region: "Europe", name: "Jobs.ch", desc: "Switzerland internships", location: "Switzerland", url: "https://www.jobs.ch/en/vacancies/?term=internship%20software" },
  { region: "Europe", name: "SwissDevJobs", desc: "Switzerland developer jobs", location: "Switzerland", url: "https://swissdevjobs.ch/" },
  { region: "Europe", name: "JobTeaser", desc: "France / Europe student internships", location: "France", url: "https://www.jobteaser.com/" },
  { region: "Europe", name: "L'Etudiant", desc: "French student job board", location: "France", url: "https://jobs.letudiant.fr/stages" },
  { region: "Europe", name: "HelloWork", desc: "French jobs & stages", location: "France", url: "https://www.hellowork.com/fr-fr/emploi/recherche.html?k=stage+informatique" },
  { region: "Europe", name: "InfoJobs", desc: "Spain internship listings", location: "Spain", url: "https://www.infojobs.net/" },
  { region: "Europe", name: "Jobindex", desc: "Denmark student jobs", location: "Denmark", url: "https://www.jobindex.dk/" },
  { region: "Europe", name: "Studentjob", desc: "Netherlands & multi-country student jobs", location: "Netherlands", url: "https://www.studentjob.nl/" },
  { region: "Europe", name: "Berlin Startup Jobs", desc: "Berlin startup openings", location: "Germany", url: "https://berlinstartupjobs.com/" },
  { region: "Europe", name: "EU-Startups Jobs", desc: "European startup job board", location: "Europe", url: "https://www.eu-startups.com/jobs/" },
  { region: "Europe", name: "Otta", desc: "Startup software intern roles", location: "Europe · USA", url: "https://app.otta.com/jobs?keywords=intern%20software" },
  // USA & Canada
  { region: "USA & Canada", name: "Handshake", desc: "College recruiting (via your university)", location: "USA", url: "https://joinhandshake.com/explore/?query=software%20intern" },
  { region: "USA & Canada", name: "RippleMatch", desc: "Early-career matching", location: "USA", url: "https://ripplematch.com/" },
  { region: "USA & Canada", name: "WayUp", desc: "Internships & entry-level jobs", location: "USA", url: "https://www.wayup.com/s/internships/software/" },
  { region: "USA & Canada", name: "Simplify Jobs", desc: "Summer 2027 tech internships tracker", location: "USA", url: "https://simplify.jobs/l/Top-Summer-Internships-2027" },
  { region: "USA & Canada", name: "SimplifyJobs GitHub", desc: "Community Summer 2027 internship list", location: "USA", url: "https://github.com/SimplifyJobs/Summer2027-Internships" },
  { region: "USA & Canada", name: "Levels.fyi", desc: "Intern compensation & openings", location: "USA", url: "https://www.levels.fyi/internships/?track=Software%20Engineer" },
  { region: "USA & Canada", name: "ZipRecruiter", desc: "Software intern job search", location: "USA", url: "https://www.ziprecruiter.com/Jobs/Software-Engineer-Intern" },
  { region: "USA & Canada", name: "College Recruiter", desc: "Internships & entry-level", location: "USA", url: "https://www.collegerecruiter.com/" },
  { region: "USA & Canada", name: "Idealist", desc: "Nonprofit & social impact internships", location: "USA", url: "https://www.idealist.org/en/internships" },
  { region: "USA & Canada", name: "USAJOBS Pathways", desc: "US federal internships", location: "USA", url: "https://www.usajobs.gov/Search/Results?hp=student" },
  { region: "USA & Canada", name: "Job Bank Canada", desc: "Canadian government listings", location: "Canada", url: "https://www.jobbank.gc.ca/" },
  { region: "USA & Canada", name: "FSWEP", desc: "Federal Student Work Experience (Canada)", location: "Canada", url: "https://www.canada.ca/en/public-service-commission/jobs/services/recruitment/students/federal-student-work-program.html" },
  // Latin America
  { region: "Latin America", name: "Computrabajo", desc: "LatAm job board", location: "Latin America", url: "https://www.computrabajo.com/" },
  { region: "Latin America", name: "OCC Mundial", desc: "Mexico jobs & prácticas", location: "Mexico", url: "https://www.occ.com.mx/" },
  { region: "Latin America", name: "Gupy", desc: "Brazil early-career & estágio", location: "Brazil", url: "https://www.gupy.io/" },
  { region: "Latin America", name: "Vagas.com", desc: "Brazil job board", location: "Brazil", url: "https://www.vagas.com.br/" },
  { region: "Latin America", name: "CIEE", desc: "Brazil student internship program", location: "Brazil", url: "https://portal.ciee.org.br/" },
];

const APPLIED_STORAGE_KEY = "leads-applied-jobs-v1";

function loadAppliedIds() {
  try {
    const raw = localStorage.getItem(APPLIED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

const state = {
  jobs: [],
  sourcesOk: 0,
  sourcesTried: 0,
  lastFetch: null,
  appliedIds: loadAppliedIds(),
};

function saveAppliedIds() {
  localStorage.setItem(
    APPLIED_STORAGE_KEY,
    JSON.stringify([...state.appliedIds])
  );
}

function isApplied(jobId) {
  return state.appliedIds.has(jobId);
}

function setApplied(jobId, applied) {
  if (applied) state.appliedIds.add(jobId);
  else state.appliedIds.delete(jobId);
  saveAppliedIds();
}

const els = {
  jobList: document.getElementById("jobList"),
  loading: document.getElementById("loadingState"),
  error: document.getElementById("errorState"),
  errorMessage: document.getElementById("errorMessage"),
  empty: document.getElementById("emptyState"),
  resultCount: document.getElementById("resultCount"),
  sourceCount: document.getElementById("sourceCount"),
  lastUpdated: document.getElementById("lastUpdated"),
  searchInput: document.getElementById("searchInput"),
  locationFilter: document.getElementById("locationFilter"),
  sortFilter: document.getElementById("sortFilter"),
  hideAppliedFilter: document.getElementById("hideAppliedFilter"),
  refreshBtn: document.getElementById("refreshBtn"),
  heroRefreshBtn: document.getElementById("heroRefreshBtn"),
  listRefreshBtn: document.getElementById("listRefreshBtn"),
  retryBtn: document.getElementById("retryBtn"),
  portalList: document.getElementById("portalList"),
};

function refreshButtons() {
  return [els.refreshBtn, els.heroRefreshBtn, els.listRefreshBtn].filter(Boolean);
}

function isInternship(text) {
  return INTERN_RE.test(text);
}

function isSoftware(text) {
  return SOFTWARE_RE.test(text);
}

function matchesRole(title, tags = [], description = "") {
  const blob = [title, ...(tags || []), description.slice(0, 400)].join(" ");
  return isInternship(blob) && isSoftware(blob);
}

/** Role taxonomy for the multiselect filter (SDE / SWE / DevOps on by default). */
const ROLE_MATCHERS = [
  {
    id: "sde",
    test: (t) =>
      /\b(sde|software development engineer|software developer)\b/i.test(t),
  },
  {
    id: "swe",
    test: (t) =>
      /\b(swe|software engineer|software engineering)\b/i.test(t),
  },
  {
    id: "devops",
    test: (t) =>
      /\b(devops|dev.?ops|sre|site reliability|platform engineer|infrastructure engineer|cloud engineer|reliability engineer)\b/i.test(
        t
      ),
  },
  {
    id: "frontend",
    test: (t) =>
      /\b(frontend|front[- ]?end|ui engineer|react engineer|web ui)\b/i.test(t),
  },
  {
    id: "backend",
    test: (t) => /\b(backend|back[- ]?end|server engineer|api engineer)\b/i.test(t),
  },
  {
    id: "fullstack",
    test: (t) => /\b(full[- ]?stack|fullstack)\b/i.test(t),
  },
  {
    id: "mobile",
    test: (t) =>
      /\b(mobile|android|ios|react native|flutter)\b/i.test(t),
  },
  {
    id: "data",
    test: (t) =>
      /\b(data engineer|data science|data scientist|analytics engineer|data analytics)\b/i.test(
        t
      ),
  },
  {
    id: "ml",
    test: (t) =>
      /\b(machine learning|ml engineer|ai engineer|artificial intelligence|deep learning|llm)\b/i.test(
        t
      ),
  },
  {
    id: "qa",
    test: (t) =>
      /\b(qa|quality assurance|test engineer|sdet|automation test)\b/i.test(t),
  },
  {
    id: "security",
    test: (t) =>
      /\b(security engineer|cybersecurity|infosec|appsec)\b/i.test(t),
  },
];

function detectRoles(title, tags = []) {
  const text = `${title} ${(tags || []).join(" ")}`;
  const roles = ROLE_MATCHERS.filter((r) => r.test(text)).map((r) => r.id);

  // Generic software internships map to SDE + SWE so they appear in the default view
  if (
    !roles.length &&
    /\b(software|developer|engineer)\b/i.test(text)
  ) {
    return ["sde", "swe"];
  }

  if (!roles.length) return ["other"];

  // Titles like "Software Engineer Intern" already match swe; also treat as SDE-family
  if (roles.includes("swe") && !roles.includes("sde") && !roles.includes("frontend") && !roles.includes("backend") && !roles.includes("mobile") && !roles.includes("ml") && !roles.includes("data") && !roles.includes("devops") && !roles.includes("qa") && !roles.includes("security")) {
    roles.push("sde");
  }

  return roles;
}

function normalizeJob(raw) {
  const title = raw.title.trim();
  const tags = (raw.tags || []).slice(0, 5);
  return {
    id: raw.id,
    title,
    company: raw.company.trim(),
    location: raw.location || "Not specified",
    url: raw.url,
    tags,
    roles: detectRoles(title, tags),
    source: raw.source,
    publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : null,
    remote: Boolean(raw.remote),
  };
}

function getSelectedRoles() {
  return Array.from(
    document.querySelectorAll('#roleFilters input[name="role"]:checked')
  ).map((el) => el.value);
}

/** Always bypass browser cache so Refresh pulls the newest openings. */
async function freshFetch(url, options = {}) {
  let requestUrl = url;
  try {
    const u = new URL(url);
    u.searchParams.set("_ts", String(Date.now()));
    requestUrl = u.toString();
  } catch {
    /* keep original */
  }
  return fetch(requestUrl, { ...options, cache: "no-store" });
}

function dedupeJobs(jobs) {
  const seen = new Set();
  return jobs.filter((job) => {
    const key = `${job.company.toLowerCase()}|${job.title.toLowerCase()}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

async function fetchRemotive() {
  const urls = [
    "https://remotive.com/api/remote-jobs?search=internship",
    "https://remotive.com/api/remote-jobs?search=intern",
    "https://remotive.com/api/remote-jobs?category=software-dev",
  ];

  const collected = [];
  let anyOk = false;

  for (const url of urls) {
    try {
      const res = await freshFetch(url);
      if (!res.ok) continue;
      const data = await res.json();
      anyOk = true;
      const jobs = (data.jobs || [])
        .filter((j) => {
          const extra = `${j.category || ""} ${j.job_type || ""} ${(j.tags || []).join(" ")} ${j.description || ""}`.slice(0, 800);
          return (
            matchesRole(j.title, j.tags, extra) ||
            (isInternship(`${j.title} ${j.job_type} ${extra}`) &&
              isSoftware(`${j.title} ${j.category} ${extra}`))
          );
        })
        .map((j) =>
          normalizeJob({
            id: `remotive-${j.id}`,
            title: j.title,
            company: j.company_name,
            location: j.candidate_required_location || "Remote",
            url: j.url,
            tags: j.tags || [],
            source: "Remotive",
            publishedAt: j.publication_date,
            remote: true,
          })
        );
      collected.push(...jobs);
    } catch {
      /* try next */
    }
  }

  if (!anyOk) throw new Error("Remotive unavailable");
  return collected;
}

async function fetchArbeitnow() {
  const res = await freshFetch("https://www.arbeitnow.com/api/job-board-api");
  if (!res.ok) throw new Error("Arbeitnow unavailable");
  const data = await res.json();

  return (data.data || [])
    .filter((j) => {
      const types = (j.job_types || []).join(" ");
      const tags = j.tags || [];
      return matchesRole(j.title, [...tags, types], types);
    })
    .map((j) =>
      normalizeJob({
        id: `arbeitnow-${j.slug}`,
        title: j.title,
        company: j.company_name,
        location: j.remote ? `Remote · ${j.location || ""}`.trim() : j.location || "Europe",
        url: j.url,
        tags: j.tags || [],
        source: "Arbeitnow",
        publishedAt: j.created_at ? new Date(j.created_at * 1000).toISOString() : null,
        remote: Boolean(j.remote),
      })
    );
}

/** Public Greenhouse boards that often list university/intern SWE roles */
async function fetchGreenhouseBoards() {
  const boards = [
    { token: "stripe", name: "Stripe" },
    { token: "cloudflare", name: "Cloudflare" },
    { token: "figma", name: "Figma" },
    { token: "datadog", name: "Datadog" },
    { token: "lyft", name: "Lyft" },
    { token: "pinterest", name: "Pinterest" },
    { token: "scaleai", name: "Scale AI" },
    { token: "coinbase", name: "Coinbase" },
    { token: "affirm", name: "Affirm" },
    { token: "mongodb", name: "MongoDB" },
    { token: "roblox", name: "Roblox" },
    { token: "duolingo", name: "Duolingo" },
    { token: "samsara", name: "Samsara" },
    { token: "dropbox", name: "Dropbox" },
    { token: "twilio", name: "Twilio" },
    { token: "asana", name: "Asana" },
    { token: "discord", name: "Discord" },
    { token: "plaid", name: "Plaid" },
    { token: "brex", name: "Brex" },
    { token: "ramp", name: "Ramp" },
    { token: "airbnb", name: "Airbnb" },
    { token: "doordash", name: "DoorDash" },
    { token: "robinhood", name: "Robinhood" },
    { token: "reddit", name: "Reddit" },
    { token: "block", name: "Block" },
    { token: "hubspot", name: "HubSpot" },
    { token: "elastic", name: "Elastic" },
    { token: "gitlab", name: "GitLab" },
    { token: "okta", name: "Okta" },
    { token: "nvidia", name: "NVIDIA" },
    { token: "hackerrank", name: "HackerRank" },
    { token: "notion", name: "Notion" },
    { token: "spotify", name: "Spotify" },
    { token: "airtable", name: "Airtable" },
  ];

  const results = await Promise.allSettled(
    boards.map(async ({ token, name }) => {
      const res = await freshFetch(
        `https://boards-api.greenhouse.io/v1/boards/${token}/jobs`
      );
      if (!res.ok) throw new Error(token);
      const data = await res.json();
      return (data.jobs || [])
        .filter((j) => matchesRole(j.title, [], j.location?.name || ""))
        .map((j) =>
          normalizeJob({
            id: `gh-${token}-${j.id}`,
            title: j.title,
            company: name,
            location: j.location?.name || "See posting",
            url: j.absolute_url,
            tags: ["Greenhouse", "2027-friendly"],
            source: "Greenhouse",
            publishedAt: j.updated_at,
            remote: /remote/i.test(j.location?.name || ""),
          })
        );
    })
  );

  const jobs = [];
  let ok = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      ok += 1;
      jobs.push(...r.value);
    }
  }
  if (ok === 0) throw new Error("Greenhouse unavailable");
  return jobs;
}

/**
 * LinkedIn openings via Tech Opportunities (CORS-friendly aggregator).
 * LinkedIn itself blocks browser scrapes; this feed returns official linkedin.com/jobs URLs.
 */
async function fetchLinkedIn() {
  const collected = [];
  let anyOk = false;
  const queries = [
    { type: "internship", category: "software-engineering" },
    { type: "new-grad", category: "software-engineering" },
  ];

  for (const query of queries) {
    for (let page = 1; page <= 4; page += 1) {
      const params = new URLSearchParams({
        type: query.type,
        category: query.category,
        "page-size": "100",
        page: String(page),
        sort: "first-seen-desc",
      });
      try {
        const res = await freshFetch(
          `https://techopportunities.eu/api/v1/opportunities?${params}`,
          { credentials: "omit" }
        );
        if (!res.ok) break;
        anyOk = true;
        const data = await res.json();
        for (const j of data.data || []) {
          const title = j.title || "";
          if (
            !matchesRole(
              title,
              [j.category, j.industries].filter(Boolean),
              j.location || ""
            )
          ) {
            continue;
          }
          collected.push(
            normalizeJob({
              id: `linkedin-${j.linkedinJobId || j.link}`,
              title,
              company: j.company || "Unknown",
              location: j.location || "See posting",
              url: j.link,
              tags: ["LinkedIn", j.category, j.employmentType].filter(Boolean),
              source: "LinkedIn",
              publishedAt: j.firstSeenAt || null,
              remote: /remote/i.test(j.location || ""),
            })
          );
        }
        const totalPages = data.pagination?.totalPages || 1;
        if (page >= totalPages) break;
      } catch {
        break;
      }
    }
  }

  if (!anyOk) throw new Error("LinkedIn feed unavailable");
  return collected;
}

/** The Muse — public internship software-engineering feed */
async function fetchTheMuse() {
  const collected = [];
  let anyOk = false;

  for (let page = 0; page < 5; page += 1) {
    try {
      const res = await freshFetch(
        `https://www.themuse.com/api/public/jobs?category=Software%20Engineering&level=Internship&page=${page}`
      );
      if (!res.ok) continue;
      anyOk = true;
      const data = await res.json();
      const pageJobs = data.results || [];
      for (const j of pageJobs) {
        const locs = (j.locations || []).map((l) => l.name).join(", ");
        const cats = (j.categories || []).map((c) => c.name);
        if (!matchesRole(j.name, cats, locs)) continue;
        collected.push(
          normalizeJob({
            id: `muse-${j.id}`,
            title: j.name,
            company: j.company?.name || "Unknown",
            location: locs || "See posting",
            url: j.refs?.landing_page || j.refs?.external,
            tags: cats.concat(["The Muse"]),
            source: "The Muse",
            publishedAt: j.publication_date,
            remote: /remote/i.test(locs),
          })
        );
      }
      if (pageJobs.length < 20) break;
    } catch {
      /* next page */
    }
  }

  if (!anyOk) throw new Error("The Muse unavailable");
  return collected.filter((j) => j.url);
}

/** Remote OK — filter software internships from the public JSON feed */
async function fetchRemoteOK() {
  const res = await freshFetch("https://remoteok.com/api");
  if (!res.ok) throw new Error("Remote OK unavailable");
  const data = await res.json();

  return (Array.isArray(data) ? data : [])
    .filter((j) => j && j.position && j.id)
    .filter((j) => matchesRole(j.position, j.tags || [], j.description || ""))
    .map((j) =>
      normalizeJob({
        id: `remoteok-${j.id}`,
        title: j.position,
        company: j.company || "Unknown",
        location: j.location || "Remote",
        url: j.url || j.apply_url,
        tags: (j.tags || []).slice(0, 5).concat(["Remote OK"]),
        source: "Remote OK",
        publishedAt: j.date || null,
        remote: true,
      })
    )
    .filter((j) => j.url);
}

/** Ashby public job boards */
async function fetchAshbyBoards() {
  const boards = [
    { token: "notion", name: "Notion" },
    { token: "openai", name: "OpenAI" },
    { token: "ramp", name: "Ramp" },
    { token: "cursor", name: "Cursor" },
    { token: "perplexity", name: "Perplexity" },
    { token: "linear", name: "Linear" },
    { token: "supabase", name: "Supabase" },
    { token: "replit", name: "Replit" },
  ];

  const results = await Promise.allSettled(
    boards.map(async ({ token, name }) => {
      const res = await freshFetch(
        `https://api.ashbyhq.com/posting-api/job-board/${token}`
      );
      if (!res.ok) throw new Error(token);
      const data = await res.json();
      return (data.jobs || [])
        .filter((j) =>
          matchesRole(
            j.title,
            [j.department, j.team].filter(Boolean),
            j.location || ""
          )
        )
        .map((j) =>
          normalizeJob({
            id: `ashby-${token}-${j.id}`,
            title: j.title,
            company: name,
            location: j.location || "See posting",
            url: j.jobUrl || j.applyUrl,
            tags: ["Ashby", j.department, j.team].filter(Boolean),
            source: "Ashby",
            publishedAt: j.publishedAt,
            remote: Boolean(j.isRemote) || /remote/i.test(j.workplaceType || ""),
          })
        );
    })
  );

  const jobs = [];
  let ok = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      ok += 1;
      jobs.push(...r.value);
    }
  }
  if (ok === 0) throw new Error("Ashby unavailable");
  return jobs;
}

/** Lever public postings boards */
async function fetchLeverBoards() {
  const boards = [
    { token: "spotify", name: "Spotify" },
    { token: "palantir", name: "Palantir" },
    { token: "twitch", name: "Twitch" },
    { token: "nike", name: "Nike" },
    { token: "canva", name: "Canva" },
    { token: "grammarly", name: "Grammarly" },
  ];

  const results = await Promise.allSettled(
    boards.map(async ({ token, name }) => {
      const res = await freshFetch(
        `https://api.lever.co/v0/postings/${token}?mode=json`
      );
      if (!res.ok) throw new Error(token);
      const data = await res.json();
      return (Array.isArray(data) ? data : [])
        .filter((j) =>
          matchesRole(
            j.text,
            [j.categories?.team, j.categories?.department].filter(Boolean),
            j.categories?.location || ""
          )
        )
        .map((j) =>
          normalizeJob({
            id: `lever-${token}-${j.id}`,
            title: j.text,
            company: name,
            location: j.categories?.location || j.country || "See posting",
            url: j.hostedUrl || j.applyUrl,
            tags: ["Lever", j.categories?.team, j.categories?.commitment].filter(
              Boolean
            ),
            source: "Lever",
            publishedAt: j.createdAt
              ? new Date(j.createdAt).toISOString()
              : null,
            remote: /remote|hybrid/i.test(
              `${j.workplaceType || ""} ${j.categories?.location || ""}`
            ),
          })
        );
    })
  );

  const jobs = [];
  let ok = 0;
  for (const r of results) {
    if (r.status === "fulfilled") {
      ok += 1;
      jobs.push(...r.value);
    }
  }
  if (ok === 0) throw new Error("Lever unavailable");
  return jobs;
}

/** Jobicy remote board — intern / software tagged */
async function fetchJobicy() {
  const urls = [
    "https://jobicy.com/api/v2/remote-jobs?count=50&tag=internship",
    "https://jobicy.com/api/v2/remote-jobs?count=50&tag=software",
  ];
  const collected = [];
  let anyOk = false;

  for (const url of urls) {
    try {
      const res = await freshFetch(url);
      if (!res.ok) continue;
      anyOk = true;
      const data = await res.json();
      for (const j of data.jobs || []) {
        const tags = [].concat(j.jobIndustry || [], j.jobType || [], j.jobLevel || []);
        if (!matchesRole(j.jobTitle, tags, `${j.jobExcerpt || ""}`)) continue;
        collected.push(
          normalizeJob({
            id: `jobicy-${j.id}`,
            title: j.jobTitle,
            company: j.companyName,
            location: j.jobGeo || "Remote",
            url: j.url,
            tags,
            source: "Jobicy",
            publishedAt: j.pubDate || null,
            remote: true,
          })
        );
      }
    } catch {
      /* next */
    }
  }

  if (!anyOk) throw new Error("Jobicy unavailable");
  return collected;
}

/** ApplyGuy public JSON — verified US Summer 2027 SWE / related internships. */
async function fetchApplyGuy() {
  const res = await freshFetch(
    "https://raw.githubusercontent.com/ApplyGuy/2027-Internships/main/data/internships.json"
  );
  if (!res.ok) throw new Error("ApplyGuy unavailable");
  const data = await res.json();
  const jobs = (data.jobs || [])
    .filter((j) => {
      if (/^software engineering$/i.test(j.category || "")) return true;
      const title = j.title || "";
      return (
        isSoftware(title) &&
        (isInternship(title) || /intern|co[- ]?op/i.test(title))
      );
    })
    .slice(0, 400)
    .map((j) =>
      normalizeJob({
        id: `applyguy-${j.id}`,
        title: j.title,
        company: j.company,
        location: j.location || "USA",
        url: j.listingUrl || j.url,
        tags: ["2027", j.season, j.category].filter(Boolean),
        source: "ApplyGuy 2027",
        publishedAt: j.posted || data.updatedAt || null,
        remote: /remote/i.test(j.location || ""),
      })
    );
  if (!jobs.length) throw new Error("ApplyGuy returned no SWE roles");
  return jobs;
}

function stripHtmlText(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&nbsp;/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** SimplifyJobs Summer 2027 GitHub list — Software Engineering section. */
async function fetchSimplifyJobs() {
  const res = await freshFetch(
    "https://raw.githubusercontent.com/SimplifyJobs/Summer2027-Internships/dev/README.md"
  );
  if (!res.ok) throw new Error("SimplifyJobs unavailable");
  const md = await res.text();

  const markers = [
    "## 💻 Software Engineering Internship Roles",
    "## Software Engineering Internship Roles",
    "Software Engineering Internship Roles",
  ];
  let start = -1;
  for (const m of markers) {
    start = md.indexOf(m);
    if (start !== -1) break;
  }
  if (start === -1) throw new Error("SimplifyJobs SWE section missing");

  let end = md.indexOf("\n## ", start + 20);
  if (end === -1) end = Math.min(md.length, start + 500000);
  const section = md.slice(start, end);

  const rowRe =
    /<tr>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>\s*<td[^>]*>([\s\S]*?)<\/td>/gi;
  const collected = [];
  let match;
  while ((match = rowRe.exec(section)) !== null) {
    const companyHtml = match[1];
    const titleHtml = match[2];
    const locationHtml = match[3];
    const applyHtml = match[4];

    if (/Company|Role|Location|Application/i.test(stripHtmlText(companyHtml))) continue;
    if (/🔒|closed/i.test(applyHtml) || /🔒/.test(companyHtml)) continue;

    const company = stripHtmlText(companyHtml).replace(/^↳\s*/, "").replace(/^🔥\s*/, "");
    const title = stripHtmlText(titleHtml);
    const location = stripHtmlText(locationHtml);
    if (!company || !title) continue;
    if (!isInternship(title) && !isSoftware(title)) continue;

    const hrefs = [...applyHtml.matchAll(/href="([^"]+)"/gi)].map((m) => m[1]);
    const applyUrl =
      hrefs.find(
        (h) =>
          h.startsWith("http") &&
          !/simplify\.jobs\/p\//i.test(h) &&
          !/imgur\.com/i.test(h)
      ) || hrefs.find((h) => h.startsWith("http"));

    if (!applyUrl) continue;

    collected.push(
      normalizeJob({
        id: `simplify-${company.toLowerCase().replace(/[^a-z0-9]+/g, "-")}-${title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .slice(0, 48)}`,
        title,
        company,
        location: location || "See posting",
        url: applyUrl,
        tags: ["Summer 2027", "SimplifyJobs"],
        source: "SimplifyJobs 2027",
        publishedAt: new Date().toISOString(),
        remote: /remote/i.test(location),
      })
    );

    if (collected.length >= 300) break;
  }

  if (!collected.length) throw new Error("SimplifyJobs parse empty");
  return collected;
}

async function loadAllJobs() {
  const buckets = [];
  const sources = [
    { name: "SimplifyJobs 2027", fn: fetchSimplifyJobs },
    { name: "ApplyGuy 2027", fn: fetchApplyGuy },
    { name: "LinkedIn", fn: fetchLinkedIn },
    { name: "The Muse", fn: fetchTheMuse },
    { name: "Greenhouse", fn: fetchGreenhouseBoards },
    { name: "Ashby", fn: fetchAshbyBoards },
    { name: "Lever", fn: fetchLeverBoards },
    { name: "Remote OK", fn: fetchRemoteOK },
    { name: "Jobicy", fn: fetchJobicy },
    { name: "Remotive", fn: fetchRemotive },
    { name: "Arbeitnow", fn: fetchArbeitnow },
  ];

  state.sourcesTried = sources.length;
  state.sourcesOk = 0;

  const settled = await Promise.allSettled(sources.map((s) => s.fn()));

  settled.forEach((result, i) => {
    if (result.status === "fulfilled") {
      state.sourcesOk += 1;
      buckets.push(...result.value);
    } else {
      console.warn(`${sources[i].name} failed:`, result.reason);
    }
  });

  if (state.sourcesOk === 0) {
    throw new Error(
      "All live sources failed. Check your network, or open this page via a local server (not some locked-down file:// setups)."
    );
  }

  state.jobs = dedupeJobs(buckets).sort(
    (a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0)
  );
  state.lastFetch = new Date();
}

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime())) return "Recently posted";
  return date.toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function applyFilters(jobs) {
  const q = els.searchInput.value.trim().toLowerCase();
  const loc = els.locationFilter.value;
  const sort = els.sortFilter.value;
  const selectedRoles = getSelectedRoles();

  let filtered = jobs.filter((job) => {
    if (q) {
      const hay = `${job.title} ${job.company} ${job.location} ${job.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    const region = regionOf(job);
    if (loc === "focus" && !matchesFocusRegions(job)) return false;
    if (loc === "india" && !isIndiaOnly(job)) return false;
    if (loc === "japan" && region !== "japan") return false;
    if (loc === "europe" && region !== "europe") return false;
    if (loc === "usa" && region !== "usa") return false;
    if (
      loc === "remote" &&
      !(job.remote || REMOTE_RE.test(job.location || "") || WORLDWIDE_RE.test(job.location || ""))
    ) {
      return false;
    }

    if (!selectedRoles.length) return false;
    if (!(job.roles || []).some((role) => selectedRoles.includes(role))) {
      return false;
    }

    if (els.hideAppliedFilter?.checked && isApplied(job.id)) {
      return false;
    }

    return true;
  });

  if (sort === "company") {
    filtered = [...filtered].sort((a, b) => a.company.localeCompare(b.company));
  } else if (sort === "title") {
    filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
  } else {
    // Newest first, but India openings surface at the top by default
    filtered = [...filtered].sort((a, b) => {
      const regionDiff =
        (REGION_PRIORITY[regionOf(a)] ?? 5) - (REGION_PRIORITY[regionOf(b)] ?? 5);
      if (loc === "focus" && regionDiff !== 0) return regionDiff;
      return (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0);
    });
  }

  return filtered;
}

function renderJobs(jobs) {
  els.jobList.innerHTML = "";
  els.empty.hidden = jobs.length > 0;

  jobs.forEach((job, index) => {
    const applied = isApplied(job.id);
    const li = document.createElement("li");
    li.className = `job-card${applied ? " is-applied" : ""}`;
    li.dataset.jobId = job.id;
    li.style.animationDelay = `${Math.min(index, 12) * 0.04}s`;

    const tagsHtml = job.tags
      .slice(0, 4)
      .map((t) => `<span class="tag">${escapeHtml(t)}</span>`)
      .join("");

    li.innerHTML = `
      <div>
        <h3 class="job-title">${escapeHtml(job.title)}</h3>
        <p class="job-company">${escapeHtml(job.company)}</p>
        <div class="job-meta">
          <span>${escapeHtml(job.location)}</span>
          <span>${formatDate(job.publishedAt)}</span>
        </div>
        <div class="job-tags">${tagsHtml}${(job.roles || [])
          .map((r) => `<span class="tag tag-role">${escapeHtml(r.toUpperCase())}</span>`)
          .join("")}</div>
        <p class="job-source">Source: ${escapeHtml(job.source)}</p>
      </div>
      <div class="job-actions">
        <label class="applied-check">
          <input type="checkbox" class="applied-toggle" ${applied ? "checked" : ""} />
          Applied
        </label>
        <a class="btn-apply" href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer">
          Apply
        </a>
      </div>
    `;
    els.jobList.appendChild(li);
  });

  els.resultCount.textContent = `${jobs.length} opening${jobs.length === 1 ? "" : "s"}`;
  els.sourceCount.textContent = `${state.sourcesOk}/${state.sourcesTried} sources online`;
}

function renderPortals() {
  const order = [
    "Global",
    "India",
    "Japan",
    "Europe",
    "USA & Canada",
    "Latin America",
  ];
  const byRegion = new Map();
  for (const p of PORTALS) {
    const region = p.region || "Global";
    if (!byRegion.has(region)) byRegion.set(region, []);
    byRegion.get(region).push(p);
  }

  els.portalList.innerHTML = order
    .filter((region) => byRegion.has(region))
    .map((region) => {
      const cards = byRegion
        .get(region)
        .map(
          (p) => `
        <li>
          <a class="portal-card" href="${escapeHtml(p.url)}" target="_blank" rel="noopener noreferrer">
            <p class="portal-name">${escapeHtml(p.name)}</p>
            <p class="portal-desc">${escapeHtml(p.desc)}</p>
            <p class="portal-loc">${escapeHtml(p.location || region)}</p>
          </a>
        </li>`
        )
        .join("");
      return `
        <div class="portal-region">
          <h3 class="portal-region-title">${escapeHtml(region)}</h3>
          <ul class="portal-list">${cards}</ul>
        </div>`;
    })
    .join("");
}

function updateMeta() {
  if (!state.lastFetch) {
    els.lastUpdated.textContent = "Checking sources…";
    return;
  }
  els.lastUpdated.textContent = `Updated ${state.lastFetch.toLocaleString()} · ${state.sourcesOk}/${state.sourcesTried} portals & APIs · newest internship roles`;
}

function refreshView() {
  renderJobs(applyFilters(state.jobs));
}

function setRefreshBusy(busy) {
  for (const btn of refreshButtons()) {
    btn.classList.toggle("is-busy", busy);
    if (btn.id === "heroRefreshBtn") {
      btn.textContent = busy ? "Updating from all portals…" : "Refresh latest openings";
    } else {
      const label = busy ? "Refreshing…" : "Refresh latest";
      btn.innerHTML = `<span class="refresh-icon" aria-hidden="true"></span> ${label}`;
    }
  }
}

async function bootstrap(showLoading = true, scrollToList = false) {
  els.error.hidden = true;
  els.empty.hidden = true;
  if (showLoading) {
    els.loading.hidden = false;
    els.jobList.innerHTML = "";
  }
  setRefreshBusy(true);
  els.lastUpdated.textContent =
    "Refreshing latest internship roles from LinkedIn, The Muse, Greenhouse, Ashby, Lever, Remote OK & more…";

  try {
    await loadAllJobs();
    updateMeta();
    refreshView();
    if (scrollToList) {
      document.getElementById("openings")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  } catch (err) {
    els.error.hidden = false;
    els.errorMessage.textContent = err.message || "Could not load listings.";
    els.resultCount.textContent = "0 openings";
    els.sourceCount.textContent = "0 sources";
    els.lastUpdated.textContent = "Fetch failed — click Refresh latest to try again";
  } finally {
    els.loading.hidden = true;
    setRefreshBusy(false);
  }
}

els.searchInput.addEventListener("input", refreshView);
els.locationFilter.addEventListener("change", refreshView);
els.sortFilter.addEventListener("change", refreshView);
els.hideAppliedFilter.addEventListener("change", refreshView);
document.getElementById("roleFilters").addEventListener("change", refreshView);
els.jobList.addEventListener("change", (event) => {
  const toggle = event.target.closest(".applied-toggle");
  if (!toggle) return;
  const card = toggle.closest(".job-card");
  if (!card?.dataset.jobId) return;

  setApplied(card.dataset.jobId, toggle.checked);

  if (els.hideAppliedFilter.checked && toggle.checked) {
    refreshView();
    return;
  }

  card.classList.toggle("is-applied", toggle.checked);
});
function onRefreshClick() {
  bootstrap(true, true);
}

els.refreshBtn.addEventListener("click", onRefreshClick);
els.heroRefreshBtn.addEventListener("click", onRefreshClick);
els.listRefreshBtn.addEventListener("click", onRefreshClick);
els.retryBtn.addEventListener("click", () => bootstrap(true, true));

renderPortals();
bootstrap(true, false);

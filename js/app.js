const SOURCE_BOARDS = {
greenhouse: [
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
  ],
ashby: [
    { token: "notion", name: "Notion" },
    { token: "openai", name: "OpenAI" },
    { token: "ramp", name: "Ramp" },
    { token: "cursor", name: "Cursor" },
    { token: "perplexity", name: "Perplexity" },
    { token: "linear", name: "Linear" },
    { token: "supabase", name: "Supabase" },
    { token: "replit", name: "Replit" },
  ],
lever: [
    { token: "spotify", name: "Spotify" },
    { token: "palantir", name: "Palantir" },
    { token: "twitch", name: "Twitch" },
    { token: "nike", name: "Nike" },
    { token: "canva", name: "Canva" },
    { token: "grammarly", name: "Grammarly" },
  ]
};

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
const REMOTE_RE = /\b(remote|work from home|wfh|home[- ]based|distributed)\b/i;

function isFullyRemoteOpportunity(job) {
  const text = `${job.location || ""} ${job.title || ""} ${(job.tags || []).join(" ")}`;
  if (/\b(hybrid|partially remote|partial remote)\b/i.test(text)) return false;
  return Boolean(job.remote) || REMOTE_RE.test(text) || WORLDWIDE_RE.test(job.location || "");
}
const REMOTE_FRIENDLY_RE =
  /\b(remote|work\s*from\s*home|\bwfh\b|hybrid|distributed|work\s*from\s*anywhere|fully\s*remote|remote[- ]first)\b/i;

function geoRegionsIn(locationText) {
  const loc = locationText || "";
  const regions = new Set();
  if (INDIA_RE.test(loc)) regions.add("india");
  if (JAPAN_RE.test(loc)) regions.add("japan");
  if (USA_RE.test(loc)) regions.add("usa");
  if (EUROPE_RE.test(loc)) regions.add("europe");
  return regions;
}

/** True when the posting is remote / hybrid / WFH / worldwide. */
function isRemoteOpportunity(jobOrParts) {
  if (!jobOrParts) return false;
  if (typeof jobOrParts === "object" && jobOrParts.remote) return true;
  const loc = jobOrParts.location || jobOrParts.loc || "";
  const title = jobOrParts.title || "";
  const tags = Array.isArray(jobOrParts.tags)
    ? jobOrParts.tags.join(" ")
    : jobOrParts.tags || "";
  const blob = `${loc} ${title} ${tags}`;
  return (
    REMOTE_FRIENDLY_RE.test(blob) ||
    WORLDWIDE_RE.test(blob) ||
    /\b(remoteok|remotive|jobicy)\b/i.test(jobOrParts.source || "")
  );
}

function regionOf(job) {
  const loc = job.location || "";
  const geos = geoRegionsIn(loc);
  const remote = isRemoteOpportunity(job);

  // "India · USA · Europe" style labels are multi-region, not India-only
  if (geos.size > 1 || (geos.size >= 1 && WORLDWIDE_RE.test(loc))) {
    return "multi";
  }
  if (geos.has("india")) return "india";
  if (geos.has("japan")) return "japan";
  if (geos.has("usa")) return "usa";
  if (geos.has("europe")) return "europe";
  if (remote) return "remote";
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
  // Always keep remote / hybrid / worldwide openings in the default focus view
  if (isRemoteOpportunity(job) || region === "remote") return true;
  return (
    region === "india" ||
    region === "japan" ||
    region === "europe" ||
    region === "usa" ||
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
  { region: "Japan", name: "METI Japan Internship Program", desc: "Official internship programme for international talent — check current intake and eligibility", location: "Japan", url: "https://www.internshipprogram.go.jp/english/" },
  { region: "Japan", name: "Study in Japan — Internships", desc: "Official student internship guidance and employment support links", location: "Japan", url: "https://www.studyinjapan.go.jp/en/work-in-japan/internships/" },
  { region: "Japan", name: "Wantedly", desc: "Startup-friendly, culture-based matching", location: "Japan", url: "https://www.wantedly.com/projects?type=internship&occupation_types%5B%5D=jp_engineer" },
  { region: "Japan", name: "Mynavi", desc: "Main shukatsu / student internship platform", location: "Japan", url: "https://job.mynavi.jp/" },
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

const STATUS_STORAGE_KEY = "leads-application-status-v1";
const SAVED_JOBS_STORAGE_KEY = "leads-tracked-jobs-v1";
const APPLICATION_STATUSES = ["Not applied", "Applied", "Interview", "Offer", "Rejected"];
function loadTrackingMap(key) {
  try {
    const value = JSON.parse(localStorage.getItem(key) || "{}");
    return value && typeof value === "object" && !Array.isArray(value) ? value : {};
  } catch { return {}; }
}
const APPLIED_STORAGE_KEY = "leads-applied-jobs-v1";
const REQUIREMENTS_STORAGE_KEY = "leads-job-requirements-v1";
const SITE_INFO_STORAGE_KEY = "leads-site-info-v1";
const VIEW_STORAGE_KEY = "leads-view-mode-v1";

function loadAppliedIds() {
  try {
    const raw = localStorage.getItem(APPLIED_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return new Set(Array.isArray(parsed) ? parsed : []);
  } catch {
    return new Set();
  }
}

function loadRequirementsMap() {
  try {
    const raw = localStorage.getItem(REQUIREMENTS_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : {};
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
}

function loadSiteInfo() {
  try {
    return localStorage.getItem(SITE_INFO_STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

function loadViewMode() {
  const saved = localStorage.getItem(VIEW_STORAGE_KEY);
  return ["sheet", "portals", "profile", "sources"].includes(saved) ? saved : "cards";
}

const state = {
  jobs: [],
  sourcesOk: 0,
  sourcesTried: 0,
  lastFetch: null,
  appliedIds: loadAppliedIds(),
  applicationStatuses: loadTrackingMap(STATUS_STORAGE_KEY),
  savedJobs: loadTrackingMap(SAVED_JOBS_STORAGE_KEY),
  requirements: loadRequirementsMap(),
  viewMode: loadViewMode(),
};

function saveAppliedIds() {
  localStorage.setItem(
    APPLIED_STORAGE_KEY,
    JSON.stringify([...state.appliedIds])
  );
}

function saveRequirementsMap() {
  localStorage.setItem(
    REQUIREMENTS_STORAGE_KEY,
    JSON.stringify(state.requirements)
  );
}

function getApplicationStatus(jobId) {
  const saved = state.applicationStatuses[jobId];
  return APPLICATION_STATUSES.includes(saved) ? saved : state.appliedIds.has(jobId) ? "Applied" : "Not applied";
}
function isApplied(jobId) {
  return getApplicationStatus(jobId) !== "Not applied";
}
function setApplicationStatus(jobId, status) {
  if (!APPLICATION_STATUSES.includes(status)) return;
  state.applicationStatuses[jobId] = status;
  if (status === "Not applied") {
    state.appliedIds.delete(jobId);
    delete state.savedJobs[jobId];
  } else {
    state.appliedIds.add(jobId);
    const job = state.jobs.find(item => item.id === jobId);
    if (job) state.savedJobs[jobId] = job;
  }
  saveAppliedIds();
  localStorage.setItem(STATUS_STORAGE_KEY, JSON.stringify(state.applicationStatuses));
  localStorage.setItem(SAVED_JOBS_STORAGE_KEY, JSON.stringify(state.savedJobs));
}
function setApplied(jobId, applied) {
  setApplicationStatus(jobId, applied ? "Applied" : "Not applied");
}

function getRequirement(jobId) {
  return state.requirements[jobId] || "";
}

function setRequirement(jobId, text) {
  const value = String(text || "").trim();
  if (value) state.requirements[jobId] = value;
  else delete state.requirements[jobId];
  saveRequirementsMap();
}

const els = {
  jobList: document.getElementById("jobList"),
  listingsCards: document.getElementById("listingsCards"),
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
  sheetSection: document.getElementById("sheet"),
  sheetBody: document.getElementById("sheetBody"),
  sheetEmpty: document.getElementById("sheetEmpty"),
  sheetCount: document.getElementById("sheetCount"),
  siteInfoInput: document.getElementById("siteInfoInput"),
  siteInfoSaved: document.getElementById("siteInfoSaved"),
  exportSheetBtn: document.getElementById("exportSheetBtn"),
  viewCardsBtn: document.getElementById("viewCardsBtn"),
  viewSheetBtn: document.getElementById("viewSheetBtn"),
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

/** Require IT evidence in the role itself, rather than a board's broad category. */
function isITOpportunity(job) {
  const title = job.title || "";
  return /\b(software|sde|swe|developer|programmer|frontend|front[- ]?end|backend|back[- ]?end|full[- ]?stack|fullstack|devops|sre|site reliability|cloud|cybersecurity|cyber security|infosec|appsec|information security|network engineer|network administrator|network support|systems? administrator|systems? analyst|IT support|IT intern|IT trainee|IT apprentice|IT analyst|IT specialist|IT technician|information technology|technical support|help ?desk|desktop support|database|DBA|data engineer|data scien(?:ce|tist)|data analy(?:st|tics)|analytics engineer|machine learning|ML engineer|AI engineer|artificial intelligence|deep learning|LLM|SDET|test automation|automation test|QA engineer|quality assurance engineer|platform engineer|infrastructure engineer|security engineer|embedded|firmware|android|ios|mobile (?:engineer|development)|web (?:engineer|design|development)|UI engineer|UX engineer)\b/i.test(title);
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
  const location = raw.location || "Not specified";
  const remote = Boolean(raw.remote) ||
    isRemoteOpportunity({ location, title, tags, source: raw.source });
  return {
    id: raw.id,
    title,
    company: raw.company.trim(),
    location: remote && location === "Not specified" ? "Remote" : location,
    url: raw.url,
    tags: remote && !tags.some((t) => /remote|hybrid/i.test(t))
      ? [...tags, "Remote"].slice(0, 5)
      : tags,
    roles: detectRoles(title, tags),
    source: raw.source,
    opportunityType: raw.opportunityType || (/intern|co[- ]?op|working student/i.test(title) ? "internship" : "placement"),
    publishedAt: raw.publishedAt ? new Date(raw.publishedAt) : null,
    remote,
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
  return fetch(requestUrl, { ...options, signal: options.signal || AbortSignal.timeout(15000), cache: "no-store" });
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
  const boards = SOURCE_BOARDS.greenhouse;

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
  const boards = SOURCE_BOARDS.ashby;

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
  const boards = SOURCE_BOARDS.lever;

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
            remote: /remote/i.test(
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

/** Curated GitHub trackers rank above generic job boards (Simplify / ApplyGuy flow). */
const SOURCE_PRIORITY = {
  "SimplifyJobs 2027": 0,
  "Simplify New Grad": 1,
  "ApplyGuy 2027": 2,
  "Surya Tracker": 3,
  "FresherFlow India": 4,
  LinkedIn: 5,
  Greenhouse: 6,
  Ashby: 7,
  Lever: 8,
  "The Muse": 9,
  "Remote OK": 10,
  Jobicy: 11,
  Remotive: 12,
  Arbeitnow: 13,
};

const AUTO_REFRESH_MS = 15 * 60 * 1000;

function unixSecondsToIso(seconds) {
  if (!seconds && seconds !== 0) return null;
  const n = Number(seconds);
  if (!Number.isFinite(n)) return null;
  // Simplify uses unix seconds; guard against ms accidentally
  const ms = n > 1e12 ? n : n * 1000;
  return new Date(ms).toISOString();
}

function isSoftwareCategory(category = "") {
  return /software|swe|sde|engineering/i.test(category);
}

/**
 * Shared mapper for Simplify-style listings.json rows
 * (active flag, company_name, locations[], date_posted, exact url).
 */
function mapTrackerListing(j, { idPrefix, source, opportunityType, extraTags = [] }) {
  const title = j.title || "";
  const company = j.company_name || j.company || "";
  const location = Array.isArray(j.locations)
    ? j.locations.filter(Boolean).join(" · ")
    : j.location || "See posting";
  const url = j.url || j.listingUrl || j.apply_url;
  if (!title || !company || !url || !/^https?:\/\//i.test(url)) return null;

  const terms = [].concat(j.terms || [], j.season || [], extraTags).filter(Boolean);
  const remote = isRemoteOpportunity({
    location,
    title,
    tags: terms,
    source,
  });
  return normalizeJob({
    id: `${idPrefix}-${j.id || `${company}-${title}`.slice(0, 64)}`,
    title,
    company,
    location: location || (remote ? "Remote" : "See posting"),
    url,
    tags: terms.slice(0, 5),
    source,
    opportunityType,
    publishedAt: unixSecondsToIso(j.date_posted || j.date_updated) || j.posted || null,
    remote,
  });
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
    .sort((a, b) => String(b.posted || "").localeCompare(String(a.posted || "")))
    .slice(0, 500)
    .map((j) =>
      normalizeJob({
        id: `applyguy-${j.id}`,
        title: j.title,
        company: j.company,
        location: j.location || "USA",
        url: j.listingUrl || j.url,
        tags: ["2027", j.season, j.category].filter(Boolean),
        source: "ApplyGuy 2027",
        opportunityType: "internship",
        publishedAt: j.posted || data.updatedAt || null,
        remote: /remote/i.test(j.location || ""),
      })
    );
  if (!jobs.length) throw new Error("ApplyGuy returned no SWE roles");
  return jobs;
}

/**
 * SimplifyJobs machine-readable listings.json (same feed swelist / Pitt CSC use).
 * Much more reliable than scraping the README HTML tables.
 */
async function fetchSimplifyJobs(kind = "internship") {
  const placement = kind === "placement";
  const repo = placement ? "New-Grad-Positions" : "Summer2027-Internships";
  const res = await freshFetch(
    `https://raw.githubusercontent.com/SimplifyJobs/${repo}/dev/.github/scripts/listings.json`
  );
  if (!res.ok) throw new Error(`SimplifyJobs ${repo} unavailable`);
  const listings = await res.json();
  if (!Array.isArray(listings)) throw new Error("SimplifyJobs feed malformed");

  const mapped = listings
    .filter((j) => j && j.active !== false && j.is_visible !== false)
    .filter((j) => isSoftwareCategory(j.category || "") || isSoftware(j.title || ""))
    .filter((j) => {
      if (placement) return true;
      const blob = `${j.title || ""} ${(j.terms || []).join(" ")}`;
      return isInternship(blob) || /intern|co[- ]?op/i.test(blob);
    })
    .map((j) =>
      mapTrackerListing(j, {
        idPrefix: placement ? "simplify-ng" : "simplify",
        source: placement ? "Simplify New Grad" : "SimplifyJobs 2027",
        opportunityType: placement ? "placement" : "internship",
        extraTags: [
          placement ? "New Grad" : "Summer 2027",
          "SimplifyJobs",
          j.sponsorship && j.sponsorship !== "Other" ? j.sponsorship : null,
        ],
      })
    )
    .filter(Boolean)
    .sort(
      (a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0)
    )
    .slice(0, 800);

  if (!mapped.length) throw new Error("SimplifyJobs returned no software roles");
  return mapped;
}

/**
 * SuryaHarikrishnan/2027-internship-tracker — aggregated daily listings.json
 * (Simplify + other community sources, deduped).
 */
async function fetchSuryaTracker() {
  const res = await freshFetch(
    "https://raw.githubusercontent.com/SuryaHarikrishnan/2027-internship-tracker/master/data/listings.json"
  );
  if (!res.ok) throw new Error("Surya tracker unavailable");
  const listings = await res.json();
  if (!Array.isArray(listings)) throw new Error("Surya feed malformed");

  const mapped = listings
    .filter((j) => j && j.active !== false && j.is_visible !== false)
    .filter((j) => isSoftwareCategory(j.category || "") || isSoftware(j.title || ""))
    .filter((j) => {
      const blob = `${j.title || ""} ${(j.terms || []).join(" ")} ${j.season || ""}`;
      return (
        isInternship(blob) ||
        /intern|co[- ]?op|new grad|graduate|emerging talent/i.test(blob)
      );
    })
    .map((j) => {
      const placement =
        /new grad|graduate|emerging talent|university grad/i.test(j.title || "") &&
        !isInternship(j.title || "");
      return mapTrackerListing(j, {
        idPrefix: "surya",
        source: "Surya Tracker",
        opportunityType: placement ? "placement" : "internship",
        extraTags: ["Tracker", j.season, ...(j.terms || [])].filter(Boolean),
      });
    })
    .filter(Boolean)
    .sort(
      (a, b) => (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0)
    )
    .slice(0, 800);

  if (!mapped.length) throw new Error("Surya tracker returned no software roles");
  return mapped;
}

/** FresherFlow India jobs/internships — India placement + internship leads. */
async function fetchFresherFlowIndia() {
  const res = await freshFetch(
    "https://raw.githubusercontent.com/FresherFlow/India-Jobs-Internships/main/data/jobs.json"
  );
  if (!res.ok) throw new Error("FresherFlow India unavailable");
  const data = await res.json();
  const jobs = data.jobs || [];

  const mapped = jobs
    .filter((j) => j && String(j.status || "").toUpperCase() !== "EXPIRED")
    .filter((j) => {
      const blob = `${j.title || ""} ${(j.tags || []).join(" ")} ${j.notesHighlights || ""}`;
      return isSoftware(blob) || /sde|swe|developer|engineer|intern|fresher/i.test(blob);
    })
    .map((j) => {
      const type = String(j.type || "").toUpperCase();
      const isIntern =
        type === "INTERNSHIP" || isInternship(j.title || "") || /intern/i.test(j.title || "");
      const location = Array.isArray(j.locations)
        ? j.locations.join(" · ")
        : j.location || "India";
      return normalizeJob({
        id: `fresherflow-${j.id}`,
        title: j.title,
        company: j.company,
        location: /india/i.test(location) ? location : `${location} · India`,
        url: j.applyLink || j.url,
        tags: ["India", ...(j.tags || []), j.workMode].filter(Boolean).slice(0, 5),
        source: "FresherFlow India",
        opportunityType: isIntern ? "internship" : "placement",
        publishedAt: j.dateAdded || j.addedAt || null,
        remote: /remote/i.test(`${j.workMode || ""} ${location}`),
      });
    })
    .filter((j) => j.url);

  if (!mapped.length) throw new Error("FresherFlow returned no open software roles");
  return mapped;
}

function compareJobsByTrackerPriority(a, b) {
  const srcDiff =
    (SOURCE_PRIORITY[a.source] ?? 50) - (SOURCE_PRIORITY[b.source] ?? 50);
  if (srcDiff !== 0) return srcDiff;
  return (b.publishedAt?.getTime() || 0) - (a.publishedAt?.getTime() || 0);
}

async function loadAllJobs() {
  const buckets = [];
  const sources = [
    // Community internship / placement trackers (primary live leads)
    { name: "SimplifyJobs 2027", fn: () => fetchSimplifyJobs("internship") },
    { name: "Simplify New Grad", fn: () => fetchSimplifyJobs("placement") },
    { name: "ApplyGuy 2027", fn: fetchApplyGuy },
    { name: "Surya Tracker", fn: fetchSuryaTracker },
    { name: "FresherFlow India", fn: fetchFresherFlowIndia },
    // ATS + boards (supplement)
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

  state.jobs = dedupeJobs([...buckets.filter(isITOpportunity), ...Object.values(state.savedJobs).filter(job => job && isApplied(job.id)).map(job => ({ ...job, publishedAt: job.publishedAt ? new Date(job.publishedAt) : null }))]).sort(compareJobsByTrackerPriority);
  state.lastFetch = new Date();
}

function formatDate(date) {
  if (!date || Number.isNaN(date.getTime())) return "Date not provided";
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
    const type = document.getElementById("opportunityFilter")?.value || "all";
    if (type !== "all" && job.opportunityType !== type) return false;
    if (q) {
      const hay = `${job.title} ${job.company} ${job.location} ${job.tags.join(" ")}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }

    const region = regionOf(job);
    const remote = isRemoteOpportunity(job);
    if (loc === "focus" && !matchesFocusRegions(job)) return false;
    // Country filters keep onsite roles there, plus remote/hybrid that mention that region
    if (loc === "india" && !(isIndiaOnly(job) || (remote && INDIA_RE.test(job.location || "")))) {
      return false;
    }
    if (loc === "japan" && !(region === "japan" || (remote && JAPAN_RE.test(job.location || "")))) {
      return false;
    }
    if (loc === "europe" && !(region === "europe" || (remote && EUROPE_RE.test(job.location || "")))) {
      return false;
    }
    if (loc === "usa" && !(region === "usa" || (remote && USA_RE.test(job.location || "")))) {
      return false;
    }
    if (loc === "remote" && !remote) {
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
    // Tracker-priority + newest; India/focus regions still surface first when selected
    filtered = [...filtered].sort((a, b) => {
      const regionDiff =
        (REGION_PRIORITY[regionOf(a)] ?? 5) - (REGION_PRIORITY[regionOf(b)] ?? 5);
      if (loc === "focus" && regionDiff !== 0) return regionDiff;
      return compareJobsByTrackerPriority(a, b);
    });
  }

  return filtered;
}

const GITHUB_SOURCES = {
  "SimplifyJobs 2027": "https://github.com/SimplifyJobs/Summer2027-Internships",
  "Simplify New Grad": "https://github.com/SimplifyJobs/New-Grad-Positions",
  "ApplyGuy 2027": "https://github.com/ApplyGuy/2027-Internships",
  "Surya Tracker": "https://github.com/SuryaHarikrishnan/2027-internship-tracker",
  "FresherFlow India": "https://github.com/FresherFlow/India-Jobs-Internships",
};

function renderJobSource(job) {
  const repository = GITHUB_SOURCES[job.source];
  return repository
    ? `<a href="${repository}" target="_blank" rel="noopener noreferrer" title="View GitHub source repository">${escapeHtml(job.source)} · GitHub ↗</a>`
    : escapeHtml(job.source);
}

function renderSources() {
  const sources = [
    ...Object.entries(GITHUB_SOURCES).map(([name, url]) => ({ name, url, group: "GitHub feeds", detail: "Automatic listing feed" })),
    ...[
      ["LinkedIn", "https://www.linkedin.com/jobs/"],
      ["The Muse", "https://www.themuse.com/jobs"],
      ["Remote OK", "https://remoteok.com/"],
      ["Jobicy", "https://jobicy.com/"],
      ["Remotive", "https://remotive.com/"],
      ["Arbeitnow", "https://www.arbeitnow.com/"],
    ].map(([name, url]) => ({ name, url, group: "Job boards", detail: "Automatic listing feed; availability varies" })),
    ...Object.entries(SOURCE_BOARDS).flatMap(([provider, boards]) => boards.map(board => ({
      name: board.name,
      url: provider === "greenhouse" ? `https://job-boards.greenhouse.io/${board.token}` : provider === "ashby" ? `https://jobs.ashbyhq.com/${board.token}` : `https://jobs.lever.co/${board.token}`,
      group: "Company boards", detail: `${provider[0].toUpperCase() + provider.slice(1)} · Automatic listing feed`,
    }))),
    ...PORTALS.map(portal => ({ name: portal.name, url: portal.url, group: "Career portals", detail: `${portal.region} · Browse directly · ${portal.desc}` })),
  ];
  function update() {
    const query = document.getElementById("sourceSearch").value.trim().toLowerCase();
    const category = document.getElementById("sourceCategory").value;
    const filtered = sources.filter(source => (category === "all" || source.group === category) && `${source.name} ${source.group} ${source.detail}`.toLowerCase().includes(query));
    document.getElementById("sourcesCount").textContent = `${filtered.length} sources`;
    document.getElementById("sourcesList").innerHTML = filtered.map(source => `<a class="source-directory-card" href="${escapeHtml(source.url)}" target="_blank" rel="noopener noreferrer"><span class="source-category">${escapeHtml(source.group)}</span><h3>${escapeHtml(source.name)} <span aria-hidden="true">↗</span></h3><p>${escapeHtml(source.detail)}</p></a>`).join("");
    document.getElementById("sourcesEmpty").hidden = filtered.length > 0;
  }
  document.getElementById("sourceSearch").addEventListener("input", update);
  document.getElementById("sourceCategory").addEventListener("change", update);
  update();
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
      .map((t) => {
        const remoteClass = /remote|hybrid/i.test(t) ? " tag-remote" : "";
        return `<span class="tag${remoteClass}">${escapeHtml(t)}</span>`;
      })
      .join("");
    const remoteBadge = isFullyRemoteOpportunity(job)
      ? `<span class="tag tag-remote">Remote</span>`
      : "";

    li.innerHTML = `
      <div>
        <h3 class="job-title">${escapeHtml(job.title)}</h3>
        <p class="job-company">${escapeHtml(job.company)}</p>
        <div class="job-meta">
          <span>${escapeHtml(job.location)}</span>
          <span>${formatDate(job.publishedAt)}</span>
          ${remoteBadge}
        </div>
        <div class="job-tags">${tagsHtml}${(job.roles || [])
          .map((r) => `<span class="tag tag-role">${escapeHtml(r.toUpperCase())}</span>`)
          .join("")}</div>
        <p class="job-source">${renderJobSource(job)}</p>
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

function renderSheet(jobs) {
  if (!els.sheetBody) return;

  els.sheetBody.innerHTML = "";
  if (els.sheetEmpty) els.sheetEmpty.hidden = jobs.length > 0;
  if (els.sheetCount) {
    els.sheetCount.textContent = `${jobs.length} row${jobs.length === 1 ? "" : "s"}`;
  }

  const frag = document.createDocumentFragment();

  jobs.forEach((job) => {
    const applied = isApplied(job.id);
    const tr = document.createElement("tr");
    tr.className = applied ? "is-applied" : "";
    tr.dataset.jobId = job.id;

    const rolesHtml = (job.roles || [])
      .map((r) => `<span class="tag tag-role">${escapeHtml(r.toUpperCase())}</span>`)
      .join("");

    tr.innerHTML = `
      <td class="sheet-applied-check">
        <select class="sheet-status-select" aria-label="Application status for ${escapeHtml(job.title)}">${APPLICATION_STATUSES.map(status => `<option${getApplicationStatus(job.id) === status ? " selected" : ""}>${status}</option>`).join("")}</select>
      </td>
      <td class="sheet-role">${escapeHtml(job.title)}</td>
      <td class="sheet-company">${escapeHtml(job.company)}</td>
      <td>${escapeHtml(job.location)}</td>
      <td><div class="sheet-roles">${rolesHtml || "—"}</div></td>
      <td>
        <input
          type="text"
          class="sheet-req-input"
          value="${escapeHtml(getRequirement(job.id))}"
          placeholder="GPA, visa, stack, deadline…"
          aria-label="Requirements for ${escapeHtml(job.title)}"
        />
      </td>
      <td>${renderJobSource(job)}</td>
      <td>
        <a class="sheet-link" href="${escapeHtml(job.url)}" target="_blank" rel="noopener noreferrer" title="${escapeHtml(job.url)}">
          ${escapeHtml(job.url)}
        </a>
      </td>
    `;
    frag.appendChild(tr);
  });

  els.sheetBody.appendChild(frag);
}

function setViewMode(mode) {
  const next = ["cards", "sheet", "portals", "profile", "sources"].includes(mode) ? mode : "cards";
  state.viewMode = next;
  document.body.dataset.section = next;
  document.querySelectorAll(".app-sidebar [data-section]").forEach(button => {
    if (button.dataset.section === next) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  const profile = document.getElementById("applicationProfile");
  if (profile) profile.open = next === "profile";
  localStorage.setItem(VIEW_STORAGE_KEY, next);

  const panels = {
    sources: document.getElementById("sourcesSection"),
    profile: document.getElementById("applicationProfile"),
    cards: els.listingsCards,
    sheet: els.sheetSection,
    portals: document.getElementById("portals"),
  };

  Object.entries(panels).forEach(([key, panel]) => {
    if (!panel) return;
    const active = key === next;
    panel.classList.toggle("is-hidden", !active);
    panel.hidden = !active;
  });

  document.querySelectorAll("[data-workspace-tab]").forEach((btn) => {
    const selected = btn.dataset.workspaceTab === next;
    btn.classList.toggle("is-active", selected);
    btn.setAttribute("aria-selected", selected ? "true" : "false");
    btn.tabIndex = selected ? 0 : -1;
  });
}

function bindWorkspaceTabs() {
  const tabs = Array.from(document.querySelectorAll("[data-workspace-tab]"));
  tabs.forEach((btn) => {
    btn.addEventListener("click", () => setViewMode(btn.dataset.workspaceTab));
    btn.addEventListener("keydown", (event) => {
      const idx = tabs.indexOf(btn);
      if (idx < 0) return;
      let nextIdx = idx;
      if (event.key === "ArrowRight" || event.key === "ArrowDown") {
        nextIdx = (idx + 1) % tabs.length;
      } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
        nextIdx = (idx - 1 + tabs.length) % tabs.length;
      } else if (event.key === "Home") {
        nextIdx = 0;
      } else if (event.key === "End") {
        nextIdx = tabs.length - 1;
      } else {
        return;
      }
      event.preventDefault();
      const next = tabs[nextIdx];
      next.focus();
      setViewMode(next.dataset.workspaceTab);
    });
  });
}

function csvEscape(value) {
  const str = String(value ?? "");
  if (/[",\n\r]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function exportSheetCsv(jobs) {
  const headers = [
    "Status",
    "Role",
    "Company",
    "Location",
    "Software roles",
    "Requirements",
    "Source",
    "GitHub source repository",
    "Exact apply link",
  ];
  const rows = jobs.map((job) =>
    [
      getApplicationStatus(job.id),
      job.title,
      job.company,
      job.location,
      (job.roles || []).join(" | "),
      getRequirement(job.id),
      job.source,
      GITHUB_SOURCES[job.source] || "",
      job.url,
    ]
      .map(csvEscape)
      .join(",")
  );
  const csv = [headers.join(","), ...rows].join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `leads-opportunities-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function initSiteInfoPanel() {
  if (!els.siteInfoInput) return;
  els.siteInfoInput.value = loadSiteInfo();

  let saveTimer = null;
  els.siteInfoInput.addEventListener("input", () => {
    localStorage.setItem(SITE_INFO_STORAGE_KEY, els.siteInfoInput.value);
    if (els.siteInfoSaved) {
      els.siteInfoSaved.hidden = false;
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        els.siteInfoSaved.hidden = true;
      }, 1200);
    }
  });
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
        <div class="portal-region" id="portals-${escapeHtml(region.toLowerCase().replace(/[^a-z]+/g, "-"))}">
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
  els.lastUpdated.textContent = `Updated ${state.lastFetch.toLocaleString()} · ${state.sourcesOk}/${state.sourcesTried} live feeds · auto-refresh every 15 min`;
}

function refreshView() {
  const filtered = applyFilters(state.jobs);
  renderJobs(filtered);
  renderSheet(filtered);
}

function setRefreshBusy(busy) {
  for (const btn of refreshButtons()) {
    btn.classList.toggle("is-busy", busy);
    // Text-only updates — never rewrite button HTML (that felt laggy)
    if (btn.id === "heroRefreshBtn") {
      btn.textContent = busy ? "Updating…" : "Refresh latest";
      continue;
    }
    const label = btn.querySelector(".btn-label");
    if (label) label.textContent = busy ? "Refreshing…" : "Refresh";
  }
}

async function bootstrap(showLoading = true, scrollToList = false) {
  els.error.hidden = true;
  els.empty.hidden = true;
  if (showLoading) {
    setViewMode("cards");
    els.listingsCards?.classList.remove("is-hidden");
    if (els.listingsCards) els.listingsCards.hidden = false;
    els.loading.hidden = false;
    els.jobList.innerHTML = "";
    if (els.sheetBody) els.sheetBody.innerHTML = "";
  }
  setRefreshBusy(true);
  els.lastUpdated.textContent =
    "Refreshing live feeds from SimplifyJobs, ApplyGuy, Surya Tracker, FresherFlow India & company boards…";

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
    setViewMode(state.viewMode);
    setRefreshBusy(false);
  }
}

document.querySelectorAll("[data-browse-location]").forEach((button) => {
  button.addEventListener("click", () => {
    els.locationFilter.value = button.dataset.browseLocation;
    setViewMode("cards");
    refreshView();
    document.getElementById("openings").scrollIntoView({ behavior: "smooth" });
  });
});
els.searchInput.addEventListener("input", refreshView);
function selectOpportunityTab(tab) {
  document.getElementById("opportunityFilter").value = tab.dataset.opportunityTab;
  document.querySelectorAll("[data-opportunity-tab]").forEach((button) => {
    const selected = button === tab;
    button.setAttribute("aria-selected", String(selected));
    button.tabIndex = selected ? 0 : -1;
  });
  const heading = document.getElementById("filtersHeading") || document.querySelector(".filters-heading");
  if (heading) {
    heading.textContent =
      tab.dataset.opportunityTab === "internship"
        ? "Internship openings"
        : "Placement openings";
  }
  refreshView();
}
const opportunityTabs = Array.from(document.querySelectorAll("[data-opportunity-tab]"));
opportunityTabs.forEach((tab, index) => {
  tab.addEventListener("click", () => selectOpportunityTab(tab));
  tab.addEventListener("keydown", (event) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? 0 : event.key === "End" ? opportunityTabs.length - 1 : (index + (event.key === "ArrowRight" ? 1 : -1) + opportunityTabs.length) % opportunityTabs.length;
    opportunityTabs[next].focus();
    selectOpportunityTab(opportunityTabs[next]);
  });
});
els.locationFilter.addEventListener("change", refreshView);
els.sortFilter.addEventListener("change", refreshView);
els.hideAppliedFilter.addEventListener("change", refreshView);
function updateRolesSummary() {
  const roles = Array.from(document.querySelectorAll('#roleFilters input[name="role"]'));
  const count = roles.filter(input => input.checked).length;
  document.getElementById("rolesSummary").textContent = count === roles.length ? "All roles selected" : count === 0 ? "No roles selected" : `${count} roles selected`;
  const all = document.getElementById("selectAllRoles");
  all.checked = count === roles.length;
  all.indeterminate = count > 0 && count < roles.length;
}
document.getElementById("roleFilters").addEventListener("change", () => {
  updateRolesSummary();
  refreshView();
});
document.getElementById("selectAllRoles").addEventListener("change", (event) => {
  document.querySelectorAll('#roleFilters input[name="role"]').forEach(input => { input.checked = event.target.checked; });
  updateRolesSummary();
  refreshView();
});
document.addEventListener("click", (event) => {
  const dropdown = document.getElementById("rolesDropdown");
  if (!dropdown.contains(event.target)) dropdown.open = false;
});
document.getElementById("rolesDropdown").addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    event.currentTarget.open = false;
    event.currentTarget.querySelector("summary").focus();
  }
});
updateRolesSummary();
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
  const sheetRow = els.sheetBody?.querySelector(
    `tr[data-job-id="${CSS.escape(card.dataset.jobId)}"]`
  );
  if (sheetRow) {
    sheetRow.classList.toggle("is-applied", toggle.checked);
    const sheetStatus = sheetRow.querySelector(".sheet-status-select");
    if (sheetStatus) sheetStatus.value = getApplicationStatus(card.dataset.jobId);
  }
});

els.sheetBody?.addEventListener("change", (event) => {
  const select = event.target.closest(".sheet-status-select");
  if (!select) return;
  const row = select.closest("tr");
  if (!row?.dataset.jobId) return;
  setApplicationStatus(row.dataset.jobId, select.value);
  refreshView();
});

els.sheetBody?.addEventListener("change", (event) => {
  const input = event.target.closest(".sheet-req-input");
  if (!input) return;
  const row = input.closest("tr");
  if (!row?.dataset.jobId) return;
  setRequirement(row.dataset.jobId, input.value);
});

document.querySelectorAll(".app-sidebar [data-section]").forEach(button => {
  button.addEventListener("click", () => {
    setViewMode(button.dataset.section);
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
});
document.addEventListener("leads:open-profile", () => setViewMode("profile"));
bindWorkspaceTabs();
document.querySelector('a[href="#sheet"]')?.addEventListener("click", (event) => {
  event.preventDefault();
  setViewMode("sheet");
  document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" });
});
document.querySelectorAll('a[href="#workspace"], a[href="#openings"]').forEach((link) => {
  link.addEventListener("click", () => setViewMode("cards"));
});
document.querySelector('a[href="#portals"]')?.addEventListener("click", (event) => {
  event.preventDefault();
  setViewMode("portals");
  document.getElementById("workspace")?.scrollIntoView({ behavior: "smooth" });
});
els.exportSheetBtn?.addEventListener("click", () => {
  exportSheetCsv(applyFilters(state.jobs));
});

if (location.hash === "#sheet") setViewMode("sheet");
else if (location.hash === "#portals") setViewMode("portals");

function onRefreshClick() {
  bootstrap(true, true);
}

els.refreshBtn.addEventListener("click", onRefreshClick);
els.heroRefreshBtn.addEventListener("click", onRefreshClick);
els.listRefreshBtn.addEventListener("click", onRefreshClick);
els.retryBtn.addEventListener("click", () => bootstrap(true, true));

renderSources();
initSiteInfoPanel();
setViewMode(state.viewMode);
renderPortals();
bootstrap(true, false);

// ApplyGuy-style cadence: re-pull community feeds quietly every 15 minutes
setInterval(() => {
  if (document.visibilityState === "hidden") return;
  bootstrap(false, false);
}, AUTO_REFRESH_MS);




// Keep the sidebar below the actual navbar height, including wrapped mobile links.
const appHeader = document.querySelector(".site-header");
if (appHeader && typeof ResizeObserver !== "undefined") {
  new ResizeObserver(entries => {
    const height = Math.round(entries[0].target.getBoundingClientRect().height);
    document.documentElement.style.setProperty("--app-header-height", `${height}px`);
  }).observe(appHeader);
}

document.getElementById("footerSourcesLink")?.addEventListener("click", event => {
  event.preventDefault();
  setViewMode("sources");
  window.scrollTo({ top: 0, behavior: "smooth" });
});

const sidebarDrawer = document.getElementById("workspaceSidebar");
const sidebarToggle = document.getElementById("sidebarToggle");
const sidebarBackdrop = document.getElementById("sidebarBackdrop");
function toggleSidebar(open) {
  sidebarDrawer.hidden = !open;
  sidebarBackdrop.hidden = !open;
  document.body.classList.toggle("drawer-open", open);
  sidebarToggle.setAttribute("aria-expanded", String(open));
  for (const element of [document.querySelector("main"), document.querySelector(".site-header"), document.querySelector(".site-footer")]) {
    if (element) element.inert = open;
  }
  if (open) document.getElementById("sidebarClose").focus();
  else sidebarToggle.focus();
}
sidebarToggle.addEventListener("click", () => toggleSidebar(true));
document.getElementById("sidebarClose").addEventListener("click", () => toggleSidebar(false));
sidebarBackdrop.addEventListener("click", () => toggleSidebar(false));
sidebarDrawer.addEventListener("click", event => {
  if (event.target.closest("[data-section]")) toggleSidebar(false);
});
sidebarDrawer.addEventListener("keydown", event => {
  if (event.key === "Escape") { toggleSidebar(false); return; }
  if (event.key !== "Tab") return;
  const buttons = [...sidebarDrawer.querySelectorAll("button")];
  const first = buttons[0], last = buttons[buttons.length - 1];
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
  else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
});

const PROFILE_KEY = "leads-application-profile-v1";
const FIELDS = [
  ["name", "Full name", "text", "name"],
  ["email", "Email", "email", "email"],
  ["phone", "Phone", "tel", "tel"],
  ["location", "City / country", "text", "address-level2"],
  ["college", "College / university", "text", "organization"],
  ["degree", "Degree / major", "text", "off"],
  ["graduation", "Graduation year", "text", "off"],
  ["linkedin", "LinkedIn URL", "url", "url"],
  ["github", "GitHub URL", "url", "url"],
  ["portfolio", "Portfolio / resume link", "url", "url"],
  ["skills", "Skills", "text", "off"],
  ["introduction", "Short introduction", "textarea", "off"],
];

export function loadProfile(storage = localStorage) {
  try {
    const parsed = JSON.parse(storage.getItem(PROFILE_KEY) || "{}");
    const values = {};
    for (const [key] of FIELDS) {
      if (typeof parsed?.[key] === "string") values[key] = parsed[key];
    }
    return values;
  } catch { return {}; }
}

export function selectedProfileText(values, selectedKeys) {
  return FIELDS.filter(([key]) => selectedKeys.includes(key) && values[key]?.trim())
    .map(([key, label]) => `${label}: ${values[key].trim()}`).join("\n");
}

function initProfile() {
  const panel = document.getElementById("applicationProfile");
  const form = document.getElementById("applicationProfileForm");
  const status = document.getElementById("profileSaveStatus");
  const values = loadProfile();
  const controls = new Map();
  const selection = new Map();

  async function copy(text) {
    if (!text) { status.textContent = "Fill a field and select it first."; return; }
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = "Copied. Paste into the matching application fields.";
    } catch {
      const manual = document.getElementById("profileCopyText");
      manual.hidden = false;
      manual.value = text;
      manual.focus();
      manual.select();
      status.textContent = "Select and copy the text below manually.";
    }
  }

  for (const [key, label, type, autocomplete] of FIELDS) {
    const row = document.createElement("div");
    row.className = "profile-field";
    const pick = document.createElement("input");
    pick.type = "checkbox";
    pick.checked = true;
    pick.setAttribute("aria-label", `Include ${label} when copying`);
    selection.set(key, pick);
    const input = document.createElement(type === "textarea" ? "textarea" : "input");
    if (type !== "textarea") input.type = type;
    input.id = `profile-${key}`;
    input.name = key;
    input.autocomplete = autocomplete;
    input.value = values[key] || "";
    const fieldLabel = document.createElement("label");
    fieldLabel.htmlFor = input.id;
    fieldLabel.textContent = label;
    const field = document.createElement("div");
    field.append(fieldLabel, input);
    controls.set(key, input);
    input.addEventListener("input", () => {
      values[key] = input.value;
      try {
        localStorage.setItem(PROFILE_KEY, JSON.stringify(values));
        status.textContent = "Saved in this browser.";
      } catch { status.textContent = "Could not save. Browser storage may be full or unavailable."; }
    });
    const copyButton = document.createElement("button");
    copyButton.type = "button";
    copyButton.className = "btn-ghost";
    copyButton.textContent = "Copy";
    copyButton.setAttribute("aria-label", `Copy ${label}`);
    copyButton.addEventListener("click", () => copy(input.value));
    row.append(pick, field, copyButton);
    form.append(row);
  }
  form.addEventListener("submit", event => event.preventDefault());
  document.getElementById("copyProfileFields").addEventListener("click", () => {
    copy(selectedProfileText(values, [...selection].filter(([, input]) => input.checked).map(([key]) => key)));
  });
  document.getElementById("clearProfile").addEventListener("click", () => {
    if (!confirm("Clear your saved application profile from this browser?")) return;
    try { localStorage.removeItem(PROFILE_KEY); }
    catch { status.textContent = "Could not clear saved profile."; return; }
    for (const [key, input] of controls) { input.value = ""; delete values[key]; }
    document.getElementById("profileCopyText").value = "";
    document.getElementById("profileCopyText").hidden = true;
    status.textContent = "Saved profile cleared.";
  });
  document.addEventListener("click", event => {
    if (event.target.closest(".btn-apply, .sheet-link")) {
      document.dispatchEvent(new CustomEvent("leads:open-profile"));
      panel.open = true;
      status.textContent = "Application opened in a separate tab. Copy saved fields here as needed.";
    }
  });
}

if (typeof document !== "undefined") initProfile();

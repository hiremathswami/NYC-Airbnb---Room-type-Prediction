"use strict";

/* ---------- Data ---------- */
const BOROUGHS = {
  "Manhattan": { c: [40.7831, -73.9712], hoods: "Battery Park City|Chelsea|Chinatown|Civic Center|East Harlem|East Village|Financial District|Flatiron District|Gramercy|Greenwich Village|Harlem|Hell's Kitchen|Inwood|Kips Bay|Little Italy|Lower East Side|Marble Hill|Midtown|Morningside Heights|Murray Hill|NoHo|Nolita|Roosevelt Island|SoHo|Stuyvesant Town|Theater District|Tribeca|Two Bridges|Upper East Side|Upper West Side|Washington Heights|West Village" },
  "Brooklyn": { c: [40.6782, -73.9442], hoods: "Bath Beach|Bay Ridge|Bedford-Stuyvesant|Bensonhurst|Bergen Beach|Boerum Hill|Borough Park|Brighton Beach|Brooklyn Heights|Brownsville|Bushwick|Canarsie|Carroll Gardens|Clinton Hill|Cobble Hill|Columbia St|Coney Island|Crown Heights|Cypress Hills|DUMBO|Downtown Brooklyn|Dyker Heights|East Flatbush|East New York|Flatbush|Flatlands|Fort Greene|Fort Hamilton|Gowanus|Gravesend|Greenpoint|Kensington|Manhattan Beach|Midwood|Mill Basin|Navy Yard|Park Slope|Prospect Heights|Prospect-Lefferts Gardens|Red Hook|Sea Gate|Sheepshead Bay|South Slope|Sunset Park|Vinegar Hill|Williamsburg|Windsor Terrace" },
  "Queens": { c: [40.7282, -73.7949], hoods: "Arverne|Astoria|Bay Terrace|Bayside|Bayswater|Belle Harbor|Bellerose|Breezy Point|Briarwood|Cambria Heights|College Point|Corona|Ditmars Steinway|Douglaston|East Elmhurst|Edgemere|Elmhurst|Far Rockaway|Flushing|Forest Hills|Fresh Meadows|Glendale|Hollis|Holliswood|Howard Beach|Jackson Heights|Jamaica|Jamaica Estates|Jamaica Hills|Kew Gardens|Kew Gardens Hills|Laurelton|Little Neck|Long Island City|Maspeth|Middle Village|Neponsit|Ozone Park|Queens Village|Rego Park|Richmond Hill|Ridgewood|Rockaway Beach|Rosedale|South Ozone Park|Springfield Gardens|St. Albans|Sunnyside|Whitestone|Woodhaven|Woodside" },
  "Bronx": { c: [40.8448, -73.8648], hoods: "Allerton|Baychester|Belmont|Bronxdale|Castle Hill|City Island|Claremont Village|Clason Point|Co-op City|Concourse|Concourse Village|East Morrisania|Eastchester|Edenwald|Fieldston|Fordham|Highbridge|Hunts Point|Kingsbridge|Longwood|Melrose|Morris Heights|Morris Park|Morrisania|Mott Haven|Mount Eden|Mount Hope|North Riverdale|Norwood|Olinville|Parkchester|Pelham Bay|Pelham Gardens|Port Morris|Riverdale|Schuylerville|Soundview|Spuyten Duyvil|Throgs Neck|Tremont|Unionport|University Heights|Van Nest|Wakefield|West Farms|Westchester Square|Williamsbridge|Woodlawn" },
  "Staten Island": { c: [40.5795, -74.1502], hoods: "Arden Heights|Arrochar|Bay Terrace, Staten Island|Bull's Head|Castleton Corners|Clifton|Concord|Dongan Hills|Eltingville|Emerson Hill|Graniteville|Grant City|Great Kills|Grymes Hill|Howland Hook|Huguenot|Lighthouse Hill|Mariners Harbor|Midland Beach|New Brighton|New Dorp|New Dorp Beach|New Springville|Oakwood|Port Richmond|Prince's Bay|Randall Manor|Rosebank|Rossville|Shore Acres|Silver Lake|South Beach|St. George|Stapleton|Todt Hill|Tompkinsville|Tottenville|West Brighton|Westerleigh|Willowbrook" }
};

// Order must match the model's classes_ (used by predict_proba)
const CLASSES = [
  { key: "Entire home/apt", name: "Entire home or apartment", letter: "E", cls: "b-home",    color: "var(--home)" },
  { key: "Private room",    name: "Private room",             letter: "P", cls: "b-private", color: "var(--private)" },
  { key: "Shared room",     name: "Shared room",              letter: "S", cls: "b-shared",  color: "var(--shared)" }
];

const PRESETS = [
  { g: "Manhattan", n: "Midtown",          lat: 40.7549, lng: -73.9840, price: 220, mn: 2, rev: 85, rpm: 1.8, host: 3, av: 220 },
  { g: "Brooklyn",  n: "Bedford-Stuyvesant", lat: 40.6872, lng: -73.9418, price: 75,  mn: 3, rev: 40, rpm: 1.1, host: 1, av: 150 },
  { g: "Queens",    n: "Jamaica",          lat: 40.7027, lng: -73.7890, price: 35,  mn: 1, rev: 12, rpm: 0.6, host: 5, av: 330 }
];

/* ---------- Helpers ---------- */
const $ = (id) => document.getElementById(id);
const form = $("form"), hoodSel = $("neighbourhood"), boroughBox = $("boroughs");
let borough = "";

/* ---------- Theme ---------- */
const root = document.documentElement;
function setTheme(t) {
  root.dataset.theme = t;
  $("themeBtn").setAttribute("aria-label", t === "dark" ? "Switch to light theme" : "Switch to dark theme");
  try { localStorage.setItem("theme", t); } catch (e) {}
}
let saved = null;
try { saved = localStorage.getItem("theme"); } catch (e) {}
setTheme(saved || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light"));
$("themeBtn").addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));

/* ---------- Borough chips + neighbourhood list ---------- */
Object.keys(BOROUGHS).forEach((name) => {
  const btn = document.createElement("button");
  btn.type = "button"; btn.className = "borough"; btn.setAttribute("role", "radio");
  btn.setAttribute("aria-checked", "false"); btn.dataset.name = name;
  btn.innerHTML = `<i class="b">${name[0]}</i>${name}`;
  btn.addEventListener("click", () => selectBorough(name, true));
  boroughBox.appendChild(btn);
});

function selectBorough(name, fillCoords) {
  borough = name;
  boroughBox.querySelectorAll(".borough").forEach((b) => b.setAttribute("aria-checked", String(b.dataset.name === name)));
  hoodSel.innerHTML = '<option value="">Select a neighbourhood</option>' +
    BOROUGHS[name].hoods.split("|").map((h) => `<option>${h}</option>`).join("");
  if (fillCoords) {
    $("latitude").value = BOROUGHS[name].c[0];
    $("longitude").value = BOROUGHS[name].c[1];
  }
}

/* ---------- Slider ---------- */
const avail = $("availability_365");
function paintSlider() {
  avail.style.setProperty("--p", (avail.value / avail.max * 100) + "%");
  $("availOut").textContent = avail.value + " days";
}
avail.addEventListener("input", paintSlider);
paintSlider();

/* ---------- Presets ---------- */
document.querySelectorAll("[data-preset]").forEach((btn) =>
  btn.addEventListener("click", () => {
    const p = PRESETS[btn.dataset.preset];
    selectBorough(p.g, false);
    hoodSel.value = p.n;
    $("latitude").value = p.lat; $("longitude").value = p.lng; $("price").value = p.price;
    $("minimum_nights").value = p.mn; $("number_of_reviews").value = p.rev;
    $("reviews_per_month").value = p.rpm; $("calculated_host_listings_count").value = p.host;
    avail.value = p.av; paintSlider();
    form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));
    $("formError").hidden = true;
  })
);

/* ---------- API status ---------- */
const apiBase = () => $("apiBase").value.trim().replace(/\/+$/, "");
async function checkApi() {
  const dot = $("dot");
  try {
    const r = await fetch(apiBase() + "/", { cache: "no-store" });
    if (!r.ok) throw new Error();
    dot.className = "dot up"; $("dotText").textContent = "API online";
  } catch (e) {
    dot.className = "dot down"; $("dotText").textContent = "API offline";
  }
}
try { const s = localStorage.getItem("apiBase"); if (s) $("apiBase").value = s; } catch (e) {}
$("apiBase").addEventListener("change", () => {
  try { localStorage.setItem("apiBase", apiBase()); } catch (e) {}
  checkApi();
});
checkApi();

/* ---------- Submit ---------- */
function showError(msg) { const e = $("formError"); e.textContent = msg; e.hidden = false; }

form.addEventListener("submit", async (ev) => {
  ev.preventDefault();
  $("formError").hidden = true;
  form.querySelectorAll(".invalid").forEach((el) => el.classList.remove("invalid"));

  if (!borough) { showError("Choose a neighbourhood group (borough) first."); return; }
  const bad = [...form.querySelectorAll("input,select")].filter((el) => !el.checkValidity());
  if (bad.length) {
    bad.forEach((el) => el.classList.add("invalid"));
    bad[0].focus();
    showError("Some fields are empty or out of range. Check the highlighted ones.");
    return;
  }

  const num = (id) => Number($(id).value);
  const payload = {
    neighbourhood_group: borough,
    neighbourhood: hoodSel.value,
    latitude: num("latitude"), longitude: num("longitude"),
    price: num("price"), minimum_nights: Math.trunc(num("minimum_nights")),
    number_of_reviews: Math.trunc(num("number_of_reviews")),
    reviews_per_month: num("reviews_per_month"),
    calculated_host_listings_count: Math.trunc(num("calculated_host_listings_count")),
    availability_365: Math.trunc(num("availability_365"))
  };

  const btn = $("submit");
  btn.disabled = true; btn.classList.add("loading"); btn.querySelector(".label").textContent = "Predicting";
  try {
    const res = await fetch(apiBase() + "/predict", {
      method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload)
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const d = data.detail;
      const msg = Array.isArray(d) ? d.map((x) => `${(x.loc || []).slice(-1)}: ${x.msg}`).join("; ") : (d || res.statusText);
      throw new Error(msg);
    }
    renderResult(data);
    checkApi();
  } catch (err) {
    showError(err instanceof TypeError
      ? "Can't reach the API. Start it with: uvicorn main:app --reload, then check the address under API."
      : "The API rejected this listing: " + err.message);
  } finally {
    btn.disabled = false; btn.classList.remove("loading"); btn.querySelector(".label").textContent = "Predict again";
  }
});

/* ---------- Result ---------- */
function countUp(el, to, ms) {
  const t0 = performance.now();
  (function tick(t) {
    const k = Math.min((t - t0) / ms, 1);
    el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3)));
    if (k < 1) requestAnimationFrame(tick);
  })(t0);
}

function renderResult(data) {
  const probs = data.Probability || [];
  const topIdx = Math.max(0, CLASSES.findIndex((c) => c.key === data.prediction));
  const top = CLASSES[topIdx];
  const topPct = Math.round((probs[topIdx] ?? 0) * 100);

  $("empty").hidden = true;
  const out = $("out");
  out.hidden = false;

  const bullet = $("bigBullet");
  bullet.className = "b big " + top.cls;
  bullet.textContent = top.letter;
  bullet.style.animation = "none"; void bullet.offsetWidth; bullet.style.animation = "";

  $("verdict").textContent = top.name;
  countUp($("confNum"), topPct, 900);

  const list = $("bars");
  list.innerHTML = CLASSES.map((c, i) => {
    const p = Math.round((probs[i] ?? 0) * 1000) / 10;
    return `<li class="${i === topIdx ? "top" : ""}">
      <i class="b ${c.cls}">${c.letter}</i>
      <div><div class="name">${c.name}</div><div class="track"><div class="fill" data-w="${p}" style="background:${c.color}"></div></div></div>
      <span class="pct">${p.toFixed(1)}%</span></li>`;
  }).join("");
  requestAnimationFrame(() => requestAnimationFrame(() =>
    list.querySelectorAll(".fill").forEach((f, i) => setTimeout(() => (f.style.width = f.dataset.w + "%"), i * 120))
  ));

  $("note").textContent = topPct < 60
    ? "The model is torn between types here, so treat this as a lean rather than a verdict."
    : "Confidence is the share of the model's trees that voted for this type.";
  out.classList.remove("reveal"); void out.offsetWidth; out.classList.add("reveal");
  if (matchMedia("(max-width: 900px)").matches) out.scrollIntoView({ behavior: "smooth", block: "center" });
}

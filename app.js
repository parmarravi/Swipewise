// Swipewise Core Application Logic
let cardMetadata = {};
let walletState = {};

// Default initial wallet cards to activate
const DEFAULT_WALLET_STATE = {
  amazon: true,
  sbi: true,
  mmt: true,
  hdfc: true,
  infinia: false,
  regalia: false,
  millennia: false,
  tataneu: false,
  sbicashback: false,
  sbiaurum: false,
  axisace: false,
  axisatlas: false,
  axisflipkart: false,
  axisneo: false,
  icicicoral: false,
  icicisapphiro: false,
  amexplat: false,
  amexgold: false,
  hsbccash: false,
  idfcwealth: false
};

// Copyable AI Prompt template fallback
let AI_PROMPT_TEMPLATE = `Search the web and build a curated dataset of the top 20 most popular, highly-rated, and actively recommended credit cards available in India as of mid-2026.

The goal is to generate a production-ready JSON dataset for a credit card recommendation/rewards engine.

-----------------------------------
CARD SELECTION METHODOLOGY
-----------------------------------

The AI agent MUST first identify and shortlist the top 20 cards using a balanced and research-driven methodology instead of randomly selecting cards.

Selection criteria MUST include:

1. Market Popularity
- Frequently recommended by Indian credit card communities, Reddit India, CardMaven, Technofino, CardExpert, ValueResearch, ET Money, Mint, etc.
- Widely issued and actively used cards in India.

2. Coverage Across Categories
The final 20 cards MUST contain a balanced mix across:
- Cashback cards
- Premium travel cards
- Ultra-premium luxury cards
- Entry-level rewards cards
- Dining cards
- Fuel cards
- Co-branded retail cards
- Airline/hotel cards
- UPI-focused cards
- Lifestyle cards
- Forex/international spend cards

3. Issuer Diversity
Do NOT overload one bank.
Distribute cards across major issuers such as:
- HDFC Bank
- ICICI Bank
- SBI Card
- Axis Bank
- American Express
- HSBC
- IDFC FIRST
- YES Bank
- AU Bank
- Kotak
- Standard Chartered
- IndusInd
- Federal Bank
- RBL Bank
- Others if relevant

4. Real-World Reward Strength
Prioritize cards known for:
- High effective reward rates
- Strong transfer partners
- Lounge access
- Milestone benefits
- Travel value
- Cashback efficiency
- Low forex markup
- Strong ecosystem partnerships

5. Recent Relevance (2025–2026)
Cards MUST be validated against recent devaluations or upgrades.
Avoid outdated legacy cards unless still strongly competitive.

6. Data Availability
Only include cards where:
- Official fees
- Reward structures
- Lounge policies
- T&C pages
- Spend exclusions
can be verified through live web sources.

-----------------------------------
RESEARCH REQUIREMENTS
-----------------------------------

For EACH selected card:
- Research latest official bank pages and T&C PDFs
- Cross-check reward logic using trusted Indian card analysis platforms
- Verify:
  - Joining fee
  - Annual fee
  - Fee waiver rules
  - Domestic lounge policy
  - International lounge policy
  - Reward earning structure
  - Reward redemption value
  - Category exclusions
  - Recent devaluations (if any)

-----------------------------------
OUTPUT REQUIREMENTS
-----------------------------------

Format the final output as ONE single valid JSON object.

Output ONLY the JSON.
Do NOT include:
- markdown explanations
- notes
- analysis
- tables
- conversational text
- code comments outside JSON

The JSON must be directly savable as:
swipewise_top20.json

-----------------------------------
JSON SCHEMA
-----------------------------------

{
  "card_unique_id": {
    "id": "card_unique_id",
    "name": "Full Card Name",
    "issuer": "Issuer Name",
    "source": "Primary verification source and date",
    "source_url": "https://official-or-verification-url.com",
    "tagline": "Short summary of the card",
    "is_devalued": true,
    "pointToInr": 0.25,
    "lounge": "Domestic and international lounge rules",
    "fees": "Joining and annual fee details",
    "waiver": "Annual fee waiver criteria",
    "bestUse": "Best spending categories",
    "worstUse": "Categories with exclusions or poor rewards",
    "calcType": "percentage",
    "spendIncrement": 150,
    "multipliers": {
      "groceries": 1,
      "dining": 1,
      "default": 1
    },
    "rates": {
      "amazon": 1.33,
      "amazon-nonprime": 1.33,
      "groceries": 1.33,
      "dining": 5.33,
      "swiggy-zomato": 1.33,
      "utility": 0.0,
      "mmt-hotels": 6.66,
      "mmt-flights": 6.66,
      "international": 2.0,
      "general": 1.33,
      "default": 1.33
    }
  }
}

-----------------------------------
FIELD RULES
-----------------------------------

1. id
- Use lowercase alphanumeric slug
Examples:
- hdfcinfinia
- sbicashback
- iciciamazonpay

2. source_url
Must contain a real live URL from:
- Official bank portal
- Official T&C PDF
- Trusted Indian finance/card analysis website

3. is_devalued
true:
- if major reward/lounges/features were reduced in 2025/2026

false:
- if stable or improved

4. calcType allowed values ONLY:
- percentage
- points_by_spend
- points_by_value
- amex

5. Reward Rate Calculation Rules
All values inside "rates" MUST represent FINAL NET RETURN %.

Example:
If:
- 4 reward points per ₹150
- 1 RP = ₹0.25

Then:
(4 × 0.25) / 150 × 100
= 0.66%

Use the FINAL calculated percentage only.

6. Mandatory "rates" keys:
- amazon
- amazon-nonprime
- groceries
- dining
- swiggy-zomato
- utility
- mmt-hotels
- mmt-flights
- international
- general
- default

7. Lounge Rules
Mention:
- number of visits
- domestic/international
- spend-based unlock conditions if applicable

8. Reward Exclusions
Explicitly consider:
- fuel
- rent
- wallet loads
- education
- insurance
- utilities
- government payments

9. Accuracy Priority
Prefer:
- official bank data
over
- blogs/forums

Use blogs/forums only for:
- reward interpretation
- real-world valuation
- devaluation tracking

10. Final Dataset Quality Goal
The resulting JSON should be suitable for:
- rewards optimization engines
- AI recommendation systems
- fintech apps
- card comparison platforms
- spend simulation systems`;

// Fetch prompt from external file prompt.txt on load
async function loadPromptTemplate() {
  try {
    const response = await fetch('./prompt.txt');
    if (!response.ok) throw new Error("Failed to fetch prompt.txt");
    AI_PROMPT_TEMPLATE = await response.text();
    console.log("Loaded AI prompt template from prompt.txt.");
  } catch (error) {
    console.warn("Could not load prompt.txt via fetch (possibly file:// CORS restriction). Using inlined fallback.", error);
  }
}

// Setup application on load
window.onload = async function () {
  await loadCardDatabase();
  await loadPromptTemplate();
  initializeWalletState();
  initCardDeckBinder();
  setupEventListeners();
  updateLastUpdatedIndicator();
  populatePromptUI();
};

// Load database from LocalStorage or cards.json
async function loadCardDatabase() {
  try {
    const customCardsStr = localStorage.getItem('swipewise_custom_cards');
    if (customCardsStr) {
      cardMetadata = JSON.parse(customCardsStr);
      console.log("Loaded custom cards database from local storage.");
    } else {
      const response = await fetch('./cards.json');
      if (!response.ok) throw new Error("Failed to fetch default cards database.");
      cardMetadata = await response.json();
      console.log("Loaded default cards database via fetch.");
    }
  } catch (error) {
    console.error("Database loading failed:", error);
    alert("Could not load card database. If you are running locally via the file:// protocol, please run a local server (e.g. run 'python3 -m http.server' in the project directory) or upload a configuration file.");
  }
}

// Load or initialize wallet selection state
function initializeWalletState() {
  const storedWallet = localStorage.getItem('swipewise_wallet_state');
  if (storedWallet) {
    try {
      walletState = JSON.parse(storedWallet);
    } catch (e) {
      walletState = { ...DEFAULT_WALLET_STATE };
    }
  } else {
    walletState = { ...DEFAULT_WALLET_STATE };
  }
}

// Persist current wallet choices
function saveWalletState() {
  localStorage.setItem('swipewise_wallet_state', JSON.stringify(walletState));
}

// Populate the prompt code box in home UI
function populatePromptUI() {
  const el = document.getElementById('ai-prompt-box');
  if (el) {
    el.innerText = AI_PROMPT_TEMPLATE;
  }
}

// Set up UI Event listeners
function setupEventListeners() {
  const dragZone = document.getElementById('upload-zone');
  const fileInput = document.getElementById('file-input');

  if (dragZone && fileInput) {
    // Click zone triggers input file dialog
    dragZone.addEventListener('click', () => fileInput.click());

    fileInput.addEventListener('change', (e) => {
      if (e.target.files.length > 0) {
        handleUploadedFile(e.target.files[0]);
      }
    });

    // Drag-over styling hooks
    dragZone.addEventListener('dragover', (e) => {
      e.preventDefault();
      dragZone.classList.add('dragover');
    });

    dragZone.addEventListener('dragleave', () => {
      dragZone.classList.remove('dragover');
    });

    dragZone.addEventListener('drop', (e) => {
      e.preventDefault();
      dragZone.classList.remove('dragover');
      if (e.dataTransfer.files.length > 0) {
        handleUploadedFile(e.dataTransfer.files[0]);
      }
    });
  }
}

// Handle file parsing and validation
function handleUploadedFile(file) {
  const isJson = file.name.endsWith('.json');
  const isPdf = file.name.endsWith('.pdf');

  if (isPdf) {
    // Friendly reminder about PDF -> AI -> JSON flow
    showModal('pdf-guide-modal');
    return;
  }

  if (!isJson) {
    alert("Please upload a valid .json configuration file.");
    return;
  }

  const reader = new FileReader();
  reader.onload = function (e) {
    try {
      const parsedData = JSON.parse(e.target.result);

      // Validate schema
      if (typeof parsedData !== 'object' || parsedData === null) {
        throw new Error("Invalid JSON structure.");
      }

      // Check at least one card structure
      const sampleCard = Object.values(parsedData)[0];
      if (!sampleCard || !sampleCard.name || !sampleCard.rates) {
        throw new Error("JSON structure does not match Swipewise cards configuration schema.");
      }

      // Update Database
      // If uploading updates to existing, merge them, otherwise overwrite
      const mergedDatabase = { ...cardMetadata, ...parsedData };
      localStorage.setItem('swipewise_custom_cards', JSON.stringify(mergedDatabase));

      // Update Timestamp
      const now = new Date();
      localStorage.setItem('swipewise_updated_at', now.toISOString());

      // Success notification
      alert("Database updated successfully! Swipewise will now refresh to apply changes.");

      // Automatic Screen Refresh
      window.location.reload();

    } catch (err) {
      alert("Error parsing JSON: " + err.message);
    }
  };
  reader.readAsText(file);
}

// Process pasted JSON content directly
function handlePastedJson() {
  const pasteArea = document.getElementById('json-paste-area');
  let jsonText = pasteArea.value.trim();

  if (!jsonText) {
    alert("Please paste JSON text first.");
    return;
  }

  // Strip markdown code block wrapper if present
  if (jsonText.startsWith('```')) {
    jsonText = jsonText.replace(/^```(?:json)?\n?/, '').replace(/\n?```$/, '').trim();
  }

  try {
    const parsedData = JSON.parse(jsonText);

    // Schema validation
    const sampleCard = Object.values(parsedData)[0];
    if (!sampleCard || !sampleCard.name || !sampleCard.rates) {
      throw new Error("Pasted content does not match card structure.");
    }

    const mergedDatabase = { ...cardMetadata, ...parsedData };
    localStorage.setItem('swipewise_custom_cards', JSON.stringify(mergedDatabase));

    const now = new Date();
    localStorage.setItem('swipewise_updated_at', now.toISOString());

    alert("Database updated successfully! Refreshing view...");
    window.location.reload();
  } catch (err) {
    alert("Parsing Error: Make sure your text is a valid JSON block.\nDetails: " + err.message);
  }
}

// Reset custom updates to original database
function resetDatabase() {
  if (confirm("Are you sure you want to revert all changes and load default system card definitions?")) {
    localStorage.removeItem('swipewise_custom_cards');
    localStorage.removeItem('swipewise_updated_at');
    window.location.reload();
  }
}

// Parse date from data source string and calculate lag dynamically
function getCardLagString(sourceStr) {
  if (!sourceStr) return "Lag untracked";
  const match = sourceStr.match(/(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*[\s,]+(20\d{2})/i);
  if (match) {
    const months = {
      jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11
    };
    const monthName = match[1].toLowerCase().substring(0, 3);
    const year = parseInt(match[2]);
    const month = months[monthName];
    if (month !== undefined) {
      const sourceDate = new Date(year, month, 1);
      const diffMs = Date.now() - sourceDate.getTime();
      const diffMonths = Math.floor(diffMs / (1000 * 60 * 60 * 24 * 30));
      if (diffMonths <= 0) return "Up to date";
      return `${diffMonths} month${diffMonths > 1 ? 's' : ''} lag`;
    }
  }
  return "Lag untracked";
}

// Update "Last updated at" info block
function updateLastUpdatedIndicator() {
  const indicator = document.getElementById('last-updated-time');
  const updatedTime = localStorage.getItem('swipewise_updated_at');

  if (indicator) {
    if (updatedTime) {
      const date = new Date(updatedTime);
      const formatted = date.toLocaleDateString('en-IN', {
        day: '2-digit', month: 'short', year: 'numeric',
        hour: '2-digit', minute: '2-digit', hour12: true
      });
      const diffMs = Date.now() - date.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const lagText = diffDays === 0 ? "today" : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      indicator.innerHTML = `🛡️ Data source: <strong>Custom AI Configuration</strong> (Updated: ${formatted} - ${lagText})`;
      indicator.classList.remove('text-slate-400');
      indicator.classList.add('text-indigo-400');
    } else {
      const presetDate = new Date("2026-05-23T17:40:00+05:30");
      const diffMs = Date.now() - presetDate.getTime();
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const lagText = diffDays === 0 ? "today" : `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
      indicator.innerHTML = `🛡️ Data source: <strong>Default System Presets</strong> (Last updated: May 23, 2026 - ${lagText})`;
    }
  }
}

// Core Card Reward Optimizer engine
function calculateCardReward(card, amount, category) {
  let rate = card.rates[category] !== undefined ? card.rates[category] : card.rates.default;

  // Custom conditional rule logic for special cards
  if (card.id === 'amexplat') {
    if (amount >= 15000) {
      rate = 4.8;
    } else {
      rate = 1.2;
    }
  }

  let value = amount * (rate / 100);
  let points = value;

  if (card.calcType === 'points_by_spend') {
    const mult = card.multipliers[category] !== undefined ? card.multipliers[category] : card.multipliers.default;
    // Points = (amount / spendIncrement) * multiplier
    const rawPoints = (amount / card.spendIncrement) * mult;
    points = Math.floor(rawPoints);
    value = points * card.pointToInr;
    // Keep rate aligned with absolute percentage yield
    rate = amount > 0 ? (value / amount) * 100 : 0;
  } else if (card.calcType === 'points_by_value') {
    points = Math.floor(value / card.pointToInr);
  } else if (card.calcType === 'amex') {
    points = Math.floor(amount / 50);
  } else {
    // default flat percentage cashback
    points = value;
  }

  return {
    rate: Number(rate.toFixed(2)),
    value: Number(value.toFixed(2)),
    points: Math.floor(points)
  };
}

// Copy prompt template to user clipboard
function copyAIPrompt() {
  navigator.clipboard.writeText(AI_PROMPT_TEMPLATE)
    .then(() => {
      const copyBtn = document.getElementById('copy-prompt-btn');
      const originalText = copyBtn.innerText;
      copyBtn.innerText = "✓ Prompt Copied!";
      copyBtn.classList.remove('bg-indigo-600');
      copyBtn.classList.add('bg-emerald-600');

      setTimeout(() => {
        copyBtn.innerText = originalText;
        copyBtn.classList.remove('bg-emerald-600');
        copyBtn.classList.add('bg-indigo-600');
      }, 2000);
    })
    .catch(err => {
      alert("Failed to copy prompt to clipboard. Please select the text box contents manually.");
    });
}

// Modal Helpers
function showModal(id) {
  document.getElementById(id).classList.remove('hidden');
  document.getElementById(id).classList.add('flex');
}

function closeModal(id) {
  document.getElementById(id).classList.remove('flex');
  document.getElementById(id).classList.add('hidden');
}

// UI Rendering Hooks (Ported from original, refactored for new database loader)
function initCardDeckBinder() {
  const grid = document.getElementById('deck-grid');
  if (!grid) return;
  grid.innerHTML = '';

  for (const key in cardMetadata) {
    const card = cardMetadata[key];
    const checked = walletState[key] ? 'checked' : '';

    const cardBadge = document.createElement('div');
    cardBadge.className = `p-2 rounded-xl border select-none transition-all duration-300 flex items-center gap-2.5 cursor-pointer ${walletState[key] ? 'card-checkbox-active bg-slate-800/80 border-indigo-500/50 shadow-md shadow-indigo-500/5' : 'bg-slate-950/60 border-slate-900'}`;
    cardBadge.setAttribute('onclick', `toggleBinderCard('${key}')`);
    cardBadge.innerHTML = `
      <input type="checkbox" id="deck-cb-${key}" ${checked} class="w-3.5 h-3.5 rounded text-indigo-500 bg-slate-900 border-slate-700 pointer-events-none" onclick="event.stopPropagation();">
      <div class="overflow-hidden">
        <div class="text-[11px] font-bold text-slate-200 truncate">${card.name}</div>
        <div class="text-[9px] text-slate-500 font-medium">${card.issuer}</div>
      </div>
    `;
    grid.appendChild(cardBadge);
  }
  updateActiveWalletVisualList();
  populateBridgeCardSelect();
  populateStrategyDirectory();
  calculateOptimalCard();
}

function toggleBinderCard(key) {
  walletState[key] = !walletState[key];
  const checkbox = document.getElementById(`deck-cb-${key}`);
  if (checkbox) checkbox.checked = walletState[key];

  saveWalletState();
  initCardDeckBinder();
}

function massToggleWallet(state) {
  for (const key in walletState) {
    walletState[key] = state;
  }
  saveWalletState();
  initCardDeckBinder();
}

function updateActiveWalletVisualList() {
  const container = document.getElementById('active-wallet-list');
  if (!container) return;
  container.innerHTML = '';

  let count = 0;
  for (const key in walletState) {
    if (walletState[key] && cardMetadata[key]) {
      count++;
      const badge = document.createElement('span');
      badge.className = `text-[10px] font-bold px-2 py-1 rounded bg-slate-950 border border-slate-800 flex items-center gap-1.5`;
      badge.innerHTML = `<span class="w-1.5 h-1.5 rounded-full ${cardMetadata[key].badgeColor || 'bg-slate-500'}"></span> ${cardMetadata[key].name}`;
      container.appendChild(badge);
    }
  }

  if (count === 0) {
    container.innerHTML = `<span class="text-xs text-rose-400 italic font-medium">Your active wallet is empty! Select cards in the deck binder above.</span>`;
  }
}

function calculateOptimalCard() {
  const amountInput = document.getElementById('spend-amount-input');
  if (!amountInput) return;
  const amount = parseFloat(amountInput.value) || 0;
  const category = document.getElementById('spend-category').value;

  const calculatedResults = [];
  for (const key in cardMetadata) {
    const card = cardMetadata[key];
    const results = calculateCardReward(card, amount, category);
    calculatedResults.push({
      id: key,
      name: card.name,
      tagline: card.tagline,
      colors: card.colors,
      border: card.border,
      badgeColor: card.badgeColor,
      textColor: card.textColor,
      themeBg: card.themeBg,
      accentColor: card.accentColor,
      rewardsUnit: card.rewardsUnit,
      rate: results.rate,
      val: results.value,
      points: results.points,
      owned: walletState[key]
    });
  }

  if (calculatedResults.length === 0) return;

  const absoluteBest = [...calculatedResults].sort((a, b) => b.val - a.val)[0];
  const ownedResults = calculatedResults.filter(item => item.owned);

  let recommended = null;
  let showOpportunityMissed = false;

  if (ownedResults.length > 0) {
    recommended = [...ownedResults].sort((a, b) => b.val - a.val)[0];
    if (absoluteBest.id !== recommended.id && absoluteBest.val > recommended.val) {
      showOpportunityMissed = true;
    }
  } else {
    recommended = absoluteBest;
  }

  renderRecommendation(recommended, showOpportunityMissed, absoluteBest, category, amount);
  renderComparisonList(calculatedResults, recommended ? recommended.id : null);
}

function renderRecommendation(rec, isMissedOpportunity, absoluteBest, category, amount) {
  if (!rec) return;

  const rName = document.getElementById('winner-name');
  const rTagline = document.getElementById('winner-tagline');
  const rCash = document.getElementById('winner-cash-value');
  const rRate = document.getElementById('winner-reward-rate');
  const rRationale = document.getElementById('winner-rationale');

  if (rName) rName.innerText = rec.name;
  if (rTagline) rTagline.innerText = rec.tagline;
  if (rCash) rCash.innerText = `₹${rec.val.toLocaleString('en-IN')}`;
  if (rRate) rRate.innerText = `${rec.rate}%`;

  let rationale = "";
  if (isMissedOpportunity) {
    rationale = `⚠️ You currently use <strong>${rec.name}</strong> giving you ₹${rec.val.toFixed(1)}, but you are missing out on <strong>₹${(absoluteBest.val - rec.val).toFixed(1)} more</strong> because you don't own the ${absoluteBest.name}!`;
  } else {
    rationale = `Selecting <strong>${rec.name}</strong> for ${category.replace('-', ' ')} transactions guarantees you get the maximum possible rate return of <strong>${rec.rate}%</strong>, earning you <strong>${rec.points} ${rec.rewardsUnit}</strong>.`;
  }

  if (category === 'international') {
    if (rec.id === 'axisatlas') {
      rationale += ` Atlas Card offers high 4% yield on overseas POS, making it highly robust for international travel limits.`;
    } else if (rec.id === 'mmt') {
      rationale += ` Additionally, the MMT Card charges a low 0.99% forex fee, netting you direct currency savings compared to normal cards charging 3.5%!`;
    }
  }

  if (rRationale) rRationale.innerHTML = rationale;

  const cardVisual = document.getElementById('winner-card-visual');
  if (cardVisual) {
    cardVisual.className = `w-56 h-36 rounded-2xl p-4 flex flex-col justify-between text-white shadow-2xl relative transition-all duration-500 hover:scale-105 select-none font-sans bg-gradient-to-br ${rec.colors} border ${rec.border}`;
    cardVisual.innerHTML = `
      <div class="flex justify-between items-start">
        <span class="text-[9px] font-bold tracking-widest opacity-90">${rec.name.toUpperCase()}</span>
        <span class="text-[10px] font-extrabold text-white/50">${rec.id.substring(0, 3).toUpperCase()}</span>
      </div>
      <div>
        <div class="text-[10px] font-mono tracking-widest opacity-80">•••• •••• •••• ${rec.id.length * 99}</div>
        <div class="flex justify-between items-end mt-1">
          <span class="text-[8px] uppercase tracking-wider opacity-60">Swipewise Optimized</span>
          <span class="text-[9px] font-bold text-amber-300">PREMIUM</span>
        </div>
      </div>
    `;
  }
}

function renderComparisonList(results, winnerId) {
  const listContainer = document.getElementById('comparison-list');
  if (!listContainer) return;
  listContainer.innerHTML = '';

  const sorted = [...results].sort((a, b) => b.val - a.val);

  sorted.forEach(card => {
    const isWinner = card.id === winnerId;
    const progressWidth = `${Math.min(100, (card.val / (sorted[0].val || 1)) * 100)}%`;

    let progressColor = 'bg-slate-700';
    if (isWinner) progressColor = 'bg-emerald-500';
    else if (card.val > 0) progressColor = 'bg-indigo-600/80';

    const cardItem = document.createElement('div');
    cardItem.className = `p-4 rounded-2xl border transition-all ${isWinner ? 'border-emerald-500/40 bg-slate-900/60' : 'border-slate-800 bg-slate-950/60'} flex flex-col sm:flex-row sm:items-center justify-between gap-4`;

    cardItem.innerHTML = `
      <div class="flex-grow space-y-2">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full ${card.badgeColor}"></span>
          <h5 class="text-xs sm:text-sm font-bold text-slate-200">${card.name}</h5>
          ${isWinner ? '<span class="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">Optimal choice</span>' : ''}
          ${!card.owned ? '<span class="text-[9px] font-bold tracking-wider uppercase px-2 py-0.5 rounded bg-rose-500/10 text-rose-400 border border-rose-500/20">Not in wallet</span>' : ''}
        </div>
        
        <div class="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
          <div class="${progressColor} h-full transition-all duration-700" style="width: ${progressWidth}"></div>
        </div>

        <div class="flex justify-between items-center text-[10px] text-slate-400">
          <span>Yield Rate: <strong>${card.rate}%</strong></span>
          <span>Points: <strong>${card.points} ${card.rewardsUnit}</strong></span>
        </div>
      </div>

      <div class="text-left sm:text-right shrink-0 border-t sm:border-t-0 border-slate-900 pt-2 sm:pt-0">
        <div class="text-[10px] uppercase font-bold text-slate-500">Effective Cash Value</div>
        <div class="text-lg font-black ${isWinner ? 'text-emerald-400' : 'text-slate-300'}">₹${card.val.toLocaleString('en-IN')}</div>
      </div>
    `;

    listContainer.appendChild(cardItem);
  });
}

function populateBridgeCardSelect() {
  const select = document.getElementById('bridge-card');
  if (!select) return;
  select.innerHTML = '';

  for (const key in cardMetadata) {
    const card = cardMetadata[key];
    const option = document.createElement('option');
    option.value = key;
    option.innerText = `${card.name} (1 pt = ₹${card.pointToInr})`;
    select.appendChild(option);
  }
}

function runBridgeCalculator() {
  const cardSelect = document.getElementById('bridge-card');
  if (!cardSelect) return;
  const cardId = cardSelect.value;
  const targetVal = parseFloat(document.getElementById('bridge-target-value').value) || 0;
  const currentPoints = parseFloat(document.getElementById('bridge-current-points').value) || 0;

  const card = cardMetadata[cardId];
  if (!card) return;

  const pointValue = card.pointToInr;
  const currentCashVal = currentPoints * pointValue;
  const shortfall = Math.max(0, targetVal - currentCashVal);

  document.getElementById('bridge-disp-target').innerText = `₹${targetVal.toLocaleString('en-IN')}`;
  document.getElementById('bridge-disp-current-val').innerText = `₹${currentCashVal.toLocaleString('en-IN')}`;
  document.getElementById('bridge-disp-shortfall').innerText = `₹${shortfall.toLocaleString('en-IN')}`;

  const strategyContainer = document.getElementById('bridge-strategy-details');
  let strategyHtml = "";

  if (shortfall <= 0) {
    strategyHtml = `
      <div class="flex items-center gap-2 text-emerald-400 font-bold">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
        <span>Goal Achieved! You have enough points to redeem this reward immediately.</span>
      </div>
    `;
  } else {
    const pointsNeeded = Math.ceil(shortfall / pointValue);
    strategyHtml = `
      <p class="mb-2">To clear your remaining <strong>₹${shortfall.toLocaleString('en-IN')} shortfall</strong>, you must accrue <strong>${pointsNeeded.toLocaleString('en-IN')} ${card.rewardsUnit}</strong>.</p>
      <p class="mb-3 font-semibold text-indigo-400">Recommended Accelerated Strategies:</p>
      <ul class="list-disc pl-4 space-y-1.5 text-slate-300">
    `;

    if (card.issuer === 'HDFC') {
      const reqSmartbuy = Math.ceil(shortfall / 0.165);
      const reqNormal = Math.ceil(shortfall / 0.033);
      strategyHtml += `
        <li><strong>SmartBuy Acceleration:</strong> Spend approximately ₹${reqSmartbuy.toLocaleString('en-IN')} via HDFC SmartBuy shopping portal (10X rewards = 16.5% return) to cover points instantly.</li>
        <li><strong>Standard Purchase Limit:</strong> General card swiping would require high expenditures up to ₹${reqNormal.toLocaleString('en-IN')}.</li>
        <li><strong>HDFC Point Purchasing:</strong> Points can also be co-paid (at ₹0.25 to ₹1.0 depending on flights/catalogs) directly inside NetBanking portal.</li>
      `;
    } else if (card.issuer === 'SBI') {
      const sbiMultiplierSpend = Math.ceil(shortfall / 0.033);
      strategyHtml += `
        <li><strong>Voucher Procurement (Gyftr):</strong> Purchase digital vouchers using SBI Gyftr store to gain instant 5X or 10X reward multipliers.</li>
        <li><strong>Offline Spend Accelerator:</strong> Offline grocery/dining expenditures worth ₹${sbiMultiplierSpend.toLocaleString('en-IN')} will also clear the point gap faster.</li>
      `;
    } else if (card.issuer === 'AMEX') {
      strategyHtml += `
        <li><strong>Amex Reward Multiplier:</strong> Purchase gift cards (Amazon, Flipkart) via Amex Multiplier portal to score instant 5X reward points (worth ~10% back).</li>
        <li><strong>Milestone Strategy:</strong> Complete immediate spend challenges (₹1.9 Lakh or ₹4 Lakh milestones) to yield bonus lump-sum point deposits of 15,000 to 24,000 MR points.</li>
      `;
    } else if (card.issuer === 'AXIS') {
      const axisTravel = Math.ceil(shortfall / 0.10);
      strategyHtml += `
        <li><strong>Direct Travel Acceleration:</strong> Book direct flights or hotel packages worth ₹${axisTravel.toLocaleString('en-IN')} to earn the 10% milestone boost of Atlas/Ace.</li>
        <li><strong>Axis Grab Deals:</strong> Access the Grab Deals site for up to 5X multipliers across major online e-commerce partners.</li>
      `;
    } else {
      const generalSpend = Math.ceil(shortfall / 0.02);
      strategyHtml += `
        <li><strong>Standard Accelerated Categories:</strong> Execute online transactions worth approximately ₹${generalSpend.toLocaleString('en-IN')} using co-branded partner programs to optimize rate gains.</li>
      `;
    }
    strategyHtml += `</ul>`;
  }
  strategyContainer.innerHTML = strategyHtml;
}

function populateStrategyDirectory() {
  const container = document.getElementById('strategy-grid');
  if (!container) return;
  container.innerHTML = '';

  for (const key in cardMetadata) {
    const card = cardMetadata[key];
    const cardItem = document.createElement('div');
    cardItem.className = `card-strategy-item bg-slate-950/80 border border-slate-800 hover:border-indigo-500/30 p-5 rounded-2xl space-y-4 transition-all`;
    cardItem.setAttribute('data-keywords', `${card.name} ${card.issuer} ${card.lounge} ${card.fees} ${card.bestUse}`.toLowerCase());

    cardItem.innerHTML = `
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2.5">
          <span class="w-3.5 h-3.5 rounded-full ${card.badgeColor || 'bg-slate-500'}"></span>
          <h4 class="font-extrabold text-slate-100 text-sm sm:text-base">${card.name}</h4>
        </div>
        <span class="text-[10px] bg-indigo-500/10 border border-indigo-500/20 text-indigo-400 px-2.5 py-1 rounded-full font-bold">${card.issuer}</span>
      </div>
      
      <div class="grid grid-cols-2 gap-2 text-[11px] text-slate-400 bg-slate-900/60 p-2.5 rounded-xl border border-slate-900">
        <div><strong class="text-slate-200">Joining / Annual:</strong> ${card.fees}</div>
        <div><strong class="text-slate-200">Fee Waiver:</strong> ${card.waiver}</div>
        <div><strong class="text-slate-200">Point Value:</strong> ₹${card.pointToInr}</div>
        <div><strong class="text-slate-200">Reward Unit:</strong> ${card.rewardsUnit}</div>
        <div class="col-span-2 border-t border-slate-800/60 pt-1.5 mt-0.5 flex justify-between items-center flex-wrap gap-1">
          <span><strong class="text-slate-200">Data Source:</strong> ${card.source || 'Default Preset'}</span>
          <span class="text-[10px] text-amber-500 font-bold bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded">${getCardLagString(card.source)}</span>
        </div>
      </div>

      <div class="space-y-2">
        <div>
          <h5 class="text-[11px] font-bold text-emerald-400 uppercase tracking-wide">🏆 Best To Use</h5>
          <p class="text-xs text-slate-300 leading-relaxed">${card.bestUse}</p>
        </div>
        <div>
          <h5 class="text-[11px] font-bold text-rose-400 uppercase tracking-wide">❌ Where Not To Use</h5>
          <p class="text-xs text-slate-300 leading-relaxed">${card.worstUse}</p>
        </div>
        <div class="border-t border-slate-900 pt-2.5 flex justify-between text-[11px] text-slate-400">
          <span class="truncate">✈️ Lounge: <strong>${card.lounge}</strong></span>
        </div>
      </div>
    `;
    container.appendChild(cardItem);
  }
}

function filterCardsStrategy() {
  const query = document.getElementById('directory-search').value.toLowerCase().trim();
  const items = document.querySelectorAll('.card-strategy-item');

  items.forEach(item => {
    const keywords = item.getAttribute('data-keywords');
    if (keywords.includes(query) || query === '') {
      item.style.display = 'block';
    } else {
      item.style.display = 'none';
    }
  });
}

function switchTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(el => el.classList.add('hidden'));
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('block'));

  const activeTab = document.getElementById(`tab-${tabId}`);
  if (activeTab) {
    activeTab.classList.remove('hidden');
    activeTab.classList.add('block');
  }

  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.className = "tab-btn px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 text-slate-400 hover:text-white hover:bg-slate-900";
  });

  const targetBtn = document.getElementById(`tab-btn-${tabId}`);
  if (targetBtn) {
    targetBtn.className = "tab-btn px-4 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all duration-300 bg-indigo-600 text-white shadow-md shadow-indigo-600/10";
  }

  if (tabId === 'bridging') {
    runBridgeCalculator();
  }
}

function dismissToast() {
  const el = document.getElementById('welcome-toast');
  if (el) el.classList.add('hidden');
}

function syncSpendAmountFromInput(value) {
  const parsedVal = parseInt(value);
  // Update range value if it is a valid number
  const range = document.getElementById('spend-amount-range');
  if (range && !isNaN(parsedVal)) {
    range.value = parsedVal;
  }
  calculateOptimalCard();
}

function syncSpendAmountFromRange(value) {
  const input = document.getElementById('spend-amount-input');
  if (input) {
    input.value = value;
  }
  calculateOptimalCard();
}

function clampSpendAmountOnBlur() {
  const input = document.getElementById('spend-amount-input');
  if (input) {
    let parsedVal = parseInt(input.value) || 0;
    parsedVal = Math.min(Math.max(parsedVal, 10), 500000); // Allow down to ₹10 as min limit specifies min="10"
    input.value = parsedVal;
    const range = document.getElementById('spend-amount-range');
    if (range) range.value = parsedVal;
    calculateOptimalCard();
  }
}


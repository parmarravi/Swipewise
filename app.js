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

// Load database from LocalStorage or cards.json fallback
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
    console.warn("Database fetch failed/blocked (possibly file:// scheme CORS). Falling back to local default cards database.", error);
    cardMetadata = JSON.parse(JSON.stringify(DEFAULT_CARDS_DATABASE));
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

// Inlined hardcoded fallback database for file:// local scheme execution
const DEFAULT_CARDS_DATABASE = {
  "amazon": {
    "id": "amazon",
    "name": "Amazon Pay ICICI Card",
    "issuer": "ICICI",
    "tagline": "Unlimited, direct cashback into your Amazon wallet.",
    "colors": "from-[#111111] to-[#333333]",
    "border": "border-[#FF9900]",
    "badgeColor": "bg-[#FF9900]",
    "textColor": "text-[#FF9900]",
    "themeBg": "#1f1f1f",
    "accentColor": "#FF9900",
    "rewardsUnit": "Amazon Pay Cash",
    "pointToInr": 1.0,
    "lounge": "None",
    "fees": "\u20b90 (Lifetime Free)",
    "waiver": "N/A",
    "bestUse": "All Amazon spends (5% Prime / 3% Non-Prime), flight bookings on Amazon, Utility Bills (2%).",
    "worstUse": "Local offline retail, offline groceries, rent payments, fuel, gold purchases.",
    "calcType": "percentage",
    "rates": {
      "amazon": 5.0,
      "amazon-nonprime": 3.0,
      "swiggy-zomato": 2.0,
      "utility": 2.0,
      "groceries": 1.0,
      "dining": 1.0,
      "general": 1.0,
      "mmt-hotels": 2.0,
      "mmt-flights": 2.0,
      "international": 1.0,
      "default": 1.0
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "sbi": {
    "id": "sbi",
    "name": "SBI SimplySAVE Card",
    "issuer": "SBI",
    "tagline": "Engineered for traditional brick-and-mortar neighborhood shoppers.",
    "colors": "from-[#005B94] to-[#0092D1]",
    "border": "border-[#00B0F0]",
    "badgeColor": "bg-[#00B0F0]",
    "textColor": "text-[#00B0F0]",
    "themeBg": "#023c66",
    "accentColor": "#00B0F0",
    "rewardsUnit": "Reward Points",
    "pointToInr": 0.25,
    "lounge": "None",
    "fees": "\u20b9499 + GST / Year",
    "waiver": "Spends above \u20b91 Lakh / Year",
    "bestUse": "Offline Departmental Stores, offline Supermarkets, Casual dining & offline movies (10X Points).",
    "worstUse": "E-commerce shopping, international travel bookings, digital utility payments.",
    "calcType": "points_by_spend",
    "spendIncrement": 150,
    "multipliers": {
      "groceries": 10,
      "dining": 10,
      "default": 1
    },
    "rates": {
      "groceries": 1.66,
      "dining": 1.66,
      "default": 0.16
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "mmt": {
    "id": "mmt",
    "name": "MMT ICICI Signature Card",
    "issuer": "ICICI",
    "tagline": "High reward multipliers for avid holiday and flight bookers.",
    "colors": "from-[#0052D4] to-[#4364F7]",
    "border": "border-[#0052D4]",
    "badgeColor": "bg-[#0052D4]",
    "textColor": "text-indigo-400",
    "themeBg": "#1e3c72",
    "accentColor": "#3a7bd5",
    "rewardsUnit": "MyCash Coins",
    "pointToInr": 1.0,
    "lounge": "8 Domestic + 1 International lounge access / Year (linked to spends)",
    "fees": "\u20b92,500 One-time fee (Lifetime Free post joining)",
    "waiver": "N/A (Joining vouchers offset the cost)",
    "bestUse": "MakeMyTrip flight bookings (3% rewards), holiday packages & hotels (6% rewards), low forex spends.",
    "worstUse": "Daily utility bills, fuel, insurance reloads, general physical retail.",
    "calcType": "points_by_spend",
    "spendIncrement": 200,
    "multipliers": {
      "mmt-hotels": 12,
      "mmt-flights": 6,
      "international": 3,
      "default": 1.25
    },
    "rates": {
      "mmt-hotels": 6.0,
      "mmt-flights": 3.0,
      "international": 0.75,
      "default": 0.625
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "hdfc": {
    "id": "hdfc",
    "name": "HDFC MoneyBack Plus Card",
    "issuer": "HDFC",
    "tagline": "A well-rounded classic starter card for daily online spending.",
    "colors": "from-[#0A2540] to-[#004B87]",
    "border": "border-[#004B87]",
    "badgeColor": "bg-[#004B87]",
    "textColor": "text-rose-400",
    "themeBg": "#00254c",
    "accentColor": "#004B87",
    "rewardsUnit": "CashPoints",
    "pointToInr": 0.25,
    "lounge": "None",
    "fees": "\u20b9500 + GST / Year",
    "waiver": "Spends above \u20b950,000 / Year",
    "bestUse": "Online shopping with partners (Amazon, Swiggy, Flipkart, BigBasket, Reliance Smart) (10X CashPoints).",
    "worstUse": "Direct booking of flights/hotels via direct portals, rent, offline payments, wallet loading.",
    "calcType": "points_by_spend",
    "spendIncrement": 150,
    "multipliers": {
      "amazon": 20,
      "amazon-nonprime": 20,
      "swiggy-zomato": 20,
      "groceries": 20,
      "default": 2
    },
    "rates": {
      "amazon": 3.33,
      "amazon-nonprime": 3.33,
      "swiggy-zomato": 3.33,
      "groceries": 3.33,
      "default": 0.33
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "infinia": {
    "id": "infinia",
    "name": "HDFC Infinia Metal Card",
    "issuer": "HDFC",
    "tagline": "Unbeatable ultra-premium card offering high rewards on flight/hotel redemptions.",
    "colors": "from-[#1a1a1a] to-[#434343]",
    "border": "border-slate-500",
    "badgeColor": "bg-slate-700",
    "textColor": "text-amber-400",
    "themeBg": "#121212",
    "accentColor": "#d4af37",
    "rewardsUnit": "Infinia Points",
    "pointToInr": 1.0,
    "lounge": "Unlimited domestic and international airport lounge access (unconditional)",
    "fees": "\u20b912,500 + GST / Year",
    "waiver": "Spends above \u20b910 Lakhs / Year",
    "bestUse": "SmartBuy flight/hotel bookings (up to 33% back), voucher purchases (up to 16.5% back), offline luxury spends (3.3%).",
    "worstUse": "Standard offline payments that earn base 3.3%, fuel stations, wallet transfers.",
    "calcType": "percentage",
    "rates": {
      "mmt-hotels": 16.5,
      "mmt-flights": 16.5,
      "amazon": 16.5,
      "swiggy-zomato": 3.3,
      "groceries": 3.3,
      "dining": 3.3,
      "default": 3.3
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "regalia": {
    "id": "regalia",
    "name": "HDFC Regalia Gold Card",
    "issuer": "HDFC",
    "tagline": "Elegant gold-tiered credit card with strong travel perks.",
    "colors": "from-[#b8860b] to-[#111111]",
    "border": "border-yellow-600",
    "badgeColor": "bg-yellow-600",
    "textColor": "text-yellow-400",
    "themeBg": "#3d300c",
    "accentColor": "#FFD700",
    "rewardsUnit": "Regalia Gold Points",
    "pointToInr": 0.5,
    "lounge": "12 Domestic and 6 International complimentary airport lounges / Year",
    "fees": "\u20b92,500 + GST / Year",
    "waiver": "Spends above \u20b93 Lakhs / Year",
    "bestUse": "SmartBuy hotel/flight bookings (6.6%), lifestyle products, Myntra & Nykaa brand spends (5X points).",
    "worstUse": "Utilities (reverts to base 1.3%), fuel transactions, tax payments.",
    "calcType": "points_by_value",
    "rates": {
      "mmt-flights": 6.66,
      "mmt-hotels": 6.66,
      "amazon": 3.33,
      "swiggy-zomato": 3.33,
      "default": 1.33
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "millennia": {
    "id": "millennia",
    "name": "HDFC Millennia Card",
    "issuer": "HDFC",
    "tagline": "Direct 5% cashback on multiple popular internet commerce brands.",
    "colors": "from-[#5f2c82] to-[#49a09d]",
    "border": "border-cyan-400",
    "badgeColor": "bg-cyan-500",
    "textColor": "text-cyan-300",
    "themeBg": "#213a52",
    "accentColor": "#00f2fe",
    "rewardsUnit": "Cashback \u20b9",
    "pointToInr": 1.0,
    "lounge": "8 Domestic Lounge visits / Year (linked to spends)",
    "fees": "\u20b91,000 + GST / Year",
    "waiver": "Spends above \u20b91 Lakh / Year",
    "bestUse": "Online partners like Amazon, Flipkart, Swiggy, Zomato, Myntra, BookMyShow (5% cashback).",
    "worstUse": "Offline stores (1%), insurance premiums, wallet loads (0%).",
    "calcType": "percentage",
    "rates": {
      "amazon": 5.0,
      "amazon-nonprime": 5.0,
      "swiggy-zomato": 5.0,
      "default": 1.0
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "tataneu": {
    "id": "tataneu",
    "name": "HDFC Tata Neu Infinity Card",
    "issuer": "HDFC",
    "tagline": "High returns in the Tata ecosystem and on daily UPI spend.",
    "colors": "from-[#E01E5A] to-[#2E0854]",
    "border": "border-rose-600",
    "badgeColor": "bg-rose-600",
    "textColor": "text-rose-400",
    "themeBg": "#541c30",
    "accentColor": "#E01E5A",
    "rewardsUnit": "NeuCoins",
    "pointToInr": 1.0,
    "lounge": "8 Domestic and 4 International Lounge visits / Year",
    "fees": "\u20b91,499 + GST / Year",
    "waiver": "Spends above \u20b93 Lakhs / Year",
    "bestUse": "Tata Neu ecosystem (BigBasket, 1mg, Tata Cliq, IHCL Hotels) (5% back), UPI payments (1.5%).",
    "worstUse": "Non-partner offline shops, government payments.",
    "calcType": "percentage",
    "rates": {
      "groceries": 5.0,
      "utility": 5.0,
      "amazon": 1.5,
      "swiggy-zomato": 1.5,
      "default": 1.5
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "sbicashback": {
    "id": "sbicashback",
    "name": "SBI Cashback Credit Card",
    "issuer": "SBI",
    "tagline": "Flat 5% online cashback with zero partner exceptions or limits.",
    "colors": "from-[#0051A8] to-[#1282A2]",
    "border": "border-sky-400",
    "badgeColor": "bg-sky-400",
    "textColor": "text-sky-300",
    "themeBg": "#024160",
    "accentColor": "#00D2FF",
    "rewardsUnit": "Cashback \u20b9",
    "pointToInr": 1.0,
    "lounge": "None",
    "fees": "\u20b9999 + GST / Year",
    "waiver": "Spends above \u20b92 Lakhs / Year",
    "bestUse": "All online transactions anywhere on the internet (Amazon, Flipkart, Swiggy, flights) (5% cash).",
    "worstUse": "Offline utility payments, offline supermarkets, school fees (1%).",
    "calcType": "percentage",
    "rates": {
      "amazon": 5.0,
      "amazon-nonprime": 5.0,
      "swiggy-zomato": 5.0,
      "mmt-flights": 5.0,
      "mmt-hotels": 5.0,
      "default": 1.0
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "sbiaurum": {
    "id": "sbiaurum",
    "name": "SBI Aurum Card",
    "issuer": "SBI",
    "tagline": "Premium black metal credit card with highly rewarding offline accelerators.",
    "colors": "from-[#0F0F10] to-[#2B2D2F]",
    "border": "border-amber-500",
    "badgeColor": "bg-amber-600",
    "textColor": "text-amber-500",
    "themeBg": "#1e1e1e",
    "accentColor": "#d4af37",
    "rewardsUnit": "Aurum Points",
    "pointToInr": 0.25,
    "lounge": "Unlimited domestic and international lounge access for cardholder and guests",
    "fees": "\u20b99,999 + GST / Year",
    "waiver": "Spends above \u20b912 Lakhs / Year",
    "bestUse": "High-volume international expenses (3.3%), dining venues (3.3%), movie tickets (Buy 1 Get 1 up to \u20b91000).",
    "worstUse": "Fuel stations, rental expenses, basic utilities.",
    "calcType": "points_by_value",
    "rates": {
      "groceries": 3.33,
      "dining": 3.33,
      "international": 3.33,
      "default": 1.66
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "axisace": {
    "id": "axisace",
    "name": "Axis Bank Ace Card",
    "issuer": "AXIS",
    "tagline": "Outstanding utility and physical merchant cashback tool.",
    "colors": "from-[#800020] to-[#3D0C11]",
    "border": "border-rose-900",
    "badgeColor": "bg-rose-900",
    "textColor": "text-rose-400",
    "themeBg": "#44040a",
    "accentColor": "#AE275F",
    "rewardsUnit": "Cashback \u20b9",
    "pointToInr": 1.0,
    "lounge": "4 Domestic airport lounge visits / Year",
    "fees": "\u20b9499 + GST / Year",
    "waiver": "Spends above \u20b92 Lakhs / Year",
    "bestUse": "Utility bills and recharges via Google Pay (5%), Swiggy & Zomato orders (4%), all general offline retail (1.5%).",
    "worstUse": "International transactions, government reloads, rent.",
    "calcType": "percentage",
    "rates": {
      "utility": 5.0,
      "swiggy-zomato": 4.0,
      "default": 1.5
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "axisatlas": {
    "id": "axisatlas",
    "name": "Axis Bank Atlas Card",
    "issuer": "AXIS",
    "tagline": "Miles-focused travel card with industry-leading rewards on direct airlines.",
    "colors": "from-[#0f172a] to-[#3b82f6]",
    "border": "border-blue-500",
    "badgeColor": "bg-blue-600",
    "textColor": "text-blue-400",
    "themeBg": "#091533",
    "accentColor": "#3b82f6",
    "rewardsUnit": "EDGE Miles",
    "pointToInr": 1.0,
    "lounge": "Up to 12 Domestic and 4 International lounge visits / Year (tiered by membership)",
    "fees": "\u20b95,000 + GST / Year",
    "waiver": "N/A (Rewarded with 10,000 bonus edge miles on joining/milestones)",
    "bestUse": "Direct Airline hotel portals & brand travel sites (10% miles), international offline POS spends (4%).",
    "worstUse": "Basic utility recharges, government services, insurance payments (0%).",
    "calcType": "percentage",
    "rates": {
      "mmt-flights": 10.0,
      "mmt-hotels": 10.0,
      "international": 4.0,
      "default": 2.0
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "axisflipkart": {
    "id": "axisflipkart",
    "name": "Axis Bank Flipkart Card",
    "issuer": "AXIS",
    "tagline": "Dedicated co-branded card offering direct Flipkart and partner rebates.",
    "colors": "from-[#2874F0] to-[#FFE11B]",
    "border": "border-blue-600",
    "badgeColor": "bg-blue-600",
    "textColor": "text-yellow-400",
    "themeBg": "#1e3c72",
    "accentColor": "#2874F0",
    "rewardsUnit": "Cashback \u20b9",
    "pointToInr": 1.0,
    "lounge": "4 Domestic airport lounge visits / Year",
    "fees": "\u20b9500 + GST / Year",
    "waiver": "Spends above \u20b92 Lakhs / Year",
    "bestUse": "Shopping on Flipkart & Myntra (5% flat), Swiggy, Uber, PVR orders (4%).",
    "worstUse": "Amazon shopping (1.5%), utilities (1.5%), fuel surcharge areas.",
    "calcType": "percentage",
    "rates": {
      "swiggy-zomato": 4.0,
      "mmt-flights": 5.0,
      "mmt-hotels": 5.0,
      "default": 1.5
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "axisneo": {
    "id": "axisneo",
    "name": "Axis Bank Neo Card",
    "issuer": "AXIS",
    "tagline": "Highly discounted entry-level card for online food ordering and recharges.",
    "colors": "from-[#cb202d] to-[#121212]",
    "border": "border-red-600",
    "badgeColor": "bg-red-600",
    "textColor": "text-red-400",
    "themeBg": "#3d0a0d",
    "accentColor": "#cb202d",
    "rewardsUnit": "EDGE Points",
    "pointToInr": 0.2,
    "lounge": "None",
    "fees": "\u20b9250 + GST / Year",
    "waiver": "Spends above \u20b91 Lakh / Year",
    "bestUse": "Ordering via Swiggy (40% discount up to \u20b9120 per order), Paytm utility recharges (10%).",
    "worstUse": "Large offline shopping, flights, international billing.",
    "calcType": "points_by_value",
    "rates": {
      "swiggy-zomato": 4.0,
      "utility": 5.0,
      "default": 0.2
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "icicicoral": {
    "id": "icicicoral",
    "name": "ICICI Coral Credit Card",
    "issuer": "ICICI",
    "tagline": "Entry-level card with dependable movie and restaurant benefits.",
    "colors": "from-[#FF6F61] to-[#DE6B48]",
    "border": "border-orange-500",
    "badgeColor": "bg-orange-500",
    "textColor": "text-orange-300",
    "themeBg": "#4a251a",
    "accentColor": "#FF6F61",
    "rewardsUnit": "Reward Points",
    "pointToInr": 0.25,
    "lounge": "4 Domestic Lounge visits / Year (linked to spends)",
    "fees": "\u20b9500 + GST / Year",
    "waiver": "Spends above \u20b91.5 Lakhs / Year",
    "bestUse": "Booking movie tickets on BookMyShow (25% discount), dining at partner restaurants.",
    "worstUse": "International luxury spends, high value e-commerce.",
    "calcType": "points_by_value",
    "rates": {
      "groceries": 1.0,
      "utility": 1.0,
      "default": 0.5
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "icicisapphiro": {
    "id": "icicisapphiro",
    "name": "ICICI Sapphiro Card",
    "issuer": "ICICI",
    "tagline": "Dual-branded (Visa/Amex) card offering premium dining and entertainment rewards.",
    "colors": "from-[#0F52BA] to-[#0A235C]",
    "border": "border-blue-700",
    "badgeColor": "bg-blue-700",
    "textColor": "text-blue-300",
    "themeBg": "#122543",
    "accentColor": "#0F52BA",
    "rewardsUnit": "Reward Points",
    "pointToInr": 0.25,
    "lounge": "16 Domestic and 2 International lounge access / Year (spends linked)",
    "fees": "\u20b93,500 + GST / Year",
    "waiver": "Spends above \u20b96 Lakhs / Year",
    "bestUse": "Weekend international offline expenses (1.5%), movie tickets (Buy 1 Get 1 on BMS).",
    "worstUse": "Everyday online checkout where co-branded cards deliver flat 5% value.",
    "calcType": "points_by_value",
    "rates": {
      "international": 1.5,
      "groceries": 1.0,
      "dining": 1.0,
      "default": 0.5
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "amexplat": {
    "id": "amexplat",
    "name": "Amex Platinum Travel Card",
    "issuer": "AMEX",
    "tagline": "Milestone card with massive rewards structure on annual expenditure goals.",
    "colors": "from-[#1E3F66] to-[#526E7D]",
    "border": "border-indigo-400",
    "badgeColor": "bg-indigo-600",
    "textColor": "text-indigo-200",
    "themeBg": "#162e4a",
    "accentColor": "#0070D2",
    "rewardsUnit": "MR Points",
    "pointToInr": 0.4,
    "lounge": "8 Domestic Lounge visits / Year",
    "fees": "\u20b95,000 + GST / Year",
    "waiver": "N/A (Rewarded with 48,000 bonus MR points + \u20b910,000 Taj Vouchers on spends)",
    "bestUse": "Accumulating exact milestone targets of \u20b91.9 Lakh and \u20b94 Lakh spends to trigger point jackpots (effective 8% yield).",
    "worstUse": "Transactions above \u20b94 Lakhs or split wallets that never reach milestone goals.",
    "calcType": "amex",
    "rates": {
      "default": 1.2
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "amexgold": {
    "id": "amexgold",
    "name": "Amex Gold Charge Card",
    "issuer": "AMEX",
    "tagline": "Flexible charge card with unique 5X rewards multiplier catalog.",
    "colors": "from-[#D4AF37] to-[#8C6D12]",
    "border": "border-yellow-500",
    "badgeColor": "bg-yellow-600",
    "textColor": "text-yellow-400",
    "themeBg": "#3d300c",
    "accentColor": "#FFD700",
    "rewardsUnit": "MR Points",
    "pointToInr": 0.4,
    "lounge": "None",
    "fees": "\u20b94,500 + GST / Year",
    "waiver": "N/A",
    "bestUse": "Amex Reward Multiplier online gateway (10% reward value on voucher purchases), monthly 1,000 bonus points milestones.",
    "worstUse": "Offline fuel, gold, utilities where rewards revert to 0.",
    "calcType": "amex",
    "rates": {
      "amazon": 10.0,
      "groceries": 10.0,
      "default": 2.0
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "hsbccash": {
    "id": "hsbccash",
    "name": "HSBC Cashback Card",
    "issuer": "HSBC",
    "tagline": "Top-tier 10% flat cashback for dining and grocery retail.",
    "colors": "from-[#DB0011] to-[#600000]",
    "border": "border-red-600",
    "badgeColor": "bg-red-600",
    "textColor": "text-red-400",
    "themeBg": "#440103",
    "accentColor": "#DB0011",
    "rewardsUnit": "Cashback \u20b9",
    "pointToInr": 1.0,
    "lounge": "None",
    "fees": "\u20b9999 + GST / Year",
    "waiver": "Spends above \u20b92 Lakhs / Year",
    "bestUse": "All dining, food delivery platforms, and offline groceries (10% cashback up to \u20b91,000 / Month).",
    "worstUse": "High value online electronics shopping, utility payments.",
    "calcType": "percentage",
    "rates": {
      "groceries": 10.0,
      "dining": 10.0,
      "swiggy-zomato": 10.0,
      "default": 1.5
    },
    "source": "Official Bank Terms (May 2026)"
  },
  "idfcwealth": {
    "id": "idfcwealth",
    "name": "IDFC First Wealth Card",
    "issuer": "IDFC",
    "tagline": "Incredible lifetime free premium card with progressive spend accelerators.",
    "colors": "from-[#4D000E] to-[#8C001C]",
    "border": "border-rose-900",
    "badgeColor": "bg-rose-900",
    "textColor": "text-rose-400",
    "themeBg": "#3a0208",
    "accentColor": "#9E2A2B",
    "rewardsUnit": "Reward Points",
    "pointToInr": 0.25,
    "lounge": "4 Domestic & 4 International Lounge visits / Quarter (linked to spends)",
    "fees": "\u20b90 (Lifetime Free)",
    "waiver": "N/A",
    "bestUse": "Online spending on milestones (1.5%), spends on your Birthday (2.5%), free lounge/movie tickets.",
    "worstUse": "Daily micro offline payments that only earn 0.75%.",
    "calcType": "points_by_value",
    "rates": {
      "amazon": 1.5,
      "swiggy-zomato": 1.5,
      "mmt-flights": 1.5,
      "default": 0.75
    },
    "source": "Official Bank Terms (May 2026)"
  }
};

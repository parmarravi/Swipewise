# Swipewise - Credit Card Reward Optimizer

Swipewise is a dynamic, client-side web application designed to help users maximize their credit card rewards across premium Indian credit cards. It calculates optimal category-specific returns, tracks milestone progress, and acts as a central strategy dictionary.

## 🚀 Features

- **💰 Card Advisor:** Input a transaction amount and category to automatically determine which of your active cards yields the highest effective cash/reward value.
- **🌉 Bridge Goal:** Calculate exactly how much spend or point accumulation is required to hit a specific reward milestone.
- **📖 Card Strategy:** Browse a master directory of top credit cards to view annual fees, waiver requirements, lounge benefits, best/worst use cases, and dynamic data recency.
- **🤖 AI Sync & Update Center:** Swipewise uses an externalized prompt (`prompt.txt`) to allow users to update card details instantly. Users can copy the prompt into any web-enabled AI (ChatGPT, Gemini, Claude) to scrape current bank terms and upload the resulting JSON file directly.

## 🛠 Setup & Installation

Swipewise is a 100% static, client-side application. No backend or build process is required.

1. **Clone the repository:**
   ```bash
   git clone https://github.com/parmarravi/Swipewise.git
   ```

2. **Run Locally:**
   Because Swipewise dynamically fetches `cards.json`, opening `index.html` directly via the `file://` protocol may trigger browser CORS restrictions. To ensure full functionality, serve the directory using a local web server:

   *Using Python:*
   ```bash
   python3 -m http.server 8000
   ```

   *Using Node (npx):*
   ```bash
   npx serve
   ```

   Then navigate to `http://localhost:8000` in your browser.

## 🌐 Deployment

Since it requires no server-side execution, Swipewise is perfectly suited for direct static hosting on **GitHub Pages**, **Vercel**, or **Netlify**. Simply point the deployment to the repository root.

## ⚙️ Data Management

The application loads its default card configurations from [`cards.json`](./cards.json). 
When users upload custom configurations or use the AI Sync Center, modifications are parsed, validated, and merged into the browser's `localStorage` (`swipewise_custom_cards`), ensuring persistent settings across sessions.

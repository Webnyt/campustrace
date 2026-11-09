# CampusTrace - Complete University Lost & Found System

CampusTrace is a full-stack campus portal designed for universities, colleges, and schools to report, search, claim, and recover lost student belongings across lecture halls, cafeterias, libraries, and complexes.

---

## 📦 What's Included in this Source Package

This folder contains the complete codebase, including the original PHP/MySQL version and the modern full-stack React, Express, Firebase, and Google Maps Grounding implementation:

```
campustrace-source-package/
├── src/
│   ├── components/         # All React components
│   │   ├── Header.tsx      # Top bar with Google Auth, Stats, & Download CTA
│   │   ├── HeroSearch.tsx  # Dynamic keyword search & suggestion tags
│   │   ├── FilterBar.tsx   # Category pills, status filters, CSV export, list/grid toggle
│   │   ├── ItemCard.tsx    # Card layout with claim status, photos & Maps badge
│   │   ├── ItemTableView.tsx # Compact spreadsheet/table view
│   │   ├── ReportModal.tsx # Report Found/Lost modal with FileReader thumbnail preview & Maps check
│   │   ├── ClaimModal.tsx  # Verification claim modal with celebratory confetti
│   │   ├── ItemDetailModal.tsx # Full detail modal with Google Maps Grounding & directions
│   │   ├── PrintNoticeModal.tsx # Printable bulletin board notice with tear-off phone slips
│   │   └── StatsModal.tsx  # Campus recovery metrics, top locations, and charts
│   ├── context/
│   │   └── AuthContext.tsx # Firebase Google Authentication & profile sync
│   ├── firebase/
│   │   ├── config.ts       # Firebase initialization & multi-database support
│   │   └── firestoreService.ts # Real-time Cloud Firestore subscription & CRUD
│   ├── services/
│   │   ├── api.ts          # REST endpoints client
│   │   └── mapsService.ts  # Google Maps Grounding client
│   ├── utils/
│   │   └── csvExport.ts    # Filtered items CSV spreadsheet exporter
│   ├── data/
│   │   └── mockData.ts     # Sample campus categories, locations, presets, and seed items
│   ├── types.ts            # Shared TypeScript interfaces
│   ├── App.tsx             # Root application orchestrator
│   ├── main.tsx            # React entry point with AuthProvider
│   └── index.css           # Global Tailwind CSS configuration
├── server.ts               # Express backend with REST APIs and Gemini 3.8 Flash Maps Grounding
├── data/
│   └── campustrace_db.json # Local JSON database store
├── public/                 # Static assets and images
├── original_php/
│   └── campustrace_original.php # Full original PHP + PDO MySQL single-file script
├── firebase-applet-config.json # Firebase client configuration
├── firebase-blueprint.json # Database schema representation
├── firestore.rules         # Security rules for Cloud Firestore
├── package.json            # Node.js dependencies and scripts
├── tsconfig.json           # TypeScript configuration
├── vite.config.ts          # Vite bundler configuration
└── .env.example            # Environment variables template
```

---

## 🚀 How to Run Locally on Your Laptop

### Prerequisites
- **Node.js**: Version 18.x, 20.x, or 22.x ([Download Node.js](https://nodejs.org))
- **npm** (comes bundled with Node.js)

### Step 1: Install Dependencies
Open your terminal inside this folder and run:
```bash
npm install
```

### Step 2: Configure Environment Variables
Copy the example environment file:
```bash
cp .env.example .env
```
Open `.env` and set your `GEMINI_API_KEY`:
```env
GEMINI_API_KEY="your_gemini_api_key_here"
PORT=3000
```
*(Get a free key from [Google AI Studio](https://aistudio.google.com/app/apikey) if you want to use Google Maps Grounding).*

### Step 3: Start the Development Server
```bash
npm run dev
```
Open your browser and navigate to:
**http://localhost:3000**

---

## 🏗️ Production Build & Deployment

To compile for production:
```bash
npm run build
npm start
```
This builds optimized frontend assets into `/dist` and serves the app using Express.

---

## 🐘 Running the Legacy PHP Version (Optional)

If you have XAMPP, WampServer, or MAMP installed on your laptop:
1. Start Apache and MySQL in XAMPP.
2. Copy `original_php/campustrace_original.php` into your `htdocs/` folder.
3. Access **http://localhost/campustrace_original.php**.

Or run directly using PHP's built-in CLI server:
```bash
php -S localhost:8000 original_php/campustrace_original.php
```

---

## 🛡️ Key Features Included

1. **Google Maps Grounding (`gemini-3.8-flash`)**:
   - Accurately identifies campus facilities and buildings.
   - Recommends verified safe handover points (Campus Security, Library Desks, Student Union).
   - Generates direct Google Maps links for turn-by-turn walking directions.

2. **Database & Auth (Cloud Firestore & Firebase Auth)**:
   - One-click Google Sign-in.
   - Real-time updates pushed instantaneously to all connected users.
   - Resilient offline fallback.

3. **FileReader Image Preview**:
   - Instant image thumbnail preview before submitting an item report.
   - Inspect and zoom mode.

4. **Campus Utility Suite**:
   - CSV spreadsheet download of filtered lost/found items.
   - Printable bulletin board flyer with tear-off phone strips.
   - Recovery analytics and statistics dashboard.

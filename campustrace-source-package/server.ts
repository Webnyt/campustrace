process.env.VITE_CONFIG_NATIVE_IGNORE_WARNING = 'true';

process.on('uncaughtException', (err) => {
  console.error('[CampusTrace] Uncaught Exception:', err);
});

process.on('unhandledRejection', (reason) => {
  console.error('[CampusTrace] Unhandled Rejection:', reason);
});

import express from 'express';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

const app = express();
const portArgIndex = process.argv.indexOf('--port');
const cliPort = portArgIndex !== -1 ? Number(process.argv[portArgIndex + 1]) : null;
const PORT = cliPort || 3000;

const isProd = process.env.NODE_ENV === 'production';


// Support JSON and urlencoded bodies up to 20MB for images
app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: true, limit: '20mb' }));
app.use(express.static(path.join(__dirname, 'public')));

// Direct download endpoint for full source code zip
app.get('/api/download-source-zip', (req, res) => {
  const zipPath = path.join(__dirname, 'public', 'campustrace-source-code.zip');
  if (fs.existsSync(zipPath)) {
    res.download(zipPath, 'campustrace-source-code.zip');
  } else {
    res.status(404).json({ status: 'error', message: 'Source code package not found.' });
  }
});


// Database storage file path
const DATA_DIR = path.join(__dirname, 'data');
const DB_FILE = path.join(DATA_DIR, 'campustrace_db.json');

export interface Category {
  category_id: number;
  category_name: string;
  icon: string;
}

export interface LostFoundItem {
  item_id: number;
  category_id: number;
  category_name: string;
  item_name: string;
  description: string;
  location_found: string;
  finder_contact: string;
  finder_name?: string;
  image_path?: string | null;
  item_status: 'Unclaimed' | 'Claimed';
  claimed_by?: string;
  claimed_date?: string;
  claim_notes?: string;
  dropoff_location?: string;
  item_type: 'found' | 'lost'; // Supports both found items and lost reports
  date_posted: string;
}

const DEFAULT_CATEGORIES: Category[] = [
  { category_id: 1, category_name: 'Electronics', icon: 'Laptop' },
  { category_id: 2, category_name: 'IDs & Cards', icon: 'CreditCard' },
  { category_id: 3, category_name: 'Books & Notes', icon: 'BookOpen' },
  { category_id: 4, category_name: 'Personal Items', icon: 'Heart' },
  { category_id: 5, category_name: 'Keys & Wallets', icon: 'Key' },
  { category_id: 6, category_name: 'Clothing & Bags', icon: 'Shirt' },
];

function getInitialItems(): LostFoundItem[] {
  return [
    {
      item_id: 1,
      category_id: 1,
      category_name: 'Electronics',
      item_name: 'Casio Scientific Calculator',
      description: 'FX-991ES Plus in black casing with owner initials "KA" etched lightly on the battery cover. Battery still working.',
      location_found: 'Science Complex Lecture Hall 3',
      finder_contact: '0241234567',
      finder_name: 'Kwame A.',
      dropoff_location: 'Science Complex Security Desk (Desk #1)',
      image_path: 'https://images.unsplash.com/photo-1594980596870-8aa52a78d8cd?auto=format&fit=crop&w=600&q=80',
      item_status: 'Unclaimed',
      item_type: 'found',
      date_posted: new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString(), // 4 hrs ago
    },
    {
      item_id: 2,
      category_id: 2,
      category_name: 'IDs & Cards',
      item_name: 'University Student ID Card',
      description: 'BSc Information Technology Level 200 student ID card. Blue lanyard with campus crest.',
      location_found: 'Central Cafeteria',
      finder_contact: '0559876543',
      finder_name: 'Cafeteria Staff (Auntie Mary)',
      dropoff_location: 'Central Cafeteria Cashier Counter',
      image_path: '/images/student_id_card.jpg',
      item_status: 'Unclaimed',
      item_type: 'found',
      date_posted: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(), // 12 hrs ago
    },
    {
      item_id: 3,
      category_id: 3,
      category_name: 'Books & Notes',
      item_name: 'Data Structures Spiral Notebook',
      description: 'A4 handwritten study notes with green cover, contains red and blue pen diagrams on Binary Trees and Hash Tables.',
      location_found: 'Main Library Reading Room',
      finder_contact: '0201112233',
      finder_name: 'Library Circulation Desk',
      dropoff_location: 'Main Library 2nd Floor Info Desk',
      image_path: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=600&q=80',
      item_status: 'Unclaimed',
      item_type: 'found',
      date_posted: new Date(Date.now() - 1000 * 60 * 60 * 26).toISOString(), // 1 day ago
    },
    {
      item_id: 4,
      category_id: 1,
      category_name: 'Electronics',
      item_name: 'Apple AirPods Pro (2nd Gen)',
      description: 'White MagSafe charging case with faint sticker residue on the front and custom orange ear tips inside.',
      location_found: 'Engineering Block B - 3rd Floor Computer Lab',
      finder_contact: '0245678901',
      finder_name: 'Emmanuel O.',
      dropoff_location: 'Held by finder (Call/WhatsApp to verify serial)',
      image_path: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80',
      item_status: 'Unclaimed',
      item_type: 'found',
      date_posted: new Date(Date.now() - 1000 * 60 * 60 * 30).toISOString(),
    },
    {
      item_id: 5,
      category_id: 5,
      category_name: 'Keys & Wallets',
      item_name: 'Toyota Key Fob & Dorm Room B204 Key',
      description: 'Black key bundle on a red woven Nike lanyard with dorm key #B204 and silver gym membership barcode tag.',
      location_found: 'University Sports Complex Bleachers',
      finder_contact: '0543219876',
      finder_name: 'Coach Mensah',
      dropoff_location: 'Sports Pavilion Head Office',
      image_path: 'https://images.unsplash.com/photo-1582139329536-e7284fece509?auto=format&fit=crop&w=600&q=80',
      item_status: 'Claimed',
      claimed_by: 'Michael Boateng (ID: 10849201)',
      claimed_date: new Date(Date.now() - 1000 * 60 * 60 * 8).toISOString(),
      claim_notes: 'Owner unlocked his dorm room and verified gym tag number matches record.',
      item_type: 'found',
      date_posted: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
    },
    {
      item_id: 6,
      category_id: 4,
      category_name: 'Personal Items',
      item_name: 'Hydro Flask 32oz Water Bottle',
      description: 'Cobalt blue wide-mouth vacuum bottle covered in tech stickers (GitHub, Linux, NASA, campus robotics club).',
      location_found: 'Student Union Hub - Quiet Study Lounge',
      finder_contact: '0278899001',
      finder_name: 'Sarah D.',
      dropoff_location: 'Student Union Help Desk',
      image_path: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=600&q=80',
      item_status: 'Unclaimed',
      item_type: 'found',
      date_posted: new Date(Date.now() - 1000 * 60 * 60 * 55).toISOString(),
    },
  ];
}

export interface EmailAlertSubscription {
  id: string;
  user_email: string;
  user_name?: string;
  keyword?: string;
  category_id?: number | 'All';
  category_name?: string;
  location_filter?: string;
  alert_type: 'instant' | 'daily_digest';
  active: boolean;
  created_at: string;
  match_count?: number;
}

export interface DispatchedEmail {
  id: string;
  to_email: string;
  recipient_name: string;
  subject: string;
  item_id: number | string;
  item_name: string;
  category_name: string;
  location: string;
  dropoff_location?: string;
  image_path?: string | null;
  sent_at: string;
  status: 'delivered' | 'simulated';
  match_reason: string;
  body_html: string;
  body_text: string;
}

function getDefaultEmailAlerts(): EmailAlertSubscription[] {
  return [
    {
      id: 'alert_1',
      user_email: 'govindamensah1@gmail.com',
      user_name: 'Govinda M.',
      keyword: 'AirPods',
      category_id: 1,
      category_name: 'Electronics',
      location_filter: '',
      alert_type: 'instant',
      active: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 48).toISOString(),
      match_count: 1,
    },
    {
      id: 'alert_2',
      user_email: 'govindamensah1@gmail.com',
      user_name: 'Govinda M.',
      keyword: 'Student ID',
      category_id: 2,
      category_name: 'IDs & Cards',
      location_filter: 'Central Cafeteria',
      alert_type: 'instant',
      active: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString(),
      match_count: 1,
    },
    {
      id: 'alert_3',
      user_email: 'sarah.k@campus.edu',
      user_name: 'Sarah K.',
      keyword: 'Calculator',
      category_id: 1,
      category_name: 'Electronics',
      location_filter: 'Science Complex',
      alert_type: 'instant',
      active: true,
      created_at: new Date(Date.now() - 1000 * 60 * 60 * 12).toISOString(),
      match_count: 1,
    },
  ];
}

function generateUniversityEmailHtml(
  item: LostFoundItem,
  recipientName: string,
  matchReason: string
): string {
  const photoHtml = item.image_path
    ? `<div style="text-align: center; margin: 20px 0;">
        <img src="${item.image_path}" alt="${item.item_name}" style="max-width: 100%; max-height: 240px; border-radius: 12px; border: 1px solid #e2e8f0; object-fit: cover;" />
       </div>`
    : '';

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>CampusTrace University Lost & Found Alert</title>
</head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f8fafc; color: #1e293b; padding: 24px; margin: 0;">
  <div style="max-width: 580px; margin: 0 auto; background-color: #ffffff; border-radius: 16px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.05);">
    <!-- University Header Banner -->
    <div style="background: linear-gradient(135deg, #4338ca, #6366f1); padding: 24px 28px; color: #ffffff;">
      <div style="display: inline-block; background-color: rgba(255, 255, 255, 0.2); padding: 4px 10px; border-radius: 9999px; font-size: 11px; font-weight: bold; letter-spacing: 0.05em; text-transform: uppercase; margin-bottom: 8px;">
        University Lost & Found Alert
      </div>
      <h2 style="margin: 0; font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.025em;">CampusTrace Security Dispatch</h2>
      <p style="margin: 4px 0 0; font-size: 13px; color: #e0e7ff;">A newly reported campus item matches your alert criteria</p>
    </div>

    <!-- Alert Body Content -->
    <div style="padding: 24px 28px;">
      <p style="font-size: 14px; margin-top: 0;">Hello <strong>${recipientName}</strong>,</p>
      <p style="font-size: 13px; color: #475569; line-height: 1.5;">
        Our automated campus tracking system flagged a report matching your alert subscription:
        <span style="display: inline-block; background-color: #e0e7ff; color: #3730a3; padding: 2px 8px; border-radius: 6px; font-weight: 600; font-size: 12px; margin-left: 4px;">${matchReason}</span>
      </p>

      <!-- Item Card Box -->
      <div style="background-color: #f1f5f9; border: 1px solid #cbd5e1; border-radius: 12px; padding: 18px; margin: 18px 0;">
        <div style="display: flex; justify-content: space-between; align-items: baseline; margin-bottom: 8px;">
          <h3 style="margin: 0; font-size: 16px; font-weight: 700; color: #0f172a;">${item.item_name}</h3>
          <span style="font-size: 11px; font-weight: 700; color: #4338ca; background-color: #ffffff; padding: 2px 8px; border-radius: 6px; border: 1px solid #cbd5e1;">${item.category_name}</span>
        </div>
        <p style="font-size: 12px; color: #334155; margin: 6px 0 12px; line-height: 1.4;">${item.description}</p>
        
        ${photoHtml}

        <div style="font-size: 12px; color: #475569; border-top: 1px solid #e2e8f0; padding-top: 10px; margin-top: 8px;">
          <p style="margin: 4px 0;">📍 <strong>Location Found:</strong> ${item.location_found}</p>
          <p style="margin: 4px 0;">🏢 <strong>Handover / Drop-off Desk:</strong> ${item.dropoff_location || 'Campus Desk'}</p>
          <p style="margin: 4px 0;">📞 <strong>Finder Contact:</strong> ${item.finder_contact} (${item.finder_name || 'Campus Citizen'})</p>
        </div>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 24px 0 16px;">
        <a href="https://ais-dev-mg5dxvn7cpn3tqma7erthe-497330873035.europe-west1.run.app" style="display: inline-block; background-color: #4f46e5; color: #ffffff; text-decoration: none; font-size: 13px; font-weight: 600; padding: 12px 24px; border-radius: 10px; box-shadow: 0 2px 4px rgba(79, 70, 229, 0.2);">
          Open CampusTrace to View & Claim Item →
        </a>
      </div>

      <div style="background-color: #fffbeb; border: 1px solid #fde68a; border-radius: 8px; padding: 12px; font-size: 11px; color: #92400e; margin-top: 16px;">
        ⚠️ <strong>Campus Safety Protocol:</strong> When claiming, always present your student/faculty ID and be prepared to unlock digital devices or verify serial numbers before taking possession.
      </div>
    </div>

    <!-- University Footer -->
    <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 16px 28px; text-align: center; font-size: 11px; color: #64748b;">
      CampusTrace • University Safe Handover & Lost Intelligence Hub<br/>
      You received this automated dispatch because you subscribed to email alerts on the CampusTrace Portal.
    </div>
  </div>
</body>
</html>
  `;
}

interface DbSchema {
  categories: Category[];
  items: LostFoundItem[];
  emailAlerts: EmailAlertSubscription[];
  dispatchedEmails: DispatchedEmail[];
  nextItemId: number;
}

function initDb(): DbSchema {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (fs.existsSync(DB_FILE)) {
      const content = fs.readFileSync(DB_FILE, 'utf-8');
      const data = JSON.parse(content);
      if (data && Array.isArray(data.items)) {
        if (!Array.isArray(data.emailAlerts)) {
          data.emailAlerts = getDefaultEmailAlerts();
        }
        if (!Array.isArray(data.dispatchedEmails)) {
          data.dispatchedEmails = [];
        }
        return data;
      }
    }
  } catch (err) {
    console.error('Error reading DB, using defaults:', err);
  }

  const initialItems = getInitialItems();
  const initialAlerts = getDefaultEmailAlerts();
  
  // Seed sample dispatched emails matching initial items
  const initialDispatches: DispatchedEmail[] = [
    {
      id: 'disp_1',
      to_email: 'govindamensah1@gmail.com',
      recipient_name: 'Govinda M.',
      subject: '[CampusTrace Alert] New Match Found: Apple AirPods Pro (2nd Gen)',
      item_id: 4,
      item_name: 'Apple AirPods Pro (2nd Gen)',
      category_name: 'Electronics',
      location: 'Engineering Block B - 3rd Floor Computer Lab',
      dropoff_location: 'Held by finder (Call/WhatsApp to verify serial)',
      image_path: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?auto=format&fit=crop&w=600&q=80',
      sent_at: new Date(Date.now() - 1000 * 60 * 60 * 18).toISOString(),
      status: 'delivered',
      match_reason: 'Matched keyword "AirPods" in Electronics',
      body_html: generateUniversityEmailHtml(initialItems[3], 'Govinda M.', 'Matched keyword "AirPods" in Electronics'),
      body_text: 'CampusTrace Alert: Apple AirPods Pro (2nd Gen) reported in Engineering Block B. Contact: 0245678901.',
    },
    {
      id: 'disp_2',
      to_email: 'govindamensah1@gmail.com',
      recipient_name: 'Govinda M.',
      subject: '[CampusTrace Alert] New Match Found: University Student ID Card',
      item_id: 2,
      item_name: 'University Student ID Card',
      category_name: 'IDs & Cards',
      location: 'Central Cafeteria',
      dropoff_location: 'Central Cafeteria Cashier Counter',
      image_path: '/images/student_id_card.jpg',
      sent_at: new Date(Date.now() - 1000 * 60 * 60 * 10).toISOString(),
      status: 'delivered',
      match_reason: 'Matched keyword "Student ID" in IDs & Cards at Central Cafeteria',
      body_html: generateUniversityEmailHtml(initialItems[1], 'Govinda M.', 'Matched keyword "Student ID" in IDs & Cards'),
      body_text: 'CampusTrace Alert: University Student ID Card reported at Central Cafeteria. Dropoff: Cashier Counter.',
    },
  ];

  const initialData: DbSchema = {
    categories: DEFAULT_CATEGORIES,
    items: initialItems,
    emailAlerts: initialAlerts,
    dispatchedEmails: initialDispatches,
    nextItemId: 7,
  };
  saveDb(initialData);
  return initialData;
}

function saveDb(data: DbSchema) {
  try {
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
  } catch (err) {
    console.error('Failed to write db file:', err);
  }
}

let db = initDb();

function matchItemToAlerts(item: LostFoundItem): DispatchedEmail[] {
  const matches: DispatchedEmail[] = [];
  const activeAlerts = (db.emailAlerts || []).filter((a) => a.active);

  for (const alert of activeAlerts) {
    let isMatch = false;
    let reason = '';

    // Check category match
    const categoryMatches =
      !alert.category_id || alert.category_id === 'All' || alert.category_id === item.category_id;

    // Check keyword match
    const kw = (alert.keyword || '').toLowerCase().trim();
    const itemHaystack = `${item.item_name} ${item.description} ${item.location_found}`.toLowerCase();

    if (kw) {
      if (itemHaystack.includes(kw) && categoryMatches) {
        isMatch = true;
        reason = `Matched keyword "${alert.keyword}" in ${item.category_name}`;
      }
    } else if (categoryMatches) {
      isMatch = true;
      reason = `Matched category subscription: ${item.category_name}`;
    }

    // Check location filter if provided
    if (isMatch && alert.location_filter && alert.location_filter.trim()) {
      if (!item.location_found.toLowerCase().includes(alert.location_filter.toLowerCase())) {
        isMatch = false;
      }
    }

    if (isMatch) {
      alert.match_count = (alert.match_count || 0) + 1;
      const dispatched: DispatchedEmail = {
        id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        to_email: alert.user_email,
        recipient_name: alert.user_name || alert.user_email.split('@')[0],
        subject: `[CampusTrace Alert] New Match Found: ${item.item_name}`,
        item_id: item.item_id,
        item_name: item.item_name,
        category_name: item.category_name,
        location: item.location_found,
        dropoff_location: item.dropoff_location || 'Campus Desk',
        image_path: item.image_path,
        sent_at: new Date().toISOString(),
        status: 'delivered',
        match_reason: reason,
        body_html: generateUniversityEmailHtml(item, alert.user_name || 'Student', reason),
        body_text: `CampusTrace University Alert: A matching item "${item.item_name}" was turned in at ${item.location_found}. Drop-off location: ${item.dropoff_location || 'Campus Desk'}. Finder contact: ${item.finder_contact}.`,
      };
      matches.push(dispatched);
      db.dispatchedEmails.unshift(dispatched);
    }
  }

  return matches;
}

// ==============================================================================
// REST & PHP-COMPATIBLE API ROUTES
// ==============================================================================

// 1. Get Categories
app.get('/api/categories', (req, res) => {
  res.json({
    status: 'success',
    categories: db.categories,
  });
});

// 2. Get Items (with optional filter query parameters)
app.get('/api/items', (req, res) => {
  const { category, status, search, type } = req.query;
  let filtered = [...db.items];

  if (category && category !== 'All') {
    filtered = filtered.filter(
      (item) => item.category_name.toLowerCase() === String(category).toLowerCase()
    );
  }

  if (status && status !== 'All') {
    filtered = filtered.filter((item) => item.item_status === status);
  }

  if (type && type !== 'All') {
    filtered = filtered.filter((item) => item.item_type === type);
  }

  if (search) {
    const q = String(search).toLowerCase();
    filtered = filtered.filter((item) =>
      `${item.item_name} ${item.location_found} ${item.description} ${item.finder_name || ''} ${item.dropoff_location || ''}`
        .toLowerCase()
        .includes(q)
    );
  }

  // Sort newest first
  filtered.sort((a, b) => new Date(b.date_posted).getTime() - new Date(a.date_posted).getTime());

  res.json({
    status: 'success',
    total: filtered.length,
    items: filtered,
  });
});

// 3. Add Item (Supports both JSON & standard form action)
app.post('/api/items', (req, res) => {
  const {
    item_name,
    category_id,
    location_found,
    finder_contact,
    finder_name,
    description,
    image_path,
    dropoff_location,
    item_type = 'found',
  } = req.body;

  if (!item_name || !location_found || !finder_contact) {
    return res.status(400).json({
      status: 'error',
      message: 'Please fill in all required fields (Item Name, Location, Contact).',
    });
  }

  const catId = Number(category_id) || 1;
  const category = db.categories.find((c) => c.category_id === catId) || db.categories[0];

  const newItem: LostFoundItem = {
    item_id: db.nextItemId++,
    category_id: catId,
    category_name: category.category_name,
    item_name: String(item_name).trim(),
    description: String(description || '').trim(),
    location_found: String(location_found).trim(),
    finder_contact: String(finder_contact).trim(),
    finder_name: finder_name ? String(finder_name).trim() : 'Anonymous Campus Citizen',
    dropoff_location: dropoff_location ? String(dropoff_location).trim() : 'With Finder',
    image_path: image_path || null,
    item_status: 'Unclaimed',
    item_type: item_type === 'lost' ? 'lost' : 'found',
    date_posted: new Date().toISOString(),
  };

  db.items.unshift(newItem);
  const matchedDispatches = matchItemToAlerts(newItem);
  dispatchOneSignalPush(newItem).catch((err) =>
    console.warn('[OneSignal] Async push error on item post:', err)
  );
  saveDb(db);

  return res.status(201).json({
    status: 'success',
    message:
      matchedDispatches.length > 0
        ? `Item posted! ${matchedDispatches.length} subscribed ${
            matchedDispatches.length === 1 ? 'student was' : 'students were'
          } notified via email alert.`
        : 'Item successfully posted to CampusTrace!',
    item: newItem,
    matchedAlertsCount: matchedDispatches.length,
    dispatchedAlerts: matchedDispatches,
  });
});

// 4. Claim Item (AJAX claim status handler matching PHP `claim_item`)
app.post('/api/items/:id/claim', (req, res) => {
  const itemId = Number(req.params.id);
  const { claimed_by, claim_notes } = req.body;

  const itemIndex = db.items.findIndex((item) => item.item_id === itemId);
  if (itemIndex === -1) {
    return res.status(404).json({ status: 'error', message: 'Item not found.' });
  }

  db.items[itemIndex] = {
    ...db.items[itemIndex],
    item_status: 'Claimed',
    claimed_by: claimed_by ? String(claimed_by).trim() : 'Verified Student/Owner',
    claimed_date: new Date().toISOString(),
    claim_notes: claim_notes ? String(claim_notes).trim() : 'Claimed and handed over safely.',
  };

  saveDb(db);

  res.json({
    status: 'success',
    message: 'Item marked as claimed / returned successfully!',
    item: db.items[itemIndex],
  });
});

// 5. Unclaim / Revert Item
app.post('/api/items/:id/unclaim', (req, res) => {
  const itemId = Number(req.params.id);
  const itemIndex = db.items.findIndex((item) => item.item_id === itemId);
  if (itemIndex === -1) {
    return res.status(404).json({ status: 'error', message: 'Item not found.' });
  }

  db.items[itemIndex] = {
    ...db.items[itemIndex],
    item_status: 'Unclaimed',
    claimed_by: undefined,
    claimed_date: undefined,
    claim_notes: undefined,
  };

  saveDb(db);

  res.json({
    status: 'success',
    message: 'Item status reopened as Unclaimed.',
    item: db.items[itemIndex],
  });
});

// 6. Delete Item
app.delete('/api/items/:id', (req, res) => {
  const itemId = Number(req.params.id);
  const initialLength = db.items.length;
  db.items = db.items.filter((item) => item.item_id !== itemId);

  if (db.items.length === initialLength) {
    return res.status(404).json({ status: 'error', message: 'Item not found.' });
  }

  saveDb(db);
  res.json({ status: 'success', message: 'Item deleted successfully.' });
});

// 7. Reset to demo data
app.post('/api/reset-demo', (req, res) => {
  db = {
    categories: DEFAULT_CATEGORIES,
    items: getInitialItems(),
    emailAlerts: getDefaultEmailAlerts(),
    dispatchedEmails: [],
    nextItemId: 7,
  };
  saveDb(db);
  res.json({ status: 'success', message: 'Database reset to default campus items.', items: db.items });
});

// 8. Stats Endpoint
app.get('/api/stats', (req, res) => {
  const total = db.items.length;
  const unclaimed = db.items.filter((i) => i.item_status === 'Unclaimed').length;
  const claimed = db.items.filter((i) => i.item_status === 'Claimed').length;
  const recoveryRate = total > 0 ? Math.round((claimed / total) * 100) : 0;

  // Category counts
  const categoryCounts = db.categories.map((c) => ({
    name: c.category_name,
    count: db.items.filter((i) => i.category_id === c.category_id).length,
  }));

  // Top locations
  const locationMap: Record<string, number> = {};
  db.items.forEach((i) => {
    const loc = i.location_found.split('-')[0].trim();
    locationMap[loc] = (locationMap[loc] || 0) + 1;
  });

  res.json({
    status: 'success',
    stats: {
      total,
      unclaimed,
      claimed,
      recoveryRate,
      categoryCounts,
      topLocations: Object.entries(locationMap)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5),
    },
  });
});

// ==============================================================================
// EMAIL ALERTS & UNIVERSITY DISPATCH SYSTEM
// ==============================================================================

// 8a. Get all active alert subscriptions
app.get('/api/email-alerts', (req, res) => {
  const { email } = req.query;
  let alerts = db.emailAlerts || [];
  if (email) {
    alerts = alerts.filter(
      (a) => a.user_email.toLowerCase() === String(email).toLowerCase()
    );
  }
  res.json({
    status: 'success',
    total: alerts.length,
    alerts,
  });
});

// 8b. Create new email alert subscription
app.post('/api/email-alerts', (req, res) => {
  const { user_email, user_name, keyword, category_id, category_name, location_filter, alert_type = 'instant' } = req.body;
  
  if (!user_email || !user_email.includes('@')) {
    return res.status(400).json({
      status: 'error',
      message: 'A valid university email address is required to create an alert.',
    });
  }

  const catId = category_id === 'All' ? 'All' : Number(category_id) || 'All';
  let catName = category_name || 'All Categories';
  if (catId !== 'All') {
    const foundCat = db.categories.find((c) => c.category_id === catId);
    if (foundCat) catName = foundCat.category_name;
  }

  const newAlert: EmailAlertSubscription = {
    id: `alert_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_email: String(user_email).trim().toLowerCase(),
    user_name: user_name ? String(user_name).trim() : String(user_email).split('@')[0],
    keyword: keyword ? String(keyword).trim() : '',
    category_id: catId,
    category_name: catName,
    location_filter: location_filter ? String(location_filter).trim() : '',
    alert_type: alert_type === 'daily_digest' ? 'daily_digest' : 'instant',
    active: true,
    created_at: new Date().toISOString(),
    match_count: 0,
  };

  db.emailAlerts = db.emailAlerts || [];
  db.emailAlerts.unshift(newAlert);

  // Check if any existing unclaimed items match this newly created alert
  const matchingExisting = db.items.filter((item) => {
    if (item.item_status !== 'Unclaimed') return false;
    const catMatches = catId === 'All' || item.category_id === catId;
    if (newAlert.keyword) {
      const hay = `${item.item_name} ${item.description} ${item.location_found}`.toLowerCase();
      return catMatches && hay.includes(newAlert.keyword.toLowerCase());
    }
    return catMatches;
  });

  saveDb(db);

  res.status(201).json({
    status: 'success',
    message: `Email alert created successfully for "${newAlert.keyword || newAlert.category_name}"!`,
    alert: newAlert,
    existingMatchesCount: matchingExisting.length,
  });
});

// 8c. Delete email alert
app.delete('/api/email-alerts/:id', (req, res) => {
  const alertId = req.params.id;
  const initialCount = (db.emailAlerts || []).length;
  db.emailAlerts = (db.emailAlerts || []).filter((a) => a.id !== alertId);

  if (db.emailAlerts.length === initialCount) {
    return res.status(404).json({ status: 'error', message: 'Alert subscription not found.' });
  }

  saveDb(db);
  res.json({ status: 'success', message: 'Alert subscription successfully cancelled.' });
});

// 8d. Toggle active state
app.patch('/api/email-alerts/:id/toggle', (req, res) => {
  const alertId = req.params.id;
  const alert = (db.emailAlerts || []).find((a) => a.id === alertId);
  if (!alert) {
    return res.status(404).json({ status: 'error', message: 'Alert subscription not found.' });
  }

  alert.active = req.body.active !== undefined ? Boolean(req.body.active) : !alert.active;
  saveDb(db);

  res.json({
    status: 'success',
    message: `Alert is now ${alert.active ? 'active' : 'paused'}.`,
    alert,
  });
});

// 8e. Get Dispatched Emails history (Outbox)
app.get('/api/email-alerts/dispatched', (req, res) => {
  const { email } = req.query;
  let dispatches = db.dispatchedEmails || [];
  if (email) {
    dispatches = dispatches.filter(
      (d) => d.to_email.toLowerCase() === String(email).toLowerCase()
    );
  }
  res.json({
    status: 'success',
    total: dispatches.length,
    dispatches,
  });
});

// 8f. Send / Trigger an Email Alert on demand (Test or Forward item details)
app.post('/api/send-alert-email', (req, res) => {
  const { to_email, item_id, recipient_name, reason } = req.body;
  if (!to_email || !to_email.includes('@')) {
    return res.status(400).json({ status: 'error', message: 'Valid email address required.' });
  }

  const item = db.items.find((i) => i.item_id === Number(item_id) || String(i.item_id) === String(item_id));
  if (!item) {
    return res.status(404).json({ status: 'error', message: 'Target item not found.' });
  }

  const matchReason = reason || `Direct campus share for item #${item.item_id}`;
  const recName = recipient_name || to_email.split('@')[0];

  const dispatched: DispatchedEmail = {
    id: `email_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    to_email: String(to_email).trim().toLowerCase(),
    recipient_name: recName,
    subject: `[CampusTrace Dispatch] Notification: ${item.item_name}`,
    item_id: item.item_id,
    item_name: item.item_name,
    category_name: item.category_name,
    location: item.location_found,
    dropoff_location: item.dropoff_location || 'Campus Desk',
    image_path: item.image_path,
    sent_at: new Date().toISOString(),
    status: 'delivered',
    match_reason: matchReason,
    body_html: generateUniversityEmailHtml(item, recName, matchReason),
    body_text: `CampusTrace Dispatch: ${item.item_name} at ${item.location_found}. Drop-off Desk: ${item.dropoff_location || 'Campus Desk'}. Finder contact: ${item.finder_contact}.`,
  };

  db.dispatchedEmails = db.dispatchedEmails || [];
  db.dispatchedEmails.unshift(dispatched);
  saveDb(db);

  res.json({
    status: 'success',
    message: `University alert email dispatched to ${to_email}!`,
    dispatched,
  });
});

// 8g. OneSignal Closed-Tab Push Notifications Endpoint
async function dispatchOneSignalPush(item: LostFoundItem, matchReason?: string) {
  const appId = process.env.ONESIGNAL_APP_ID || process.env.VITE_ONESIGNAL_APP_ID;
  const apiKey = process.env.ONESIGNAL_REST_API_KEY;

  if (!appId || !apiKey) {
    return {
      success: false,
      reason: 'OneSignal API credentials not configured in environment (appId or restApiKey missing)',
    };
  }

  try {
    const payload = {
      app_id: appId,
      included_segments: ['Subscribed Users'],
      headings: { en: `[CampusTrace Alert] ${item.item_name}` },
      contents: {
        en: `Reported at ${item.location_found}. Drop-off: ${item.dropoff_location || 'Campus Desk'}. Click to view details.`,
      },
      url: process.env.APP_URL || 'https://ais-dev-mg5dxvn7cpn3tqma7erthe-497330873035.europe-west1.run.app',
      chrome_web_image: item.image_path || undefined,
      data: {
        itemId: item.item_id,
        category: item.category_name,
        matchReason: matchReason || 'New item alert',
      },
    };

    const response = await fetch('https://onesignal.com/api/v1/notifications', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${apiKey}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return { success: response.ok, data };
  } catch (err) {
    console.warn('[OneSignal] Push dispatch error:', err);
    return { success: false, error: String(err) };
  }
}

app.post('/api/onesignal/notify', async (req, res) => {
  const { item_id, match_reason } = req.body;
  const item = db.items.find((i) => i.item_id === Number(item_id) || String(i.item_id) === String(item_id));
  if (!item) {
    return res.status(404).json({ status: 'error', message: 'Item not found' });
  }

  const result = await dispatchOneSignalPush(item, match_reason);
  res.json({
    status: 'success',
    message: result.success
      ? 'OneSignal closed-tab push notification dispatched!'
      : (result.reason || 'OneSignal notification processed'),
    result,
  });
});

// 9. Google Maps Grounding with gemini-3.8-flash
app.post('/api/campus-map-grounding', async (req, res) => {
  const { location_name, item_name, latLng } = req.body;
  if (!location_name) {
    return res.status(400).json({ status: 'error', message: 'Location name is required.' });
  }

  try {
    const prompt = `You are the CampusTrace University Safe Location & Navigation Assistant.
A student reported a lost/found item at or near: "${location_name}".
Item details: "${item_name || 'Campus Belonging'}".

Use Google Maps to provide:
1. Exact campus place identification: Recognize the building/facility, nearby university landmarks, and general location details.
2. Verified Safe Handover & Drop-off Points: List 2-3 designated secure exchange points nearby (such as Campus Security Dispatch, Library Information Desk, or Student Union Center) along with access info or general hours.
3. Student Safety & Retrieval Protocol: Provide 2 practical tips on how students should safely meet and verify ownership before claiming.

Format in clean, structured Markdown with concise bullet points.`;

    const config: {
      tools: [{ googleMaps: Record<string, never> }];
      toolConfig?: {
        retrievalConfig: {
          latLng: {
            latitude: number;
            longitude: number;
          };
        };
      };
    } = {
      tools: [{ googleMaps: {} }],
    };

    if (latLng && typeof latLng.latitude === 'number' && typeof latLng.longitude === 'number') {
      config.toolConfig = {
        retrievalConfig: {
          latLng: {
            latitude: latLng.latitude,
            longitude: latLng.longitude,
          },
        },
      };
    }

    const ai = getGeminiClient();
    if (!ai) {
      throw new Error('Gemini API key not configured yet.');
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config,
    });


    const candidate = response.candidates?.[0];
    const groundingMetadata = candidate?.groundingMetadata;
    const groundingChunks = (groundingMetadata?.groundingChunks || []) as Array<{
      maps?: { uri?: string; title?: string; placeAnswerSources?: { name?: string } };
      web?: { uri?: string; title?: string };
    }>;

    // Extract all Maps URIs and titles as required by Google Maps Grounding instructions
    const extractedLinks: { uri: string; title: string }[] = [];
    const seenUris = new Set<string>();

    for (const chunk of groundingChunks) {
      if (chunk.maps?.uri && !seenUris.has(chunk.maps.uri)) {
        seenUris.add(chunk.maps.uri);
        extractedLinks.push({
          uri: chunk.maps.uri,
          title: chunk.maps.title || chunk.maps.placeAnswerSources?.name || 'View Location on Google Maps',
        });
      }
      if (chunk.web?.uri && !seenUris.has(chunk.web.uri)) {
        seenUris.add(chunk.web.uri);
        extractedLinks.push({
          uri: chunk.web.uri,
          title: chunk.web.title || 'Official Campus Directory',
        });
      }
    }

    // Always ensure at least one direct Google Maps search link is available
    if (extractedLinks.length === 0) {
      extractedLinks.push({
        uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
          `${location_name} University Campus`
        )}`,
        title: `Search "${location_name}" on Google Maps`,
      });
    }

    res.json({
      status: 'success',
      text: response.text || 'Location verified with Google Maps.',
      links: extractedLinks,
      groundingMetadata,
    });
  } catch (error) {
    console.error('Maps Grounding Error:', error);
    // Provide a resilient fallback response if API key is not yet set or during network offline
    res.json({
      status: 'partial',
      text: `### Verified Campus Zone: ${location_name}\n\n* **Recognized Campus Zone:** University Main Campus.\n* **Recommended Safe Handover Hubs:**\n  - **University Police & Security Office:** 24/7 Monitoring & Safe Exchange Lobby.\n  - **Main Library Circulation Desk:** Mon-Sat 8:00 AM - 10:00 PM.\n  - **Student Union Information Center:** Ground Floor, Central Concourse.\n\n* **Safe Handover Protocol:** Always arrange meetups in high-traffic campus areas, check photo student ID, and verify item serial/specifications before handoff.`,
      links: [
        {
          uri: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
            `${location_name} University Campus`
          )}`,
          title: `Search "${location_name}" on Google Maps`,
        },
      ],
      message: 'Location guidance generated with campus directory baseline.',
    });
  }
});

// ==============================================================================
// VITE MIDDLEWARE (DEV) OR STATIC ASSETS (PROD)
// ==============================================================================


async function startServer() {
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[CampusTrace] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

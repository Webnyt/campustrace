<?php
// ==============================================================================
// CAMPUS TRACE - STANDALONE PHP & MYSQL LOST AND FOUND PORTAL
// ==============================================================================
// 1. DATABASE CONFIGURATION & BOOTSTRAPPER
// ==============================================================================
class CampusTraceDB {
    private static $host = '127.0.0.1';
    private static $db   = 'campustrace_db';
    private static $user = 'root';
    private static $pass = ''; // Default XAMPP password is empty
    private static $pdo  = null;

    public static function getConnection() {
        if (self::$pdo === null) {
            $dsn = "mysql:host=" . self::$host . ";charset=utf8mb4";
            try {
                $tmpPdo = new PDO($dsn, self::$user, self::$pass);
                $tmpPdo->exec("CREATE DATABASE IF NOT EXISTS campustrace_db");
                $tmpPdo->exec("USE campustrace_db");

                // Create categories table
                $tmpPdo->exec("CREATE TABLE IF NOT EXISTS categories (
                    category_id INT AUTO_INCREMENT PRIMARY KEY,
                    category_name VARCHAR(50) NOT NULL
                )");

                // Create items table with image_path support
                $tmpPdo->exec("CREATE TABLE IF NOT EXISTS lost_found_items (
                    item_id INT AUTO_INCREMENT PRIMARY KEY,
                    category_id INT NOT NULL,
                    item_name VARCHAR(100) NOT NULL,
                    description TEXT NOT NULL,
                    location_found VARCHAR(100) NOT NULL,
                    finder_contact VARCHAR(50) NOT NULL,
                    image_path VARCHAR(255) DEFAULT NULL,
                    item_status ENUM('Unclaimed', 'Claimed') DEFAULT 'Unclaimed',
                    claimed_by VARCHAR(100) DEFAULT NULL,
                    claim_notes TEXT DEFAULT NULL,
                    date_posted TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (category_id) REFERENCES categories(category_id)
                )");

                // Seed default categories if empty
                $chk = $tmpPdo->query("SELECT COUNT(*) FROM categories")->fetchColumn();
                if ($chk == 0) {
                    $tmpPdo->exec("INSERT INTO categories (category_name) VALUES ('Electronics'), ('IDs & Cards'), ('Books & Notes'), ('Personal Items'), ('Keys & Wallets'), ('Clothing & Bags')");
                    $tmpPdo->exec("INSERT INTO lost_found_items (category_id, item_name, description, location_found, finder_contact, item_status) VALUES 
                        (1, 'Casio Scientific Calculator', 'FX-991ES Plus in black casing with owner initials KA', 'Science Complex Lecture Hall 3', '0241234567', 'Unclaimed'),
                        (2, 'University Student ID Card', 'BSc Information Technology Level 200 ID card', 'Central Cafeteria', '0559876543', 'Unclaimed'),
                        (3, 'Data Structures Spiral Notebook', 'Handwritten notes with green cover and red pen marks', 'Main Library Reading Room', '0201112233', 'Unclaimed')");
                }

                self::$pdo = new PDO("mysql:host=" . self::$host . ";dbname=campustrace_db;charset=utf8mb4", self::$user, self::$pass, [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]);
            } catch (\PDOException $e) {
                die("Database Connection Error: " . $e->getMessage());
            }
        }
        return self::$pdo;
    }
}

$db = CampusTraceDB::getConnection();
$message = "";
$msgType = "";

// ==============================================================================
// 2. FORM & AJAX ACTION HANDLERS
// ==============================================================================
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Handle Adding New Item with Image Upload
    if (isset($_POST['action']) && $_POST['action'] === 'add_item') {
        $itemName = trim($_POST['item_name'] ?? '');
        $categoryId = (int)($_POST['category_id'] ?? 1);
        $location = trim($_POST['location_found'] ?? '');
        $contact = trim($_POST['finder_contact'] ?? '');
        $description = trim($_POST['description'] ?? '');
        $imagePath = null;

        // Process File Upload if present
        if (isset($_FILES['item_image']) && $_FILES['item_image']['error'] === UPLOAD_ERR_OK) {
            $fileTmpPath = $_FILES['item_image']['tmp_name'];
            $fileName = $_FILES['item_image']['name'];
            $fileExtension = strtolower(pathinfo($fileName, PATHINFO_EXTENSION));
            $allowedExtensions = ['jpg', 'jpeg', 'png', 'webp'];

            if (in_array($fileExtension, $allowedExtensions)) {
                $newFileName = md5(time() . $fileName) . '.' . $fileExtension;
                $uploadFileDir = 'uploads/';
                if (!is_dir($uploadFileDir)) {
                    mkdir($uploadFileDir, 0777, true);
                }
                $dest_path = $uploadFileDir . $newFileName;
                if (move_uploaded_file($fileTmpPath, $dest_path)) {
                    $imagePath = $dest_path;
                }
            }
        }

        if (!empty($itemName) && !empty($location) && !empty($contact)) {
            $stmt = $db->prepare("INSERT INTO lost_found_items (category_id, item_name, description, location_found, finder_contact, image_path) VALUES (?, ?, ?, ?, ?, ?)");
            $stmt->execute([$categoryId, $itemName, $description, $location, $contact, $imagePath]);
            $message = "Item successfully registered onto CampusTrace!";
            $msgType = "success";
        } else {
            $message = "Please fill in all required fields.";
            $msgType = "danger";
        }
    }

    // Handle AJAX Claim Status Toggle
    if (isset($_POST['action']) && $_POST['action'] === 'claim_item') {
        $itemId = (int)($_POST['item_id'] ?? 0);
        $claimant = trim($_POST['claimed_by'] ?? 'Student');
        $notes = trim($_POST['claim_notes'] ?? 'Handed over.');
        if ($itemId > 0) {
            $stmt = $db->prepare("UPDATE lost_found_items SET item_status = 'Claimed', claimed_by = ?, claim_notes = ? WHERE item_id = ?");
            $stmt->execute([$claimant, $notes, $itemId]);
            header('Content-Type: application/json');
            echo json_encode(['status' => 'success', 'message' => 'Item marked as claimed']);
            exit;
        }
    }
}

// Fetch Categories
$categories = $db->query("SELECT * FROM categories ORDER BY category_name ASC")->fetchAll();

// Handle Search and Filtering
$search = trim($_GET['search'] ?? '');
$filterCategory = (int)($_GET['category'] ?? 0);
$filterStatus = trim($_GET['status'] ?? 'All');

$sql = "SELECT i.*, c.category_name FROM lost_found_items i 
        JOIN categories c ON i.category_id = c.category_id WHERE 1=1";
$params = [];

if (!empty($search)) {
    $sql .= " AND (i.item_name LIKE ? OR i.location_found LIKE ? OR i.description LIKE ?)";
    $params[] = "%$search%";
    $params[] = "%$search%";
    $params[] = "%$search%";
}

if ($filterCategory > 0) {
    $sql .= " AND i.category_id = ?";
    $params[] = $filterCategory;
}

if ($filterStatus !== 'All' && in_array($filterStatus, ['Unclaimed', 'Claimed'])) {
    $sql .= " AND i.item_status = ?";
    $params[] = $filterStatus;
}

$sql .= " ORDER BY i.date_posted DESC";
$stmt = $db->prepare($sql);
$stmt->execute($params);
$items = $stmt->fetchAll();
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>CampusTrace - University Lost & Found</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <link href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css" rel="stylesheet">
</head>
<body class="bg-slate-50 text-slate-800 antialiased">
    <!-- Navbar -->
    <header class="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
        <div class="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
            <div class="flex items-center space-x-3">
                <div class="bg-indigo-600 text-white p-2.5 rounded-xl font-bold text-xl"><i class="fa-solid fa-box-open"></i></div>
                <div>
                    <h1 class="font-bold text-lg text-slate-900 leading-none">CampusTrace</h1>
                    <span class="text-xs text-slate-500 font-medium">PHP/MySQL Campus Portal</span>
                </div>
            </div>
            <button onclick="document.getElementById('reportModal').classList.remove('hidden')" class="bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-semibold px-4 py-2.5 rounded-xl shadow-sm">
                <i class="fa-solid fa-plus mr-1"></i> Report Item
            </button>
        </div>
    </header>

    <main class="max-w-7xl mx-auto px-4 py-8">
        <?php if (!empty($message)): ?>
            <div class="mb-6 p-4 rounded-xl text-sm font-semibold <?= $msgType === 'success' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-rose-50 text-rose-800 border border-rose-200' ?>">
                <?= htmlspecialchars($message) ?>
            </div>
        <?php endif; ?>

        <!-- Items Feed -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <?php foreach ($items as $item): ?>
                <div class="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
                    <?php if (!empty($item['image_path'])): ?>
                        <img src="<?= htmlspecialchars($item['image_path']) ?>" class="h-48 w-full object-cover">
                    <?php endif; ?>
                    <div class="p-5 flex-grow">
                        <div class="flex justify-between items-center mb-2">
                            <span class="text-xs font-semibold px-2.5 py-0.5 rounded-md bg-slate-100 text-slate-700 uppercase"><?= htmlspecialchars($item['category_name']) ?></span>
                            <span class="text-xs font-bold px-2 py-0.5 rounded-full <?= $item['item_status'] === 'Claimed' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800' ?>">
                                <?= htmlspecialchars($item['item_status']) ?>
                            </span>
                        </div>
                        <h3 class="font-bold text-slate-900 text-lg mb-1"><?= htmlspecialchars($item['item_name']) ?></h3>
                        <p class="text-xs text-slate-500 mb-2"><i class="fa-solid fa-location-dot text-indigo-600 mr-1"></i><?= htmlspecialchars($item['location_found']) ?></p>
                        <p class="text-xs text-slate-600 mb-4"><?= htmlspecialchars($item['description']) ?></p>
                    </div>
                    <div class="p-4 border-t border-slate-100 bg-slate-50 flex items-center justify-between text-xs">
                        <span class="font-mono font-bold text-indigo-600"><?= htmlspecialchars($item['finder_contact']) ?></span>
                        <a href="tel:<?= htmlspecialchars($item['finder_contact']) ?>" class="px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-medium hover:bg-indigo-700">Call</a>
                    </div>
                </div>
            <?php endforeach; ?>
        </div>
    </main>
</body>
</html>

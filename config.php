<?php
// Database configuration with error reporting
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Environment variables (would use .env in production)
$host = 'localhost';
$user = 'root';
$pass = 'securepassword'; // Change this in production
$db = 'plant_medicine';

// Create connection with prepared statements
$conn = new mysqli($host, $user, $pass, $db);

// Check connection with proper error handling
if ($conn->connect_error) {
    error_log("Database connection failed: " . $conn->connect_error);
    die(json_encode(['error' => 'Database connection failed. Please try again later.']));
}

// Set charset to prevent SQL injection
$conn->set_charset("utf8mb4");

/**
 * Secure database functions with prepared statements
 */

// Fetch all categories with error handling
function fetchCategories($conn) {
    try {
        $stmt = $conn->prepare("SELECT * FROM categories");
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    } catch (Exception $e) {
        error_log("Error fetching categories: " . $e->getMessage());
        return [];
    }
}

// Fetch medicines with pagination and filtering
function fetchMedicines($conn, $page = 1, $perPage = 12, $categoryId = null) {
    try {
        $offset = ($page - 1) * $perPage;
        
        $sql = "SELECT medicines.*, categories.name AS category_name 
                FROM medicines 
                JOIN categories ON medicines.category_id = categories.id";
        
        if ($categoryId) {
            $sql .= " WHERE medicines.category_id = ?";
        }
        
        $sql .= " LIMIT ? OFFSET ?";
        
        $stmt = $conn->prepare($sql);
        
        if ($categoryId) {
            $stmt->bind_param("iii", $categoryId, $perPage, $offset);
        } else {
            $stmt->bind_param("ii", $perPage, $offset);
        }
        
        $stmt->execute();
        $result = $stmt->get_result();
        return $result->fetch_all(MYSQLI_ASSOC);
    } catch (Exception $e) {
        error_log("Error fetching medicines: " . $e->getMessage());
        return ['error' => 'Failed to load products'];
    }
}

// Add to cart with validation
function addToCart($conn, $userId, $medicineId, $quantity = 1) {
    try {
        // Validate stock first
        $stockCheck = $conn->prepare("SELECT stock FROM medicines WHERE id = ?");
        $stockCheck->bind_param("i", $medicineId);
        $stockCheck->execute();
        $stock = $stockCheck->get_result()->fetch_assoc()['stock'];
        
        if ($stock < $quantity) {
            return ['success' => false, 'message' => 'Not enough stock available'];
        }
        
        $sql = "INSERT INTO cart (user_id, medicine_id, quantity) VALUES (?, ?, ?) 
                ON DUPLICATE KEY UPDATE quantity = quantity + ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("iiii", $userId, $medicineId, $quantity, $quantity);
        
        if ($stmt->execute()) {
            // Update stock
            $updateStock = $conn->prepare("UPDATE medicines SET stock = stock - ? WHERE id = ?");
            $updateStock->bind_param("ii", $quantity, $medicineId);
            $updateStock->execute();
            
            return ['success' => true, 'cart_count' => getCartCount($conn, $userId)];
        }
        
        return ['success' => false];
    } catch (Exception $e) {
        error_log("Error adding to cart: " . $e->getMessage());
        return ['success' => false];
    }
}

// Get cart count for user
function getCartCount($conn, $userId) {
    $stmt = $conn->prepare("SELECT SUM(quantity) as count FROM cart WHERE user_id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result()->fetch_assoc();
    return $result['count'] ?? 0;
}

// User authentication with password hashing
function registerUser($conn, $name, $email, $password) {
    try {
        // Validate email
        if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
            return ['success' => false, 'message' => 'Invalid email format'];
        }
        
        // Check if email exists
        $check = $conn->prepare("SELECT id FROM users WHERE email = ?");
        $check->bind_param("s", $email);
        $check->execute();
        
        if ($check->get_result()->num_rows > 0) {
            return ['success' => false, 'message' => 'Email already registered'];
        }
        
        // Hash password
        $hashedPassword = password_hash($password, PASSWORD_BCRYPT);
        
        $sql = "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("sss", $name, $email, $hashedPassword);
        
        return $stmt->execute() ? 
            ['success' => true] : 
            ['success' => false, 'message' => 'Registration failed'];
    } catch (Exception $e) {
        error_log("Registration error: " . $e->getMessage());
        return ['success' => false];
    }
}

// Login with session creation
function loginUser($conn, $email, $password) {
    try {
        $sql = "SELECT * FROM users WHERE email = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("s", $email);
        $stmt->execute();
        
        $user = $stmt->get_result()->fetch_assoc();
        
        if ($user && password_verify($password, $user['password'])) {
            // Start secure session
            session_start();
            $_SESSION['user_id'] = $user['id'];
            $_SESSION['user_email'] = $user['email'];
            $_SESSION['logged_in'] = true;
            
            // Regenerate session ID to prevent fixation
            session_regenerate_id(true);
            
            return ['success' => true, 'user' => $user];
        }
        
        return ['success' => false, 'message' => 'Invalid credentials'];
    } catch (Exception $e) {
        error_log("Login error: " . $e->getMessage());
        return ['success' => false];
    }
}
?>
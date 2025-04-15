<?php
// Include database configuration
require_once 'config.php';

// Start session if not already started
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Set header to return JSON
header('Content-Type: application/json');

// Get user ID from session
$user_id = isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;

// Get request body
$data = json_decode(file_get_contents('php://input'), true);
$product_id = isset($data['product_id']) ? (int)$data['product_id'] : 0;

// Initialize response
$response = ['success' => false];

// Validate input
if (!$product_id) {
    http_response_code(400);
    $response['message'] = 'Invalid product ID';
    echo json_encode($response);
    exit;
}

try {
    // If user is logged in, update wishlist in database
    if ($user_id) {
        // Check if product is already in wishlist
        $stmt = $conn->prepare("SELECT id FROM wishlist WHERE user_id = ? AND product_id = ?");
        $stmt->bind_param("ii", $user_id, $product_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            // Product is in wishlist, remove it
            $stmt = $conn->prepare("DELETE FROM wishlist WHERE user_id = ? AND product_id = ?");
            $stmt->bind_param("ii", $user_id, $product_id);
            $stmt->execute();
            $response['success'] = true;
            $response['action'] = 'removed';
        } else {
            // Product is not in wishlist, add it
            $stmt = $conn->prepare("INSERT INTO wishlist (user_id, product_id) VALUES (?, ?)");
            $stmt->bind_param("ii", $user_id, $product_id);
            $stmt->execute();
            $response['success'] = true;
            $response['action'] = 'added';
        }
    } else {
        // For non-logged in users, store wishlist in session
        if (!isset($_SESSION['wishlist'])) {
            $_SESSION['wishlist'] = [];
        }
        
        $index = array_search($product_id, $_SESSION['wishlist']);
        
        if ($index !== false) {
            // Product is in wishlist, remove it
            unset($_SESSION['wishlist'][$index]);
            $_SESSION['wishlist'] = array_values($_SESSION['wishlist']); // Reindex array
            $response['success'] = true;
            $response['action'] = 'removed';
        } else {
            // Product is not in wishlist, add it
            $_SESSION['wishlist'][] = $product_id;
            $response['success'] = true;
            $response['action'] = 'added';
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    $response = ['error' => 'Database error', 'message' => $e->getMessage()];
}

// Return JSON response
echo json_encode($response);
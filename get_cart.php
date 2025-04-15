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

// Initialize response
$response = ['success' => true, 'items' => []];

try {
    // If user is logged in, get cart from database
    if ($user_id) {
        $stmt = $conn->prepare("SELECT c.id, c.product_id, c.quantity, m.name, m.price, m.image_url, m.description 
                              FROM cart c 
                              JOIN medicines m ON c.product_id = m.id 
                              WHERE c.user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $response['items'][] = $row;
        }
        
        $stmt->close();
    } else {
        // For non-logged in users, get cart from session
        if (isset($_SESSION['cart']) && is_array($_SESSION['cart'])) {
            $response['items'] = $_SESSION['cart'];
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    $response = ['success' => false, 'error' => 'Database error', 'message' => $e->getMessage()];
}

// Return JSON response
echo json_encode($response);
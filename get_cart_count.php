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
$response = ['count' => 0];

try {
    // If user is logged in, get cart count from database
    if ($user_id) {
        $stmt = $conn->prepare("SELECT SUM(quantity) as count FROM cart WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($row = $result->fetch_assoc()) {
            $response['count'] = (int)$row['count'] ?: 0;
        }
        
        $stmt->close();
    } else {
        // For non-logged in users, get cart from session if exists
        if (isset($_SESSION['cart']) && is_array($_SESSION['cart'])) {
            $count = 0;
            foreach ($_SESSION['cart'] as $item) {
                $count += isset($item['quantity']) ? (int)$item['quantity'] : 0;
            }
            $response['count'] = $count;
        }
    }
} catch (Exception $e) {
    http_response_code(500);
    $response = ['error' => 'Database error', 'message' => $e->getMessage()];
}

// Return JSON response
echo json_encode($response);
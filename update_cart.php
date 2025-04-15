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
$action = isset($data['action']) ? $data['action'] : '';
$quantity = isset($data['quantity']) ? (int)$data['quantity'] : 0;

// Initialize response
$response = ['success' => false];

// Validate input
if (!$product_id || !in_array($action, ['update', 'remove'])) {
    http_response_code(400);
    $response['message'] = 'Invalid request parameters';
    echo json_encode($response);
    exit;
}

try {
    // If user is logged in, update cart in database
    if ($user_id) {
        if ($action === 'remove') {
            // Remove item from cart
            $stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ? AND product_id = ?");
            $stmt->bind_param("ii", $user_id, $product_id);
            $stmt->execute();
        } else if ($action === 'update' && $quantity > 0) {
            // Check if product is in stock
            $stmt = $conn->prepare("SELECT stock FROM medicines WHERE id = ?");
            $stmt->bind_param("i", $product_id);
            $stmt->execute();
            $result = $stmt->get_result();
            
            if ($row = $result->fetch_assoc()) {
                if ($row['stock'] < $quantity) {
                    http_response_code(400);
                    $response['message'] = 'Not enough stock available';
                    echo json_encode($response);
                    exit;
                }
            }
            
            // Update item quantity
            $stmt = $conn->prepare("UPDATE cart SET quantity = ? WHERE user_id = ? AND product_id = ?");
            $stmt->bind_param("iii", $quantity, $user_id, $product_id);
            $stmt->execute();
        }
    } else {
        // For non-logged in users, update cart in session
        if (!isset($_SESSION['cart']) || !is_array($_SESSION['cart'])) {
            $_SESSION['cart'] = [];
        }
        
        if ($action === 'remove') {
            // Remove item from cart
            foreach ($_SESSION['cart'] as $key => $item) {
                if ($item['product_id'] == $product_id) {
                    unset($_SESSION['cart'][$key]);
                    $_SESSION['cart'] = array_values($_SESSION['cart']); // Reindex array
                    break;
                }
            }
        } else if ($action === 'update' && $quantity > 0) {
            // Update item quantity
            foreach ($_SESSION['cart'] as &$item) {
                if ($item['product_id'] == $product_id) {
                    $item['quantity'] = $quantity;
                    break;
                }
            }
        }
    }
    
    $response['success'] = true;
    $response['message'] = $action === 'remove' ? 'Item removed from cart' : 'Cart updated successfully';
} catch (Exception $e) {
    http_response_code(500);
    $response = ['success' => false, 'error' => 'Database error', 'message' => $e->getMessage()];
}

// Return JSON response
echo json_encode($response);
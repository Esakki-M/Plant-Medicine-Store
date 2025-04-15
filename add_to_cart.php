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
$quantity = isset($data['quantity']) ? (int)$data['quantity'] : 1;

// Initialize response
$response = ['success' => false];

// Validate input
if (!$product_id || $quantity <= 0) {
    http_response_code(400);
    $response['message'] = 'Invalid product ID or quantity';
    echo json_encode($response);
    exit;
}

try {
    // Check product availability
    $stmt = $conn->prepare("SELECT id, name, price, stock FROM medicines WHERE id = ? AND stock >= ?");
    $stmt->bind_param("ii", $product_id, $quantity);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        http_response_code(400);
        $response['message'] = 'Product is out of stock or does not exist';
        echo json_encode($response);
        exit;
    }
    
    $product = $result->fetch_assoc();
    
    // If user is logged in, update cart in database
    if ($user_id) {
        // Check if product is already in cart
        $stmt = $conn->prepare("SELECT id, quantity FROM cart WHERE user_id = ? AND product_id = ?");
        $stmt->bind_param("ii", $user_id, $product_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows > 0) {
            // Update existing cart item
            $cart_item = $result->fetch_assoc();
            $new_quantity = $cart_item['quantity'] + $quantity;
            
            $stmt = $conn->prepare("UPDATE cart SET quantity = ? WHERE id = ?");
            $stmt->bind_param("ii", $new_quantity, $cart_item['id']);
            $stmt->execute();
        } else {
            // Add new cart item
            $stmt = $conn->prepare("INSERT INTO cart (user_id, product_id, quantity) VALUES (?, ?, ?)");
            $stmt->bind_param("iii", $user_id, $product_id, $quantity);
            $stmt->execute();
        }
    } else {
        // For non-logged in users, store cart in session
        if (!isset($_SESSION['cart'])) {
            $_SESSION['cart'] = [];
        }
        
        $found = false;
        foreach ($_SESSION['cart'] as &$item) {
            if ($item['product_id'] == $product_id) {
                $item['quantity'] += $quantity;
                $found = true;
                break;
            }
        }
        
        if (!$found) {
            $_SESSION['cart'][] = [
                'product_id' => $product_id,
                'name' => $product['name'],
                'price' => $product['price'],
                'quantity' => $quantity
            ];
        }
    }
    
    $response['success'] = true;
    $response['message'] = 'Product added to cart successfully';
} catch (Exception $e) {
    http_response_code(500);
    $response = ['error' => 'Database error', 'message' => $e->getMessage()];
}

// Return JSON response
echo json_encode($response);
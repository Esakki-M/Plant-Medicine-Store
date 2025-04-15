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

// Validate required fields
$required_fields = ['name', 'email', 'phone', 'address', 'payment_method', 'transaction_id', 'amount'];
foreach ($required_fields as $field) {
    if (!isset($data[$field]) || empty($data[$field])) {
        http_response_code(400);
        echo json_encode(['success' => false, 'message' => "Missing required field: {$field}"]);
        exit;
    }
}

// Initialize response
$response = ['success' => false];

try {
    // Start transaction
    $conn->begin_transaction();
    
    // 1. Create order in orders table
    $stmt = $conn->prepare("INSERT INTO orders (user_id, customer_name, customer_email, customer_phone, 
                            shipping_address, payment_method, transaction_id, total_amount, order_status) 
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending')");
    
    $stmt->bind_param("issssssd", 
        $user_id, 
        $data['name'], 
        $data['email'], 
        $data['phone'], 
        $data['address'], 
        $data['payment_method'], 
        $data['transaction_id'], 
        $data['amount']
    );
    
    $stmt->execute();
    $order_id = $conn->insert_id;
    
    // 2. Get cart items
    $cart_items = [];
    
    if ($user_id) {
        // Get cart from database for logged in users
        $stmt = $conn->prepare("SELECT c.product_id, c.quantity, m.price, m.name 
                              FROM cart c 
                              JOIN medicines m ON c.product_id = m.id 
                              WHERE c.user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        
        while ($row = $result->fetch_assoc()) {
            $cart_items[] = $row;
        }
    } else if (isset($_SESSION['cart']) && is_array($_SESSION['cart'])) {
        // Get cart from session for non-logged in users
        $cart_items = $_SESSION['cart'];
    }
    
    // 3. Create order items
    if (count($cart_items) > 0) {
        $stmt = $conn->prepare("INSERT INTO order_items (order_id, product_id, quantity, price, product_name) 
                              VALUES (?, ?, ?, ?, ?)");
        
        foreach ($cart_items as $item) {
            $stmt->bind_param("iidds", 
                $order_id, 
                $item['product_id'], 
                $item['quantity'], 
                $item['price'], 
                $item['name']
            );
            $stmt->execute();
            
            // 4. Update product stock
            $update_stmt = $conn->prepare("UPDATE medicines SET stock = stock - ? WHERE id = ?");
            $update_stmt->bind_param("ii", $item['quantity'], $item['product_id']);
            $update_stmt->execute();
        }
    }
    
    // 5. Clear cart
    if ($user_id) {
        $stmt = $conn->prepare("DELETE FROM cart WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
    } else {
        unset($_SESSION['cart']);
    }
    
    // Commit transaction
    $conn->commit();
    
    // Set success response
    $response = [
        'success' => true, 
        'message' => 'Order placed successfully', 
        'order_id' => $order_id
    ];
    
    // Store order ID in session for order success page
    $_SESSION['last_order_id'] = $order_id;
    
} catch (Exception $e) {
    // Rollback transaction on error
    $conn->rollback();
    
    http_response_code(500);
    $response = ['success' => false, 'error' => 'Database error', 'message' => $e->getMessage()];
}

// Return JSON response
echo json_encode($response);
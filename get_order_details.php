<?php
// get_order_details.php - Retrieves order details for the order success page

// Include database configuration
require_once 'config.php';

// Set headers for JSON response
header('Content-Type: application/json');

// Check if order_id is provided
if (!isset($_GET['order_id']) || empty($_GET['order_id'])) {
    echo json_encode([
        'success' => false,
        'message' => 'Order ID is required'
    ]);
    exit;
}

$order_id = $_GET['order_id'];

try {
    // Connect to database
    $conn = new mysqli(DB_HOST, DB_USER, DB_PASS, DB_NAME);
    
    // Check connection
    if ($conn->connect_error) {
        throw new Exception("Database connection failed: " . $conn->connect_error);
    }
    
    // Get order details
    $orderQuery = "SELECT o.*, c.name as customer_name, c.email as customer_email, 
                   c.phone as customer_phone, c.address as shipping_address 
                   FROM orders o 
                   JOIN customers c ON o.customer_id = c.id 
                   WHERE o.order_id = ?";
    
    $stmt = $conn->prepare($orderQuery);
    $stmt->bind_param("s", $order_id);
    $stmt->execute();
    $result = $stmt->get_result();
    
    if ($result->num_rows === 0) {
        echo json_encode([
            'success' => false,
            'message' => 'Order not found'
        ]);
        exit;
    }
    
    $order = $result->fetch_assoc();
    
    // Get order items
    $itemsQuery = "SELECT oi.*, p.name as product_name 
                  FROM order_items oi 
                  JOIN products p ON oi.product_id = p.id 
                  WHERE oi.order_id = ?";
    
    $stmt = $conn->prepare($itemsQuery);
    $stmt->bind_param("s", $order_id);
    $stmt->execute();
    $itemsResult = $stmt->get_result();
    
    $items = [];
    while ($item = $itemsResult->fetch_assoc()) {
        $items[] = $item;
    }
    
    // Add items to order data
    $order['items'] = $items;
    
    // Calculate order totals
    $subtotal = 0;
    foreach ($items as $item) {
        $subtotal += $item['price'] * $item['quantity'];
    }
    
    $order['subtotal'] = $subtotal;
    $order['tax'] = $subtotal * 0.18; // 18% GST
    $order['shipping'] = ($subtotal > 1000) ? 0 : 100; // Free shipping over ₹1000
    $order['total_amount'] = $subtotal + $order['tax'] + $order['shipping'];
    
    // Return success response
    echo json_encode([
        'success' => true,
        'order' => $order
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error retrieving order details: ' . $e->getMessage()
    ]);
} finally {
    if (isset($conn)) {
        $conn->close();
    }
}
?>
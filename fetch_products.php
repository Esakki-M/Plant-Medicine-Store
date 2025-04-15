<?php
header('Content-Type: application/json');
require_once 'config.php';

try {
    // Get parameters from request
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $perPage = isset($_GET['per_page']) ? (int)$_GET['per_page'] : 12;
    $categoryId = isset($_GET['category_id']) ? (int)$_GET['category_id'] : null;
    $searchQuery = isset($_GET['query']) ? trim($_GET['query']) : null;

    // Build base query
    $sql = "SELECT medicines.*, categories.name AS category_name 
            FROM medicines 
            JOIN categories ON medicines.category_id = categories.id";
    
    $params = [];
    $types = '';
    
    // Add search condition if query exists
    if ($searchQuery && strlen($searchQuery) >= 3) {
        $sql .= " WHERE medicines.name LIKE ? OR medicines.description LIKE ?";
        $searchTerm = "%$searchQuery%";
        $params = array_merge($params, [$searchTerm, $searchTerm]);
        $types .= 'ss';
    }
    
    // Add category filter if specified
    if ($categoryId) {
        $sql .= (strpos($sql, 'WHERE') !== false) ? ' AND' : ' WHERE';
        $sql .= " medicines.category_id = ?";
        $params[] = $categoryId;
        $types .= 'i';
    }
    
    // Add pagination
    $sql .= " LIMIT ? OFFSET ?";
    $params = array_merge($params, [$perPage, ($page - 1) * $perPage]);
    $types .= 'ii';
    
    // Prepare and execute
    $stmt = $conn->prepare($sql);
    
    if (!empty($params)) {
        $stmt->bind_param($types, ...$params);
    }
    
    $stmt->execute();
    $result = $stmt->get_result();
    $products = $result->fetch_all(MYSQLI_ASSOC);
    
    // Get total count for pagination
    $countSql = "SELECT COUNT(*) as total FROM medicines";
    $total = $conn->query($countSql)->fetch_assoc()['total'];
    
    // Return JSON response
    echo json_encode([
        'success' => true,
        'data' => $products,
        'meta' => [
            'page' => $page,
            'per_page' => $perPage,
            'total' => $total,
            'total_pages' => ceil($total / $perPage)
        ]
    ]);
    
} catch (Exception $e) {
    error_log("API Error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'Internal server error']);
}
?>
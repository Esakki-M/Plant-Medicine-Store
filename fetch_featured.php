<?php
include 'config.php';

$products = fetchProducts($conn);
if ($products) {
    echo json_encode($products);
} else {
    echo json_encode(['error' => 'No products found']);
}
?>

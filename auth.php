<?php
header('Content-Type: application/json');
require_once 'config.php';

// Get request method
$method = $_SERVER['REQUEST_METHOD'];

try {
    switch ($method) {
        case 'POST':
            $input = json_decode(file_get_contents('php://input'), true);
            
            // Handle login
            if (isset($input['login'])) {
                $email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
                $password = $input['password'];
                
                $result = loginUser($conn, $email, $password);
                
                if ($result['success']) {
                    echo json_encode([
                        'success' => true,
                        'user' => $result['user'],
                        'message' => 'Login successful'
                    ]);
                } else {
                    http_response_code(401);
                    echo json_encode([
                        'success' => false,
                        'message' => $result['message'] ?? 'Login failed'
                    ]);
                }
            } 
            // Handle registration
            elseif (isset($input['register'])) {
                $name = htmlspecialchars($input['name']);
                $email = filter_var($input['email'], FILTER_SANITIZE_EMAIL);
                $password = $input['password'];
                
                $result = registerUser($conn, $name, $email, $password);
                
                if ($result['success']) {
                    echo json_encode([
                        'success' => true,
                        'message' => 'Registration successful'
                    ]);
                } else {
                    http_response_code(400);
                    echo json_encode([
                        'success' => false,
                        'message' => $result['message'] ?? 'Registration failed'
                    ]);
                }
            }
            break;
            
        case 'GET':
            // Check session status
            session_start();
            if (isset($_SESSION['logged_in'])) {
                echo json_encode([
                    'success' => true,
                    'user' => [
                        'id' => $_SESSION['user_id'],
                        'email' => $_SESSION['user_email']
                    ]
                ]);
            } else {
                http_response_code(401);
                echo json_encode(['success' => false]);
            }
            break;
            
        case 'DELETE':
            // Logout
            session_start();
            session_destroy();
            echo json_encode(['success' => true]);
            break;
            
        default:
            http_response_code(405);
            echo json_encode(['success' => false, 'message' => 'Method not allowed']);
    }
} catch (Exception $e) {
    error_log("Auth error: " . $e->getMessage());
    http_response_code(500);
    echo json_encode(['success' => false, 'message' => 'Internal server error']);
}
?>
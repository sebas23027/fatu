<?php
require __DIR__ . '/jwt_utils.php';

// Log the incoming request for debugging
file_put_contents('php://stderr', print_r([
    'Request Method' => $_SERVER['REQUEST_METHOD'],
    'Raw Input' => file_get_contents('php://input'),
    'Headers' => getallheaders()
], true));

// Set headers before any output
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *'); // Permitir qualquer origem
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Start output buffering to prevent any unexpected output
ob_start();

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

$AUTH_USER = 'lagoazul';
$AUTH_PASS = 'cnlagoazul';
$SECRET_KEY = 'xH8aP2tL9zQ7mR5kF6jD3sV1yB4nC0eG';

$input = file_get_contents('php://input');
file_put_contents('php://stderr', "Raw input: $input\n");
$data = json_decode($input, true);

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $username = $data['username'] ?? '';
    $password = $data['password'] ?? '';

    if ($username === $AUTH_USER && $password === $AUTH_PASS) {
        $headers = ['alg' => 'HS256', 'typ' => 'JWT'];
        $payload = [
            'username' => $username,
            'exp' => time() + (60 * 60)
        ];
        $jwt = generate_jwt($headers, $payload, $SECRET_KEY);

        // Discard any output before our JSON
        ob_end_clean();
        
        // Send clean JSON
        echo json_encode(['token' => $jwt]);
        
        // Log the token being sent
        file_put_contents('php://stderr', "Generated token: $jwt\n");
        exit;
    } else {
        http_response_code(401);
        ob_end_clean();
        echo json_encode(['message' => 'Credenciais inválidas.']);
        exit;
    }
} else {
    http_response_code(405);
    ob_end_clean();
    echo json_encode(['message' => 'Método não permitido.']);
}

// Capture and log any unexpected output
$output = ob_get_clean();
if (!empty($output)) {
    file_put_contents('php://stderr', "Unexpected output: $output\n");
    echo json_encode(['error' => 'Unexpected output detected on server.']);
}
?>

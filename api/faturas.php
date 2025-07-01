<?php
require 'jwt_utils.php';

file_put_contents('php://stderr', print_r([
    'method' => $_SERVER['REQUEST_METHOD'],
    'body' => file_get_contents('php://input'),
    'headers' => getallheaders(),
    'query' => $_GET,
], true));

// Permitir qualquer origem
header('Content-Type: application/json');
header("Access-Control-Allow-Origin: *");
header("Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS");
header("Access-Control-Allow-Headers: Content-Type, Authorization");
header("Access-Control-Allow-Credentials: true"); // Permite envio de credenciais

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Responde a requisições OPTIONS para CORS
    http_response_code(200);
    exit;
}

require 'db.php';
require 'utils.php';

header('Content-Type: application/json');

function verificarTokenJWT() {
    $SECRET_KEY = 'xH8aP2tL9zQ7mR5kF6jD3sV1yB4nC0eG'; // Chave secreta para JWT
    $token = get_bearer_token();

    // Log para verificar o token recebido
    file_put_contents('php://stderr', print_r(['Token recebido' => $token], true));

    if (!$token) {
        http_response_code(401);
        echo json_encode(['message' => 'Token não fornecido.']);
        exit;
    }

    if (!is_jwt_valid($token, $SECRET_KEY)) {
        http_response_code(401);
        echo json_encode(['message' => 'Token inválido ou expirado.']);
        exit;
    }
}

// Verifica o token JWT antes de processar qualquer requisição
verificarTokenJWT();

function atualizarArquivoFaturas($pdo) {
    $filePath = __DIR__ . '/backup/faturas.json'; // Caminho do arquivo
    $stmt = $pdo->query('SELECT * FROM faturas');
    $faturas = $stmt->fetchAll(PDO::FETCH_ASSOC);

    file_put_contents($filePath, json_encode($faturas, JSON_PRETTY_PRINT));
}

$method = $_SERVER['REQUEST_METHOD'];

if ($method === 'GET') {
    try {
        $stmt = $pdo->query('SELECT * FROM faturas');
        $faturas = $stmt->fetchAll(PDO::FETCH_ASSOC);
        echo json_encode($faturas);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Erro ao buscar faturas.', 'error' => $e->getMessage()]);
    }
} elseif ($method === 'POST') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Log para depuração
    file_put_contents('php://stderr', print_r(['POST data' => $data], true));

    try {
        $stmt = $pdo->prepare('INSERT INTO faturas (nif, email, valor, metodo, data, enviada) VALUES (:nif, :email, :valor, :metodo, :data, :enviada)');
        $stmt->execute([
            'nif' => $data['nif'],
            'email' => $data['email'],
            'valor' => $data['valor'],
            'metodo' => $data['metodo'],
            'data' => $data['data'],
            'enviada' => $data['enviada'] ?? 0,
        ]);
        atualizarArquivoFaturas($pdo); // Atualiza o arquivo após a inserção
        echo json_encode(['message' => 'Fatura adicionada com sucesso.']);
    } catch (PDOException $e) {
        // Log do erro
        file_put_contents('php://stderr', print_r(['PDOException' => $e->getMessage()], true));

        http_response_code(500);
        echo json_encode(['message' => 'Erro ao adicionar fatura.', 'error' => $e->getMessage()]);
    }
} elseif ($method === 'PUT') {
    $data = json_decode(file_get_contents('php://input'), true);

    // Log para verificar os dados recebidos
    file_put_contents('php://stderr', print_r(['PUT data' => $data], true));

    if (!isset($data['id'], $data['nif'], $data['email'], $data['valor'], $data['metodo'], $data['data'])) {
        http_response_code(400);
        echo json_encode(['message' => 'Dados incompletos para atualizar a fatura.']);
        exit;
    }

    try {
        $stmt = $pdo->prepare('UPDATE faturas SET nif = :nif, email = :email, valor = :valor, metodo = :metodo, data = :data, enviada = :enviada WHERE id = :id');
        $stmt->execute([
            'id' => $data['id'],
            'nif' => $data['nif'],
            'email' => $data['email'],
            'valor' => $data['valor'],
            'metodo' => $data['metodo'],
            'data' => $data['data'],
            'enviada' => $data['enviada'] ?? 0,
        ]);

        // Log para verificar se a atualização foi bem-sucedida
        file_put_contents('php://stderr', "Fatura com ID {$data['id']} atualizada com sucesso.\n");

        atualizarArquivoFaturas($pdo); // Atualiza o arquivo após a atualização
        echo json_encode(['message' => 'Fatura atualizada com sucesso.']);
    } catch (PDOException $e) {
        http_response_code(500);
        echo json_encode(['message' => 'Erro ao atualizar fatura.', 'error' => $e->getMessage()]);
    }
}elseif ($method === 'DELETE') {
    // Tenta pegar o id da query string, se não vier, pega do body JSON
    $id = $_GET['id'] ?? null;
    if (!$id) {
        $input = json_decode(file_get_contents('php://input'), true);
        $id = $input['id'] ?? null;
    }
    if ($id) {
        try {
            $stmt = $pdo->prepare('DELETE FROM faturas WHERE id = :id');
            $stmt->execute(['id' => $id]);
            atualizarArquivoFaturas($pdo); // Atualiza o arquivo após a exclusão
            echo json_encode(['message' => 'Fatura excluída com sucesso.']);
        } catch (PDOException $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Erro ao excluir fatura.', 'error' => $e->getMessage()]);
        }
    } else {
        http_response_code(400);
        echo json_encode(['message' => 'ID da fatura é obrigatório.']);
    }
}
?>

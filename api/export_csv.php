<?php
require 'db.php';

header('Content-Type: text/csv');
header('Content-Disposition: attachment; filename="faturas_backup_' . date('Y-m-d_H-i-s') . '.csv"');

$output = fopen('php://output', 'w');

// Escreve o cabeçalho do CSV
fputcsv($output, ['ID', 'NIF', 'Email', 'Valor', 'Método', 'Data', 'Enviada']);

try {
    $stmt = $pdo->query('SELECT * FROM faturas');
    while ($row = $stmt->fetch(PDO::FETCH_ASSOC)) {
        fputcsv($output, $row);
    }
} catch (PDOException $e) {
    echo "Erro ao exportar dados: " . $e->getMessage();
}

fclose($output);
?>

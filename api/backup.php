<?php
$host = 'localhost';
$dbname = 'faturasbomba_db';
$username = 'root';
$password = '';

$backupFile = 'backup_' . date('Y-m-d_H-i-s') . '.sql';

try {
    // Executa o comando mysqldump
    $command = "mysqldump -h $host -u $username --password=$password $dbname > $backupFile";
    system($command, $output);

    if ($output === 0) {
        echo "Backup criado com sucesso: $backupFile";
    } else {
        echo "Erro ao criar o backup.";
    }
} catch (Exception $e) {
    echo "Erro: " . $e->getMessage();
}
?>

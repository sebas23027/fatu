import { useState } from "react";
import { Table, Button, Spinner, ToggleButtonGroup, ToggleButton, Modal, Form, Alert, Row, Col, InputGroup } from "react-bootstrap";
import { saveAs } from "file-saver"; // Biblioteca para salvar arquivos
import jsPDF from "jspdf"; // Import jsPDF with default import instead of named import
import autoTable from "jspdf-autotable"; // Import autoTable separately
import { useNavigate } from "react-router-dom";
import './ListaFaturas.css';

function ListaFaturas({ 
  faturas, 
  onDeleteFatura, 
  onToggleEnviada, 
  filter, 
  setFilter, 
  loading, 
  onRefresh 
}) {
  const [showModal, setShowModal] = useState(false);
  const [faturaEdit, setFaturaEdit] = useState(null);
  const [error, setError] = useState(null);
  const [searchDate, setSearchDate] = useState("");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchNif, setSearchNif] = useState("");
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [showNifSuggestions, setShowNifSuggestions] = useState(false);
  const navigate = useNavigate();

  const filteredFaturas = faturas.filter((fatura) => {
    const matchesStatus = fatura.enviada === (filter ? 1 : 0);
    
    // Filtro por email
    const matchesEmail = !searchEmail || fatura.email.toLowerCase().includes(searchEmail.toLowerCase());
    
    // Filtro por NIF
    const matchesNif = !searchNif || fatura.nif.toString().includes(searchNif);
    
    // Filtro por data específica
    const matchesDate = !searchDate || fatura.data === searchDate;
    
    return matchesStatus && matchesEmail && matchesNif && matchesDate;
  });

  const handleToggleEnviada = async (id) => {
    try {
      const token = localStorage.getItem("token"); // Recupera o token do localStorage
      console.log("Token enviado para alterar status:", token); // Log para verificar o token
      if (!token) {
        throw new Error("Token não encontrado. Faça login novamente.");
      }

      const fatura = faturas.find((f) => f.id === id);
      const response = await fetch(`/api/faturas.php`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`, // Adiciona o token no cabeçalho
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...fatura, enviada: fatura.enviada === 1 ? 0 : 1 }),
      });

      console.log("Resposta do backend para alterar status:", response);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro do backend ao alterar status:", errorData);
        throw new Error("Erro ao alterar o status da fatura.");
      }

      alert("Status da fatura alterado com sucesso!");
      onRefresh(); // Atualiza a lista de faturas
    } catch (err) {
      console.error("Erro ao alterar o status da fatura:", err);
      alert("Erro ao alterar o status da fatura. Verifique o console para mais detalhes.");
    }
  };

  const handleDeleteFatura = async (id) => {
    // Chama a função do App.jsx através das props
    onDeleteFatura(id);
  };

  const handleCopyFatura = (fatura) => {
    try {
      const faturaText = `
        NIF: ${fatura.nif}
        Email: ${fatura.email}
        Valor: €${fatura.valor}
        Método: ${fatura.metodo}
      `.trim();

      console.log("Texto copiado:", faturaText); // Log para verificar o texto gerado

      if (navigator.clipboard && navigator.clipboard.writeText) {
        // Usa a API Clipboard se disponível
        navigator.clipboard.writeText(faturaText)
          .then(() => {
            alert("Fatura copiada para a área de transferência!");
          })
          .catch((err) => {
            console.error("Erro ao copiar para a área de transferência:", err);
            alert("Erro ao copiar a fatura. Verifique as permissões do navegador.");
          });
      } else {
        // Fallback para navegadores que não suportam navigator.clipboard
        const textarea = document.createElement("textarea");
        textarea.value = faturaText;
        document.body.appendChild(textarea);
        textarea.select();
        try {
          document.execCommand("copy");
          alert("Fatura copiada para a área de transferência!");
        } catch (err) {
          console.error("Erro ao copiar usando fallback:", err);
          alert("Erro ao copiar a fatura. Verifique o console para mais detalhes.");
        }
        document.body.removeChild(textarea);
      }
    } catch (err) {
      console.error("Erro ao executar a função de copiar:", err);
      alert("Erro ao copiar a fatura. Verifique o console para mais detalhes.");
    }
  };

  const handleExportFaturas = () => {
    const content = faturas
      .map(
        (fatura) =>
          `NIF: ${fatura.nif}\nEmail: ${fatura.email}\nValor: €${fatura.valor}\nMétodo: ${fatura.metodo}\nData: ${fatura.data}\n\n`
      )
      .join("");
    const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
    saveAs(blob, "faturas.txt");
  };

  const handleExportFaturasPDF = () => {
    try {
      console.log("Starting PDF generation...");
      
      // Use the global jsPDF from CDN if available, otherwise try to import it
      if (window.jspdf && window.jspdf.jsPDF) {
        console.log("Using global jsPDF from CDN");
        const { jsPDF } = window.jspdf;
        
        // Create new document
        const doc = new jsPDF();
        
        // Adiciona título
        doc.setFontSize(16);
        doc.text("Lista de Faturas", 105, 10, { align: "center" });
        
        // Configura os dados da tabela
        const tableColumn = ["NIF", "Email", "Valor (€)", "Método", "Data", "Status"];
        const tableRows = faturas.map((fatura) => {
          console.log("Processing fatura:", fatura);
          return [
            fatura.nif,
            fatura.email,
            typeof fatura.valor === 'number' ? fatura.valor.toFixed(2) : parseFloat(fatura.valor).toFixed(2),
            fatura.metodo,
            fatura.data,
            fatura.enviada === 1 ? "Enviada" : "Não Enviada",
          ];
        });
        
        console.log("Table data ready:", { columns: tableColumn, rows: tableRows });
        
        // Manually call the autoTable function on the document
        if (typeof doc.autoTable !== 'function' && window.jspdf && window.jspdf.autoTable) {
          console.log("Using global autoTable function");
          window.jspdf.autoTable(doc, {
            startY: 20,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            styles: { fontSize: 10, halign: "center" },
            headStyles: { fillColor: [0, 80, 158] },
            alternateRowStyles: { fillColor: [240, 248, 255] },
          });
        } else {
          console.log("Using doc.autoTable method");
          doc.autoTable({
            startY: 20,
            head: [tableColumn],
            body: tableRows,
            theme: 'grid',
            styles: { fontSize: 10, halign: "center" },
            headStyles: { fillColor: [0, 80, 158] },
            alternateRowStyles: { fillColor: [240, 248, 255] },
          });
        }
        
        console.log("PDF generated successfully, attempting to save...");
        // Salva o PDF
        doc.save("faturas.pdf");
        console.log("PDF saved successfully");
        return;
      }
      
      // Fallback to the dynamic import method if global jsPDF is not available
      import('jspdf').then(({ default: jsPDF }) => {
        import('jspdf-autotable').then(({ default: autoTableFn }) => {
          console.log("jsPDF loaded via import:", typeof jsPDF === 'function');
          console.log("autoTable loaded via import:", typeof autoTableFn === 'function');
          
          // Create new document
          const doc = new jsPDF();
          
          // Register autoTable plugin if needed
          if (typeof doc.autoTable !== 'function') {
            autoTableFn(doc);
          }
          
          // Adiciona título
          doc.setFontSize(16);
          doc.text("Lista de Faturas", 105, 10, { align: "center" });
          
          // Configura os dados da tabela
          const tableColumn = ["NIF", "Email", "Valor (€)", "Método", "Data", "Status"];
          const tableRows = faturas.map((fatura) => {
            console.log("Processing fatura:", fatura);
            return [
              fatura.nif,
              fatura.email,
              typeof fatura.valor === 'number' ? fatura.valor.toFixed(2) : parseFloat(fatura.valor).toFixed(2),
              fatura.metodo,
              fatura.data,
              fatura.enviada === 1 ? "Enviada" : "Não Enviada",
            ];
          });
          
          console.log("Table data ready:", { columns: tableColumn, rows: tableRows });
          
          // Try both methods to call autoTable
          try {
            if (typeof doc.autoTable === 'function') {
              doc.autoTable({
                startY: 20,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                styles: { fontSize: 10, halign: "center" },
                headStyles: { fillColor: [0, 80, 158] },
                alternateRowStyles: { fillColor: [240, 248, 255] },
              });
            } else {
              autoTableFn(doc, {
                startY: 20,
                head: [tableColumn],
                body: tableRows,
                theme: 'grid',
                styles: { fontSize: 10, halign: "center" },
                headStyles: { fillColor: [0, 80, 158] },
                alternateRowStyles: { fillColor: [240, 248, 255] },
              });
            }
            
            console.log("PDF generated successfully, attempting to save...");
            // Salva o PDF
            doc.save("faturas.pdf");
            console.log("PDF saved successfully");
          } catch (err) {
            console.error("Error generating PDF with autoTable:", err);
            setError("Erro ao gerar tabela no PDF: " + err.message);
          }
        }).catch(err => {
          console.error("Error loading jspdf-autotable:", err);
          setError("Erro ao carregar o plugin autoTable: " + err.message);
        });
      }).catch(err => {
        console.error("Error loading jsPDF:", err);
        setError("Erro ao carregar a biblioteca jsPDF: " + err.message);
      });
    } catch (error) {
      console.error("Erro ao gerar o PDF:", error);
      console.error("Stack trace:", error.stack);
      setError(`Erro ao exportar o PDF: ${error.message}`);
    }
  };

  const handleEditFatura = (fatura) => {
    setFaturaEdit(fatura);
    setShowModal(true);
  };

  const handleSaveFatura = async () => {
    try {
      const token = localStorage.getItem("token"); // Recupera o token do localStorage
      console.log("Token enviado para salvar alterações:", token); // Log para verificar o token
      console.log("Dados enviados para salvar alterações:", faturaEdit); // Log para verificar os dados

      if (!token) {
        throw new Error("Token não encontrado. Faça login novamente.");
      }

      const response = await fetch(`/api/faturas.php`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`, // Adiciona o token no cabeçalho
          "Content-Type": "application/json",
        },
        body: JSON.stringify(faturaEdit),
      });

      console.log("Resposta do backend para salvar alterações:", response);

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro do backend ao salvar alterações:", errorData);
        throw new Error("Erro ao salvar alterações na fatura.");
      }

      alert("Fatura alterada com sucesso!");
      setShowModal(false);
      onRefresh(); // Atualiza a lista de faturas
    } catch (err) {
      console.error("Erro ao salvar alterações na fatura:", err);
      alert("Erro ao salvar alterações na fatura. Verifique o console para mais detalhes.");
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFaturaEdit({ ...faturaEdit, [name]: value });
  };

  const handleLogout = () => {
    localStorage.removeItem("token"); // Remove o token do localStorage
    navigate("/login"); // Redireciona para a página de login
  };

  const clearDateFilters = () => {
    setSearchDate("");
  };

  // Função para obter sugestões de email únicas
  const getEmailSuggestions = () => {
    if (!searchEmail || searchEmail.length < 2) return [];
    
    const uniqueEmails = [...new Set(faturas.map(f => f.email))];
    return uniqueEmails
      .filter(email => email.toLowerCase().includes(searchEmail.toLowerCase()))
      .slice(0, 5); // Limita a 5 sugestões
  };

  // Função para obter sugestões de NIF únicas
  const getNifSuggestions = () => {
    if (!searchNif || searchNif.length < 2) return [];
    
    const uniqueNifs = [...new Set(faturas.map(f => f.nif.toString()))];
    return uniqueNifs
      .filter(nif => nif.includes(searchNif))
      .slice(0, 5); // Limita a 5 sugestões
  };

  const handleEmailSearch = (value) => {
    setSearchEmail(value);
    setShowEmailSuggestions(value.length >= 2);
  };

  const handleNifSearch = (value) => {
    setSearchNif(value);
    setShowNifSuggestions(value.length >= 2);
  };

  const selectEmailSuggestion = (email) => {
    setSearchEmail(email);
    setShowEmailSuggestions(false);
  };

  const selectNifSuggestion = (nif) => {
    setSearchNif(nif);
    setShowNifSuggestions(false);
  };

  const clearSearchFilters = () => {
    setSearchEmail("");
    setSearchNif("");
    setSearchDate("");
    setShowEmailSuggestions(false);
    setShowNifSuggestions(false);
  };

  return (
    <div className="table-container">
      <div className="d-flex flex-column align-items-center w-100 mb-3">
        <h1 className="mb-3"></h1>
        <div className="button-group mb-3">
          <Button variant="info" onClick={handleExportFaturas} className="me-2">
            Descarregar Faturas (bloco de notas)
          </Button>
          <Button variant="info" onClick={handleExportFaturasPDF} className="me-2">
            Descarregar Faturas (PDF)
          </Button>
          <Button variant="outline-primary" onClick={onRefresh} disabled={loading}>
            {loading ? "Carregando..." : "Atualizar"}
          </Button>
        </div>
      </div>

      {error && <Alert variant="danger">{error}</Alert>} {/* Exibe erros */}

      <div className="filter-container mb-3">
        <ToggleButtonGroup
          type="radio"
          name="filter"
          value={filter}
          onChange={setFilter}
        >
          <ToggleButton id="por-enviar" variant="outline-danger" value={0}>
            Por Enviar
          </ToggleButton>
          <ToggleButton id="enviadas" variant="outline-success" value={1}>
            Enviadas
          </ToggleButton>
        </ToggleButtonGroup>
      </div>

      {/* Filtros de Pesquisa */}
      <div className="search-filter-container mb-3">
        <Row className="align-items-end">
          <Col md={3}>
            <Form.Group>
              <Form.Label>Pesquisar por Data</Form.Label>
              <Form.Control
                type="date"
                value={searchDate}
                onChange={(e) => setSearchDate(e.target.value)}
              />
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group style={{ position: 'relative' }}>
              <Form.Label>Pesquisar por Email</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o email..."
                value={searchEmail}
                onChange={(e) => handleEmailSearch(e.target.value)}
                onFocus={() => setShowEmailSuggestions(searchEmail.length >= 2)}
                onBlur={() => setTimeout(() => setShowEmailSuggestions(false), 200)}
              />
              {showEmailSuggestions && getEmailSuggestions().length > 0 && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {getEmailSuggestions().map((email, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee'
                      }}
                      onMouseDown={() => selectEmailSuggestion(email)}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      {email}
                    </div>
                  ))}
                </div>
              )}
            </Form.Group>
          </Col>
          <Col md={3}>
            <Form.Group style={{ position: 'relative' }}>
              <Form.Label>Pesquisar por NIF</Form.Label>
              <Form.Control
                type="text"
                placeholder="Digite o NIF..."
                value={searchNif}
                onChange={(e) => handleNifSearch(e.target.value)}
                onFocus={() => setShowNifSuggestions(searchNif.length >= 2)}
                onBlur={() => setTimeout(() => setShowNifSuggestions(false), 200)}
              />
              {showNifSuggestions && getNifSuggestions().length > 0 && (
                <div 
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    right: 0,
                    backgroundColor: 'white',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                    maxHeight: '200px',
                    overflowY: 'auto',
                    zIndex: 1000,
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }}
                >
                  {getNifSuggestions().map((nif, index) => (
                    <div
                      key={index}
                      style={{
                        padding: '8px 12px',
                        cursor: 'pointer',
                        borderBottom: '1px solid #eee'
                      }}
                      onMouseDown={() => selectNifSuggestion(nif)}
                      onMouseEnter={(e) => e.target.style.backgroundColor = '#f8f9fa'}
                      onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                    >
                      {nif}
                    </div>
                  ))}
                </div>
              )}
            </Form.Group>
          </Col>
          <Col md={3}>
            <div className="d-grid">
              <Button variant="outline-secondary" onClick={clearSearchFilters}>
                Limpar Filtros
              </Button>
            </div>
          </Col>
        </Row>
        {(searchDate || searchEmail || searchNif) && (
          <div className="mt-2">
            <small className="text-muted">
              Filtros ativos: {[
                searchDate && `Data: ${searchDate}`,
                searchEmail && `Email: "${searchEmail}"`,
                searchNif && `NIF: "${searchNif}"`
              ].filter(Boolean).join(', ')}
            </small>
          </div>
        )}
      </div>

      {loading ? (
        <div className="text-center p-5">
          <Spinner animation="border" role="status" />
          <p>Carregando faturas...</p>
        </div>
      ) : filteredFaturas.length === 0 ? (
        <div className="text-center p-4">
          <p>Nenhuma fatura encontrada.</p>
        </div>
      ) : (
        <div className="table-responsive">
          <Table striped bordered hover>
            <thead>
              <tr>
                <th>NIF</th>
                <th>Email</th>
                <th>Valor (€)</th>
                <th>Método</th>
                <th>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredFaturas.map((fatura) => (
                <tr key={fatura.id}>
                  <td>{fatura.nif}</td>
                  <td>{fatura.email}</td>
                  <td>{fatura.valor}</td>
                  <td>{fatura.metodo}</td>
                  <td>{fatura.data}</td>
                  <td>{fatura.enviada === 1 ? "Enviada" : "Não Enviada"}</td>
                  <td>
                    <div className="button-group">
                      <Button
                        variant="warning"
                        size="sm"
                        onClick={() => handleToggleEnviada(fatura.id)}
                      >
                        Alterar Status
                      </Button>
                      <Button
                        variant="danger"
                        size="sm"
                        onClick={() => handleDeleteFatura(fatura.id)}
                      >
                        Excluir
                      </Button>
                      <Button
                        variant="success"
                        size="sm"
                        onClick={() => handleCopyFatura(fatura)}
                      >
                        Copiar
                      </Button>
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleEditFatura(fatura)}
                      >
                        Alterar
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      {/* Modal para editar fatura */}
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Alterar Fatura</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {faturaEdit && (
            <Form>
              <Form.Group className="mb-3">
                <Form.Label>NIF</Form.Label>
                <Form.Control
                  type="text"
                  name="nif"
                  value={faturaEdit.nif}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control
                  type="email"
                  name="email"
                  value={faturaEdit.email}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Valor (€)</Form.Label>
                <Form.Control
                  type="number"
                  name="valor"
                  value={faturaEdit.valor}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Método</Form.Label>
                <Form.Control
                  type="text"
                  name="metodo"
                  value={faturaEdit.metodo}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Data</Form.Label>
                <Form.Control
                  type="date"
                  name="data"
                  value={faturaEdit.data}
                  onChange={handleChange}
                  required
                />
              </Form.Group>
            </Form>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Cancelar
          </Button>
          <Button variant="primary" onClick={handleSaveFatura}>
            Salvar Alterações
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}

export default ListaFaturas;
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import './FormularioFatura.css';

// Obter faturas existentes do localStorage (ou window.appState, se disponível)
function getFaturasExistentes() {
  // Tenta obter do window.appState (se já carregado)
  if (window.appState && Array.isArray(window.appState.faturas)) {
    return window.appState.faturas;
  }
  // Fallback: tenta obter do localStorage (se alguma vez guardou)
  try {
    const raw = localStorage.getItem("faturas");
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

function FormularioFatura({ onAddFatura }) {
  const [novaFatura, setNovaFatura] = useState({
    nif: "",
    email: "",
    valor: "",
    metodo: "MB",
    data: new Date().toISOString().split('T')[0],
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showEmailSuggestions, setShowEmailSuggestions] = useState(false);
  const [showNifSuggestions, setShowNifSuggestions] = useState(false);
  const navigate = useNavigate();

  // Obter faturas existentes para sugestões
  const faturasExistentes = getFaturasExistentes();

  // Sugestões únicas de email
  const emailSuggestions = Array.from(
    new Set(
      faturasExistentes
        .map(f => (f.email || "").trim())
        .filter(email => email.length > 0)
    )
  );

  // Sugestões únicas de NIF
  const nifSuggestions = Array.from(
    new Set(
      faturasExistentes
        .map(f => (f.nif || "").toString().trim())
        .filter(nif => nif.length > 0)
    )
  );

  // Sugestão dinâmica de email
  const filteredEmailSuggestions = novaFatura.email.length >= 2
    ? emailSuggestions.filter(email =>
        email.toLowerCase().includes(novaFatura.email.toLowerCase())
      ).slice(0, 5)
    : [];

  // Sugestão dinâmica de NIF
  const filteredNifSuggestions = novaFatura.nif.length >= 2
    ? nifSuggestions.filter(nif =>
        nif.includes(novaFatura.nif)
      ).slice(0, 5)
    : [];

  // Quando seleciona um email da sugestão, preenche o NIF correspondente
  const handleSelectEmailSuggestion = (email) => {
    const fatura = faturasExistentes.find(f => (f.email || "").trim() === email);
    setNovaFatura({
      ...novaFatura,
      email,
      nif: fatura ? fatura.nif : novaFatura.nif
    });
    setShowEmailSuggestions(false);
  };

  // Quando seleciona um NIF da sugestão, preenche o email correspondente
  const handleSelectNifSuggestion = (nif) => {
    const fatura = faturasExistentes.find(f => (f.nif || "").toString().trim() === nif);
    setNovaFatura({
      ...novaFatura,
      nif,
      email: fatura ? fatura.email : novaFatura.email
    });
    setShowNifSuggestions(false);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setNovaFatura({ ...novaFatura, [name]: value });

    // Mostrar sugestões ao digitar
    if (name === "email") setShowEmailSuggestions(value.length >= 2);
    if (name === "nif") setShowNifSuggestions(value.length >= 2);
  };

  const handleBlurEmail = () => setTimeout(() => setShowEmailSuggestions(false), 200);
  const handleBlurNif = () => setTimeout(() => setShowNifSuggestions(false), 200);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    console.log("Enviando fatura:", novaFatura);

    try {
      await onAddFatura(novaFatura);
      navigate("/"); // Redireciona para a lista de faturas após adicionar
    } catch (err) {
      console.error("Erro ao adicionar fatura:", err);
      setError("Erro ao adicionar fatura. Por favor, tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h1 className="mb-4">Adicionar Fatura</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3" style={{ position: "relative" }}>
          <Form.Label>NIF</Form.Label>
          <Form.Control
            type="text"
            name="nif"
            value={novaFatura.nif}
            onChange={handleChange}
            onFocus={() => setShowNifSuggestions(novaFatura.nif.length >= 2)}
            onBlur={handleBlurNif}
            required
            placeholder="123456789"
            autoComplete="off"
          />
          {showNifSuggestions && filteredNifSuggestions.length > 0 && (
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
              {filteredNifSuggestions.map((nif, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee'
                  }}
                  onMouseDown={() => handleSelectNifSuggestion(nif)}
                  onMouseEnter={e => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={e => e.target.style.backgroundColor = 'white'}
                >
                  {nif}
                </div>
              ))}
            </div>
          )}
        </Form.Group>
        <Form.Group className="mb-3" style={{ position: "relative" }}>
          <Form.Label>Email</Form.Label>
          <Form.Control
            type="email"
            name="email"
            value={novaFatura.email}
            onChange={handleChange}
            onFocus={() => setShowEmailSuggestions(novaFatura.email.length >= 2)}
            onBlur={handleBlurEmail}
            placeholder="exemplo@email.com"
            autoComplete="off"
          />
          {showEmailSuggestions && filteredEmailSuggestions.length > 0 && (
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
              {filteredEmailSuggestions.map((email, idx) => (
                <div
                  key={idx}
                  style={{
                    padding: '8px 12px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #eee'
                  }}
                  onMouseDown={() => handleSelectEmailSuggestion(email)}
                  onMouseEnter={e => e.target.style.backgroundColor = '#f8f9fa'}
                  onMouseLeave={e => e.target.style.backgroundColor = 'white'}
                >
                  {email}
                </div>
              ))}
            </div>
          )}
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Valor (€)</Form.Label>
          <Form.Control
            type="number"
            name="valor"
            value={novaFatura.valor}
            onChange={handleChange}
            required
            min="0"
            step="0.01"
            placeholder="0.00"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Método</Form.Label>
          <Form.Select
            name="metodo"
            value={novaFatura.metodo}
            onChange={handleChange}
            required
          >
            <option value="MB">MB</option>
            <option value="Dinheiro">Dinheiro</option>
            <option value="Transferência">Transferência</option>
          </Form.Select>
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Data</Form.Label>
          <Form.Control
            type="date"
            name="data"
            value={novaFatura.data}
            onChange={handleChange}
            required
          />
        </Form.Group>
        <div className="d-flex justify-content-between">
          <Button variant="secondary" onClick={() => navigate("/")}>
            Cancelar
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <Spinner as="span" animation="border" size="sm" className="me-2" />
                Adicionando...
              </>
            ) : (
              "Adicionar Fatura"
            )}
          </Button>
        </div>
      </Form>
    </div>
  );
}

export default FormularioFatura;
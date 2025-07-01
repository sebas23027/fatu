import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Form, Button, Alert, Spinner } from "react-bootstrap";
import './Login.css';

function Login() {
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  // Clear any invalid tokens when loading login page
  useEffect(() => {
    localStorage.removeItem("token");
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCredentials({ ...credentials, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await fetch("/api/login.php", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(credentials),
      });

      if (!response.ok) {
        console.error("Erro na resposta da API:", response.status, response.statusText);
        throw new Error("Credenciais inválidas.");
      }

      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        const text = await response.text(); // Log the raw response for debugging
        console.error("Resposta bruta da API:", text);
        throw new Error("Resposta da API não é JSON.");
      }

      const data = await response.json();
      console.log("Dados recebidos:", data);

      if (data.token) {
        localStorage.setItem("token", data.token); // Armazena o token no localStorage
        console.log("Token armazenado:", data.token);
        navigate("/"); // Redireciona para a página principal
      } else {
        throw new Error("Token não recebido.");
      }
    } catch (err) {
      console.error("Erro na requisição:", err);
      setError(err.message || "Erro ao conectar ao servidor.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <h1>Login</h1>
      {error && <Alert variant="danger">{error}</Alert>}
      <Form onSubmit={handleSubmit}>
        <Form.Group className="mb-3">
          <Form.Label>Usuário</Form.Label>
          <Form.Control
            type="text"
            name="username"
            value={credentials.username}
            onChange={handleChange}
            required
            placeholder="Digite seu usuário"
          />
        </Form.Group>
        <Form.Group className="mb-3">
          <Form.Label>Senha</Form.Label>
          <Form.Control
            type="password"
            name="password"
            value={credentials.password}
            onChange={handleChange}
            required
            placeholder="Digite sua senha"
          />
        </Form.Group>
        <Button type="submit" variant="primary" disabled={loading}>
          {loading ? (
            <>
              <Spinner as="span" animation="border" size="sm" className="me-2" />
              Entrando...
            </>
          ) : (
            "Entrar"
          )}
        </Button>
      </Form>
    </div>
  );
}

export default Login;
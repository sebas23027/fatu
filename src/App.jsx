import React, { useState, useEffect, useRef } from "react"; // Added React import
import { BrowserRouter as Router, Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { Navbar, Nav, Container, Alert, Button } from "react-bootstrap";
import { FaSignOutAlt } from "react-icons/fa";
import ListaFaturas from "./ListaFaturas";
import FormularioFatura from "./FormularioFatura";
import Login from "./Login";
import { isTokenValid, authenticatedFetch, clearAuthAndRedirect } from "./utils/authUtils"; // Added missing import
import './App.css';

// This context will replace the global window.appState
export const AppContext = React.createContext(null);

function AppNavbar() {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    navigate("/login");
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg">
      <Container>
        <Navbar.Brand href="/">Faturas Bomba</Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link href="/">Lista de Faturas</Nav.Link>
            <Nav.Link href="/adicionar">Adicionar Fatura</Nav.Link>
          </Nav>
          <Button
            variant="outline-light"
            onClick={handleLogout}
            className="d-flex align-items-center"
            style={{ borderRadius: "20px", padding: "5px 15px" }}
          >
            <FaSignOutAlt className="me-2" /> Logout
          </Button>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const isLoginPage = location.pathname === '/login';
  const appState = window.appState; // Use the global app state

  // Custom authentication redirection logic at the layout level
  useEffect(() => {
    // Only check auth when not on login page
    if (!isLoginPage) {
      if (!isTokenValid()) {
        // Use navigate instead of window.location for smoother transitions
        navigate("/login");
      }
    }
  }, [isLoginPage, navigate]);

  return (
    <>
      {!isLoginPage && <AppNavbar />}
      <div className={isLoginPage ? "login-layout" : "content"}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route
            path="/"
            element={
              <PrivateRoute>
                <ListaFaturas
                  faturas={appState.faturas}
                  onDeleteFatura={appState.handleDeleteFatura}
                  onToggleEnviada={appState.handleToggleEnviada}
                  filter={appState.filter}
                  setFilter={appState.setFilter}
                  loading={appState.loading}
                  onRefresh={appState.fetchFaturas}
                />
              </PrivateRoute>
            }
          />
          <Route
            path="/adicionar"
            element={
              <PrivateRoute>
                <FormularioFatura onAddFatura={appState.handleAddFatura} />
              </PrivateRoute>
            }
          />
        </Routes>
      </div>
    </>
  );
}

function PrivateRoute({ children }) {
  // Instead of redirecting here, we'll let the AppLayout handle redirects
  // This prevents double-checks which can cause refresh loops
  return isTokenValid() ? children : <Navigate to="/login" />;
}

function App() {
  const [faturas, setFaturas] = useState([]);
  const [filter, setFilter] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialized, setInitialized] = useState(false);
  const isFirstRender = useRef(true);

  const API_URL = import.meta.env.VITE_API_BASE_URL || "/api";

  const fetchFaturas = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("Token não encontrado. Faça login novamente.");
      }

      const response = await fetch("/api/faturas.php", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Erro ao buscar faturas. Verifique sua autenticação.");
      }

      const data = await response.json();
      setFaturas(data);
      setInitialized(true);
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFatura = async (id) => {
    try {
      // Exibe uma mensagem de confirmação
      const confirmDelete = window.confirm("Tem certeza de que deseja excluir esta fatura? Esta ação não pode ser desfeita.");
      if (!confirmDelete) {
        return; // Cancela a exclusão se o usuário não confirmar
      }

      console.log("App.jsx - ID recebido para exclusão:", id);
      const token = localStorage.getItem("token");
      console.log("App.jsx - Token para exclusão:", token);
      const response = await fetch(`/api/faturas.php`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ id })
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro do backend ao excluir:", errorData);
        throw new Error("Erro ao excluir fatura.");
      }

      fetchFaturas();
    } catch (err) {
      console.error("Erro ao excluir fatura:", err);
      setError("Erro ao excluir fatura.");
    }
  };

  const handleToggleEnviada = async (id) => {
    try {
      const token = localStorage.getItem("token");
      const fatura = faturas.find((f) => f.id === id);
      const response = await fetch("/api/faturas.php", {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...fatura, enviada: fatura.enviada === 1 ? 0 : 1 }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro do backend ao alterar status:", errorData);
        throw new Error("Erro ao atualizar status da fatura.");
      }

      fetchFaturas();
    } catch (err) {
      console.error("Erro ao atualizar status da fatura:", err);
      setError("Erro ao atualizar status da fatura.");
    }
  };

  const handleAddFatura = async (novaFatura) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/faturas.php", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(novaFatura),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("Erro do backend:", errorData);
        throw new Error("Erro ao adicionar fatura.");
      }

      fetchFaturas();
    } catch (err) {
      console.error("Erro ao adicionar fatura:", err);
      setError("Erro ao adicionar fatura.");
    }
  };

  // Only fetch data once on mount and when explicitly called by refresh
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      
      // Only fetch if we have a valid token
      if (isTokenValid()) {
        fetchFaturas();
      } else {
        setLoading(false);
        setInitialized(true);
      }
    }
  }, []);

  // Create a global app state object to pass to the AppLayout
  window.appState = {
    faturas,
    filter,
    setFilter,
    loading,
    fetchFaturas,
    handleDeleteFatura,
    handleToggleEnviada,
    handleAddFatura,
    initialized
  };

  return (
    <Router>
      {error && (
        <Alert variant="danger" className="mt-3">
          {error}
        </Alert>
      )}
      <AppLayout />
    </Router>
  );
}

export default App;
import React, { useState, useEffect } from "react";
import { Table, Button, Modal, Form } from "react-bootstrap";

const ListaFaturas = () => {
  const [faturas, setFaturas] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [faturaEdit, setFaturaEdit] = useState(null);

  useEffect(() => {
    // Fetch faturas from API
  }, []);

  const handleToggleEnviada = async (id) => {
    try {
      const token = localStorage.getItem("token");
      console.log("Token enviado para alterar status:", token);
      if (!token) {
        throw new Error("Token não encontrado. Faça login novamente.");
      }

      const fatura = faturas.find((f) => f.id === id);
      const response = await fetch(`/api/faturas.php`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ ...fatura, enviada: fatura.enviada === 1 ? 0 : 1 }),
      });

      // Rest of the function stays the same
    } catch (err) {
      // Error handling
    }
  };

  const handleDeleteFatura = async (id) => {
    try {
      // Confirmation code

      const token = localStorage.getItem("token");
      console.log("Token enviado para exclusão:", token);
      if (!token) {
        throw new Error("Token não encontrado. Faça login novamente.");
      }

      const response = await fetch(`/api/faturas.php?id=${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      // Rest of the function stays the same
    } catch (err) {
      // Error handling
    }
  };

  const handleSaveFatura = async () => {
    try {
      const token = localStorage.getItem("token");
      console.log("Token enviado para salvar alterações:", token);
      console.log("Dados enviados para salvar alterações:", faturaEdit);

      if (!token) {
        throw new Error("Token não encontrado. Faça login novamente.");
      }

      const response = await fetch(`/api/faturas.php`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(faturaEdit),
      });

      // Rest of the function stays the same
    } catch (err) {
      // Error handling
    }
  };

  return (
    <div>
      <Table>
        {/* Table content */}
      </Table>
      <Button onClick={() => setShowModal(true)}>Add Fatura</Button>
      <Modal show={showModal} onHide={() => setShowModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Edit Fatura</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            {/* Form content */}
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowModal(false)}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSaveFatura}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default ListaFaturas;
'use client';

import { useState, useEffect, FormEvent } from 'react';
import { Table, Button, Form, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import { Role } from '@prisma/client';

interface User {
  id: string;
  name: string;
  email: string;
  role: Role;
}

export default function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<Role>(Role.EMPLOYEE);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUsers = async () => {
    setIsLoading(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        headers: { 'Authorization': `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to fetch users');
      const data = await res.json();
      setUsers(data);
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email, password, role }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Failed to create user');
      }
      
      // Reset form and refresh user list
      setName('');
      setEmail('');
      setPassword('');
      setRole(Role.EMPLOYEE);
      fetchUsers();

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Ocurrió un error inesperado');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (userId: string) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este usuario?')) {
      setError(null);
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`/api/users/${userId}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.message || 'Failed to delete user');
        }

        fetchUsers(); // Refresh user list
      } catch (err) {
        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError('Ocurrió un error inesperado');
        }
      }
    }
  };

  return (
    <Row>
      <Col md={4}>
        <Card>
          <Card.Header as="h5">Crear Nuevo Usuario</Card.Header>
          <Card.Body>
            <Form onSubmit={handleSubmit}>
              <Form.Group className="mb-3">
                <Form.Label>Nombre</Form.Label>
                <Form.Control type="text" value={name} onChange={e => setName(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <Form.Control type="email" value={email} onChange={e => setEmail(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Contraseña</Form.Label>
                <Form.Control type="password" value={password} onChange={e => setPassword(e.target.value)} required />
              </Form.Group>
              <Form.Group className="mb-3">
                <Form.Label>Rol</Form.Label>
                <Form.Select value={role} onChange={e => setRole(e.target.value as Role)}>
                  <option value={Role.EMPLOYEE}>Empleado</option>
                  <option value={Role.ADMIN}>Administrador</option>
                </Form.Select>
              </Form.Group>
              {error && <Alert variant="danger">{error}</Alert>}
              <Button type="submit" variant="primary" disabled={isSubmitting}>
                {isSubmitting ? <Spinner size="sm" /> : 'Crear Usuario'}
              </Button>
            </Form>
          </Card.Body>
        </Card>
      </Col>
      <Col md={8}>
        <Card>
            <Card.Header as="h5">Lista de Usuarios</Card.Header>
            <Card.Body>
                {isLoading ? <Spinner /> : (
                <Table striped bordered hover responsive="sm">
                    <thead>
                    <tr>
                        <th>Nombre</th>
                        <th>Email</th>
                        <th>Rol</th>
                        <th>Acciones</th>
                    </tr>
                    </thead>
                    <tbody>
                    {users.map(user => (
                        <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                            <Button variant="danger" size="sm" onClick={() => handleDelete(user.id)}>
                            Eliminar
                            </Button>
                        </td>
                        </tr>
                    ))}
                    </tbody>
                </Table>
                )}
            </Card.Body>
        </Card>
      </Col>
    </Row>
  );
}

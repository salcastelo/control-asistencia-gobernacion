'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import Image from 'next/image';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      // Store token and user info in localStorage
      localStorage.setItem('token', data.token);
      localStorage.setItem('userRole', data.role);
      localStorage.setItem('userName', data.name);

      // Redirect based on role
      if (data.role === 'ADMIN') {
        router.push('/admin');
      } else {
        router.push('/dashboard');
      }

    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container fluid className="d-flex align-items-center justify-content-center vh-100" style={{backgroundColor: '#eef2f5'}}>
      <Row>
        <Col>
                    <Card>
            <Card.Body className="p-4">
              <div className="text-center mb-4">
                <Image src="/logo.png" alt="Logo" width={296} height={72} />
              </div>
              <h3 className="text-center mb-4 text-primary">Control de Jornada</h3>
              <Form onSubmit={handleSubmit}>
                <Form.Group className="mb-3" controlId="formBasicEmail">
                  <Form.Label>Correo Electrónico</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Ingrese su correo"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </Form.Group>

                <Form.Group className="mb-3" controlId="formBasicPassword">
                  <Form.Label>Contraseña</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </Form.Group>

                {error && <Alert variant="danger">{error}</Alert>}

                <div className="d-grid">
                    <Button variant="primary" type="submit" disabled={isLoading}>
                        {isLoading ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                />
                                <span className="visually-hidden">Cargando...</span>
                            </>
                        ) : (
                            'Iniciar Sesión'
                        )}
                    </Button>
                </div>
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

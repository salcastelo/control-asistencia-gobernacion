'use client';

import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Row, Col, Card, Button, Navbar, Nav, Spinner, Alert } from 'react-bootstrap';
import dynamic from 'next/dynamic';
import { EventType } from '@prisma/client';

type WorkStatus = EventType | 'OFFLINE';

export default function DashboardPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [workStatus, setWorkStatus] = useState<WorkStatus>('OFFLINE');
  const [location, setLocation] = useState<[number, number] | null>(null);

  const MapView = useMemo(() => dynamic(() => import('@/components/MapView'), { 
    ssr: false,
    loading: () => <div style={{height: '400px'}} className="d-flex justify-content-center align-items-center"><Spinner animation="border" /></div>
  }), []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('userName');
    const role = localStorage.getItem('userRole');

    if (!token || (role !== 'EMPLOYEE' && role !== 'ADMIN')) { // Allow admin to see dashboard
      router.push('/login');
    } else {
      setUserName(name);
      // Here you would fetch the last status of the user from the DB
      // For now, we start as OFFLINE
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  const handleAction = (eventType: EventType) => {
    setError(null);
    setIsActionLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        setLocation([latitude, longitude]);
        
        try {
          const token = localStorage.getItem('token');
          const res = await fetch('/api/timelog', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({ eventType, latitude, longitude }),
          });

          if (!res.ok) {
            const data = await res.json();
            throw new Error(data.message || 'Error al registrar la acción');
          }

          setWorkStatus(eventType);

        } catch (err) {
          if (err instanceof Error) {
            setError(err.message);
          } else {
            setError('Ocurrió un error inesperado');
          }
        } finally {
          setIsActionLoading(false);
        }
      },
      (error) => {
        setError(`Error de geolocalización: ${error.message}`);
        setIsActionLoading(false);
      }
    );
  };

  if (isLoading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" variant="primary" /></div>;
  }

  return (
    <>
            <Navbar bg="light" expand="lg" className="mb-3">
        <Container>
          <Navbar.Brand>Panel de Empleado</Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              <Navbar.Text className="me-3">Bienvenido, {userName}</Navbar.Text>
              <Button variant="outline-light" onClick={handleLogout}>Cerrar Sesión</Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        {error && <Alert variant="danger">{error}</Alert>}
        <Row>
          <Col md={5}>
            <Card className="text-center">
              <Card.Header as="h4">Registrar Jornada</Card.Header>
              <Card.Body>
                <Card.Text>Estado actual: <span className="fw-bold">{workStatus}</span></Card.Text>
                <div className="d-grid gap-2">
                  <Button variant="success" size="lg" onClick={() => handleAction(EventType.CLOCK_IN)} disabled={isActionLoading || workStatus !== 'OFFLINE'}>Iniciar Jornada</Button>
                  <Button variant="warning" size="lg" onClick={() => handleAction(EventType.LUNCH_OUT)} disabled={isActionLoading || workStatus !== 'CLOCK_IN'}>Salida a Almuerzo</Button>
                  <Button variant="info" size="lg" onClick={() => handleAction(EventType.LUNCH_IN)} disabled={isActionLoading || workStatus !== 'LUNCH_OUT'}>Regreso de Almuerzo</Button>
                  <Button variant="danger" size="lg" onClick={() => handleAction(EventType.CLOCK_OUT)} disabled={isActionLoading || workStatus === 'OFFLINE' || workStatus === 'CLOCK_OUT'}>Finalizar Jornada</Button>
                </div>
                {isActionLoading && <div className="mt-3"><Spinner animation="border" /> <span className="ms-2">Registrando...</span></div>}
              </Card.Body>
            </Card>
          </Col>
          <Col md={7}>
            <Card>
                <Card.Header as="h4">Última Ubicación Registrada</Card.Header>
                <Card.Body>
                    {location ? <MapView position={location} /> : <div className="text-center p-5">Aún no se ha registrado ninguna ubicación.</div>}
                </Card.Body>
            </Card>
          </Col>
        </Row>
      </Container>
    </>
  );
}
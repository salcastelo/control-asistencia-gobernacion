'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Container, Button, Navbar, Nav, Spinner, Tabs, Tab } from 'react-bootstrap';
import UserManagement from '@/components/UserManagement';
import Reports from '@/components/Reports';

export default function AdminPage() {
  const router = useRouter();
  const [userName, setUserName] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const name = localStorage.getItem('userName');
    const role = localStorage.getItem('userRole');

    if (!token || role !== 'ADMIN') {
      router.push('/login');
    } else {
      setUserName(name);
      setIsLoading(false);
    }
  }, [router]);

  const handleLogout = () => {
    localStorage.clear();
    router.push('/login');
  };

  if (isLoading) {
    return <div className="d-flex justify-content-center align-items-center vh-100"><Spinner animation="border" variant="primary" /></div>;
  }

  return (
    <>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand>Panel de Administración</Navbar.Brand>
          <Navbar.Toggle />
          <Navbar.Collapse className="justify-content-end">
            <Nav>
              <Navbar.Text className="me-3">Administrador: {userName}</Navbar.Text>
              <Button variant="outline-light" onClick={handleLogout}>Cerrar Sesión</Button>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      <Container className="mt-4">
        <Tabs defaultActiveKey="user-management" id="admin-tabs" className="mb-3">
          <Tab eventKey="user-management" title="Gestión de Usuarios">
            <UserManagement />
          </Tab>
          <Tab eventKey="reports" title="Reportes">
            <Reports />
          </Tab>
        </Tabs>
      </Container>
    </>
  );
}

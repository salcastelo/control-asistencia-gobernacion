'use client';

import { useState, useEffect, FormEvent, useRef } from 'react';
import { Table, Button, Form, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

interface User {
  id: string;
  name: string;
}

interface TimeLog {
  id: string;
  timestamp: string;
  eventType: string;
  latitude: number;
  longitude: number;
  user: {
    name: string;
  };
}

export default function Reports() {
  const [users, setUsers] = useState<User[]>([]);
  const [reportData, setReportData] = useState<TimeLog[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const reportTableRef = useRef(null);

  useEffect(() => {
    const fetchUsers = async () => {
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
      }
    };
    fetchUsers();
  }, []);

  const handleGenerateReport = async (e: FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const params = new URLSearchParams({
        userId,
        startDate,
        endDate,
      });
      
      const res = await fetch(`/api/reports?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${token}` },
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.message || 'Failed to generate report');
      }

      const data = await res.json();
      setReportData(data);

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

  const handlePrintPDF = () => {
    if (!reportTableRef.current) return;

    html2canvas(reportTableRef.current).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save('reporte.pdf');
    });
  };

  const translateEventType = (eventType: string) => {
    switch (eventType) {
      case 'CLOCK_IN':
        return 'Entrada';
      case 'LUNCH_OUT':
        return 'Salida a comer';
      case 'LUNCH_IN':
        return 'Regreso de comer';
      case 'CLOCK_OUT':
        return 'Salida';
      default:
        return eventType;
    }
  };

  return (
    <Card>
      <Card.Header as="h5">Generador de Reportes</Card.Header>
      <Card.Body>
        <Form onSubmit={handleGenerateReport}>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>Usuario</Form.Label>
                <Form.Select value={userId} onChange={e => setUserId(e.target.value)}>
                  <option value="">Todos</option>
                  {users.map(user => (
                    <option key={user.id} value={user.id}>{user.name}</option>
                  ))}
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Fecha de Inicio</Form.Label>
                <Form.Control type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Fecha de Fin</Form.Label>
                <Form.Control type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
              </Form.Group>
            </Col>
            <Col md={2} className="d-flex align-items-end">
              <Button type="submit" variant="primary" className="w-100" disabled={isLoading}>
                {isLoading ? <Spinner size="sm" /> : 'Generar'}
              </Button>
            </Col>
            <Col md={2} className="d-flex align-items-end">
                <Button variant="secondary" className="w-100" onClick={handlePrintPDF} disabled={reportData.length === 0}>
                    Imprimir en PDF
                </Button>
            </Col>
          </Row>
        </Form>

        {error && <Alert variant="danger">{error}</Alert>}

        <div ref={reportTableRef}>
            <Table striped bordered hover responsive="sm">
            <thead>
                <tr>
                <th>Usuario</th>
                <th>Fecha y Hora</th>
                <th>Tipo de Evento</th>
                <th>Ubicación (Lat, Lon)</th>
                </tr>
            </thead>
            <tbody>
                {reportData.map(log => (
                <tr key={log.id}>
                    <td>{log.user.name}</td>
                    <td>{new Date(log.timestamp).toLocaleString()}</td>
                    <td>{translateEventType(log.eventType)}</td>
                    <td>{log.latitude.toFixed(5)}, {log.longitude.toFixed(5)}</td>
                </tr>
                ))}
            </tbody>
            </Table>
        </div>
        {reportData.length === 0 && !isLoading && <div className="text-center p-3">No hay datos para mostrar. Use los filtros para generar un reporte.</div>}
      </Card.Body>
    </Card>
  );
}

import React, { useState } from 'react';
import { Row, Col, Card, Form, Navbar, Nav, Button } from 'react-bootstrap';
import { useRouter } from 'next/router';

export default function CreateAd() {
  const [script, setScript] = useState('');
  const [voice, setVoice] = useState('6wLJ4Wm2OxvAvetEUBCS');
  const router = useRouter();

  const voices = {
    Alex: "6wLJ4Wm2OxvAvetEUBCS",
    Jez: "WA9uLg4JEEGnvosWUUIc",
    Liam: "TX3LPaxmHKxFdv7VOQHJ",
    Myra: "gGqsateSZjogPUDNb6hx",
    Zoe: "cBijDV6IOSWp9c8dA7Xn"
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Passing data to add_music page
    router.push({
      pathname: '/add_music',
      query: { script, voice }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  return (
    <div style={{
      backgroundColor: '#343a40',
      minHeight: '100vh',
      // padding: '20px',
      display: 'flex',
      flexDirection: 'column',

    }}>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Navbar.Brand style={{ marginLeft: '10px', fontSize: '1.5em', fontWeight: 'bold', color: 'lightblue' }}>
          Firebay Studios (Demo)
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">
            {/* <Nav.Link style={{ color: "#FFF", borderRadius: '25px' }} onClick={() => router.push('/crm')}>
                        CRM
                    </Nav.Link> */}
          </Nav>
        </Navbar.Collapse>
        <Button variant="danger" size="sm" onClick={handleLogout} style={{ marginRight: '10px' }}>
          Logout
        </Button>
      </Navbar>
      <Row>
        <Col md={6} className="mx-auto">
          <Card className="p-4 bg-dark text-white" style={{ marginTop: '140px' }}>
            <h2 className="mb-4">Voice Settings</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="script">
                <Form.Label>Script</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder="Enter your script here"
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  style={{ color: 'black' }}
                />
              </Form.Group>
              <br></br>

              <Form.Group controlId="voice">
                <Form.Label>Voice</Form.Label>
                <Form.Select
                  aria-label="Voice select"
                  value={voice}
                  onChange={(e) => setVoice(e.target.value)}
                  style={{ color: 'black' }}
                >
                  {Object.entries(voices).map(([name, code]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Button type="submit" className="mt-3">
                Submit
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    </div>
  );
}

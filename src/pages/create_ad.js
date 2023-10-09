import React, { useState } from 'react';
import { Row, Col, Card, Form,  Navbar, Nav, Button  } from 'react-bootstrap';
import { useRouter } from 'next/router';


export default function CreateAd() {
  const [script, setScript] = useState('');
  const [gender, setGender] = useState('Male');
  const [accent, setAccent] = useState('American');
  const [age, setAge] = useState('18 yo - 25 yo');
  const router = useRouter();

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ script, gender, accent, age });
    router.push('/add_music');
  };
  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
};

  return (
    // <Container className="mt-5">
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
          <Card className="p-4 bg-dark text-white" style={{ marginTop: '140px'}}>
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

              <Form.Group controlId="gender">
                <Form.Label>Gender</Form.Label>
                <Form.Select
                  aria-label="Gender select"
                  value={gender}
                  onChange={(e) => setGender(e.target.value)}
                  style={{ color: 'black' }}
                >
                  <option>Male</option>
                  <option>Female</option>
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="accent">
                <Form.Label>Accent</Form.Label>
                <Form.Select
                  aria-label="Accent select"
                  value={accent}
                  onChange={(e) => setAccent(e.target.value)}
                  style={{ color: 'black' }}
                >
                  <option>American</option>
                  <option>British</option>
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="age">
                <Form.Label>Age</Form.Label>
                <Form.Select
                  aria-label="Age select"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  style={{ color: 'black' }}
                >
                  <option>18 yo - 25 yo</option>
                  <option>26 yo - 35 yo</option>
                  <option>36 yo - 50 yo</option>
                  <option>51 yo - 75 yo</option>
                </Form.Select>
              </Form.Group>

              <Button type="submit" className="mt-3">
                Submit
              </Button>
            </Form>
          </Card>
        </Col>
      </Row>
    {/* </Container> */}
    </div>
  );
}

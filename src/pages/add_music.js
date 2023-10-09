import React, { useState } from 'react';
import { Row, Col, Card, Form, Navbar, Nav, Button } from 'react-bootstrap';
import { useRouter } from 'next/router';

export default function AddMusic() {
    const [noMusic, setNoMusic] = useState(false);
    const [genre, setGenre] = useState('None');
    const router = useRouter();

    const handleSubmit = (e) => {
        e.preventDefault();
        console.log({ noMusic, genre });
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <div style={{
            backgroundColor: '#343a40',
            minHeight: '100vh',
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
                        <h2 className="mb-4">Add Background Music</h2>
                        <Form onSubmit={handleSubmit}>


                            <Form.Group controlId="noMusic">
                                <Form.Check
                                    type="checkbox"
                                    label="No Music"
                                    checked={noMusic}
                                    onChange={() => setNoMusic(!noMusic)}
                                />
                            </Form.Group>

                            <br></br>

                            <Form.Group controlId="genre">
                                <Form.Label>Genre</Form.Label>
                                <Form.Select
                                    aria-label="Genre select"
                                    value={genre}
                                    onChange={(e) => setGenre(e.target.value)}
                                    disabled={noMusic}
                                    style={{ color: 'black' }}
                                >
                                    <option>None</option>
                                    <option>Chill</option>
                                    <option>Upbeat</option>
                                    <option>Emotional</option>
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

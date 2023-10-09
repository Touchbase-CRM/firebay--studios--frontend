import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Navbar, Nav, Button } from 'react-bootstrap';
import { useRouter } from 'next/router';
import firebase from '../firebase';
import 'firebase/auth';
import axios from 'axios';

function toSnakeCase(str) {
    return str.toLowerCase().replace(/\s+/g, '_');
}

export default function AddMusic() {
    const [noMusic, setNoMusic] = useState(false);
    const [genre, setGenre] = useState('None');
    const [script, setScript] = useState('');
    const [voice, setVoice] = useState('');
    const router = useRouter();

    const { script: scriptQuery, voice: voiceQuery } = router.query;

    useEffect(() => {
        if(scriptQuery) setScript(scriptQuery);
        if(voiceQuery) setVoice(voiceQuery);
    }, [scriptQuery, voiceQuery]);

    const handleSubmit = (e) => {
        e.preventDefault();
        const userId = firebase.auth().currentUser.uid;
        const snakeCaseGenre = toSnakeCase(genre);
    
        const payload = { 
            "user_id": userId, 
            "no_music": noMusic, 
            "music_type": snakeCaseGenre, 
            "script": script, 
            "voice": voice 
        };
    
        // Endpoint URL
        const url = "http://localhost:5000/generate-mix";
    
        // Send POST request to the API
        axios.post(url, payload, { responseType: 'arraybuffer' })
            .then((response) => {
                // 3a. Receive binary audio data
                console.log('Audio data received');
    
                // 3b & 4a. Convert binary data to a Blob and create a Blob URL
                const audioBlob = new Blob([response.data], { type: 'audio/mp3' });
                const audioUrl = URL.createObjectURL(audioBlob);
    
                // 5a & 5b. Navigate to the download page and pass the Blob URL
                // Assuming you have a route called '/download'
                router.push({
                    pathname: '/download',
                    query: { audioUrl }
                });
            })
            .catch((error) => {
                // Print error message
                if (error.response) {
                    console.error(`Failed to retrieve audio. Status code: ${error.response.status}, Message: ${error.response.data}`);
                } else if (error.request) {
                    console.error(`No response received: ${error.request}`);
                } else {
                    console.error(`Error: ${error.message}`);
                }
            });
    };
    
    

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    return (
        <div style={{ backgroundColor: '#343a40', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar bg="dark" variant="dark" expand="lg">
                <Navbar.Brand style={{ marginLeft: '10px', fontSize: '1.5em', fontWeight: 'bold', color: 'lightblue' }}>
                    Firebay Studios (Demo)
                </Navbar.Brand>
                <Navbar.Toggle aria-controls="basic-navbar-nav" />
                <Navbar.Collapse id="basic-navbar-nav">
                    <Nav className="mr-auto"></Nav>
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
                                    <option>Up Beat</option>
                                    <option>Happy</option>
                                    <option>Jazz</option>
                                    <option>Motivational</option>
                                    <option>Rock</option>
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

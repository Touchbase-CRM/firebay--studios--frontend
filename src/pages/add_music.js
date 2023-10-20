import React, { useState, useEffect, useRef } from 'react';
import { Row, Col, Card, Form, Navbar, Nav, Button } from 'react-bootstrap';
import { useRouter } from 'next/router';
import firebase from '../firebase';
import 'firebase/auth';
import axios from 'axios';
import Spinner from '../components/Spinner';

function toSnakeCase(str) {
    return str.toLowerCase().replace(/\s+/g, '_');
}

export default function AddMusic() {
    const [noMusic, setNoMusic] = useState(false);
    const [genre, setGenre] = useState('up_beat');
    const [script, setScript] = useState('');
    const [voice, setVoice] = useState('');
    const [pendingAdvertisement, setPendingAdvertisement] = useState(false);
    const router = useRouter();
    const [adLength, setAdLength] = useState('');

    const goBack = () => {
        router.back();
    };

    const { adLength: adLengthQuery, script: scriptQuery, voice: voiceQuery } = router.query;

    useEffect(() => {
        if (adLengthQuery) setAdLength(adLengthQuery);
        if (scriptQuery) setScript(scriptQuery);
        if (voiceQuery) setVoice(voiceQuery);
    }, [adLengthQuery, scriptQuery, voiceQuery]);

    // Cancel token source for the Axios request
    const cancelTokenSourceRef = useRef(null);

    const cancelLoading = () => {
        setPendingAdvertisement(false);
        setNoMusic(false);
        setGenre('up_beat');
        setScript('');
        setVoice('');
        if (cancelTokenSourceRef.current) {
            cancelTokenSourceRef.current.cancel('Request canceled by the user.');
        }
        router.push('/create_ad');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        setPendingAdvertisement(true);  // Set pending before API call starts

        const userId = firebase.auth().currentUser.uid;
        const snakeCaseGenre = toSnakeCase(genre);
        cancelTokenSourceRef.current = axios.CancelToken.source();

        const payload = {
            "user_id": userId,
            "no_music": noMusic,
            "music_type": snakeCaseGenre,
            "script": script,
            "voice": voice,
            "ad_length": adLength
        };

        // Endpoint URL
        const url = "https://vgz580uujk.execute-api.us-east-2.amazonaws.com/generate-mix";
        // const url = "http://localhost:8000/generate-mix"; // For local testing

        // Send POST request to the API
        axios.post(url, payload, {
            responseType: 'arraybuffer',
            cancelToken: cancelTokenSourceRef.current.token  // Using the token from useRef
        })
            .then((response) => {
                console.log('Audio data received');

                const audioBlob = new Blob([response.data], { type: 'audio/mp3' });
                const audioUrl = URL.createObjectURL(audioBlob);

                router.push({
                    pathname: '/download',
                    query: { audioUrl }
                });
            })
            .catch((error) => {
                if (axios.isCancel(error)) {
                    console.log('Request was canceled:', error.message);
                } else if (error.response) {
                    console.error(`Failed to retrieve audio. Status code: ${error.response.status}, Message: ${error.response.data}`);
                } else if (error.request) {
                    console.error(`No response received: ${error.request}`);
                } else {
                    console.error(`Error: ${error.message}`);
                }
            })
            .finally(() => {
                setPendingAdvertisement(false);  // Set pending to false when API call completes
            });
    };

    const handleLogout = () => {
        localStorage.removeItem('user');
        router.push('/login');
    };

    if (pendingAdvertisement) {
        return (
            <div className="d-flex align-items-center justify-content-center flex-column" style={{ height: '100vh' }}>
                <Spinner animation="border" variant="primary" style={{ marginBottom: '200px' }} />

                <Card className="p-4 bg-dark text-white" style={{ marginTop: '300px' }}>
                    <p className="ml-3 mb-0" style={{ fontWeight: 'bold', fontSize: '24px', color: 'white', textShadow: '1px 1px 1px #000' }}>We are preparing your advertisement, hold on tight...</p>
                </Card>
                <Button variant="danger" onClick={cancelLoading} className="mt-3">Cancel and Start Over</Button>
            </div>
        );
    }


    return (
        <div style={{ backgroundColor: '#343a40', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
            <Navbar bg="dark" variant="dark" expand="lg">

                <Navbar.Brand style={{ marginLeft: '10px' }}>
                    <img src="/fire.png" alt="Firebay Studios" width="50" height="50" className="d-inline-block align-top" />
                </Navbar.Brand>

                <Button variant="light" onClick={goBack} style={{ marginRight: '10px' }}>&larr;</Button>
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

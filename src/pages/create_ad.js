import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Navbar, Nav, Button } from 'react-bootstrap';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import VoiceAudioPlayer from '../components/VoiceAudioPlayer';


export default function CreateAd() {
  const [script, setScript] = useState('');
  const [voice, setVoice] = useState('6wLJ4Wm2OxvAvetEUBCS');
  const router = useRouter();
  const [adLength, setAdLength] = useState('30'); // Default ad length
  var sampleMessage = "My name is "

  const CHACRACTEROVERFLOWTHRESHOLD = 15; // This is the threshold we will use to avoid overflow
  const CHARACTERSPERSEC = 15.2; // Experimentally determined characters per second

  // Calculate character limit based on the ad length
  var charLimit = Math.round(parseInt(adLength) * CHARACTERSPERSEC);
  charLimit = charLimit - CHACRACTEROVERFLOWTHRESHOLD; // substracting a threshold to avoid overflow

  useEffect(() => {
    setScript('');  // Reset script whenever adLength changes
  }, [adLength]);


  const voices = {
    Alex: "6wLJ4Wm2OxvAvetEUBCS",
    Jez: "WA9uLg4JEEGnvosWUUIc",
    Liam: "TX3LPaxmHKxFdv7VOQHJ",
    Myra: "gGqsateSZjogPUDNb6hx",
    Zoe: "cBijDV6IOSWp9c8dA7Xn"
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (script.length > charLimit) {  // Checking for character count
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You have too many characters!'
      });
      return;
    }
    if (script.length < 1) {  // Checking for empty script
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You cannot have an empty script!'
      });
      return;
    }


    // Passing data to add_music page
    router.push({
      pathname: '/add_music',
      query: { adLength, script, voice }
    });
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    router.push('/login');
  };

  const wordCountStyle = {
    position: 'absolute',
    bottom: '10px',
    right: '10px',
    background: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '0 5px',
    borderRadius: '5px',
  };

  return (
    <div style={{
      backgroundColor: '#343a40',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
    }}>
      <Navbar bg="dark" variant="dark" expand="lg">
        <Navbar.Brand style={{ marginLeft: '10px' }}>
          <img src="/fire.png" alt="Firebay Studios" width="50" height="50" className="d-inline-block align-top" />
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
          <Card className="p-4 bg-dark text-white" style={{ marginTop: '140px', height: '700px' }} >
            <h2 className="mb-4">Voice Settings</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="adLength">
                <Form.Label>Choose Ad Length</Form.Label>
                <Form.Select
                  aria-label="Ad length select"
                  value={adLength}
                  onChange={(e) => setAdLength(e.target.value)}
                  style={{ color: 'black' }}
                >
                  <option value="30">30 seconds</option>
                  <option value="60">60 seconds</option>
                </Form.Select>
              </Form.Group>

              <Form.Group controlId="script" style={{ position: 'relative' }}>
                <Form.Label>Script</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder={`Enter your script here (up to ${charLimit} characters)`}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  style={{ color: 'black', height: '350px' }}
                />
                <div style={wordCountStyle}>
                  {script.length}/{charLimit}
                </div>
              </Form.Group>


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
          <div>
            <VoiceAudioPlayer text={sampleMessage} voice_id={voice} />
          </div>
        </Col>
      </Row>
    </div>

  );
}

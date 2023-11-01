import React, { useState, useEffect } from 'react';
import { Row, Col, Card, Form, Navbar, Nav, Button } from 'react-bootstrap';
import { useRouter } from 'next/router';
import Swal from 'sweetalert2';
import VoiceAudioPlayer from '../components/VoiceAudioPlayer';
import IntonationManager from '../components/IntonationManager';
import ExamplesViewer from '../components/ExamplesViewer';
import { createClient } from '@vercel/kv';

const frontendCache = createClient({
  url: process.env.NEXT_PUBLIC_KV_REST_API_URL,
  token: process.env.NEXT_PUBLIC_KV_REST_API_TOKEN,
});


export default function CreateAd() {
  const [script, setScript] = useState('');
  const [voiceId, setVoiceId] = useState('6wLJ4Wm2OxvAvetEUBCS');
  const [voiceName, setVoiceName] = useState('Charley');
  const router = useRouter();
  const [adLength, setAdLength] = useState('30'); // Default ad length
  const [showExamples, setShowExamples] = useState(false);
  const [keywords, setKeywords] = useState([]);
  const [isFormSubmitted, setFormSubmitted] = useState(false);

  const CHACRACTEROVERFLOWTHRESHOLD = 15; // This is the threshold we will use to avoid overflow
  const CHARACTERSPERSEC = 15.2; // Experimentally determined characters per second

  var charLimit = Math.round(parseInt(adLength) * CHARACTERSPERSEC);   // Calculate character limit based on the ad length
  charLimit = charLimit - CHACRACTEROVERFLOWTHRESHOLD; // substracting a threshold to avoid overflow
  var sampleMessage = `Hi I’m ${voiceName}, feel free to use my voice to create an ad.`;// this message is currently not needed. But it will be useful if we directly use api to preview voice.

  useEffect(() => {
    setScript('');  // Reset script whenever adLength changes
  }, [adLength]);

  useEffect(() => {
    if (isFormSubmitted) {
      setFormSubmitted(false);
    }
  }, [isFormSubmitted]);

  useEffect(() => {
    if (isFormSubmitted) {
      // Now the script state has the updated value. You can safely route.
      router.push({
        pathname: '/add_music',
        query: { adLength, script, voiceId }
      });
    }
  }, [script, isFormSubmitted, adLength, voiceId, router]);


  const cacheAdDetails = async () => {
    try {
      // Create an object with each state variable as a key-value pair
      const adDetails = {
        scriptCache: script,
        voiceIdCache: voiceId,
        voiceNameCache: voiceName,
        adLengthCache: adLength,
        keywordsCache: JSON.stringify(keywords) // Keywords might be an array, so we'll stringify it just in case
      };

      // Store it in the cache with a unique hash key like 'adDetailsCache'
      await frontendCache.hset('mythicalManMonth', adDetails);
    } catch (error) {
      console.error('Failed to cache ad details:', error);
    }
  };


  const voices = {
    Charley: "6wLJ4Wm2OxvAvetEUBCS",
    Bryan: "WA9uLg4JEEGnvosWUUIc",
    Joe: "TX3LPaxmHKxFdv7VOQHJ",
    Elizabeth: "gGqsateSZjogPUDNb6hx",
    Kate: "cBijDV6IOSWp9c8dA7Xn"
  };

  const handleKeywordsChange = (updatedKeywords) => {
    setKeywords(updatedKeywords);
  };

  const checkKeywordsInScript = () => {
    const Intonator = "'";
    let updatedScript = script;
    const notFoundKeywords = [];

    keywords.forEach(keyword => {
      if (updatedScript.includes(keyword)) {
        // Surround the keyword with the Intonator character for emphasis
        updatedScript = updatedScript.replace(new RegExp(`\\b${keyword}\\b`, 'g'), `${Intonator}${keyword}${Intonator}`);
      } else {
        notFoundKeywords.push(keyword);
      }
    });

    // Update the script state.
    setScript(updatedScript);

    if (notFoundKeywords.length > 0) {
      Swal.fire({
        icon: 'error',
        title: 'Keywords Not Found',
        text: `The following keywords were not found in the script: ${notFoundKeywords.join(', ')}. Please remove them or add them to your script to continue.`,
      });
      return false;
    }
    return true;
  };


  const handleSubmit = (e) => {
    e.preventDefault();

    if (!checkKeywordsInScript()) return;

    if (script.length > charLimit) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You have too many characters!'
      });
      return;
    }
    if (script.length < 1) {
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'You cannot have an empty script!'
      });
      return;
    }
    cacheAdDetails();

    // Set form submitted to true
    setFormSubmitted(true);
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
        <Col md={10} className="mx-auto">
          <Card className="p-4 bg-dark text-white" style={{ marginTop: '70px', height: '800px', width: '1450px', marginBottom: '140px' }} >
            <h2 className="mb-4">Voice Settings</h2>
            <Form onSubmit={handleSubmit}>
              <Form.Group controlId="adLength">
                <Form.Label>Choose Ad Length</Form.Label>
                <Form.Select
                  aria-label="Ad length select"
                  value={adLength}
                  onChange={(e) => setAdLength(e.target.value)}
                  style={{ color: 'black', marginBottom: '20px' }}
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
                  style={{ color: 'black', height: '200px', marginBottom: '20px' }}
                />
                <div style={wordCountStyle}>
                  {script.length}/{charLimit}
                </div>
              </Form.Group>

              <IntonationManager onKeywordsChange={handleKeywordsChange} />


              <Form.Group controlId="voice">
                <Form.Label>Voice</Form.Label>
                <Form.Select
                  aria-label="Voice select"
                  value={voiceId}
                  onChange={(e) => {
                    setVoiceId(e.target.value);
                    setVoiceName(e.target[e.target.selectedIndex].text);
                  }}

                  style={{ color: 'black' }}
                >
                  {Object.entries(voices).map(([name, code]) => (
                    <option key={code} value={code}>
                      {name}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Button type="submit" className="mt-3" style={{ marginRight: '10px', marginTop: '20px' }}>
                Submit
              </Button>
              <button
                className="mt-3"
                type="button"
                onClick={() => setShowExamples(true)}
                style={{
                  backgroundColor: '#17a2b8', // Blue color similar to Bootstrap primary
                  border: 'none',
                  borderRadius: '5px',
                  padding: '8px 16px',
                  fontSize: '1rem',
                  color: 'white',
                  cursor: 'pointer',
                  outline: 'none',
                  transition: 'background-color 0.3s',
                  float: 'right',// This makes it align to the card's edge,
                  marginTop: '20px'
                }}
                onMouseOver={(e) => e.target.style.backgroundColor = '#138496'} // Darken the info color on hover
                onMouseOut={(e) => e.target.style.backgroundColor = '#17a2b8'}
              >
                Samples
              </button>


              <ExamplesViewer show={showExamples} onHide={() => setShowExamples(false)} />
            </Form>
          </Card>

          <div>
            <VoiceAudioPlayer text={sampleMessage} voiceId={voiceId} voiceName={voiceName} style={{ marginTop: '20px' }} />
          </div>
        </Col>
      </Row>
    </div>

  );
}
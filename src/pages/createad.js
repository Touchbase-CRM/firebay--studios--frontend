import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button } from 'react-bootstrap';

export default function CreateAd() {
  const [script, setScript] = useState('');
  const [gender, setGender] = useState('Male');
  const [accent, setAccent] = useState('American');
  const [age, setAge] = useState('18 yo - 25 yo');

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log({ script, gender, accent, age });
  };

  return (
    <Container className="mt-5">
      <Row>
        <Col md={6} className="mx-auto">
            <br></br>
          <Card className="p-4 bg-dark text-white">
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
    </Container>
  );
}

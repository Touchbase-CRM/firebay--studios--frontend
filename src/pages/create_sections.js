import React, { useState, useEffect } from "react";
import { Row, Col, Card, Form, Navbar, Nav, Button } from "react-bootstrap";
import { useRouter } from "next/router";

import useUserInputsStore from "../store/userInputs";
import { Section } from "../dataStructures/section";
import { sectionQueueWrapperForDequeue } from "../store/zustand_wrappers/sections_queue";

import withAuth from "../hocs/withAuth";
import { getAuth } from "firebase/auth";
import Swal from "sweetalert2";

function CreateSections() {
  const auth = getAuth();

  const router = useRouter();

  // Zustand store hooks
  const {
    adLength,
    setAdLength,
    sectionsQueue,
    enqueueSection,
    sectionsArray,
    addSection,
    currentSectionObj,
    setCurrentSectionObj,
  } = useUserInputsStore();
  const store = useUserInputsStore();

  const [isFormSubmitted, setFormSubmitted] = useState(false);
  const [originalScriptForSectionSplit, setOriginalScriptForSectionSplit] =
    useState("");

  const CHACRACTEROVERFLOWTHRESHOLD = 15; // This is the threshold we will use to avoid overflow
  const CHARACTERSPERSEC = 15.2; // Experimentally determined characters per second

  var charLimit = Math.round(parseInt(adLength) * CHARACTERSPERSEC); // Calculate character limit based on the ad length
  charLimit = charLimit - CHACRACTEROVERFLOWTHRESHOLD; // substracting a threshold to avoid overflow

  useEffect(() => {
    if (isFormSubmitted) {
      router.push("/process_section");
    }
  }, [isFormSubmitted, router]);

  const validateScript = (script, charLimit, onSuccess, onFailure) => {
    if (script.length > charLimit) {
      onFailure("error", "Oops...", "You have too many characters!");
      return false; // Indicate failure
    }
    if (script.length < 1) {
      onFailure("error", "Oops...", "You cannot have an empty script!");
      return false; // Indicate failure
    }
    onSuccess();
    return true; // Indicate success
  };

  const showAlert = (icon, title, text) => {
    Swal.fire({
      icon: icon,
      title: title,
      text: text,
    });
  };

  const handleScriptChange = (e) => {
    const updatedScript = e.target.value;
    setOriginalScriptForSectionSplit(updatedScript);
    const extractedSections = updatedScript
      .split(/(?<!\.{2})\.(?!\.)\s+/)
      .filter(Boolean);

    // Clear the current queue before adding new sections
    useUserInputsStore.getState().resetSectionsQueue();

    // Enqueue each extracted section as a Section object
    extractedSections.forEach((sectionContent, index) => {
      const section = new Section(index + 1, sectionContent); // +1 if you want to start indexing from 1
      addSection(section);
      enqueueSection(section);
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const isValid = validateScript(
      originalScriptForSectionSplit,
      charLimit,
      () => setFormSubmitted(true),
      showAlert
    );

    if (!isValid) return;

    if (sectionsQueue.size() !== 0) {
      router.push("/process_section");
      sectionQueueWrapperForDequeue(store); // dequeue the first section
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("user");
    auth
      .signOut()
      .then(() => {
        router.push("/login");
      })
      .catch((error) => {
        console.error("Logout Error:", error);
      });
  };

  const wordCountStyle = {
    position: "absolute",
    bottom: "10px",
    right: "10px",
    background: "rgba(0, 0, 0, 0.7)",
    color: "white",
    padding: "0 5px",
    borderRadius: "5px",
  };

  return (
    <div
      style={{
        backgroundColor: "#343a40",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Navbar
        bg="dark"
        variant="dark"
        expand="lg"
        style={{ marginBottom: "20px" }}
      >
        <Navbar.Brand style={{ marginLeft: "10px" }}>
          <img
            src="/fire.png"
            alt="Firebay Studios"
            width="50"
            height="50"
            className="d-inline-block align-top"
          />
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse
          id="basic-navbar-nav"
          className="justify-content-between"
        >
          <Nav className="mr-auto">
            {/* Other nav links or content can go here */}
          </Nav>
          {/* This will ensure the CustomDropdown is aligned to the right */}
        </Navbar.Collapse>
      </Navbar>

      <Row>
        <Col md={10} className="mx-auto"></Col>
      </Row>
      <Row>
        <Col md={10} className="mx-auto">
          <Card
            className="p-4 bg-dark text-white"
            style={{
              backgroundColor: "black",
              color: "white",
              marginTop: "10px",
              height: "800px",
              marginBottom: "10px",
            }}
          >
            <Card.Body>
              <Card.Title>Script Editor</Card.Title>
              <Form.Group controlId="adLength">
                <Form.Label>Choose Ad Length</Form.Label>
                <Form.Select
                  aria-label="Ad length select"
                  value={adLength}
                  onChange={(e) => setAdLength(e.target.value)}
                  style={{ color: "black", marginBottom: "20px" }}
                >
                  <option value="30">30 seconds</option>
                  <option value="60">60 seconds</option>
                </Form.Select>
              </Form.Group>
              {/* Message to display when script is empty */}
              {originalScriptForSectionSplit === "" && (
                <div className="alert alert-info" role="alert">
                  <strong>Quick Guide to Pyro Sections</strong>
                  <br />
                  In Pyro Advanced Ad Generation mode, we split your script into
                  "sections". A section is the smallest unit of voice over that
                  has the same voice properties such as voice actor, intonation,
                  emotions, etc. Note that a section can be either a sentence or
                  a fragment in Pyro, so anywhere you have included period
                  symbol with one or more proceeding white spaces, we will treat
                  it as a new section. Moreover, if you don't have trailing
                  spaces after a period symbol, we will not treat it as a new
                  section.
                </div>
              )}

              <Form.Group controlId="script" style={{ position: "relative" }}>
                <Form.Label>Script</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder={`Enter your script here (up to ${charLimit} characters)`}
                  value={originalScriptForSectionSplit}
                  onChange={handleScriptChange}
                  style={{
                    color: "black",
                    height: "140px",
                    marginBottom: "20px",
                  }}
                />
                <div style={wordCountStyle}>
                  {originalScriptForSectionSplit.length}/{charLimit}
                </div>
              </Form.Group>

              <div
                style={{
                  backgroundColor: "#282c34",
                  padding: "10px",
                  borderRadius: "5px",
                  marginTop: "10px",
                }}
              >
                <div>
                  <Form.Label>Sections from your script</Form.Label>
                  {sectionsQueue.size() > 0 ? (
                    <ol>
                      {sectionsQueue.items.map((section, index) => (
                        <li key={index} style={{ color: "orange" }}>
                          {section.getCurrentContent()}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <p style={{ color: "lightblue", fontStyle: "italic" }}>
                      No sections found
                    </p>
                  )}
                </div>
              </div>

              <br></br>
              {/* Display the number of sections found */}
              {sectionsQueue.size() > 0 && (
                <div className="alert alert-success" role="alert">
                  We have found {sectionsQueue.size()} section
                  {sectionsQueue.size() !== 1 ? "s" : ""} in your script. You
                  will be prompted to produce the voice for these one by one in
                  the next few steps.
                </div>
              )}
            </Card.Body>
          </Card>

          <div
            style={{
              // position: "absolute",
              // bottom: "10px",
              // left: "10px",
              fontSize: "small",
              fontWeight: "bold",
              fontStyle: "italic",
            }}
          >
            <Button
              className="mt-3"
              style={{ marginRight: "10px", marginTop: "20px" }}
              onClick={handleSubmit}
            >
              Next
            </Button>
          </div>
          {/* By adding a massive margin top I was able to add the scrollability to mac OS */}
        </Col>
      </Row>
    </div>
  );
}
export default withAuth(CreateSections);

import React, { useState, useEffect } from "react";
import { Row, Col, Card, Form, Navbar, Nav, Button } from "react-bootstrap";
import { useRouter } from "next/router";

import useUserInputsStore from "../store/userInputs";
import { Section } from "../dataStructures/section";

import withAuth from "../hocs/withAuth";
import { getAuth } from "firebase/auth";
import Swal from "sweetalert2";
import Alert from "react-bootstrap/Alert";

function CreateSections() {
  const auth = getAuth();
  const router = useRouter();

  // Zustand store hooks
  const {
    adLength,
    setAdLength,
    sectionsQueue,
    enqueueSectionZustand,
    dequeueSectionZustand,
    // sectionsArray,
    currentSectionObj,
    numSectionsIdentified,
    setNumSectionsIdentified,
    setCurrentSectionObjZustand,
    setOriginalScriptString,
    ogScriptWordsArray,
    setOgScriptWordsArray,
    transformedWords,
    setTransformedWords,
    reset: resetUserInputsStore,
  } = useUserInputsStore();

  const [isFormSubmitted, setFormSubmitted] = useState(false);
  const [originalScriptForSectionSplit, setOriginalScriptForSectionSplit] =
    useState("");

  const CHACRACTEROVERFLOWTHRESHOLD = 15; // This is the threshold we will use to avoid overflow
  const CHARACTERSPERSEC = 15.2; // Experimentally determined characters per second

  var charLimit = Math.round(parseInt(adLength) * CHARACTERSPERSEC); // Calculate character limit based on the ad length
  charLimit = charLimit - CHACRACTEROVERFLOWTHRESHOLD; // substracting a threshold to avoid overflow

  useEffect(() => {
    // prevent back button
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = ""; // Chrome requires returnValue to be set
    };

    const handleBackButton = async () => {
      handleLogout();
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    window.onpopstate = handleBackButton;

    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
      window.onpopstate = null;
    };
  }, [router]);

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
    useUserInputsStore.getState().resetSectionsQueueZustand();
    setNumSectionsIdentified(extractedSections.length);
    // Enqueue each extracted section as a Section object
    extractedSections.forEach((sectionContent, index) => {
      const section = new Section(
        index + 0,
        sectionContent,
        sectionContent,
        null,
        0
      ); // +1 if you want to start indexing from 1
      enqueueSectionZustand(section);
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
      console.log("Queue not empty, continue processing");
      dequeueSectionZustand(); // Remove the first item from the queue
      const lastDequeuedItemObject = useUserInputsStore.getState();
      setCurrentSectionObjZustand(lastDequeuedItemObject.lastDequeuedItem);

      const lastDequeuedItem =
        lastDequeuedItemObject.lastDequeuedItem.getCurrentContent();

      // Update the original script string to the last dequeued item
      setOriginalScriptString(lastDequeuedItem || "");

      // Split the dequeued item into words and update transformed words
      const newWords = lastDequeuedItem ? lastDequeuedItem.split(" ") : [];
      const newTransformedWords = {};

      newWords.forEach((word, index) => {
        if (ogScriptWordsArray[index] === word && transformedWords[index]) {
          newTransformedWords[index] = transformedWords[index];
        }
      });

      // Update the original script words array and transformed words
      setOgScriptWordsArray(newWords);
      setTransformedWords(newTransformedWords);
    }
  };

  const handleLogout = () => {
    resetUserInputsStore();
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
        backgroundColor: "#FFFFFF",
      }}
    >
      <Navbar
        expand="lg"
        style={{ marginBottom: "5px", backgroundColor: "#e4e4e4" }} // Set the navbar background to #e4e4e4
      >
        <Navbar.Brand style={{ marginLeft: "10px" }}>
          <img
            src="/fire.png"
            width="50"
            height="50"
            className="d-inline-block align-top"
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto">{/* Nav items here */}</Nav>
        </Navbar.Collapse>
        <Button
          variant="danger"
          size="sm"
          onClick={handleLogout}
          style={{ marginRight: "10px" }}
        >
          Logout
        </Button>
      </Navbar>

      <Row>
        <Col md={10} className="mx-auto"></Col>
      </Row>
      <Row>
        <Col md={10} className="mx-auto">
          <Card
            className="p-4 "
            style={{
              borderRadius: "1rem",
              borderColor: "#eb631c",
              color: "black",
              marginTop: "10px",
              height: "900px",
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
                <Alert variant="info">
                  <Alert.Heading>
                    Simple Guide to Sections in Pyro Advanced Ad Generation Mode
                  </Alert.Heading>
                  <p>
                    When making an ad with Pyro Advanced Ad Generation Mode,
                    think of your script as being made up of small parts called
                    “sections.” Each section is like a chunk of your ad where
                    the speaking style doesn’t change - it’s the same voice,
                    tone, and emotion throughout.
                  </p>
                  <hr />
                  <p>
                    <strong>How to Make a Section:</strong> End a part of your
                    script with a dot (like the period at the end of a sentence)
                    and then add a space. This tells Pyro you’re starting a new
                    section with a new speaking style. If you don’t put a space
                    after the dot (period), Pyro understands that you’re still
                    in the same section, keeping the same speaking style.
                  </p>
                  <p>
                    <strong>NOTE:</strong> These suggestions should be made to
                    your script before uploading onto the Pyro platform.
                  </p>
                  <p className="mb-0">
                    <strong>Key Tip:</strong> Dot (period) plus space equals a
                    new section. No space means the same section continues.
                  </p>
                </Alert>
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
                  backgroundColor: "#eb631c",
                  padding: "10px",
                  borderRadius: "5px",
                  marginTop: "10px",
                  maxHeight: "300px", // Set a max-height for scrollable area
                  overflowY: "auto", // Add vertical scrollbar
                }}
              >
                <div>
                  <Form.Label>Sections from your script</Form.Label>
                  {sectionsQueue.size() > 0 ? (
                    <table
                      style={{
                        width: "100%", // Full width of the container
                        borderCollapse: "collapse",
                        backgroundColor: "#e4e4e4",
                      }}
                    >
                      <thead>
                        <tr>
                          <th
                            style={{
                              borderBottom: "2px solid #dee2e6",
                              padding: "8px",
                              color: "black",
                              width: "5%", // Allocate less width for 'Section ID'
                            }}
                          >
                            Section ID
                          </th>
                          <th
                            style={{
                              borderBottom: "2px solid #dee2e6",
                              padding: "8px",
                              color: "black",

                              // Do not set width here to allow this column to take the remaining space
                            }}
                          >
                            Section content
                          </th>
                          <th
                            style={{
                              borderBottom: "2px solid #dee2e6",
                              padding: "8px",
                              color: "black",

                              width: "15%", // Allocate less width for 'Allocated character count for the section'
                            }}
                          >
                            Allocated character count for the section
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {sectionsQueue.items.map((section, index) => (
                          <tr key={index}>
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #dee2e6",
                                textAlign: "center", // Center align for better aesthetics
                              }}
                            >
                              {section.getIndex() + 1}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #dee2e6",
                                // Removed maxWidth to allow this cell to take up remaining space
                              }}
                            >
                              {section.getOriginalContent()}
                            </td>
                            <td
                              style={{
                                padding: "8px",
                                borderBottom: "1px solid #dee2e6",
                                textAlign: "center", // Center align for better aesthetics
                              }}
                            >
                              {section.getOriginalCharCount()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
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
                  the next few steps. To comply with the ad length you desired,
                  you will be limited to the character count mentioned for each
                  section above.
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
              style={{
                marginRight: "10px",
                marginTop: "20px",
                backgroundColor: "#EB631C",
                borderColor: "#EB631C",
              }}
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

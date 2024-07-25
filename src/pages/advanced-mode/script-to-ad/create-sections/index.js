import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Alert,
  Offcanvas,
} from "react-bootstrap";
import { getAuth } from "firebase/auth";
import Swal from "sweetalert2";
import { useRouter } from "next/router";

import { NavBar } from "@/components/foundation-components/nav-bar";
import { SectioningTutorial } from "@/_pages/advanced-mode/script-to-ad/create-sections/components/tutorial/alert";
import DetectedSections from "@/_pages/advanced-mode/script-to-ad/create-sections/components/detected-sections";

import useUserInputsStore from "@/store/user-inputs";
import { Section } from "@/data-structures/section";
import withAuth from "@/hocs/with-auth";

function CreateSections() {
  const auth = getAuth();
  const router = useRouter();

  // Zustand store hooks
  const {
    adLength,
    setAdLength,
    sectionsArray,
    setSectionsArray,
    setSectionHistoryArray,
    setNumSectionsIdentified,
    s2aAdvancedFreeStyleStatus,
    setS2aAdvancedFreeStyleStatus,
    reset: resetUserInputsStore,
  } = useUserInputsStore();

  const [localSectionsArray, setLocalSectionsArray] = useState(sectionsArray);
  const [isFormSubmitted, setFormSubmitted] = useState(false);
  const [originalScriptForSectionSplit, setOriginalScriptForSectionSplit] =
    useState("");
  const CHACRACTEROVERFLOWTHRESHOLD = 15; // This is the threshold we will use to avoid overflow
  const CHARACTERSPERSEC = 15.2; // Experimentally determined characters per second
  const [showTutorial, setShowTutorial] = useState(false);
  const [showOffCanvas, setShowOffCanvas] = useState(false); // New state for off-canvas

  var charLimit = Math.round(parseInt(adLength) * CHARACTERSPERSEC); // Calculate character limit based on the ad length
  charLimit = charLimit - CHACRACTEROVERFLOWTHRESHOLD; // subtracting a threshold to avoid overflow

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
      router.push("/advanced-mode/script-to-ad/process-section/0");
    }
  }, [isFormSubmitted, router]);

  const validateScript = (script, charLimit, onSuccess, onFailure) => {
    if (!s2aAdvancedFreeStyleStatus && script.length > charLimit) {
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

  const handleClearScript = () => {
    setOriginalScriptForSectionSplit("");
    setLocalSectionsArray([]);
    setNumSectionsIdentified(0);
  };

  const handleScriptChange = (e) => {
    const updatedScript = e.target.value;
    setOriginalScriptForSectionSplit(updatedScript);
    const extractedSections = updatedScript.split(/\s*\/\/\s*/).filter(Boolean);

    setNumSectionsIdentified(extractedSections.length);
    let tmpArray = [];
    extractedSections.forEach((sectionContent, index) => {
      const section = new Section(
        index + 0,
        sectionContent,
        sectionContent,
        null,
        0
      ); // +1 if you want to start indexing from 1
      // Add the section to the tmpArray
      tmpArray.push(section);
    });

    setLocalSectionsArray(tmpArray);
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

    // Update Zustand store with the local state before navigating
    setSectionsArray(localSectionsArray);
    setSectionHistoryArray(new Array(localSectionsArray.length).fill(null));

    // Navigate to the first section if the section array is not empty
    if (localSectionsArray.length !== 0) {
      router.push("/advanced-mode/script-to-ad/process-section/0");
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

  const handleFreeStyleChange = (e) => {
    const newValue = e.target.checked;
    setS2aAdvancedFreeStyleStatus(newValue);
  };
  const handleTutorialClose = () => setShowTutorial(false);
  const handleTutorialShow = () => setShowTutorial(true);

  const handleOffCanvasClose = () => setShowOffCanvas(false); // New function to handle closing the off-canvas
  const handleOffCanvasShow = () => setShowOffCanvas(true); // New function to handle showing the off-canvas

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
      <NavBar links={[]} logoutHandler={handleLogout} />

      <Row className="m-0 p-0 mt-4 mt-md-5">
        <Col md={10} className="mx-auto m-0 p-0"></Col>
      </Row>
      <Row className="m-0 p-0">
        <Col md={10} className="mx-auto m-0 p-0">
          <Card
            className="p-2 p-md-3 m-0"
            style={{
              borderRadius: "1rem",
              borderColor: "#eb631c",
              color: "black",
              marginBottom: "20px",
              minWidth: "100%",
              boxSizing: "border-box",
            }}
          >
            <Card.Body className="p-0 p-md-1">
              <Card.Title>Script Editor</Card.Title>
              <Form.Group controlId="adLength" className="mt-2">
                <Form.Label>Choose Ad Length</Form.Label>
                <Form.Select
                  aria-label="Ad length select"
                  value={adLength}
                  onChange={(e) => setAdLength(e.target.value)}
                  style={{ color: "black", marginBottom: "10px" }}
                >
                  <option value="10">10 seconds</option>
                  <option value="15">15 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="45">45 seconds</option>
                  <option value="60">60 seconds</option>
                  <option value="90">90 seconds</option>
                  <option value="120">120 seconds</option>
                </Form.Select>
              </Form.Group>

              <Form.Group
                controlId="freeStyleToggle"
                className="d-flex align-items-center"
                style={{ marginTop: "10px" }}
              >
                <Form.Label className="mb-0" style={{ marginRight: "10px" }}>
                  Free Style Mode
                </Form.Label>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="freeStyleSwitch"
                    checked={s2aAdvancedFreeStyleStatus}
                    onChange={handleFreeStyleChange}
                    style={{
                      backgroundColor: s2aAdvancedFreeStyleStatus
                        ? "#eb631c"
                        : "white",
                      borderColor: s2aAdvancedFreeStyleStatus
                        ? "#eb631c"
                        : "#adb5bd",
                    }}
                  />
                </div>
              </Form.Group>
              <Form.Group
                controlId="dragonBreathToggle"
                className="d-flex align-items-center"
                style={{ marginTop: "5px" }}
              >
                <Alert
                  style={{
                    variant: "info",
                    fontSize: "12px",
                    padding: "5px 10px",
                  }}
                >
                  Pyro Tip: If you are not concerned about sticking to the spot
                  length of {adLength} Sec , you can enable free style mode to
                  lift the character count restrictions. We will still display
                  the character limit as a reccomendation which you may choose
                  to ignore.
                </Alert>
              </Form.Group>

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
                    height: "150px",
                    marginBottom: "10px",
                    resize: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "48px",
                    right: "0px",
                    background: "rgba(0, 0, 0, 0.7)",
                    color: "white",
                    padding: "0 5px",
                    borderRadius: "5px",
                  }}
                >
                  {originalScriptForSectionSplit.length}/{charLimit}
                </div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <Button
                    style={{
                      backgroundColor: "#FDA942",
                      borderColor: "#FDA942",
                    }}
                    onClick={handleClearScript}
                  >
                    Clear
                  </Button>
                  <Button
                    variant="primary"
                    onClick={
                      originalScriptForSectionSplit === ""
                        ? handleTutorialShow
                        : handleOffCanvasShow
                    }
                    style={{
                      backgroundColor: "white",
                      borderColor: "#FDA942",
                      color: "black",
                    }} // Adjusted to align horizontally with the Clear Script button
                  >
                    {originalScriptForSectionSplit === "" ? "Tutorial" : "View Sections"}
                  </Button>
                </div>
              </Form.Group>


              <br></br>
              {/* Display the number of sections found */}
              {localSectionsArray.length > 0 && (
                <div
                  className="alert alert-success"
                  role="alert"
                  style={{
                    backgroundColor: "#d4edda",
                    borderColor: "#c3e6cb",
                    color: "#155724",
                  }}
                >
                  We found {localSectionsArray.length} section
                  {localSectionsArray.length !== 1 ? "s" : ""} in your script.
                  You can{" "}
                  <span
                    onClick={handleOffCanvasShow}
                    style={{
                      color: "#155724",
                      textDecoration: "underline",
                      cursor: "pointer",
                      fontFamily: "inherit",
                      fontSize: "inherit",
                    }}
                  >
                    view the sections here
                  </span>
                  . Next, you'll be prompted to produce the voice for these one
                  by one. To ensure your ad fits the desired length, you'll be
                  limited to the character count mentioned for each section.
                </div>
              )}
            </Card.Body>
          </Card>

          <div
            style={{
              fontSize: "small",
              fontWeight: "bold",
              fontStyle: "italic",
            }}
          >
            <Button
              className="mt-2"
              style={{
                marginRight: "10px",
                backgroundColor: "#EB631C",
                borderColor: "#EB631C",
              }}
              onClick={handleSubmit}
            >
              Next
            </Button>
          </div>
        </Col>
      </Row>

      {/* Off-canvas for displaying sections as a numbered list group */}
      <DetectedSections
        show={showOffCanvas}
        handleClose={handleOffCanvasClose}
        sections={localSectionsArray}
      />

      {/* Off-canvas for displaying tutorial */}
      <Offcanvas
        show={showTutorial}
        onHide={handleTutorialClose}
        placement="end"
      >
        <Offcanvas.Header closeButton>
          <Offcanvas.Title>Tutorial</Offcanvas.Title>
        </Offcanvas.Header>
        <Offcanvas.Body>
          <SectioningTutorial />
        </Offcanvas.Body>
      </Offcanvas>
    </div>
  );

}

// export default withAuth(CreateSections);
export default CreateSections;

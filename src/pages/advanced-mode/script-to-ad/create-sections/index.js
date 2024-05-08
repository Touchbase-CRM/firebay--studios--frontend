import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Offcanvas,
} from "react-bootstrap";
import { getAuth } from "firebase/auth";
import Swal from "sweetalert2";
import Alert from "react-bootstrap/Alert";

import "bootstrap-icons/font/bootstrap-icons.css";
import { useRouter } from "next/router";

import { NavBar } from "@/components/foundation-components/nav-bar";
import { SectioningTutorial } from "./components/tutorial/alert";

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

  const links = [
    {
      label: "Dashboard",
      url: "/dashboard",
      isInternal: true,
      icon: "bi bi-house", // Bootstrap icon class
      style: { marginRight: "10px" }, // Example styling
    },
    // {
    //   label: "About",
    //   url: "/about",
    //   // Optionally, some links might not have an icon
    //   style: { marginRight: "10px" },
    // },
    // Add more links as needed
  ];

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
      <NavBar links={links} logoutHandler={handleLogout} />

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
              height: "950px",
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
                  <option value="10">10 seconds</option>
                  <option value="15">15 seconds</option>
                  <option value="30">30 seconds</option>
                  <option value="45">45 seconds</option>
                  <option value="60">60 seconds</option>
                </Form.Select>
              </Form.Group>
              {/* Message to display when script is empty */}
              {originalScriptForSectionSplit === "" && (
                <>
                  <Offcanvas
                    show={showTutorial}
                    onHide={handleTutorialClose}
                    placement="end"
                    style={{ width: "800px" }}
                  >
                    <Offcanvas.Header closeButton>
                      <Offcanvas.Title>Tutorial</Offcanvas.Title>
                    </Offcanvas.Header>
                    <Offcanvas.Body>
                      <SectioningTutorial />
                    </Offcanvas.Body>
                  </Offcanvas>
                </>
              )}

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
                    height: "140px",
                    marginBottom: "20px",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    bottom: "62px",
                    right: "3px",
                    background: "rgba(0, 0, 0, 0.7)",
                    color: "white",
                    padding: "0 5px",
                    borderRadius: "5px",
                  }}
                >
                  {originalScriptForSectionSplit.length}/{charLimit}
                </div>
                <div
                  style={{ display: "flex", justifyContent: "space-between" }}
                >
                  <Button
                    style={{
                      backgroundColor: "#FDA942",
                      borderColor: "#FDA942",
                    }}
                    onClick={handleClearScript}
                  >
                    Clear
                  </Button>
                  {originalScriptForSectionSplit === "" && (
                    <Button
                      variant="primary"
                      onClick={handleTutorialShow}
                      style={{
                        position: "absolute",
                        right: "0px",
                        bottom: "10px",
                        backgroundColor: "white",
                        borderColor: "#FDA942",
                        color: "black",
                      }} // Adjusted to align horizontally with the Clear Script button
                    >
                      Tutorial
                    </Button>
                  )}
                </div>
              </Form.Group>

              <div
                style={{
                  borderColor: "#eb631c",
                  color: "black",
                  padding: "10px",
                  borderRadius: "5px",
                  marginTop: "10px",
                  maxHeight: "350px", // Set a max-height for scrollable area
                  overflowY: "auto", // Add vertical scrollbar
                  backgroundColor: "rgba(0, 0, 0, 0.05)", // Add gray background
                }}
              >
                <div style={{ marginTop: "10px" }}>
                  <Form.Label style={{ color: "black" }}>
                    Sections From Your Script
                  </Form.Label>
                  {localSectionsArray.length > 0 ? (
                    <Table bordered hover style={{ borderColor: "#eb631c" }}>
                      <thead style={{ backgroundColor: "#eb631c" }}>
                        <tr>
                          <th
                            style={{
                              borderColor: "#eb631c",
                              padding: "8px",
                              color: "black",
                              width: "5%", // Allocate less width for 'Section ID'
                            }}
                          >
                            Section ID
                          </th>
                          <th
                            style={{
                              borderColor: "#eb631c",
                              padding: "8px",
                              color: "black",

                              // Do not set width here to allow this column to take the remaining space
                            }}
                          >
                            Section content
                          </th>
                          <th
                            style={{
                              borderColor: "#eb631c",
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
                        {localSectionsArray.map((section, index) => {
                          return (
                            <tr key={index} style={{ borderColor: "#eb631c" }}>
                              <td
                                style={{
                                  borderColor: "#eb631c",
                                  padding: "8px",
                                  textAlign: "center",
                                }}
                              >
                                {section.getIndex() + 1}
                              </td>
                              <td
                                style={{
                                  borderColor: "#eb631c",
                                  padding: "8px",
                                }}
                              >
                                {section.getOriginalContent()}
                              </td>
                              <td
                                style={{
                                  borderColor: "#eb631c",
                                  padding: "8px",
                                  textAlign: "center",
                                }}
                              >
                                {section.getOriginalCharCount()}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </Table>
                  ) : (
                    <p style={{ color: "gray", fontStyle: "italic" }}>
                      No sections found
                    </p>
                  )}
                </div>
              </div>

              <br></br>
              {/* Display the number of sections found */}
              {localSectionsArray.length > 0 && (
                <div className="alert alert-success" role="alert">
                  We have found {localSectionsArray.length} section
                  {localSectionsArray.length !== 1 ? "s" : ""} in your script.
                  You will be prompted to produce the voice for these one by one
                  in the next few steps. <span> </span>
                  {s2aAdvancedFreeStyleStatus ? (
                    <span>
                      To help ensure the ad fits your desired length, we suggest
                      keeping within the character count mentioned above for
                      each section. Since you are in Freestyle mode, of course
                      you can ignore it.
                    </span>
                  ) : (
                    <span>
                      To comply with the ad length you desired, you will be
                      limited to the character count mentioned for each section
                      above.
                    </span>
                  )}
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
        </Col>
      </Row>
    </div>
  );
}
export default withAuth(CreateSections);

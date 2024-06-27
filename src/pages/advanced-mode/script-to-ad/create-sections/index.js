import React, { useState, useEffect, useRef } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  Button,
  Table,
  Offcanvas,
  OverlayTrigger,
  Tooltip,
  Spinner,
} from "react-bootstrap";
import { getAuth } from "firebase/auth";
import Swal from "sweetalert2";
import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  query,
  collection,
  where,
} from "firebase/firestore";
import app from "@/firebase";

import "bootstrap-icons/font/bootstrap-icons.css";
import { useRouter } from "next/router";

import { NavBar } from "@/components/foundation-components/nav-bar";
import { SectioningTutorial } from "@/_pages/advanced-mode/script-to-ad/create-sections/components/tutorial/alert";

import useUserInputsStore from "@/store/user-inputs";
import { Section } from "@/data-structures/section";
import SimpleAudioPlayer from "@/components/simple-audio-player";

import withAuth from "@/hocs/with-auth";

function CreateSections() {
  const auth = getAuth();
  const router = useRouter();

  // Zustand store hooks
  const {
    voiceName,
    setVoiceName,
    voiceId,
    setVoiceId,
    voicePreviewFilename,
    setVoicePreviewFilename,
    modelId,
    setModelId,
    generatedVoiceUrl,
    setGeneratedVoiceUrl,
    adLength,
    setAdLength,
    sectionsArray,
    setSectionsArray,
    setSectionHistoryArray,
    setNumSectionsIdentified,
    s2aAdvancedFreeStyleStatus,
    setS2aAdvancedFreeStyleStatus,
    s2aAdvancedSingleVoiceStatus,
    setS2aAdvancedSingleVoiceStatus,
    reset: resetUserInputsStore,
  } = useUserInputsStore();

  const [localSectionsArray, setLocalSectionsArray] = useState(sectionsArray);
  const [isFormSubmitted, setFormSubmitted] = useState(false);
  const [originalScriptForSectionSplit, setOriginalScriptForSectionSplit] =
    useState("");
  const CHACRACTEROVERFLOWTHRESHOLD = 15; // This is the threshold we will use to avoid overflow
  const CHARACTERSPERSEC = 15.2; // Experimentally determined characters per second
  const [showTutorial, setShowTutorial] = useState(false);
  const [voiceOptions, setVoiceOptions] = useState([]);
  const restrictedVoices = ["Evan (Cloned)"];
  const voiceAudioPlayerRef = useRef(null);

  var charLimit = Math.round(parseInt(adLength) * CHARACTERSPERSEC); // Calculate character limit based on the ad length
  charLimit = charLimit - CHACRACTEROVERFLOWTHRESHOLD; // substracting a threshold to avoid overflow
  const baseVoicePreviewsUrl =
    "https://static--files--storage.s3.us-east-2.amazonaws.com/voice--previews/";

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
    const fetchVoiceOptions = async () => {
      const voicesDocRef = doc(
        getFirestore(app),
        "fetch_data_to_frontend",
        "pyro_voices"
      );
      try {
        const docSnapshot = await getDoc(voicesDocRef);
        if (docSnapshot.exists()) {
          setVoiceOptions(docSnapshot.data().pyro_voice_choices);
        } else {
          console.log("No voice options found in document");
        }
      } catch (error) {
        console.error("Error fetching voice options:", error);
      }
    };

    fetchVoiceOptions();
  }, []);

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
      section.setVoiceId(voiceId);
      section.setVoiceName(voiceName);
      section.setVoicePreviewFilename(voicePreviewFilename);
      section.setModelId(modelId);
      tmpArray.push(section);
    });

    setLocalSectionsArray(tmpArray);
  };

  const updateVoiceForAllSections = () => {
    const updatedSections = localSectionsArray.map((section) => {
      section.setVoiceId(voiceId);
      section.setVoiceName(voiceName);
      section.setVoicePreviewFilename(voicePreviewFilename);
      section.setModelId(modelId);
      return section;
    });

    // Assuming setLocalSectionsArray is available to update the global array
    setLocalSectionsArray(updatedSections);
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

    if (s2aAdvancedSingleVoiceStatus) {
      updateVoiceForAllSections();
    }

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

  const handleSingleVoiceChange = (e) => {
    const newValue = e.target.checked;
    setS2aAdvancedSingleVoiceStatus(newValue);
  };

  const fetchVoiceMetaData = async (voiceName) => {
    const db = getFirestore(app);
    const voiceQuery = query(
      collection(db, "pyro_voices"),
      where("pyro_name", "==", voiceName)
    );

    try {
      const querySnapshot = await getDocs(voiceQuery);
      if (!querySnapshot.empty) {
        const docData = querySnapshot.docs[0].data();
        return {
          newVoiceId: docData.elevenlabs_id,
          newVoicePreviewFilename: docData.voice_preview_filename,
          newVoiceModelId: docData.model_id,
        };
      } else {
        console.log("No matching documents found for voice:", voiceName);
        return {}; // Return an empty object instead of null
      }
    } catch (error) {
      console.error("Error fetching voice metadata:", error);
      return {}; // Return an empty object in case of error
    }
  };

  const handleVoiceChange = async (e) => {
    const selectedVoiceName = e.target.value;
    const metadata = await fetchVoiceMetaData(selectedVoiceName);

    if (
      metadata &&
      metadata.newVoiceId &&
      metadata.newVoicePreviewFilename &&
      metadata.newVoiceModelId
    ) {
      setVoiceId(metadata.newVoiceId);
      setVoicePreviewFilename(metadata.newVoicePreviewFilename);
      setVoiceName(selectedVoiceName);
      setModelId(metadata.newVoiceModelId);

      // Reset the generatedVoiceUrl to force the audio player to use the new voice preview
      setGeneratedVoiceUrl(""); // This line is added to reset the URL
    } else {
      // Handle the case when no metadata is found
      console.log(
        "No metadata found for the selected voice:",
        selectedVoiceName
      );
    }

    // Assuming you want to play the new voice preview immediately
    if (metadata.newVoicePreviewFilename) {
      const previewUrl =
        baseVoicePreviewsUrl + metadata.newVoicePreviewFilename;
      if (voiceAudioPlayerRef.current) {
        voiceAudioPlayerRef.current.src = previewUrl;
        voiceAudioPlayerRef.current.load();
        voiceAudioPlayerRef.current.play();
      }
    }
  };

  const handleTutorialClose = () => setShowTutorial(false);
  const handleTutorialShow = () => setShowTutorial(true);

  const links = [
    {
      label: "Home",
      url: "/home",
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
              height: "1150px",
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
                  <option value="90">90 seconds</option>
                  <option value="120">120 seconds</option>
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

              <Form.Group controlId="voice">
                <Form.Label style={{ marginTop: "0px" }}>Voice</Form.Label>
                {voiceOptions.length === 0 ? (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Form.Select
                      aria-label="Voice select"
                      disabled
                      style={{ color: "black" }}
                    >
                      <option>Loading voice choices...</option>
                    </Form.Select>
                    <Spinner
                      animation="border"
                      style={{ marginLeft: "10px" }}
                    />
                  </div>
                ) : (
                  <div style={{ display: "flex", alignItems: "center" }}>
                    <Form.Select
                      aria-label="Voice select"
                      value={voiceName} // Retains the current voice name
                      onChange={handleVoiceChange}
                      style={{ color: "black" }}
                      disabled={!s2aAdvancedSingleVoiceStatus}
                    >
                      {voiceOptions
                        // These restrictions are temporary. Need to figure out a better data model.
                        .filter((voice) => {
                          const isRestrictedVoice =
                            restrictedVoices.includes(voice);
                          const isFirebayStudiosEmail =
                            auth.currentUser.email.split("@")[1] ===
                            "firebaystudios.com";
                          return (
                            !isRestrictedVoice ||
                            (isRestrictedVoice && isFirebayStudiosEmail)
                          );
                        })
                        .map((voice, index) => (
                          <option key={voice} value={voice}>
                            {voice}
                          </option>
                        ))}
                    </Form.Select>
                  </div>
                )}
              </Form.Group>

              <Form.Group
                controlId="singleVoiceToggle"
                className="d-flex align-items-center"
                style={{ marginTop: "10px" }}
              >
                <Form.Label className="mb-0" style={{ marginRight: "10px" }}>
                  Single Voice Mode
                </Form.Label>
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip id="tooltip-info">
                      Pyro Tip: If you want to use a single voice for the entire
                      spot you can enable this option.
                    </Tooltip>
                  }
                >
                  <i
                    className="bi bi-info-circle"
                    style={{
                      marginLeft: "5px",
                      marginRight: "15px",
                      cursor: "pointer",
                    }}
                  ></i>
                </OverlayTrigger>
                <div className="form-check form-switch">
                  <input
                    className="form-check-input"
                    type="checkbox"
                    role="switch"
                    id="singleVoiceSwitch"
                    checked={s2aAdvancedSingleVoiceStatus}
                    onChange={handleSingleVoiceChange}
                    style={{
                      backgroundColor: s2aAdvancedSingleVoiceStatus
                        ? "#eb631c"
                        : "white",
                      borderColor: s2aAdvancedSingleVoiceStatus
                        ? "#eb631c"
                        : "#adb5bd",
                    }}
                  />
                </div>
              </Form.Group>

              <Form.Group
                controlId="freeStyleToggle"
                className="d-flex align-items-center"
                style={{ marginTop: "10px" }}
              >
                <Form.Label className="mb-0" style={{ marginRight: "20px" }}>
                  Free Style Mode
                </Form.Label>
                <OverlayTrigger
                  placement="right"
                  overlay={
                    <Tooltip id="tooltip-info">
                      Pyro Tip: If you are not concerned about sticking to the
                      spot length of {adLength} Sec, you can enable free style
                      mode to lift the character count restrictions. We will
                      still display the character limit as a recommendation
                      which you may choose to ignore.
                    </Tooltip>
                  }
                >
                  <i
                    className="bi bi-info-circle"
                    style={{
                      marginLeft: "10px",
                      marginRight: "15px",
                      cursor: "pointer",
                    }}
                  ></i>
                </OverlayTrigger>
                <div
                  className="form-check form-switch"
                  style={{ marginLeft: "0px" }}
                >
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

              <Form.Group controlId="script" style={{ position: "relative" }}>
                <Form.Label style={{ marginTop: "10px" }}>Script</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder={`Enter your script here (up to ${charLimit} characters)`}
                  value={originalScriptForSectionSplit}
                  onChange={handleScriptChange}
                  style={{
                    color: "black",
                    height: "280px",
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
                    <div style={{ maxHeight: "270px", overflowY: "auto" }}>
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
                              <tr
                                key={index}
                                style={{ borderColor: "#eb631c" }}
                              >
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
                    </div>
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
          {/* By adding a massive margin top I was able to add the scrollability to mac OS */}
          {s2aAdvancedSingleVoiceStatus && (
            <div style={{ position: "relative", marginTop: "400px" }}>
              <SimpleAudioPlayer
                audioSrc={
                  generatedVoiceUrl ||
                  baseVoicePreviewsUrl + voicePreviewFilename
                }
                audioTitle={voiceName}
                allowDownload={false}
                autoplay={s2aAdvancedSingleVoiceStatus}
              />
            </div>
          )}
        </Col>
      </Row>
    </div>
  );
}
// export default withAuth(CreateSections);
export default CreateSections;

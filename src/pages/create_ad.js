import React, { useState, useEffect, useRef } from "react";
import { Row, Col, Card, Form, Navbar, Nav, Button } from "react-bootstrap";
import { useRouter } from "next/router";

import SimpleAudioPlayer from "../components/SimpleAudioPlayer";
import IntonationManager from "../components/IntonationManager";
import CustomDropdown from "../components/CustomDropdown";
import ExamplesViewer from "../components/ExamplesViewer"; // for some reason when this component is removed the submit button of the IntonationManager does not have the correct styling. So, don't delete this unused component until we figure out why.

import useUserInputsStore from "../store/userInputs";

import withAuth from "../hocs/withAuth";
import { getAuth } from "firebase/auth";
import app from "../firebase";

import { getPortalUrl } from "../stripe_proxy_sdk";
import { usePostHog } from "posthog-js/react";
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

function CreateAd() {
  const posthog = usePostHog();
  const auth = getAuth();

  const router = useRouter();
  const voiceAudioPlayerRef = useRef(null);

  // Zustand store hooks
  const {
    script,
    setScript,
    voiceId,
    setVoiceId,
    voiceName,
    setVoiceName,
    voicePreviewFilename,
    setVoicePreviewFilename,
    adLength,
    setAdLength,
  } = useUserInputsStore();

  // const [showExamples, setShowExamples] = useState(false);
  const [voiceOptions, setVoiceOptions] = useState([]);
  const [keywords, setKeywords] = useState([]);
  const [isFormSubmitted, setFormSubmitted] = useState(false);
  const [shouldPlayAudio, setShouldPlayAudio] = useState(false);

  const CHACRACTEROVERFLOWTHRESHOLD = 15; // This is the threshold we will use to avoid overflow
  const CHARACTERSPERSEC = 15.2; // Experimentally determined characters per second

  var charLimit = Math.round(parseInt(adLength) * CHARACTERSPERSEC); // Calculate character limit based on the ad length
  charLimit = charLimit - CHACRACTEROVERFLOWTHRESHOLD; // substracting a threshold to avoid overflow

  useEffect(() => {
    if (isFormSubmitted) {
      router.push("/add_music");
    }
  }, [isFormSubmitted, router]);

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

  const baseVoicePreviewsUrl =
    "https://static--files--storage.s3.us-east-2.amazonaws.com/voice--previews/";

  const handleKeywordsChange = (updatedKeywords) => {
    setKeywords(updatedKeywords);
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

    if (metadata && metadata.newVoiceId && metadata.newVoicePreviewFilename) {
      setVoiceId(metadata.newVoiceId);
      setVoicePreviewFilename(metadata.newVoicePreviewFilename);
      setVoiceName(selectedVoiceName);
      setShouldPlayAudio(true);
    } else {
      // Handle the case when no metadata is found
      console.log(
        "No metadata found for the selected voice:",
        selectedVoiceName
      );
    }

    const userId = auth.currentUser ? auth.currentUser.uid : "anonymous";
    posthog.capture("create-ad-voice-change-drop-down-expanded", {
      date: new Date().toISOString(),
      userId: userId,
      voiceId: voiceId,
      voiceName: voiceName,
    });

    if (voiceAudioPlayerRef.current) {
      voiceAudioPlayerRef.current.src = voiceId;
      voiceAudioPlayerRef.current.load();
      voiceAudioPlayerRef.current.play();
    }
  };

  const checkKeywordsInScript = () => {
    const Intonator = "'";
    let updatedScript = script;
    const notFoundKeywords = [];

    keywords.forEach((keyword) => {
      if (updatedScript.includes(keyword)) {
        // Surround the keyword with the Intonator character for emphasis
        updatedScript = updatedScript.replace(
          new RegExp(`\\b${keyword}\\b`, "g"),
          `${Intonator}${keyword}${Intonator}`
        );
      } else {
        notFoundKeywords.push(keyword);
      }
    });

    setScript(updatedScript);

    if (notFoundKeywords.length > 0) {
      Swal.fire({
        icon: "error",
        title: "Keywords Not Found",
        text: `The following keywords were not found in the script: ${notFoundKeywords.join(
          ", "
        )}. Please remove them or add them to your script to continue.`,
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
        icon: "error",
        title: "Oops...",
        text: "You have too many characters!",
      });
      return;
    }
    if (script.length < 1) {
      Swal.fire({
        icon: "error",
        title: "Oops...",
        text: "You cannot have an empty script!",
      });
      return;
    }

    setFormSubmitted(true);
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
  const handleManageSubscription = async () => {
    try {
      // SweetAlert2 confirmation dialog
      const result = Swal.fire({
        title: "Redirecting to Subscription Management",
        text: "You will be redirected to the subscription management page in a new tab.",
        icon: "info",
        confirmButtonColor: "#3085d6",
        confirmButtonText: "Got it!",
      });

      const portalUrl = await getPortalUrl(app);
      window.open(portalUrl, "_blank");
    } catch (error) {
      console.error("Error opening portal: ", error);
    }
  };

  const dropdownItems = [
    {
      text: "Manage Subscription",
      handler: handleManageSubscription,
    },
    {
      text: "Logout",
      handler: handleLogout,
    },
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
      }}
    >
      <Navbar bg="dark" variant="dark" expand="lg">
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
          <div style={{ paddingRight: "25px" }}>
            <CustomDropdown items={dropdownItems} />
          </div>
        </Navbar.Collapse>
      </Navbar>

      <Row>
        <Col md={10} className="mx-auto">
          <Card
            className="p-4 bg-dark text-white"
            style={{
              marginTop: "70px",
              height: "800px",
              marginBottom: "140px",
            }}
          >
            <h2 className="mb-4">Voice Settings</h2>
            <Form onSubmit={handleSubmit}>
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

              <Form.Group controlId="script" style={{ position: "relative" }}>
                <Form.Label>Script</Form.Label>
                <Form.Control
                  as="textarea"
                  rows={3}
                  placeholder={`Enter your script here (up to ${charLimit} characters)`}
                  value={script}
                  onChange={(e) => setScript(e.target.value)}
                  style={{
                    color: "black",
                    height: "200px",
                    marginBottom: "20px",
                  }}
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
                  value={voiceName} // This should be the voice name, not the ID
                  onChange={handleVoiceChange}
                  style={{ color: "black" }}
                >
                  {voiceOptions.map((voice, index) => (
                    <option key={index} value={voice}>
                      {" "}
                      {/* Use unique index or better yet, a unique ID */}
                      {voice}
                    </option>
                  ))}
                </Form.Select>
              </Form.Group>

              <Button
                type="submit"
                className="mt-3"
                style={{ marginRight: "10px", marginTop: "20px" }}
              >
                Next
              </Button>
            </Form>
          </Card>
          <div>
            <SimpleAudioPlayer
              audioSrc={baseVoicePreviewsUrl + voicePreviewFilename}
              audioTitle={voiceName}
            />
          </div>
        </Col>
      </Row>
    </div>
  );
}
export default withAuth(CreateAd);

import { useRouter } from "next/router";
import React, { useState, useEffect } from "react";
import styles from "../styles/DownloadPage.module.css";
import { Card, Navbar, Nav, Button } from "react-bootstrap";
import Link from "next/link";
import AudioPlayer from "react-h5-audio-player";
import "react-h5-audio-player/lib/styles.css";
import "bootstrap/dist/css/bootstrap.min.css";
import { cookieCleaner } from "../utils/cookieUtils";
import "firebase/compat/firestore";
import { useAuth } from "../context/auth";
import firebase from "../firebase";
import "bootstrap-icons/font/bootstrap-icons.css";
import withAuth from "../hocs/withAuth";

const db = firebase.firestore();

const DownloadPage = () => {
  const router = useRouter();
  const { audioUrl } = router.query;
  const { user } = useAuth();
  const [credits, setCredits] = useState({ creditLeft: 0, creditAllowance: 0 });
  const [isDownloading, setIsDownloading] = useState(false); // Track download state

  useEffect(() => {
    if (user?.uid) {
      const docRef = db.collection("uid_to_org").doc(user.uid);

      docRef
        .get()
        .then((doc) => {
          if (doc.exists) {
            const data = doc.data();
            setCredits({
              creditLeft: data.credit_left,
              creditAllowance: data.credit_allowance,
            });
          }
        })
        .catch((error) => {
          console.log("Error getting document:", error);
        });
    }
  }, [user?.uid]);

  const handleDownload = () => {
    setIsDownloading(true); // Set downloading state to true

    // Decrement credit_left in the database
    const docRef = db.collection("uid_to_org").doc(user.uid);
    db.runTransaction((transaction) => {
      return transaction.get(docRef).then((doc) => {
        if (!doc.exists) {
          throw "Document does not exist!";
        }

        let newCreditLeft = (doc.data().credit_left || 0) - 1;
        transaction.update(docRef, { credit_left: newCreditLeft });
        return newCreditLeft; // This value is passed to the .then() handler
      });
    })
      .then((newCreditLeft) => {
        setCredits({
          ...credits,
          creditLeft: newCreditLeft,
        });
        setIsDownloading(false); // Set downloading state to false after download
      })
      .catch((error) => {
        console.error("Transaction failed: ", error);
        setIsDownloading(false); // Set downloading state to false if transaction fails
      });
  };

  const handleNewAd = () => {
    cookieCleaner();
    router.push("/create_ad");
    URL.revokeObjectURL(audioUrl);
  };

  const handleLogout = () => {
    cookieCleaner();
    localStorage.removeItem("user");
    router.push("/login");
  };

  const filename = "generated_ad.mp3";

  const handleDownloadClick = (e) => {
    if (isDownloading) {
      e.preventDefault(); // Prevent multiple downloads
    } else {
      handleDownload();
    }
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
        style={{ marginBottom: "5px" }}
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
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mr-auto"></Nav>
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
      <div className={styles.container}>
        <Card
          style={{
            width: "400px",
            height: "570px",
            marginTop: "10px",
            marginBottom: "300px",
            position: "relative",
            borderRadius: "15px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <Card.Header
            style={{
              backgroundColor: "#343a40",
              borderBottom: "1px solid rgba(255,255,255,0.1)",
              padding: "16px",
            }}
          >
            <h1
              className={styles.title}
              style={{ margin: 0, fontSize: "24px" }}
            >
              Download Manager
            </h1>
          </Card.Header>
          <Card.Body
            className="bg-dark text-white"
            style={{
              paddingTop: "20px",
              paddingBottom: "20px",
              flex: "1",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-around",
            }}
          >
            <div style={{ marginBottom: "20px" }}>
              <h5
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                  paddingBottom: "10px",
                  marginBottom: "20px",
                  fontSize: "18px",
                }}
              >
                Got what you came for?
              </h5>
              <a
                href={audioUrl}
                download={filename}
                onClick={handleDownloadClick}
                className={`btn btn-outline-light btn-lg ${
                  isDownloading ? "disabled" : ""
                }`}
                style={{ width: "100%", textAlign: "center" }}
              >
                <i className="bi bi-download"></i> Download
              </a>
            </div>
            <div style={{ marginBottom: "20px" }}>
              <h5
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                  paddingBottom: "10px",
                  marginBottom: "20px",
                  fontSize: "18px",
                }}
              >
                Need more tweaking?
              </h5>
              <ul style={{ listStyleType: "none", paddingLeft: 0 }}>
                <li style={{ marginBottom: "12px" }}>
                  <Link href="/add_music" passHref>
                    <button
                      className="btn btn-outline-light btn-lg"
                      style={{ width: "100%" }}
                    >
                      Change Music
                    </button>
                  </Link>
                </li>
                <li style={{ marginBottom: "12px" }}>
                  <Link href="/create_ad" passHref>
                    <button
                      className="btn btn-outline-light btn-lg"
                      style={{ width: "100%" }}
                    >
                      Change Script or Voice
                    </button>
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h5
                style={{
                  borderBottom: "1px solid rgba(255,255,255,0.2)",
                  paddingBottom: "10px",
                  marginBottom: "20px",
                  fontSize: "18px",
                }}
              >
                Start from scratch?
              </h5>
              <button
                className="btn btn-outline-light btn-lg"
                onClick={handleNewAd}
                style={{ width: "100%" }}
              >
                Create a new ad
              </button>
            </div>
          </Card.Body>
          <Card.Footer
            className="bg-dark text-white"
            style={{
              borderTop: "1px solid rgba(255,255,255,0.1)",
              padding: "12px 16px",
            }}
          >
            <small style={{ float: "right", fontSize: "16px" }}>
              Credits left: {credits.creditLeft}/{credits.creditAllowance}
            </small>
          </Card.Footer>
        </Card>
      </div>

      {credits.creditLeft > 0 && (
        <AudioPlayer
          style={{
            position: "fixed", // Fixed position
            bottom: 0, // At the bottom
            left: 0, // Aligned to the left
            right: 0, // Stretch across the screen
            zIndex: 1000, // Make sure it's above other elements
          }}
          src={audioUrl} // The source of the audio file
          onPlay={(e) => console.log("onPlay")} // handle the play event
          // Customize the download behavior
          customAdditionalControls={[]}
          customVolumeControls={[]}
          showJumpControls={false}
          header="Your Ad Audio" // optional header text
        />
      )}
    </div>
  );
};

export default withAuth(DownloadPage);

import React, { useState, useEffect } from "react";
import { Offcanvas, Container } from "react-bootstrap";
import { getFirestore, collection, doc, getDocs } from "firebase/firestore"; // Importing new Firestore methods
import "bootstrap-icons/font/bootstrap-icons.css";
import app from "../firebase"; // Ensure this points to the updated firebase.js file

const db = getFirestore(app); // Initialize Firestore with Firebase app

export default function ExamplesViewer({ show, onHide }) {
  const [thirtySecSamples, setThirtySecSamples] = useState([]);
  const [sixtySecSamples, setSixtySecSamples] = useState([]);

  useEffect(() => {
    if (show) {
      const fetchData = async () => {
        const thirtySec = await fetchExamples("thirty_sec_samples");
        const sixtySec = await fetchExamples("sixty_sec_samples");
        setThirtySecSamples(thirtySec);
        setSixtySecSamples(sixtySec);
      };
      fetchData();
    }
  }, [show]);

  const fetchExamples = async (type) => {
    const examplesColRef = collection(db, "examples", "sample_scripts", type);
    const snapshot = await getDocs(examplesColRef);
    const scripts = snapshot.docs.map((doc) => ({
      title: doc.data().title,
      script: doc.data().script,
    }));
    return scripts;
  };

  return (
    <Offcanvas show={show} onHide={onHide} placement="end">
      <Offcanvas.Header closeButton>
        <Offcanvas.Title style={{ fontSize: "1.5rem", fontWeight: "bold" }}>
          Script Examples
        </Offcanvas.Title>
      </Offcanvas.Header>
      <Offcanvas.Body>
        <h5>Examples for 30 seconds scripts</h5>
        {thirtySecSamples.map((item, idx) => (
          <Container
            key={idx}
            className="my-3 p-4 bg-dark text-white position-relative"
            style={{ borderRadius: "10px" }}
          >
            <h6>{item.title}</h6>
            {item.script}
          </Container>
        ))}

        <h5>Examples for 60 seconds scripts</h5>
        {sixtySecSamples.map((item, idx) => (
          <Container
            key={idx}
            className="my-3 p-4 bg-dark text-white position-relative"
            style={{ borderRadius: "10px" }}
          >
            <h6>{item.title}</h6>
            {item.script}
          </Container>
        ))}
      </Offcanvas.Body>
    </Offcanvas>
  );
}

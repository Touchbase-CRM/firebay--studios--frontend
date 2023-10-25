import React, { useState, useEffect } from 'react';
import { Offcanvas, Container } from 'react-bootstrap';
import firebase from '../firebase';
import 'firebase/compat/firestore';
import 'bootstrap-icons/font/bootstrap-icons.css';

const db = firebase.firestore();

export default function ExamplesViewer({ show, onHide }) {
    const [thirtySecSamples, setThirtySecSamples] = useState([]);
    const [sixtySecSamples, setSixtySecSamples] = useState([]);

    useEffect(() => {
        if (show) {
            const fetchData = async () => {
                const thirtySec = await fetchExamples('thirty_sec_samples');
                const sixtySec = await fetchExamples('sixty_sec_samples');
                setThirtySecSamples(thirtySec);
                setSixtySecSamples(sixtySec);
            };
            fetchData();
        }
    }, [show]);

    const fetchExamples = async (type) => {
        const snapshot = await db.collection('examples').doc('sample_scripts').collection(type).get();
        const scripts = snapshot.docs.map(doc => ({ title: doc.data().title, script: doc.data().script }));
        return scripts;
    };

    const handleCopy = (script) => {
        navigator.clipboard.writeText(script);
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="end">
            <Offcanvas.Header closeButton>
            <Offcanvas.Title style={{fontSize: '1.5rem', fontWeight: 'bold'}}>Samples</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <h5>30 seconds samples</h5>
                {thirtySecSamples.map((item, idx) => (
                    <Container key={idx} className="my-3 p-4 bg-dark text-white position-relative" style={{ borderRadius: '10px' }}>
                        <h6>{item.title}</h6>
                        {item.script}
                        <i className="bi bi-clipboard position-absolute top-0 end-0 mt-2 me-2" style={{ cursor: 'pointer' }} onClick={() => handleCopy(item.script)}></i>
                    </Container>
                ))}

                <h5>60 seconds samples</h5>
                {sixtySecSamples.map((item, idx) => (
                    <Container key={idx} className="my-3 p-4 bg-dark text-white position-relative" style={{ borderRadius: '10px' }}>
                        <h6>{item.title}</h6>
                        {item.script}
                        <i className="bi bi-clipboard position-absolute top-0 end-0 mt-2 me-2" style={{ cursor: 'pointer' }} onClick={() => handleCopy(item.script)}></i>
                    </Container>
                ))}
            </Offcanvas.Body>
        </Offcanvas>
    );
}

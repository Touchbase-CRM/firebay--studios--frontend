import React, { useState, useEffect } from 'react';
import { Offcanvas, Dropdown, Button, Card } from 'react-bootstrap';
import firebase from '../firebase';
import 'firebase/compat/firestore';


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
        const scripts = snapshot.docs.map(doc => doc.data().script);
        return scripts;
    };

    return (
        <Offcanvas show={show} onHide={onHide} placement="start">
            <Offcanvas.Header closeButton>
                <Offcanvas.Title>Examples</Offcanvas.Title>
            </Offcanvas.Header>
            <Offcanvas.Body>
                <h5>30 seconds samples</h5>
                {thirtySecSamples.map((script, idx) => (
                    <p key={idx}>
                        {script} <button onClick={() => navigator.clipboard.writeText(script)}>Copy</button>
                    </p>
                ))}

                <h5>60 seconds samples</h5>
                {sixtySecSamples.map((script, idx) => (
                    <p key={idx}>
                        {script} <button onClick={() => navigator.clipboard.writeText(script)}>Copy</button>
                    </p>
                ))}
            </Offcanvas.Body>
        </Offcanvas>
    );
}

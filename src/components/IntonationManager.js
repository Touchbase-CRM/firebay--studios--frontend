import React, { useState } from 'react';
import { Form, InputGroup, Button, Card } from 'react-bootstrap';
import 'bootstrap/dist/css/bootstrap.min.css';

const IntonationManager = ({ onAdd, onRemove }) => {
    const [keyword, setKeyword] = useState('');
    const [addedKeywords, setAddedKeywords] = useState([]);

    const handleAddKeyword = () => {
        if (keyword.trim() !== '') {
            setAddedKeywords([...addedKeywords, keyword.trim()]);
            setKeyword('');
            if (onAdd) onAdd(keyword.trim());
        }
    };

    const handleRemoveKeyword = (index) => {
        const newKeywords = [...addedKeywords];
        const removed = newKeywords.splice(index, 1);
        setAddedKeywords(newKeywords);
        if (onRemove) onRemove(removed[0]);
    };

    const handleClearKeywords = () => {
        setAddedKeywords([]);
    };

    return (
        <Form.Group controlId="keywords" style={{ position: 'relative', marginBottom: '20px' }}>
            <Form.Label>Keywords to Emphasize</Form.Label>
            <div style={{ width: '300px' }}> {/* <-- This div wraps the InputGroup */}
                <InputGroup>
                    <Form.Control
                        type="text"
                        placeholder="Enter keyword"
                        value={keyword}
                        onChange={(e) => setKeyword(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault(); // Prevent the default form submission
                                handleAddKeyword(); // Call the handleAddKeyword function
                            }
                        }}
                        style={{
                            borderRadius: '20px 0 0 20px',
                            borderRight: '0', // remove right border
                            boxShadow: 'none', // to remove any default shadows
                            borderColor: '#ced4da' // default Bootstrap input border color
                        }}
                    />

                    <div className="input-group-append">
                        <button title="Click here or press Enter key to add the keyword" type="button" className="btn btn-dark" onClick={handleAddKeyword} style={{
                            borderRadius: '0 20px 20px 0',
                            backgroundColor: '#343a40', // make it same as input's color
                            borderLeft: '0', // remove left border of the button
                            borderColor: '#ced4da', // same as input's border color
                            padding: '0.375rem 0.75rem'  // adjust if necessary
                        }}>
                            <i className="bi bi-send" style={{ color: 'white' }} ></i>
                        </button>
                    </div>
                </InputGroup>




            </div>

            <Card className="mt-3 p-2" style={{ minHeight: '110px', backgroundColor: '#cccccc' }}>
                {addedKeywords.length === 0 ? (
                    <div style={{ color: '#aaa', textAlign: 'center' }}>Keywords will appear here</div>
                ) : (
                    <button type="button"
                        style={{
                            background: 'none',
                            border: 'none',
                            position: 'absolute',
                            top: '5px',
                            right: '5px',
                            cursor: 'pointer'
                        }}
                        onClick={handleClearKeywords}
                        title="Clear all keywords">
                        <i className="bi bi-eraser-fill" style={{ color: 'black' }}></i>
                    </button>
                )}

                <div style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flexWrap: 'wrap',
                }}>
                    {addedKeywords.map((key, index) => (
                        <div key={index} style={{
                            background: '#e1e1e1',
                            borderRadius: '4px',
                            padding: '5px 10px',
                            marginRight: '10px',
                            marginBottom: '10px'
                        }}>
                            {key}
                            <span onClick={() => handleRemoveKeyword(index)} style={{
                                marginLeft: '8px',
                                cursor: 'pointer'
                            }}>×</span>
                        </div>
                    ))}
                </div>
            </Card>
        </Form.Group>
    );
}

export default IntonationManager;

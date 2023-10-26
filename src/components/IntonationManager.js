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
            <InputGroup>
                <Form.Control
                    type="text"
                    placeholder="Enter keyword"
                    value={keyword}
                    onChange={(e) => setKeyword(e.target.value)}
                />
                <div class="input-group-append">
                    <Button class="btn btn-outline-secondary" type='button' id="button-addon2" onClick={handleAddKeyword}>Emphasize</Button>
                </div>

            </InputGroup>

            <Card className="mt-3 p-2" style={{ minHeight: '110px', backgroundColor: '#cccccc' }}>
            {addedKeywords.length === 0 ? (
                    <div style={{ color: '#aaa', textAlign: 'center' }}>Keywords will appear here</div>
                ) : (
                    <i className="bi bi-eraser-fill" 
                    style={{ position: 'absolute', top: '5px', right: '5px', cursor: 'pointer' }} 
                    onClick={handleClearKeywords}
                    title="Clear all keywords"></i>
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

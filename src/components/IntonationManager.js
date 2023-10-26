import React, { useState } from 'react';
import { Form, InputGroup, Button } from 'react-bootstrap';
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
                {/* <InputGroup.Append>
                    <Button onClick={handleAddKeyword}>Emphasize</Button>
                </InputGroup.Append> */}
                  <div class="input-group-append">
                  <Button class="btn btn-outline-secondary" type='button' id="button-addon2" onClick={handleAddKeyword}>Emphasize</Button>
  </div>
  
            </InputGroup>
            
            <div style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginTop: '10px',
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
        </Form.Group>
    );
}

export default IntonationManager;

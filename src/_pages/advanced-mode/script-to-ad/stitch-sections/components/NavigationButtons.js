// src/_pages/advanced-mode/script-to-ad/stitch-sections/components/NavigationButtons.js

import React from "react";
import { Row, Col, Button } from "react-bootstrap";

const NavigationButtons = ({
    handlePreviousPage,
    handleNextPage,
    currentPage,
    totalPages,
}) => {
    return (
        <Row className="align-items-center mt-3">
            <Col xs="auto">
                <Button
                    variant="outline-secondary"
                    onClick={handlePreviousPage}
                    disabled={currentPage === 1}
                >
                    {"<"}
                </Button>{" "}
                <Button
                    variant="outline-secondary"
                    onClick={handleNextPage}
                    disabled={currentPage === totalPages}
                >
                    {">"}
                </Button>
            </Col>
        </Row>
    );
};

export default NavigationButtons;

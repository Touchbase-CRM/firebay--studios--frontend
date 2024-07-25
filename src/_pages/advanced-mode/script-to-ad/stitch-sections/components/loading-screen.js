// src/_pages/advanced-mode/script-to-ad/stitch-sections/components/LoadingScreen.js

import React from "react";
import { Card, Button } from "react-bootstrap";
import Spinner from "@/components/spinner/spinner";

const LoadingScreen = ({ cancelLoading, cancelAndRetryLoading }) => {
    return (
        <div
            className="d-flex align-items-center justify-content-center flex-column"
            style={{ height: "100vh", backgroundColor: "#FFFFFF" }}
        >
            <Spinner
                animation="border"
                variant="primary"
                style={{ marginBottom: "200px" }}
            />

            <Card
                className="p-4"
                style={{
                    marginTop: "300px",
                    borderRadius: "1rem",
                    borderColor: "#eb631c",
                    color: "black",
                }}
            >
                <p
                    className="ml-3 mb-0"
                    style={{
                        fontWeight: "bold",
                        fontSize: "24px",
                        color: "black",
                        textShadow: "1px 1px 1px #000",
                    }}
                >
                    Just a second. We are cooking up your final voice cut!
                </p>
            </Card>
            <div className="mt-3">
                <Button
                    variant="danger"
                    onClick={cancelLoading}
                    style={{ marginRight: "20px", width: "200px" }}
                    title="Stop the current operation and start from the beginning."
                >
                    Cancel and Start Over
                </Button>

                <Button
                    onClick={cancelAndRetryLoading}
                    style={{
                        width: "200px",
                        backgroundColor: "#FDA942",
                        borderColor: "#FDA942",
                    }}
                    title="Stop the current order and retry with the same data."
                >
                    Cancel and Resubmit
                </Button>
            </div>
        </div>
    );
};

export default LoadingScreen;

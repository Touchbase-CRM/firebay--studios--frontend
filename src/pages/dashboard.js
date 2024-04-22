import { Button, Table, Container, Row, Col } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { GenericModal } from "@/components/foundationComponents/modal";
import React, { useState } from "react";
import { useRouter } from "next/router";
import Swal from "sweetalert2";

const Dashboard = () => {
  const [showCreateAdModal, setShowCreateAdModal] = useState(false);
  const [adName, setAdName] = useState("");
  const router = useRouter();

  const handleCloseModal = () => {
    setShowCreateAdModal(false);
    setAdName("");
  };

  const handleAdNameChange = (event) => {
    setAdName(event.target.value);
  };

  const handleNextOnCreateAd = () => {
    if (!adName.trim()) {
      Swal.fire({
        title: "Error!",
        text: "Please enter a name for the Spot.",
        icon: "error",
      });
      return;
    }
    router.push({
      pathname: "/home",
      query: { projectName: adName },
    });
  };

  const handleCreateAd = () => {
    setShowCreateAdModal(true);
  };
  const handleDownloadClick = () => {
    console.log("Download button clicked");
  };

  const handleDeleteClick = () => {
    console.log("Delete button clicked");
  };

  const handleCopyClick = () => {
    console.log("Copy action initiated");
  };

  const handleEditClick = () => {
    console.log("Edit action initiated");
  };

  const handleRenameClick = () => {
    console.log("Rename action initiated");
  };
  const handlePreviousTableContent = () => {
    console.log("Previous table content action initiated");
  };
  const handleNextTableContent = () => {
    console.log("Next table content action initiated");
  };

  return (
    <Container
      fluid
      style={{
        backgroundColor: "white",
        padding: "20px",
        minHeight: "100vh",
      }}
    >
      <Row
        style={{
          display: "flex",
          justifyContent: "flex-end",
          marginBottom: "1rem",
        }}
      >
        <Col xs={12}>
          <Button
            variant="warning"
            style={{
              backgroundColor: "#eb631c",
              borderColor: "#eb631c",
              color: "white",
              alignSelf: "flex-start",
            }}
            onClick={handleCreateAd}
          >
            Create a new Spot
          </Button>
        </Col>
      </Row>

      <Row>
        <Col xs={12}>
          <Table striped bordered hover>
            <thead
              style={{
                backgroundColor: "#e4e4e4",
              }}
            >
              <tr>
                <th>Spot Name</th>
                <th>Created</th>
                <th>Last Downloaded</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {Array.from({ length: 6 }).map((_, index) => (
                <tr key={index}>
                  <td>Lorem ipsum dolor sit amet, consecte...</td>
                  <td>Nov 3, 2023, 11:32AM</td>
                  <td>Nov 5, 2023, 10:32AM</td>
                  <td>
                    <Button
                      variant="link"
                      onClick={handleDownloadClick}
                      title="Download Spot"
                    >
                      <i
                        className="bi bi-download"
                        style={{ color: "black" }}
                      ></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={handleCopyClick}
                      title="Duplicate Spot"
                    >
                      <i className="bi bi-files" style={{ color: "black" }}></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={handleRenameClick}
                      title="Rename Spot"
                    >
                      <i
                        className="bi bi-input-cursor-text"
                        style={{ color: "black" }}
                      ></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={handleEditClick}
                      title="Edit Spot"
                    >
                      <i
                        className="bi bi-pencil-square"
                        style={{ color: "black" }}
                      ></i>
                    </Button>
                    <Button
                      variant="link"
                      onClick={handleDeleteClick}
                      title="Delete Spot"
                    >
                      <i
                        className="bi bi-trash-fill"
                        style={{ color: "red" }}
                      ></i>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </Table>
        </Col>
      </Row>

      <Row>
        <Col xs={12} className="text-right">
          <div style={{ marginTop: "20px" }}>
            <Button
              variant="outline-secondary"
              onClick={handlePreviousTableContent}
            >
              {"<"}
            </Button>{" "}
            <Button
              variant="outline-secondary"
              onClick={handleNextTableContent}
            >
              {">"}
            </Button>
          </div>
        </Col>
      </Row>
      <GenericModal
        show={showCreateAdModal}
        onHide={handleCloseModal}
        title="Enter Spot Name"
        onSave={handleNextOnCreateAd}
        closeButtonLabel="Discard"
        saveButtonLabel="Next"
      >
        <input
          type="text"
          value={adName}
          onChange={handleAdNameChange}
          className="form-control"
          placeholder="Type the Spot name here"
        />
      </GenericModal>
    </Container>
  );
};

export default Dashboard;

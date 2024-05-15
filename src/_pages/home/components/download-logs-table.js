import React from "react";
import { Table, Card } from "react-bootstrap";

const DownloadLogsTable = ({ downloadLogs }) => {
  return (
    <div
      style={{
        marginTop: "2rem",
        maxWidth: "900px",
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <Card
        style={{ boxShadow: "0 4px 8px rgba(0,0,0,0.1)", borderRadius: "1rem" }}
      >
        <Card.Body style={{ padding: "2rem" }}>
          <div style={{ maxHeight: "400px", overflowY: "auto" }}>
            <Table striped bordered hover responsive>
              <thead style={{ backgroundColor: "#eb631c", color: "#ffffff" }}>
                <tr>
                  <th style={{ padding: "1rem", textAlign: "left" }}>
                    Downloaded File Name
                  </th>
                  <th style={{ padding: "1rem", textAlign: "left" }}>
                    Time Stamp
                  </th>
                </tr>
              </thead>
              <tbody>
                {downloadLogs.map((log, index) => (
                  <tr
                    key={index}
                    style={{
                      backgroundColor: index % 2 === 0 ? "#f9f9f9" : "#ffffff",
                    }}
                  >
                    <td style={{ padding: "1rem", textAlign: "left" }}>
                      {log.downloadFileName}
                    </td>
                    <td style={{ padding: "1rem", textAlign: "left" }}>
                      {new Date(log.downloadTime).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>
        </Card.Body>
      </Card>
    </div>
  );
};

export default DownloadLogsTable;

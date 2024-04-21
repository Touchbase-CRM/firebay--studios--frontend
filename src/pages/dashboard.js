// dashboard.js
import { Button, Table } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";

const Dashboard = () => {
  const handlePlayClick = () => {
    console.log("Play button clicked");
  };

  const handleDeleteClick = () => {
    console.log("Delete button clicked");
  };

  return (
    <div>
      <h1>Your ads</h1>
      <Button variant="warning" style={{ backgroundColor: "#eb631c" }}>
        Create a new ad
      </Button>
      <Table striped bordered hover>
        <thead>
          <tr>
            <th>Ad Name</th>
            <th>Voice</th>
            <th>Music</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: 5 }).map((_, index) => (
            <tr key={index}>
              <td>Lorem ipsum dolor sit amet, consecte...</td>
              <td>Charley</td>
              <td>Upbeat</td>
              <td>Nov 3, 2023, 10:32AM</td>
              <td>
                <Button variant="link" onClick={handlePlayClick}>
                  <i className="bi bi-play-fill" style={{ color: "black" }}></i>
                </Button>
                <Button variant="link" onClick={handleDeleteClick}>
                  <i className="bi bi-trash-fill" style={{ color: "red" }}></i>
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </Table>
    </div>
  );
};

export default Dashboard;

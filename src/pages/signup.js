import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import firebase from "../firebase";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import "firebase/compat/firestore";
import Swal from "sweetalert2";
import Image from "next/image";

const SignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handleSignUp = (event) => {
    event.preventDefault();
    const userEmailDomain = email.split("@")[1];

    firebase
      .firestore()
      .collection("organizations_meta_data")
      .doc(userEmailDomain)
      .get()
      .then((doc) => {
        if (!doc.exists) {
          Swal.fire({
            icon: "error",
            title: "Organization Not Found",
            text: "Your email domain does not match any registered organization.",
          });
          throw new Error("Organization not found."); // Prevent further execution
        } else {
          // Organization exists, set the organization state
          const orgData = doc.data();
          setOrganization(orgData.org_name);

          // Proceed to create a temporary anonymous user
          return firebase.auth().signInAnonymously();
        }
      })
      .then((userCredential) => {
        // Handle the new user here
        // For example, you could store the user's email in Firestore or in the user's profile
        const user = userCredential.user;
        console.log("Temporary user created: ", user.uid);
        // Additional code to handle the new user
      })
      .catch((error) => {
        // Handle errors here, including errors from signInAnonymously
        Swal.fire({
          icon: "error",
          title: "Error",
          text: error.message,
        });
        console.error(error);
      });
  };

  return (
    <Container
      fluid
      className="vh-100 d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "#343a40" }}
    >
      <Row className="w-100">
        <Col md={6} className="mx-auto">
          <Card
            className="my-5 mx-1 p-4"
            style={{
              backgroundColor: "#1a1a1a",
              borderRadius: "1rem",
              color: "white",
            }}
          >
            <Image
              src="/fire.png"
              alt="Firebay Studios"
              width={100}
              height={100}
              className="d-block mx-auto mb-3"
            />
            <h2 className="text-center mb-4">Firebay Studios</h2>
            <p className="text-center mb-5">
              Please enter your email to get started!
            </p>
            <style jsx global>{`
              input:-webkit-autofill,
              input:-webkit-autofill:focus,
              input:-webkit-autofill:hover {
                -webkit-box-shadow: 0 0 0 1000px #495057 inset;
                box-shadow: 0 0 0 1000px #495057 inset;
                -webkit-text-fill-color: white !important;
              }
            `}</style>
            <Form>
              <Form.Group controlId="email" className="mb-3">
                <Form.Label>Work Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter email"
                  value={email}
                  onChange={handleEmailChange}
                  required
                  style={{
                    borderColor: "#ced4da",
                    backgroundColor: "#495057",
                    color: "white",
                  }}
                />
              </Form.Group>
              <br></br>

              <Button
                className="w-100"
                variant="outline-light"
                type="submit"
                size="lg"
                onClick={handleSignUp}
              >
                Next
              </Button>
            </Form>

            <div className="my-3">
              <p className="text-center">
                Already have an account?{" "}
                <a href="/login" style={{ color: "#fff", fontWeight: "bold" }}>
                  Login
                </a>
              </p>
            </div>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};
export default SignupPage;

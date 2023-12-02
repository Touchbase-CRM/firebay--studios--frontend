import { useState } from "react";
import { useRouter } from "next/router";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import Image from "next/image";
import firebase from "../firebase";
import "firebase/compat/firestore";
import Swal from "sweetalert2";

const SignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");

  // Extract the domain from the email
  const userEmailDomain = email.split("@")[1];

  const checkEmailInUidToOrg = async () => {
    const querySnapshot = await firebase
      .firestore()
      .collection("uid_to_org")
      .where("work_email", "==", email)
      .get();

    return !querySnapshot.empty;
  };

  const checkOrganizationExists = async (userEmailDomain) => {
    const doc = await firebase
      .firestore()
      .collection("organizations_meta_data")
      .doc(userEmailDomain)
      .get();

    if (!doc.exists) {
      Swal.fire({
        icon: "error",
        title: "Organization Not Found",
        text: "Your email domain does not match any registered organization.",
      });
      throw new Error("Invalid organization");
    }
    // Organization exists, return true
    return true;
  };

  const handleEmailChange = (event) => {
    setEmail(event.target.value);
  };

  const handleSignUp = async (event) => {
    event.preventDefault();

    // Check if email already exists in uid_to_org
    const emailExists = await checkEmailInUidToOrg();
    if (emailExists) {
      Swal.fire({
        icon: "info",
        title: "Email Already Exists",
        text: "This email is already registered. Please login instead.",
      });
      return;
    }

    // Extract the domain from the email
    const userEmailDomain = email.split("@")[1];

    try {
      const orgExists = await checkOrganizationExists(userEmailDomain);
      if (orgExists) {
        // Organization exists, navigate to 'finish_signup' page
        router.push({
          pathname: "/finish_signup",
          query: { email: email },
        });
      }
    } catch (error) {
      console.error("Error checking organization:", error);
    }
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
              Please enter your work email to get started!
            </p>
            <Form onSubmit={handleSignUp}>
              <Form.Group controlId="email" className="mb-3">
                <Form.Label>Work Email address</Form.Label>
                <Form.Control
                  type="email"
                  placeholder="Enter work email"
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
              <Button
                className="w-100"
                variant="outline-light"
                type="submit"
                size="lg"
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

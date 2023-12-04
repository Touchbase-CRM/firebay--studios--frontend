import { useState } from "react";
import { useRouter } from "next/router";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import Image from "next/image";
import {
  getFirestore,
  collection,
  doc,
  getDoc,
  query,
  where,
  getDocs,
} from "firebase/firestore"; // Importing new Firestore methods
import Swal from "sweetalert2";
import app from "../firebase";
import { getCheckoutUrl, getPortalUrl } from "../stripe_proxy_sdk";

const db = getFirestore(app);

const SignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [organization, setOrganization] = useState("");

  // Extract the domain from the email
  const userEmailDomain = email.split("@")[1];

  const checkEmailInUidToOrg = async () => {
    const q = query(
      collection(db, "uid_to_org"),
      where("work_email", "==", email)
    );
    const querySnapshot = await getDocs(q);

    return !querySnapshot.empty;
  };

  // write a function to have the user payment portal link
  const getUserPaymentPortalLink = async () => {
    const priceId = "price_1OIYJOFMbNrj7ePDcK5Zk1vp";
    const checkoutUrl = await getCheckoutUrl(app, priceId);
    router.push(checkoutUrl);
  };

  const checkOrganizationExists = async (userEmailDomain) => {
    const orgDocRef = doc(db, "organizations_meta_data", userEmailDomain);
    const docSnap = await getDoc(orgDocRef);

    if (!docSnap.exists()) {
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

    try {
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

      const userEmailDomain = email.split("@")[1];
      const orgExists = await checkOrganizationExists(userEmailDomain);
      if (orgExists) {
        // Organization exists, navigate to 'finish_signup' page
        getUserPaymentPortalLink();
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

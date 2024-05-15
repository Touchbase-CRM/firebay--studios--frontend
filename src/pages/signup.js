import Swal from "sweetalert2";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import {
  getFirestore,
  doc,
  getDoc,
  writeBatch,
  collection,
  set,
} from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  fetchSignInMethodsForEmail,
  // sendEmailVerification,
} from "firebase/auth";
import Spinner from "../components/spinner/spinner";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { checkIfExistsInFirestore } from "@/utils/db-read-write-ops/deserialization-utils";

// Initialize Firebase services
const db = getFirestore();
const auth = getAuth();

const SignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [invoiceNumber, setInvoiceNumber] = useState("");
  const [isEmployee, setIsEmployee] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  useEffect(() => {
    if (router.query.email) {
      setEmail(router.query.email);
    }
  }, [router.query.email]);

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleConfirmPasswordChange = (event) => {
    setConfirmPassword(event.target.value);
  };

  const handleInvoiceNumberChange = (event) => {
    setInvoiceNumber(event.target.value);
  };

  const handleEmployeeCheck = (event) => {
    setIsEmployee(event.target.checked);
    if (event.target.checked) {
      setInvoiceNumber("");
    }
  };

  async function validateInvoiceNumber(invoiceNumber) {
    const response = await fetch("/api/Stripe/check-invoice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ invoiceNumber }),
    });

    const data = await response.json();
    if (data.valid) {
      return true;
    } else {
      Swal.fire({
        icon: "error",
        title: "Invalid Invoice Number",
        text: "Please make sure you have entered the correct invoice number.",
      });
      return false;
    }
  }

  async function validateEmployeeStatus(email) {
    const validEmployee = await checkIfExistsInFirestore("internal", email);
    if (validEmployee) {
      return validEmployee;
    } else {
      Swal.fire({
        icon: "error",
        title: "Invalid Employee Email",
        text: "Please make sure you have entered the correct email address.",
      });
      return false;
    }
  }

  const handleSignUp = async (event) => {
    event.preventDefault();

    setIsLoading(true); // Start loading
    setStatusMessage("Creating your Pyro account...");

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Passwords do not match",
        text: "Please make sure your passwords match.",
      });
      setIsLoading(false); // Stop loading
      return;
    }

    const validUser = isEmployee
      ? await validateEmployeeStatus(email)
      : await validateInvoiceNumber(invoiceNumber);
    if (!validUser) {
      setIsLoading(false); // Stop loading
      return;
    }

    try {
      // Directly attempt to create the user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;

      const batch = writeBatch(db);
      const uidToOrgRef = doc(db, "uid_to_org", user.uid);
      batch.set(uidToOrgRef, {
        work_email: email,
        monthly_downloads: -1,
        unit_price: 0,
      });

      // Ensure the parent document in 'customers' is created with a dummy field to avoid ghost docs
      const userDocRef = doc(db, "customers", user.uid);
      batch.set(userDocRef, { email: email });

      // Create the subcollection 'subscriptions'
      const subscriptionsRef = collection(userDocRef, "subscriptions");
      const newSubscriptionRef = doc(subscriptionsRef);
      batch.set(newSubscriptionRef, {
        status: "active",
      });

      await batch.commit();

      setStatusMessage("Your Pyro account has been created.");

      // Redirect to another page or perform further actions here
      router.push("/login"); // Example redirection after successful signup
    } catch (error) {
      console.error("Signup error", error);
      if (error.code === "auth/email-already-in-use") {
        Swal.fire({
          icon: "error",
          title: "Email Already in Use",
          text: "The email address is already in use by another account.",
        });
      } else {
        Swal.fire({
          icon: "error",
          title: "Signup Failed",
          text: error.message,
        });
      }
      setIsLoading(false); // Stop loading
    }
  };

  return (
    <Container
      fluid
      className="vh-100 d-flex justify-content-center align-items-center"
      style={{ backgroundColor: "#FFFFFF" }}
    >
      {isLoading && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100vh",
            textAlign: "center",
          }}
        >
          <div
            style={{
              position: "relative",
              width: "120px",
              height: "120px",
            }}
          >
            <Spinner />
          </div>
          <p style={{ marginTop: "20px", color: "black" }}>{statusMessage}</p>
        </div>
      )}
      {!isLoading && (
        <Row className="w-100">
          <Col md={6} className="mx-auto">
            <Card
              className="my-5 mx-1 p-4"
              style={{
                borderColor: "#eb631c",
                borderRadius: "1rem",
                color: "black",
                position: "relative",
              }}
            >
              {/* Step indicator */}
              <div
                style={{
                  position: "absolute",
                  top: "10px",
                  left: "10px",
                  fontSize: "small",
                }}
              >
                Step 1 of 2
              </div>
              <Image
                src="/fire.png"
                alt="Firebay Studios"
                width={100}
                height={100}
                className="d-block mx-auto mb-3"
              />
              <h2 className="text-center mb-4">Pyro Sign Up</h2>
              <p className="text-center mb-5">Let's get you started!</p>

              <Form>
                <Form.Group controlId="workEmail" className="mb-3">
                  <Form.Label>Email</Form.Label>
                  <Form.Control
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    style={{
                      borderColor: "#e4e4e4",
                      backgroundColor: "#e4e4e4",
                      color: "black",
                    }}
                  />
                </Form.Group>

                <Form.Group controlId="password" className="mb-3">
                  <Form.Label>Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={handlePasswordChange}
                    minLength={6}
                    required
                    style={{
                      borderColor: "#e4e4e4",
                      backgroundColor: "#e4e4e4",
                      color: "black",
                    }}
                  />
                </Form.Group>

                <Form.Group controlId="confirmPassword" className="mb-3">
                  <Form.Label>Confirm Password</Form.Label>
                  <Form.Control
                    type="password"
                    placeholder="Confirm Password"
                    value={confirmPassword}
                    onChange={handleConfirmPasswordChange}
                    minLength={6}
                    required
                    style={{
                      borderColor: "#e4e4e4",
                      backgroundColor: "#e4e4e4",
                      color: "black",
                    }}
                  />
                </Form.Group>

                <Form.Group controlId="invoiceNumber" className="mb-3">
                  <Form.Label>Payment Invoice Number</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="B51DB03D-0002"
                    value={invoiceNumber}
                    onChange={handleInvoiceNumberChange}
                    pattern="[A-Z0-9]{8}-[0-9]{4}"
                    disabled={isEmployee}
                    required={!isEmployee}
                    style={{
                      borderColor: "#e4e4e4",
                      backgroundColor: isEmployee ? "#e9ecef" : "#e4e4e4",
                      color: "black",
                    }}
                  />
                </Form.Group>

                <Form.Group controlId="isEmployee" className="mb-3">
                  <Form.Check
                    type="checkbox"
                    label="I am a Firebay Studios Employee"
                    checked={isEmployee}
                    onChange={handleEmployeeCheck}
                  />
                </Form.Group>

                <div className="my-3 text-left" style={{ fontSize: "small" }}>
                  By clicking the Sign Up button below, you agree to our&nbsp;
                  <a
                    href="https://www.firebaystudios.com/terms-of-service"
                    target="_blank"
                    style={{
                      textDecoration: "underline",
                      color: "#0d6efd",
                      marginRight: "4px",
                    }}
                  >
                    terms and conditions
                  </a>
                  &nbsp;as well as our&nbsp;
                  <a
                    href="https://www.firebaystudios.com/privacy-policy"
                    target="_blank"
                    style={{
                      textDecoration: "underline",
                      color: "#0d6efd",
                      marginRight: "4px",
                    }}
                  >
                    privacy policy
                  </a>
                  .
                </div>

                <Button
                  className="w-100"
                  style={{ backgroundColor: "#EB631C" }}
                  variant="outline-light"
                  type="submit"
                  size="lg"
                  onClick={handleSignUp}
                >
                  Sign Up
                </Button>
              </Form>

              {error && (
                <div className="mt-3">
                  <p className="text-center text-danger">{error}</p>
                </div>
              )}

              <div className="my-3">
                <p className="text-center">
                  On Trial?{" "}
                  <a
                    href="/trial-login"
                    style={{ color: "black", fontWeight: "bold" }}
                  >
                    Trial Login
                  </a>
                </p>
                <p className="text-center">
                  Already a subscriber?{" "}
                  <a
                    href="/login"
                    style={{ color: "black", fontWeight: "bold" }}
                  >
                    Login
                  </a>
                </p>
              </div>

              <div
                style={{
                  position: "absolute",
                  bottom: "10px",
                  right: "10px",
                  fontSize: "small",
                  fontWeight: "bold",
                  fontStyle: "italic",
                }}
              >
                By Firebay Studios
              </div>
            </Card>
          </Col>
        </Row>
      )}
    </Container>
  );
};

export default SignupPage;

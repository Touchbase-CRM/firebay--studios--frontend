import Swal from "sweetalert2";
import Image from "next/image";

import { useState, useEffect } from "react";
import { useRouter } from "next/router";

import { getFirestore, doc, getDoc, writeBatch } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  // sendEmailVerification,
} from "firebase/auth";
import app from "../firebase";

import Spinner from "../components/Spinner";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";
import { getCheckoutUrl } from "../stripe_proxy_sdk";

// Initialize Firebase services
const db = getFirestore();
const auth = getAuth();

const SignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // const [organization, setOrganization] = useState("");
  const [error, setError] = useState("");
  // const [verificationUser, setVerificationUser] = useState(null);
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

  const handleSignUp = async (event) => {
    event.preventDefault();
    setIsLoading(true); // Start loading
    // setStatusMessage("Step 1 of 2: Creating your Pyro account...");
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

    try {
      // const userEmailDomain = email.split("@")[1];
      // const orgMetaRef = doc(db, "organizations_meta_data", userEmailDomain);
      // const orgMetaSnap = await getDoc(orgMetaRef);

      // if (!orgMetaSnap.exists()) {
      //   Swal.fire({
      //     icon: "error",
      //     title: "Organization Not Found",
      //     text: "Your email domain does not match any registered organization.",
      //   });
      //   setIsLoading(false); // Stop loading
      //   return;
      // }

      // const orgData = orgMetaSnap.data();
      // setOrganization(orgData.org_name);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      // setVerificationUser(user);

      // await sendEmailVerification(user);

      // Map the users uid to their organization
      const batch = writeBatch(db);
      const uidToOrgRef = doc(db, "uid_to_org", user.uid);
      batch.set(uidToOrgRef, {
        // org_name: orgData.org_name,
        work_email: email,
        credit_allowance: 1000,
        credit_left: 1000,
      });

      await batch.commit();

      // setStatusMessage("Step 1 of 2: Your Pyro account has been created.");
      setStatusMessage("Your Pyro account has been created.");

      // Wait a moment before changing the message
      // setTimeout(
      //   () =>
      //     setStatusMessage(
      //       "Step 2 of 2: Redirecting you to the payment page, sit tight..."
      //     ),
      //   2000
      // );

      // // Define your Stripe priceId here (or fetch it as needed)
      // const priceId = "price_1OKTm4FMbNrj7ePDSxvrmLQE";
      // // const priceId = "price_1OIYJOFMbNrj7ePDcK5Zk1vp"; // test priceId

      // // Call the getCheckoutUrl function to get the Stripe checkout URL
      // const checkoutUrl = await getCheckoutUrl(app, priceId);

      // // Redirect the user to the Stripe checkout page in the same window
      // window.location.href = checkoutUrl;

      router.push("/create_ad"); // remove this once the pricing is determined.
    } catch (error) {
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
      console.error("Signup error", error);
      setIsLoading(false); // Stop loading
    }
  };

  // const handleContinue = () => {
  //   router.push("/verification");
  // };

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
          <p style={{ marginTop: "20px", color: "white" }}>{statusMessage}</p>
        </div>
      )}
      {!isLoading && (
        <Row className="w-100">
          <Col md={6} className="mx-auto">
            <Card
              className="my-5 mx-1 p-4"
              style={{
                // backgroundColor: "#1a1a1a",
                borderColor: "#eb631c",

                borderRadius: "1rem",
                color: "black",
                position: "relative", // Add this for positioning the step indicator
              }}
            >
              {/* Step indicator */}
              <div
                style={{
                  position: "absolute",
                  top: "10px", // Adjust as needed
                  left: "10px", // Adjust as needed
                  fontSize: "small", // Small font size
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
                    color: "white",
                  }}
                />
              </Form.Group>
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
                      color: "white",
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
                      color: "white",
                    }}
                  />
                </Form.Group>

                {/* Added the sentence with hyperlinks */}
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
                    href="/trial_login"
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
              {/* Add the secondary branding at the bottom right corner */}
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

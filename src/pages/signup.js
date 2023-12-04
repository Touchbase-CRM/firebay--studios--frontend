import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import firebase from "../firebase";
import {
  Container,
  Row,
  Col,
  Card,
  Form,
  Button,
  Modal,
} from "react-bootstrap";
import "firebase/compat/firestore";
import Swal from "sweetalert2";
import Image from "next/image";

const SignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [verificationUser, setVerificationUser] = useState(null);

  useEffect(() => {
    if (router.query.email) {
      setEmail(router.query.email);
    }
  }, [router.query.email]);

  const handlePrivacyPolicyChange = (event) => {
    setAcceptsPrivacyPolicy(event.target.checked);
  };

  const handleTermsAndConditionsChange = (event) => {
    setAcceptsTermsAndConditions(event.target.checked);
  };

  const handlePasswordChange = (event) => {
    setPassword(event.target.value);
  };

  const handleConfirmPasswordChange = (event) => {
    setConfirmPassword(event.target.value);
  };

  const handleSignUp = (event) => {
    event.preventDefault();
    if (!acceptsPrivacyPolicy || !acceptsTermsAndConditions) {
      Swal.fire({
        icon: "error",
        title: "Terms and Conditions/Privacy Policy",
        text: "You must accept the Privacy Policy and Terms and Conditions to proceed.",
      });
      return;
    }

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Passwords do not match",
        text: "Please make sure your passwords match",
      });
      return;
    }
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

          // Proceed to create user
          return firebase
            .auth()
            .createUserWithEmailAndPassword(email, password);
        }
      })
      .then((userCredential) => {
        // User created, send email verification
        setVerificationUser(userCredential.user);
        return userCredential.user.sendEmailVerification();
      })
      .then(() => {
        // Email verification sent, show modal
        setShowModal(true);
      })
      .catch((error) => {
        if (error.code === "auth/email-already-in-use") {
          Swal.fire({
            icon: "error",
            title: "Email Already in Use",
            text: "The email address is already in use by another account.",
          });
        } else if (error.message !== "Organization not found.") {
          // Handle other errors differently
          Swal.fire({
            icon: "error",
            title: "Error",
            text: error.message,
          });
        }
        // Log the error or handle the display of the error to the user
        console.error(error);
      });
  };

  const handleContinue = () => {
    verificationUser.reload().then(() => {
      if (verificationUser.emailVerified) {
        const db = firebase.firestore();
        const batch = db.batch();

        const uidToOrgRef = db
          .collection("uid_to_org")
          .doc(verificationUser.uid);
        batch.set(uidToOrgRef, {
          org_name: organization,
          work_email: email,
          credit_allowance: 1000,
          credit_left: 1000,
        });

        batch
          .commit()
          .then(() => {
            router.push("/create_ad");
          })
          .catch((error) => {
            Swal.fire({
              icon: "error",
              title: "Oops...",
              text: error.message,
            });
          });
      } else {
        Swal.fire({
          icon: "info",
          title: "Email Verification",
          text: "Please verify your email before continuing",
        });
      }
    });
  };

  const handleCancel = () => {
    setShowModal(false);
    setEmail(email);
    setPassword(password);
    setConfirmPassword(confirmPassword);
    setOrganization(organization);
    setFirstName(firstName);
    setLastName(lastName);

    if (verificationUser) {
      verificationUser
        .delete()
        .then(() => {
          console.log("User deleted");
        })
        .catch((error) => {
          console.error("Error deleting user", error);
        });
    }
  };

  const VerificationModal = () => (
    <Modal show={showModal}>
      <Modal.Header>
        <Modal.Title style={{ color: "black" }}>Email Verification</Modal.Title>
      </Modal.Header>
      <Modal.Body style={{ color: "black" }}>
        One more thing! Please verify your email, then click continue. Do not
        close this tab yet. Click cancel to abort the verification.
      </Modal.Body>
      <Modal.Footer>
        <Button variant="secondary" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleContinue}>
          Continue
        </Button>
      </Modal.Footer>
    </Modal>
  );

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
            <p className="text-center mb-5">Let's get you started!</p>

            <Form.Group controlId="workEmail" className="mb-3">
              <Form.Label>Work Email</Form.Label>
              <Form.Control
                type="email"
                placeholder="Enter your work email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  borderColor: "#ced4da",
                  backgroundColor: "#495057",
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
                    borderColor: "#ced4da",
                    backgroundColor: "#495057",
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
                    borderColor: "#ced4da",
                    backgroundColor: "#495057",
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
                variant="outline-light"
                type="submit"
                size="lg"
                onClick={handleSignUp}
              >
                Sign Up
              </Button>
            </Form>
            <VerificationModal />
            {error && (
              <div className="mt-3">
                <p className="text-center text-danger">{error}</p>
              </div>
            )}

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

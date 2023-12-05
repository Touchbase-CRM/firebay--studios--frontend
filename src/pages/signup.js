import Swal from "sweetalert2";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { getFirestore, doc, getDoc, writeBatch } from "firebase/firestore";
import {
  getAuth,
  createUserWithEmailAndPassword,
  sendEmailVerification,
} from "firebase/auth";
import { Container, Row, Col, Card, Form, Button } from "react-bootstrap";

// Initialize Firebase services
const db = getFirestore();
const auth = getAuth();

const SignupPage = () => {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [organization, setOrganization] = useState("");
  const [error, setError] = useState("");
  const [verificationUser, setVerificationUser] = useState(null);

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

    if (password !== confirmPassword) {
      Swal.fire({
        icon: "error",
        title: "Passwords do not match",
        text: "Please make sure your passwords match.",
      });
      return;
    }

    try {
      const userEmailDomain = email.split("@")[1];
      const orgMetaRef = doc(db, "organizations_meta_data", userEmailDomain);
      const orgMetaSnap = await getDoc(orgMetaRef);

      if (!orgMetaSnap.exists()) {
        Swal.fire({
          icon: "error",
          title: "Organization Not Found",
          text: "Your email domain does not match any registered organization.",
        });
        return; // Exit the function if organization is not found
      }

      const orgData = orgMetaSnap.data();
      setOrganization(orgData.org_name);

      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password
      );
      const user = userCredential.user;
      setVerificationUser(user);

      await sendEmailVerification(user);

      // Map the users uid to their organization
      const batch = writeBatch(db);
      const uidToOrgRef = doc(db, "uid_to_org", user.uid);
      batch.set(uidToOrgRef, {
        org_name: orgData.org_name,
        work_email: email,
        credit_allowance: 1000,
        credit_left: 1000,
      });

      await batch.commit();
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
    }
    handleContinue();
  };

  const handleContinue = () => {
    router.push("/verification");
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

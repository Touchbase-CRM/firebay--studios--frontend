import React, { useState } from "react";
import Alert from "react-bootstrap/Alert";
import { CopyBox } from "./copy-box";
export const SectioningTutorial = () => {
  return (
    <Alert
      variant="info"
      style={{
        backgroundColor: "#d1ecf1",
        borderColor: "#bee5eb",
        padding: "20px",
        borderRadius: "5px",
        color: "#0c5460",
      }}
    >
      <Alert.Heading
        style={{
          fontSize: "24px",
          marginBottom: "20px",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        Interactive Tutorial on How to Split into Sections
      </Alert.Heading>
      <p
        style={{
          fontSize: "16px",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
        }}
      >
        <strong>What is a section?</strong>
        <br />A section is a part of your script that shares the same voice,
        energy, or other specific nuances. We recommend you to split your script
        into as many sections as possible to get the best read.
      </p>
      <p
        style={{
          fontSize: "16px",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          marginTop: "20px",
        }}
      >
        <strong>How to split into sections?</strong>
        <br />
        Imagine following is your script. Copy and paste it on the script text
        box below, and observe that there is only one section.
      </p>
      {/* Reusable boxes with different texts */}
      <CopyBox text="The quick brown fox jumps over the lazy dog." />
      <p
        style={{
          fontSize: "16px",
          fontFamily: "'Helvetica Neue', Helvetica, Arial, sans-serif",
          marginTop: "20px",
        }}
      >
        Now we add double forward slashes (//) in places where we want to end a
        section. Try out the following example below and observe that now you
        have four sections.
      </p>
      <CopyBox text="The quick brown fox// jumps //over the lazy // dog." />
      {/* You can add more <CopyBox /> components as needed */}
    </Alert>
  );
};

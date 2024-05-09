import React, { useState } from "react";
import { Card, Button, OverlayTrigger, Tooltip } from "react-bootstrap";
import { Clipboard, ClipboardFill } from "react-bootstrap-icons";

const CodeBlock = ({ code, title }) => {
  const [isCopied, setIsCopied] = useState(false);

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text).then(
      () => {
        setIsCopied(true);
        setTimeout(() => {
          setIsCopied(false);
        }, 500);
      },
      (err) => {}
    );
  };

  return (
    <Card bg="dark" text="light" className="my-2">
      <Card.Header className="d-flex justify-content-between align-items-center">
        {title && <span className="text-white">{title}</span>}
        <OverlayTrigger
          placement="top"
          overlay={
            <Tooltip id="button-tooltip-2">
              {isCopied ? "Copied" : "Copy"}
            </Tooltip>
          }
        >
          <Button
            onClick={() => copyToClipboard(code)}
            variant="link"
            className="ms-auto text-light"
          >
            {isCopied ? <ClipboardFill size={20} /> : <Clipboard size={20} />}
          </Button>
        </OverlayTrigger>
      </Card.Header>
      <Card.Body>
        <pre
          style={{
            whiteSpace: "pre-wrap",
            wordBreak: "break-word",
            fontStyle: "italic",
          }}
        >
          {code}
        </pre>
      </Card.Body>
    </Card>
  );
};
export default CodeBlock;

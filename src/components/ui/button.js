import React, { forwardRef, useEffect, useState } from "react";
import { Button as BsButton, Spinner as BsSpinner } from "react-bootstrap";

const variantToBs = {
  primary: "primary",
  secondary: "secondary",
  ghost: "link",
  danger: "danger",
};

const sizeToBs = {
  sm: "sm",
  md: undefined,
  lg: "lg",
};

const ghostStyle = {
  color: "var(--text-secondary)",
  textDecoration: "none",
  border: "1px solid transparent",
  background: "transparent",
};

const dangerStyle = {
  backgroundColor: "var(--danger-500)",
  borderColor: "var(--danger-500)",
  color: "var(--text-inverse)",
};

export const Button = forwardRef(function Button(
  {
    variant = "primary",
    size = "md",
    loading = false,
    feedback = null,
    feedbackDuration = 1100,
    leftIcon = null,
    rightIcon = null,
    children,
    style,
    onClick,
    disabled,
    type = "button",
    ...rest
  },
  ref
) {
  const [showingFeedback, setShowingFeedback] = useState(false);

  useEffect(() => {
    if (!showingFeedback) return undefined;
    const t = setTimeout(() => setShowingFeedback(false), feedbackDuration);
    return () => clearTimeout(t);
  }, [showingFeedback, feedbackDuration]);

  const handleClick = (e) => {
    if (feedback) setShowingFeedback(true);
    if (onClick) onClick(e);
  };

  const baseStyle = {
    fontWeight: "var(--font-weight-medium)",
    borderRadius: "var(--radius-md)",
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "var(--space-2)",
    ...(variant === "ghost" ? ghostStyle : {}),
    ...(variant === "danger" ? dangerStyle : {}),
    ...style,
  };

  const label = showingFeedback ? feedback : children;

  return (
    <BsButton
      ref={ref}
      variant={variantToBs[variant] || "primary"}
      size={sizeToBs[size]}
      style={baseStyle}
      onClick={handleClick}
      disabled={disabled || loading}
      type={type}
      {...rest}
    >
      {loading ? (
        <BsSpinner animation="border" size="sm" role="status" aria-hidden />
      ) : (
        leftIcon
      )}
      <span>{label}</span>
      {!loading && rightIcon}
    </BsButton>
  );
});

export default Button;

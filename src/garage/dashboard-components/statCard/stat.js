// relative path: src/components/dashboardComponents/statCard/stat.js
// StatCard component in 'stat.js'
import { Card } from "react-bootstrap";
import { useEffect, useState } from "react";

export const StatCard = ({ title, icon, value, onValueChange, style }) => {
  const [internalValue, setInternalValue] = useState(value);

  // This effect updates the internal state when the prop changes
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  return (
    <Card className="text-center" style={{ ...style }}>
      <Card.Header>{title}</Card.Header>
      <Card.Body>
        {icon && <i className={icon}></i>}
        <Card.Text>{internalValue}</Card.Text>
      </Card.Body>
    </Card>
  );
};

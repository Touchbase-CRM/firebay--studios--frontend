// ComponentB.js (Child Component)

import React from "react";

function ComponentB({ reads, onSelectFruit }) {
  return (
    <div>
      {Object.entries(reads).map(([key, value]) => (
        <button key={key} onClick={() => onSelectFruit(value)}>
          {key}
        </button>
      ))}
    </div>
  );
}

export default ComponentB;

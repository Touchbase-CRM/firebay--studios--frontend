// ComponentA.js (Parent Component)

import React, { useState } from "react";
import ComponentB from "./ComponentB"; // Assuming ComponentB is in the same directory

function ComponentA() {
  // State to keep track of the selected fruit
  const [selectedFruit, setSelectedFruit] = useState("None");

  // Object to pass to ComponentB
  const reads = { 1: "Apple", 2: "Orange" };

  // Function to update the selected fruit, to be passed to ComponentB
  const handleSelectFruit = (fruit) => {
    setSelectedFruit(fruit);
  };

  return (
    <div>
      <h1>Selected Fruit: {selectedFruit}</h1>
      <ComponentB reads={reads} onSelectFruit={handleSelectFruit} />
    </div>
  );
}

export default ComponentA;

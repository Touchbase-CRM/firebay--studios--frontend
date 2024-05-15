async function checkInvoice(invoiceId) {
  const response = await fetch("/api/check-invoice", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ invoiceId }),
  });

  const data = await response.json();
  if (data.valid) {
    console.log("Invoice is valid:", data.invoice);
  } else {
    console.log("Invoice is invalid:", data.error);
  }
}

// Example usage

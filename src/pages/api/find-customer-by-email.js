// pages/api/find-customer.js
import Stripe from "stripe";

export default async function handler(req, res) {
  if (req.method === "POST") {
    try {
      const { email } = req.body;

      // Initialize Stripe with your secret key
      const stripe = new Stripe(process.env.STRIPE_RESTRICTED_SECRET_KEY);

      // Ensure the email is provided
      if (!email) {
        return res.status(400).json({ error: "Email is required" });
      }

      // Use Stripe API to find customer by email
      const customers = await stripe.customers.list({
        email: email,
        limit: 1,
      });

      if (customers.data.length > 0) {
        return res.status(200).json({ customerId: customers.data[0].id });
      } else {
        return res.status(404).json({ error: "Customer not found" });
      }
    } catch (error) {
      console.error("Error in findCustomerIdByEmail:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  } else {
    // Handle any requests that aren't POST
    res.setHeader("Allow", ["POST"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

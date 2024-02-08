// pages/api/stripe_enlist_all_subscriptions.js
import Stripe from "stripe";

export default async function handler(req, res) {
  // Initialize Stripe with your secret key
  const stripe = new Stripe(process.env.STRIPE_RESTRICTED_SECRET_KEY);

  if (req.method === "POST") {
    try {
      const { customerId } = req.body;

      // Validate customer ID input
      if (!customerId) {
        return res.status(400).json({ error: "Customer ID is required" });
      }

      // Use Stripe API to list all subscriptions for the given customer
      const subscriptions = await stripe.subscriptions.list({
        customer: customerId,
        status: "all",
        expand: ["data.default_payment_method"],
      });

      // Return the list of subscriptions
      return res.status(200).json(subscriptions);
    } catch (error) {
      console.error("Error listing all subscriptions:", error);
      return res
        .status(500)
        .json({ error: "Internal Server Error", message: error.message });
    }
  } else {
    // Respond with 405 Method Not Allowed if the request is not POST
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}

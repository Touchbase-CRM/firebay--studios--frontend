const axios = require("axios");

const API_KEY =
  "rk_test_51NfXFuFMbNrj7ePD8sxctUnCuHXMUyRUwhxKduQruPk4LGLb8perwPqwVPdW7slc6j3Z6lObXeJ9yx1JOM32h13Q000cJiqrGx"; // Replace with your actual API key
const USER_ID = "cus_PHKzN03HZlnVBq"; // User ID to check

const stripe = require("stripe")(API_KEY); // Replace with your Stripe secret key

const EMAIL = "kaveen@gmail.com"; // User email to check

const findCustomerIdByEmail = async (email) => {
  try {
    const customers = await stripe.customers.list({ email: email, limit: 1 });
    console.log("Customers found:", customers.data.length);
    if (customers.data.length > 0) {
      return customers.data[0].id;
    } else {
      return null;
    }
  } catch (error) {
    console.error("Error in findCustomerIdByEmail:", error);
    throw error;
  }
};

const checkSubscriptionStatus = async (email) => {
  try {
    const customerId = await findCustomerIdByEmail(email);
    if (!customerId) {
      return {
        hasValidTrial: false,
        trialEnd: null,
        message: "No customer found with this email.",
      };
    }

    const subscriptions = await stripe.subscriptions.list({
      customer: customerId,
      status: "all",
      expand: ["data.default_payment_method"],
    });

    console.log("Subscriptions found:", subscriptions.data.length);

    let trialInfo = { hasValidTrial: false, trialEnd: null, message: "" };

    subscriptions.data.forEach((subscription) => {
      console.log("Subscription ID:", subscription.id);
      console.log("Status:", subscription.status);
      console.log(
        "Trial Start:",
        subscription.trial_start
          ? new Date(subscription.trial_start * 1000).toLocaleDateString()
          : "None"
      );
      console.log(
        "Trial End:",
        subscription.trial_end
          ? new Date(subscription.trial_end * 1000).toLocaleDateString()
          : "None"
      );

      if (
        subscription.trial_end &&
        subscription.trial_end <= Math.floor(Date.now() / 1000)
      ) {
        const trialEndDate = new Date(
          subscription.trial_end * 1000
        ).toLocaleDateString();
        if (
          !trialInfo.trialEnd ||
          new Date(trialInfo.trialEnd) < new Date(trialEndDate)
        ) {
          trialInfo.trialEnd = trialEndDate;
        }
      }

      if (
        subscription.trial_end > Math.floor(Date.now() / 1000) &&
        subscription.status === "trialing"
      ) {
        trialInfo.hasValidTrial = true;
        trialInfo.trialEnd = new Date(
          subscription.trial_end * 1000
        ).toLocaleDateString();
      }
    });

    return trialInfo;
  } catch (error) {
    console.error("Error fetching subscription status:", error);
    throw error;
  }
};

checkSubscriptionStatus(EMAIL)
  .then((trialInfo) => {
    console.log("Trial Info:", trialInfo);
  })
  .catch((error) => {
    console.error("An error occurred while checking the trial status:", error);
  });

import { IncomingForm } from "formidable";

export const config = {
  api: {
    bodyParser: false,
  },
};

export default async function handler(req, res) {
  const form = new IncomingForm();
  form.parse(req, (err, fields, files) => {
    if (err) {
      console.error("An error occurred:", err);
      res.status(500).json({ error: "Error parsing the form data." });
      return;
    }
    console.log("model_id:", fields.model_id);
    res.status(200).json({ message: "Check server console for model_id" });
  });
}

import { Router } from "express";

import { renderOtpEmail } from "../services/email.templates.js";

// view HTML email templates in a browser.
// Mounted under /test but only when NODE_ENV !== 'production'
const router = Router();

const TYPES = ["register", "login"];

// Index — discover the available previews.
router.get("/mails", (_req, res) => {
  const items = TYPES.map((t) => `<li><a href="/test/mails/${t}?username=Steffen&email=you@example.com&code=AB12CD">/test/mails/${t}</a></li>`).join("");
  res.type("html").send(`<h1>Email previews</h1><ul>${items}</ul>` + `<p>Pass any template variable as a query param — e.g. <code>?username=Steffen&amp;email=you@example.com&amp;code=AB12CD</code>. ` + `Edit the <code>.njk</code> files in <code>src/emails/</code> and just refresh (templates reload per render in dev).</p>`);
});

// GET /test/mails/:type — render an email template to HTML for browser preview.
// Every query param is passed into the template, so add {{ username }} etc. freely.
router.get("/mails/:type", (req, res) => {
  const { type } = req.params;
  if (!TYPES.includes(type)) {
    return res
      .status(404)
      .type("html")
      .send(`Unknown email type "${type}". Try: ${TYPES.map((t) => `/test/mails/${t}`).join(", ")}`);
  }
  // Sample defaults so the preview renders with no params; query params override.
  const vars = { code: "AB12CD", username: "there", email: "user@example.com", ...req.query };
  const { html } = renderOtpEmail(type, vars);
  res.type("html").send(html);
});

export default router;

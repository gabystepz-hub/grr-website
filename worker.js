import { EmailMessage } from "cloudflare:email";

const DESTINATION = "gabystepz@gmail.com";
const SENDER = "contact@gabrielramosruiz.com";

function escapeHeader(value) {
  // Strip CR/LF to prevent header injection from form input
  return String(value).replace(/[\r\n]+/g, " ").trim();
}

async function handleContact(request, env) {
  let data;
  try {
    data = await request.json();
  } catch {
    return Response.json({ ok: false, error: "Invalid request body." }, { status: 400 });
  }

  const fname = escapeHeader(data.fname || "");
  const lname = escapeHeader(data.lname || "");
  const email = escapeHeader(data.email || "");
  const project = escapeHeader(data.project || "Not specified");
  const message = String(data.message || "").trim();

  if (!fname || !lname || !email || !message) {
    return Response.json({ ok: false, error: "Please fill out all required fields." }, { status: 400 });
  }

  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(email)) {
    return Response.json({ ok: false, error: "Please enter a valid email address." }, { status: 400 });
  }

  const subject = `New contact form message from ${fname} ${lname}`;
  const bodyText =
`You have a new message from the gabrielramosruiz.com contact form.

Name: ${fname} ${lname}
Email: ${email}
Project type: ${project}

Message:
${message}
`;

  const raw =
`From: "Website Contact Form" <${SENDER}>
To: <${DESTINATION}>
Reply-To: <${email}>
Subject: ${subject}
MIME-Version: 1.0
Content-Type: text/plain; charset="UTF-8"
Content-Transfer-Encoding: 7bit

${bodyText}`;

  try {
    const message = new EmailMessage(SENDER, DESTINATION, raw);
    await env.CONTACT_EMAIL.send(message);
  } catch (err) {
    return Response.json({ ok: false, error: "Could not send your message right now. Please try again later." }, { status: 502 });
  }

  return Response.json({ ok: true });
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/api/contact") {
      return handleContact(request, env);
    }

    // Everything else: serve the static site
    return env.ASSETS.fetch(request);
  },
};

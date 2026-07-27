const RESPONSE_ENDPOINT = "";

const groups = {
  biargs: {
    mark: "BIARGS · EXTENDED SURGICAL TEAM",
    eyebrow: "Robotic gynaecology",
    description:
      "You are invited to join an initial professional working group bringing together trusted practitioners in robotic gynaecology to help shape its purpose, priorities and future direction.",
    confirmation:
      "We will contact you shortly with proposed dates for the initial BIARGS exploratory meeting.",
  },
  alrts: {
    mark: "ALRTS · THEATRE STAFF NETWORK",
    eyebrow: "General · Colorectal · Upper GI",
    description:
      "You are invited to join an initial professional working group bringing together trusted theatre practitioners in general, colorectal and upper-GI surgery to help shape its purpose, priorities and future direction.",
    confirmation:
      "We will contact you shortly with proposed dates for the initial ALRTS exploratory meeting.",
  },
};

const params = new URLSearchParams(window.location.search);
const groupKey = params.get("group")?.toLowerCase() === "alrts" ? "alrts" : "biargs";
const token = params.get("token") || "";
const group = groups[groupKey];

const invitationView = document.querySelector("#invitation-view");
const declineConfirmation = document.querySelector("#decline-confirmation");
const responseConfirmation = document.querySelector("#response-confirmation");
const errorMessage = document.querySelector("#error-message");
const acceptButton = document.querySelector("#accept-button");
const declineButton = document.querySelector("#decline-button");
const confirmDecline = document.querySelector("#confirm-decline");
const cancelDecline = document.querySelector("#cancel-decline");
const changeResponse = document.querySelector("#change-response");

document.querySelector("#brand-label").textContent = group.mark;
document.querySelector("#eyebrow").textContent = group.eyebrow;
document.querySelector("#description").textContent = group.description;

function show(view) {
  invitationView.hidden = view !== "invitation";
  declineConfirmation.hidden = view !== "decline";
  responseConfirmation.hidden = view !== "response";
}

function setBusy(busy) {
  acceptButton.disabled = busy;
  declineButton.disabled = busy;
  acceptButton.textContent = busy ? "Recording response…" : "Accept invitation";
}

function displayConfirmation(decision) {
  const accepted = decision === "accepted";
  document.querySelector("#confirmation-icon").textContent = accepted ? "✓" : "—";
  document.querySelector("#confirmation-eyebrow").textContent = accepted
    ? "Invitation accepted"
    : "Response received";
  document.querySelector("#confirmation-heading").textContent = accepted
    ? "Thank you for joining us."
    : "Thank you for letting us know.";
  document.querySelector("#confirmation-copy").textContent = accepted
    ? group.confirmation
    : "No further action is required. We appreciate you taking the time to respond.";
  document.querySelector("#preview-notice").hidden = Boolean(RESPONSE_ENDPOINT);
  show("response");
}

async function recordDecision(decision) {
  setBusy(true);
  errorMessage.hidden = true;

  const payload = {
    token,
    group: groupKey,
    response: decision,
    respondedAt: new Date().toISOString(),
  };

  try {
    if (RESPONSE_ENDPOINT) {
      const response = await fetch(RESPONSE_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error("Unable to record response");
    } else {
      localStorage.setItem(
        `subcommittee-invitation:${token || groupKey}`,
        JSON.stringify(payload),
      );
    }
    displayConfirmation(decision);
  } catch {
    show("invitation");
    errorMessage.hidden = false;
  } finally {
    setBusy(false);
  }
}

acceptButton.addEventListener("click", () => recordDecision("accepted"));
declineButton.addEventListener("click", () => show("decline"));
cancelDecline.addEventListener("click", () => show("invitation"));
confirmDecline.addEventListener("click", () => recordDecision("declined"));
changeResponse.addEventListener("click", () => show("invitation"));

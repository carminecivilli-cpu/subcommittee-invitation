const RESPONSE_ENDPOINT =
  "https://script.google.com/macros/s/AKfycby3u9iAr1vagGqfaT4oeck7qh5QtoN29KvYF7_7ZKYbj-6jb5eW1hHdpd1mZykitHfZ/exec";

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
const demoMode = params.get("demo") === "1";
const group = groups[groupKey];

const pinView = document.querySelector("#pin-view");
const identityView = document.querySelector("#identity-view");
const invitationView = document.querySelector("#invitation-view");
const declineConfirmation = document.querySelector("#decline-confirmation");
const responseConfirmation = document.querySelector("#response-confirmation");
const errorMessage = document.querySelector("#error-message");
const pinForm = document.querySelector("#pin-form");
const pinInput = document.querySelector("#pin-input");
const pinError = document.querySelector("#pin-error");
const verifyButton = document.querySelector("#verify-button");
const participantName = document.querySelector("#participant-name");
const confirmIdentity = document.querySelector("#confirm-identity");
const rejectIdentity = document.querySelector("#reject-identity");
const acceptButton = document.querySelector("#accept-button");
const declineButton = document.querySelector("#decline-button");
const confirmDecline = document.querySelector("#confirm-decline");
const cancelDecline = document.querySelector("#cancel-decline");
const changeResponse = document.querySelector("#change-response");

document.querySelector("#brand-label").textContent = group.mark;
document.querySelector("#eyebrow").textContent = group.eyebrow;
document.querySelector("#description").textContent = group.description;

let sessionToken = "";

function show(view) {
  pinView.hidden = view !== "pin";
  identityView.hidden = view !== "identity";
  invitationView.hidden = view !== "invitation";
  declineConfirmation.hidden = view !== "decline";
  responseConfirmation.hidden = view !== "response";
}

function normalisePin(value) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);
}

async function callInvitationService(payload) {
  if (demoMode && !RESPONSE_ENDPOINT) {
    if (payload.action === "verifyPin" && payload.pin === "DEMO2026") {
      return {
        ok: true,
        name: "Preview Participant",
        sessionToken: "demo-session",
      };
    }
    if (
      payload.action === "recordResponse" &&
      payload.sessionToken === "demo-session"
    ) {
      return { ok: true };
    }
    return { ok: false, error: "The PIN is not recognised." };
  }

  if (!RESPONSE_ENDPOINT) {
    return {
      ok: false,
      error: "The invitation service is being prepared. Please try again later.",
    };
  }

  const response = await fetch(RESPONSE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify(payload),
  });

  if (!response.ok) throw new Error("Unable to reach invitation service");
  return response.json();
}

async function verifyPin(event) {
  event.preventDefault();
  const pin = normalisePin(pinInput.value);
  pinInput.value = pin;
  pinError.hidden = true;

  if (!pin) {
    pinError.textContent = "Please enter the PIN from your invitation email.";
    pinError.hidden = false;
    return;
  }

  verifyButton.disabled = true;
  verifyButton.textContent = "Checking PIN…";

  try {
    const result = await callInvitationService({
      action: "verifyPin",
      group: groupKey,
      pin,
    });

    if (!result.ok) {
      pinError.textContent = result.error || "The PIN is not recognised.";
      pinError.hidden = false;
      return;
    }

    sessionToken = result.sessionToken;
    participantName.textContent = result.name;
    show("identity");
  } catch {
    pinError.textContent = "We could not check your PIN. Please try again.";
    pinError.hidden = false;
  } finally {
    verifyButton.disabled = false;
    verifyButton.textContent = "Continue securely";
  }
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
  show("response");
}

async function recordDecision(decision) {
  setBusy(true);
  errorMessage.hidden = true;

  try {
    const result = await callInvitationService({
      action: "recordResponse",
      sessionToken,
      group: groupKey,
      response: decision,
    });
    if (!result.ok) throw new Error(result.error || "Unable to record response");
    displayConfirmation(decision);
  } catch {
    show("invitation");
    errorMessage.hidden = false;
  } finally {
    setBusy(false);
  }
}

pinInput.addEventListener("input", () => {
  pinInput.value = normalisePin(pinInput.value);
});
pinForm.addEventListener("submit", verifyPin);
confirmIdentity.addEventListener("click", () => show("invitation"));
rejectIdentity.addEventListener("click", () => {
  sessionToken = "";
  participantName.textContent = "";
  pinForm.reset();
  pinError.textContent =
    "Please check the PIN in your invitation email or contact the organiser.";
  pinError.hidden = false;
  show("pin");
  pinInput.focus();
});
acceptButton.addEventListener("click", () => recordDecision("accepted"));
declineButton.addEventListener("click", () => show("decline"));
cancelDecline.addEventListener("click", () => show("invitation"));
confirmDecline.addEventListener("click", () => recordDecision("declined"));
changeResponse.addEventListener("click", () => show("invitation"));

show("pin");

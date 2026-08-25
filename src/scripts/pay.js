const loadingEl = document.querySelector("[data-pay-loading]");
const formEl = document.querySelector("[data-pay-form]");
const errorStateEl = document.querySelector("[data-pay-error-state]");

function formatRand(cents) {
  const rand = (cents / 100).toFixed(2);
  const [whole, decimals] = rand.split(".");
  const withSpaces = whole.replace(/\B(?=(\d{3})+(?!\d))/g, " ");
  return `R${withSpaces}.${decimals}`;
}

function showError() {
  loadingEl.classList.add("hidden");
  formEl.classList.add("hidden");
  errorStateEl.classList.remove("hidden");
}

function showForm() {
  loadingEl.classList.add("hidden");
  errorStateEl.classList.add("hidden");
  formEl.classList.remove("hidden");
}

const params = new URLSearchParams(window.location.search);
const ref = params.get("ref");
const amountRaw = params.get("amount");
const desc = params.get("desc");
const sig = params.get("sig");

if (!ref || !amountRaw || !desc || !sig || !/^\d+$/.test(amountRaw)) {
  showError();
} else {
  document.querySelector("[data-ref]").textContent = ref;
  document.querySelector("[data-amount]").textContent = formatRand(parseInt(amountRaw, 10));
  document.querySelector("[data-desc-line]").textContent = desc;
  document.querySelector("[data-desc-breakdown]").textContent = desc;

  const checkoutBody = (mode) => JSON.stringify({ ref, amount: amountRaw, desc, sig, mode });

  fetch("/api/create-checkout.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: checkoutBody("validate"),
  })
    .then((res) => res.json().catch(() => ({ ok: false })))
    .then((data) => {
      if (data.ok) {
        showForm();
      } else {
        showError();
      }
    })
    .catch(() => showError());

  const checkbox = document.querySelector("[data-terms-checkbox]");
  const payButton = document.querySelector("[data-pay-button]");
  const errorMsg = document.querySelector("[data-pay-error]");

  checkbox.addEventListener("change", () => {
    payButton.disabled = !checkbox.checked;
  });

  function resetButton() {
    payButton.disabled = !checkbox.checked;
    payButton.textContent = "Pay securely with Yoco";
  }

  function showInlineError() {
    resetButton();
    errorMsg.textContent = "Something went wrong — please try again or contact us on WhatsApp.";
    errorMsg.classList.remove("hidden");
  }

  payButton.addEventListener("click", () => {
    payButton.disabled = true;
    payButton.textContent = "Redirecting to Yoco…";
    errorMsg.classList.add("hidden");

    fetch("/api/create-checkout.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: checkoutBody("checkout"),
    })
      .then((res) => res.json().catch(() => ({ ok: false })))
      .then((data) => {
        if (data.ok && data.redirectUrl) {
          window.location.href = data.redirectUrl;
        } else {
          showInlineError();
        }
      })
      .catch(showInlineError);
  });
}

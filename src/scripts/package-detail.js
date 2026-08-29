/**
 * Package detail page: the "pick any two" experience cap, the live pricing
 * summary, and the WhatsApp request form. All three pages (well, four) share
 * this one script — everything package-specific comes from the #package-data
 * JSON blob the Astro template embeds per page.
 */
(function () {
  const dataEl = document.getElementById("package-data");
  if (!dataEl) return;
  const data = JSON.parse(dataEl.textContent);

  const fmt = (n) => new Intl.NumberFormat("en-ZA", { maximumFractionDigits: 0 }).format(n);

  // ---- "Pick any two" cap: selecting a third replaces the oldest pick ----
  const checkboxes = Array.from(document.querySelectorAll('input[name="experiences"]'));
  const countEl = document.querySelector("[data-picker-count]");
  let selectionOrder = [];

  function updateCount() {
    const checked = checkboxes.filter((c) => c.checked).length;
    if (countEl) countEl.textContent = `${checked} of 2 selected`;
  }

  checkboxes.forEach((checkbox) => {
    checkbox.addEventListener("change", () => {
      if (checkbox.checked) {
        selectionOrder.push(checkbox);
        if (selectionOrder.length > 2) {
          const oldest = selectionOrder.shift();
          oldest.checked = false;
        }
      } else {
        selectionOrder = selectionOrder.filter((c) => c !== checkbox);
      }
      updateCount();
      clearError("experiences");
      recalculate();
    });
  });
  updateCount();

  // ---- Live pricing summary ----
  const originSelect = document.getElementById("pkg-origin");
  const travellersSelect = document.getElementById("pkg-travellers");
  const summaryOrigin = document.querySelector("[data-summary-origin]");
  const summaryTravellers = document.querySelector("[data-summary-travellers]");
  const summaryTotal = document.querySelector("[data-summary-total]");
  const summaryDeposit = document.querySelector("[data-summary-deposit]");

  // The top instalment tier's deposit fraction is used unconditionally — the
  // form collects a preferred month, not a firm travel date, so there isn't
  // a reliable days-before-departure figure to pick a different tier by.
  const topTier = data.instalmentTiers[0];

  // Base price covers the first 2 travellers (a couple). Each individual
  // added beyond that is charged at half the couple price, less 10% — so
  // groups aren't just couple-multiples, and growing the group is rewarded.
  function priceForCount(basePrice, count) {
    const extra = Math.max(0, count - 2);
    const perPerson = (basePrice / 2) * 0.9;
    return basePrice + extra * perPerson;
  }

  function currentPricing() {
    const originId = originSelect.value;
    const travellerId = travellersSelect.value;
    const origin = data.origins.find((o) => o.id === originId);
    const traveller = data.travellerOptions.find((t) => t.id === travellerId);
    const basePrice = originId ? data.pricePerCoupleByOrigin[originId] : undefined;

    let total = null;
    if (basePrice !== undefined && traveller && traveller.count !== null) {
      total = Math.round(priceForCount(basePrice, traveller.count));
    }

    return { origin, traveller, total };
  }

  function recalculate() {
    const { origin, traveller, total } = currentPricing();

    if (summaryOrigin) summaryOrigin.textContent = origin ? origin.label : "Choose an origin";
    if (summaryTravellers) summaryTravellers.textContent = traveller ? traveller.label : "Choose travellers";

    if (total !== null) {
      const deposit = Math.round(total * topTier.depositFraction);
      if (summaryTotal) summaryTotal.textContent = `R${fmt(total)}`;
      if (summaryDeposit) summaryDeposit.textContent = `R${fmt(deposit)} (${Math.round(topTier.depositFraction * 100)}%)`;
    } else {
      const travellerChosen = travellersSelect.value !== "";
      const placeholder = travellerChosen && traveller?.count === null ? "We'll quote you" : "—";
      if (summaryTotal) summaryTotal.textContent = placeholder;
      if (summaryDeposit) summaryDeposit.textContent = placeholder;
    }
  }

  originSelect.addEventListener("change", recalculate);
  travellersSelect.addEventListener("change", recalculate);
  recalculate();

  // ---- Phone validation/normalisation ----
  // Accepts 0XXXXXXXXX or +27XXXXXXXXX / 27XXXXXXXXX, normalises to 27XXXXXXXXX.
  function normalisePhone(raw) {
    const digits = raw.replace(/[\s()-]/g, "");
    let match = digits.match(/^0(\d{9})$/);
    if (match) return `27${match[1]}`;
    match = digits.match(/^\+?27(\d{9})$/);
    if (match) return `27${match[1]}`;
    return null;
  }

  // ---- Form validation + WhatsApp submit ----
  const form = document.getElementById("package-request-form");

  function showError(field) {
    const el = document.querySelector(`[data-error-for="${field}"]`);
    if (el) el.classList.remove("hidden");
  }
  function clearError(field) {
    const el = document.querySelector(`[data-error-for="${field}"]`);
    if (el) el.classList.add("hidden");
  }

  form.addEventListener("submit", (event) => {
    event.preventDefault();

    const name = form.elements.name.value.trim();
    const phoneRaw = form.elements.phone.value.trim();
    const email = form.elements.email.value.trim();
    const originId = form.elements.origin.value;
    const travellerId = form.elements.travellers.value;
    const month = form.elements.month.value;
    const notes = form.elements.notes.value.trim();
    const selectedExperiences = Array.from(form.elements.experiences || [])
      .filter((c) => c.checked)
      .map((c) => c.getAttribute("data-experience-name"));

    ["name", "phone", "origin", "travellers", "month", "experiences"].forEach(clearError);

    let valid = true;
    const normalisedPhone = normalisePhone(phoneRaw);

    if (name === "") {
      showError("name");
      valid = false;
    }
    if (!normalisedPhone) {
      showError("phone");
      valid = false;
    }
    if (originId === "") {
      showError("origin");
      valid = false;
    }
    if (travellerId === "") {
      showError("travellers");
      valid = false;
    }
    if (month === "") {
      showError("month");
      valid = false;
    }
    if (selectedExperiences.length !== 2) {
      showError("experiences");
      valid = false;
    }

    if (!valid) return;

    const origin = data.origins.find((o) => o.id === originId);
    const traveller = data.travellerOptions.find((t) => t.id === travellerId);
    const { total } = currentPricing();
    const deposit = total !== null ? Math.round(total * topTier.depositFraction) : null;
    const monthLabel = form.elements.month.selectedOptions[0]?.textContent ?? month;

    const totalText = total !== null ? fmt(total) : "To be quoted";
    const depositText = deposit !== null ? fmt(deposit) : "To be quoted";

    const message = [
      "New package request — Ulendo Tours",
      `Package: ${data.packageName}, ${data.nights} nights`,
      `Departing: ${origin.label}`,
      `Travellers: ${traveller.label}`,
      `Preferred month: ${monthLabel}`,
      "Experiences:",
      `1. ${selectedExperiences[0]}`,
      `2. ${selectedExperiences[1]}`,
      `Name: ${name}`,
      `WhatsApp: ${normalisedPhone}`,
      `Email: ${email || "—"}`,
      `Quoted total: R${totalText}`,
      `Deposit: R${depositText}`,
      `Notes: ${notes || "—"}`,
    ].join("\n");

    const url = `https://wa.me/${data.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener");
  });
})();

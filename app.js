(function () {
  const form = document.getElementById("rsvp-form");
  const f = form.elements; // note: form.name would be the form's own name attribute
  const panels = [...form.querySelectorAll("[data-panel]")];
  const dots = [...document.querySelectorAll("[data-step-dot]")];
  const card = document.querySelector(".card");
  let current = 1;
  let submitted = false;

  const attending = () => form.querySelector('input[name="attending"]:checked')?.value;

  // ---------- navigation ----------
  function show(step, { scroll = true, focus = true } = {}) {
    current = step;
    panels.forEach((p) => (p.hidden = Number(p.dataset.panel) !== step));
    dots.forEach((d) => {
      const n = Number(d.dataset.stepDot);
      d.classList.toggle("is-active", n === step);
      d.classList.toggle("is-done", n < step);
      if (n === step) d.setAttribute("aria-current", "step");
      else d.removeAttribute("aria-current");
    });
    // Guests who decline skip the additional details step.
    dots[2].style.opacity = attending() === "No" ? ".45" : "";
    if (scroll && card.getBoundingClientRect().top < 0) {
      card.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    const focusTarget = panels[step - 1].querySelector("input:not([type=radio]):not(.hp), textarea");
    if (focus && focusTarget) focusTarget.focus({ preventScroll: true });
  }

  // ---------- validation ----------
  function setError(key, msg) {
    const el = form.querySelector(`[data-error="${key}"]`);
    if (el) el.textContent = msg || "";
    const field = el?.closest(".field");
    if (field) field.classList.toggle("has-error", !!msg);
  }

  function validateDetails() {
    const name = f.name.value.trim();
    const email = f.email.value.trim();
    const phone = f.phone.value.replace(/[^\d]/g, "");
    let ok = true;
    if (name.length < 2) { setError("name", "Please enter your full name."); ok = false; } else setError("name");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { setError("email", "Please enter a valid email address."); ok = false; } else setError("email");
    if (phone.length < 6 || phone.length > 15) { setError("phone", "Please enter a valid phone number."); ok = false; } else setError("phone");
    if (!ok) form.querySelector(".has-error input")?.focus();
    return ok;
  }

  // ---------- submit ----------
  // `button` is the Next button on step 3, or null when a guest declines on step 2.
  async function submit(button) {
    if (submitted) return show(4);
    const cfg = window.RSVP_CONFIG || {};
    const data = {
      attending: attending(),
      name: f.name.value.trim(),
      email: f.email.value.trim(),
      phone: `${f.country.value} ${f.phone.value.trim()}`,
      allergies: attending() === "Yes" ? f.allergies.value.trim() : "",
      requests: attending() === "Yes" ? f.requests.value.trim() : "",
      website: f.website.value, // honeypot
      userAgent: navigator.userAgent,
    };

    const errorKey = button ? "submit" : "attending";
    const choices = [...form.querySelectorAll('input[name="attending"]')];
    setError(errorKey);
    const label = button?.innerHTML;
    if (button) { button.disabled = true; button.textContent = "Sending…"; }
    else { choices.forEach((c) => (c.disabled = true)); setError("attending", "Sending…"); }

    try {
      if (!cfg.scriptUrl) {
        console.warn("[RSVP] No scriptUrl set in config.js — demo mode, response not saved:", data);
        await new Promise((r) => setTimeout(r, 600));
      } else {
        // URL-encoded body keeps this a "simple" request, so no CORS preflight is needed.
        const res = await fetch(cfg.scriptUrl, { method: "POST", body: new URLSearchParams(data) });
        const json = await res.json().catch(() => ({}));
        if (!res.ok || json.result !== "success") throw new Error(json.error || `HTTP ${res.status}`);
      }
      submitted = true;
      form.querySelector("[data-thanks-yes]").hidden = data.attending !== "Yes";
      form.querySelector("[data-thanks-no]").hidden = data.attending === "Yes";
      show(4);
    } catch (err) {
      console.error("[RSVP] submit failed", err);
      const msg = "Sorry, something went wrong sending your RSVP. Please try again in a moment.";
      setError(errorKey, msg);
    } finally {
      if (button) { button.disabled = false; button.innerHTML = label; }
      else choices.forEach((c) => (c.disabled = false));
    }
  }

  // ---------- events ----------
  // "click" (not "change") so re-picking the same answer after going back still advances
  form.addEventListener("click", (e) => {
    if (e.target.name === "attending" && !e.target.disabled) {
      setError("attending");
      // Declining submits straight away; accepting continues to additional details.
      const choice = e.target.value;
      setTimeout(() => (choice === "Yes" ? show(3) : submit(null)), 280);
    }
  });

  form.addEventListener("click", (e) => {
    const next = e.target.closest("[data-next]");
    const back = e.target.closest("[data-back]");
    if (back) {
      show(current - 1);
    }
    if (next) {
      if (current === 1) {
        if (!validateDetails()) return;
        return show(2);
      }
      if (current === 3) return submit(next);
    }
  });

  // Enter key in a text field moves forward instead of submitting the form
  form.addEventListener("keydown", (e) => {
    if (e.key === "Enter" && e.target.tagName === "INPUT") {
      e.preventDefault();
      panels[current - 1].querySelector("[data-next]")?.click();
    }
  });
  form.addEventListener("submit", (e) => e.preventDefault());

  ["name", "email", "phone"].forEach((k) =>
    f[k].addEventListener("input", () => setError(k))
  );

  // ---------- views ----------
  // The invitation is the landing page; #rsvp swaps it for the RSVP card.
  function setView() {
    const rsvp = location.hash === "#rsvp";
    document.body.classList.toggle("view-rsvp", rsvp);
    window.scrollTo({ top: 0, behavior: "instant" });
  }
  window.addEventListener("hashchange", setView);
  setView();

  show(1, { scroll: false, focus: false });
})();

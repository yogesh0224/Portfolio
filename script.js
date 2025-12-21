// script.js
(() => {
  const root = document.documentElement;

  // Theme (persisted)
  const stored = localStorage.getItem("theme");
  if (stored === "light" || stored === "dark") {
    root.setAttribute("data-theme", stored);
  } else {
    const prefersLight =
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: light)").matches;
    root.setAttribute("data-theme", prefersLight ? "light" : "dark");
  }

  document.getElementById("themeToggle")?.addEventListener("click", () => {
    const current = root.getAttribute("data-theme") || "dark";
    const next = current === "dark" ? "light" : "dark";
    root.setAttribute("data-theme", next);
    localStorage.setItem("theme", next);
  });

  // Mobile nav
  const navToggle = document.getElementById("navToggle");
  const navMenu = document.getElementById("navMenu");

  const closeMenu = () => {
    navMenu?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  };

  navToggle?.addEventListener("click", () => {
    const isOpen = navMenu?.classList.toggle("open");
    navToggle?.setAttribute("aria-expanded", isOpen ? "true" : "false");
  });

  document.addEventListener("click", (e) => {
    if (!navMenu || !navToggle) return;
    const target = e.target;
    const clickedInside = navMenu.contains(target) || navToggle.contains(target);
    if (!clickedInside) closeMenu();
  });

  navMenu?.querySelectorAll("a").forEach((a) => a.addEventListener("click", closeMenu));

  // Scroll spy (main nav)
  const navLinks = Array.from(document.querySelectorAll("[data-nav]"));
  const sections = navLinks
    .map((a) => document.querySelector(a.getAttribute("href")))
    .filter(Boolean);

  if ("IntersectionObserver" in window && sections.length) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const id = "#" + entry.target.id;
          navLinks.forEach((a) => {
            a.classList.toggle("is-active", a.getAttribute("href") === id);
          });
        });
      },
      { rootMargin: "-40% 0px -55% 0px", threshold: 0.01 }
    );
    sections.forEach((s) => io.observe(s));
  }

  // Reveal animation
  const prefersReduced =
    window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const revealEls = Array.from(document.querySelectorAll(".reveal"));
  if (!prefersReduced && "IntersectionObserver" in window && revealEls.length) {
    const r = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            r.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealEls.forEach((el) => r.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add("is-visible"));
  }

  // Year
  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  // Copy helpers
  const toast = document.getElementById("toast");
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => (toast.textContent = ""), 2200);
  };

  document.querySelectorAll("[data-copy]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const value = btn.getAttribute("data-copy") || "";
      try {
        await navigator.clipboard.writeText(value);
        showToast("Copied to clipboard.");
      } catch {
        const ta = document.createElement("textarea");
        ta.value = value;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
        showToast("Copied to clipboard.");
      }
    });
  });

  // Modals + Case study navigation
  const openModal = (dlg) => {
    if (dlg && typeof dlg.showModal === "function") dlg.showModal();
  };

  document.querySelectorAll("[data-modal]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const id = btn.getAttribute("data-modal");
      const dlg = id ? document.getElementById(id) : null;
      openModal(dlg);
      // reset nav highlight to first
      if (dlg) setupCaseNav(dlg);
    });
  });

  document.querySelectorAll("dialog.modal").forEach((dlg) => {
    dlg.querySelectorAll("[data-close]").forEach((b) => {
      b.addEventListener("click", () => dlg.close());
    });

    // Click outside dialog to close
    dlg.addEventListener("click", (e) => {
      const rect = dlg.getBoundingClientRect();
      const inDialog =
        rect.top <= e.clientY &&
        e.clientY <= rect.top + rect.height &&
        rect.left <= e.clientX &&
        e.clientX <= rect.left + rect.width;
      if (!inDialog) dlg.close();
    });
  });

  function setupCaseNav(dlg) {
    const body = dlg.querySelector("[data-case-body]");
    const navButtons = Array.from(dlg.querySelectorAll("[data-case-nav]"));
    if (!body || !navButtons.length) return;

    const targets = navButtons
      .map((b) => dlg.querySelector("#" + b.getAttribute("data-case-nav")))
      .filter(Boolean);

    // click to scroll within modal body
    navButtons.forEach((btn) => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-case-nav");
        const target = id ? dlg.querySelector("#" + id) : null;
        if (!target) return;

        body.scrollTo({
          top: target.offsetTop - 8,
          behavior: "smooth",
        });
      });
    });

    // observer to highlight current section (inside modal)
    if (!("IntersectionObserver" in window)) return;

    const clearActive = () => navButtons.forEach((b) => b.classList.remove("is-active"));
    clearActive();
    navButtons[0]?.classList.add("is-active");

    const io = new IntersectionObserver(
      (entries) => {
        // pick the most visible intersecting section
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];

        if (!visible) return;

        const id = visible.target.id;
        const btn = navButtons.find((b) => b.getAttribute("data-case-nav") === id);
        if (!btn) return;

        clearActive();
        btn.classList.add("is-active");
      },
      {
        root: body,
        threshold: [0.2, 0.35, 0.5, 0.65],
        rootMargin: "-10% 0px -70% 0px",
      }
    );

    targets.forEach((t) => io.observe(t));

    // cleanup when modal closes
    dlg.addEventListener(
      "close",
      () => {
        try { io.disconnect(); } catch {}
      },
      { once: true }
    );
  }
})();

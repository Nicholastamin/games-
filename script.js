
"use strict";

document.addEventListener("DOMContentLoaded", () => {
  const $ = (selector, root = document) =>
    root.querySelector(selector);

  const $$ = (selector, root = document) =>
    [...root.querySelectorAll(selector)];

  const menuToggle = $("#menu-toggle");
  const navLinks = $(".nav-links");
  const searchToggle = $("#search-toggle");
  const searchPanel = $("#search-panel");
  const searchInput = $("#game-search");

  const filterButtons = $$(".filter-chip");
  const gameCards = $$(".game-card");
  const gameCount = $("#game-count");
  const emptyState = $("#empty-state");
  const gameGrid = $("#game-grid");

  const modal = $("#game-modal");
  const modalTitle = $("#modal-title");
  const modalDescription = $("#modal-description");
  const modalClose = $("#modal-close");
  const modalOkay = $("#modal-ok");

  let activeCategory = "all";
  let lastFocusedElement = null;

  const gameDescriptions = {
    "sky-islands": {
      title: "Sky Islands",
      description:
        "Jelajahi pulau terapung, temukan rahasia, dan hadapi tantangan di langit."
    },
    "neon-rush": {
      title: "Neon Rush",
      description:
        "Bersiaplah untuk balapan berkecepatan tinggi di dunia futuristik."
    },
    "cube-combat": {
      title: "Cube Combat",
      description:
        "Masuki arena dan bersiaplah menghadapi tantangan aksi."
    },
    "mind-blocks": {
      title: "Mind Blocks",
      description:
        "Asah logika dengan menyelesaikan tantangan puzzle."
    },
    "cosmic-explorer": {
      title: "Cosmic Explorer",
      description:
        "Mulai perjalanan menjelajahi planet dan ruang angkasa."
    },
    "street-rush": {
      title: "Street Rush",
      description:
        "Hindari rintangan, kumpulkan poin, dan raih skor terbaik."
    }
  };

  // Mobile navigation
  function closeMenu() {
    navLinks.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    menuToggle.setAttribute("aria-label", "Buka menu");
  }

  menuToggle.addEventListener("click", () => {
    const isOpen = navLinks.classList.toggle("open");

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
      "aria-label",
      isOpen ? "Tutup menu" : "Buka menu"
    );
  });

  $$(".nav-link").forEach((link) => {
    link.addEventListener("click", () => {
      closeMenu();

      $$(".nav-link").forEach((item) => {
        item.classList.toggle("active", item === link);
      });
    });
  });

  document.addEventListener("click", (event) => {
    if (
      navLinks.classList.contains("open") &&
      !navLinks.contains(event.target) &&
      !menuToggle.contains(event.target)
    ) {
      closeMenu();
    }
  });

  // Search panel
  function openSearch() {
    searchPanel.hidden = false;
    searchToggle.setAttribute("aria-expanded", "true");
    searchInput.focus();
  }

  function closeSearch() {
    searchPanel.hidden = true;
    searchToggle.setAttribute("aria-expanded", "false");
  }

  searchToggle.setAttribute("aria-expanded", "false");

  searchToggle.addEventListener("click", () => {
    if (searchPanel.hidden) {
      openSearch();
    } else {
      closeSearch();
    }
  });

  // Category filters + search
  function updateGames() {
    const query = searchInput.value
      .trim()
      .toLocaleLowerCase("id-ID");

    let visibleCount = 0;

    gameCards.forEach((card) => {
      const category = card.dataset.category || "";
      const searchText = [
        card.dataset.search || "",
        card.querySelector("h3")?.textContent || "",
        card.querySelector(".game-info p")?.textContent || ""
      ].join(" ").toLocaleLowerCase("id-ID");

      const matchesCategory =
        activeCategory === "all" ||
        category === activeCategory;

      const matchesSearch = searchText.includes(query);
      const visible = matchesCategory && matchesSearch;

      card.hidden = !visible;

      if (visible) {
        visibleCount++;
      }
    });

    gameCount.textContent =
      `${String(visibleCount).padStart(2, "0")} GAME`;

    emptyState.hidden = visibleCount !== 0;
    gameGrid.hidden = visibleCount === 0;
  }

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      activeCategory = button.dataset.category || "all";

      filterButtons.forEach((item) => {
        const isActive = item === button;

        item.classList.toggle("active", isActive);
        item.setAttribute("aria-pressed", String(isActive));
      });

      updateGames();
    });

    button.setAttribute(
      "aria-pressed",
      String(button.classList.contains("active"))
    );
  });

  searchInput.addEventListener("input", updateGames);

  // Game information modal
  function openGameModal(gameId) {
    const game = gameDescriptions[gameId];

    if (!game) return;

    lastFocusedElement = document.activeElement;

    modalTitle.textContent = game.title;
    modalDescription.textContent = game.description;

    modal.hidden = false;
    document.body.classList.add("modal-open");

    modalClose.focus();
  }

  function closeGameModal() {
    modal.hidden = true;
    document.body.classList.remove("modal-open");

    if (lastFocusedElement instanceof HTMLElement) {
      lastFocusedElement.focus();
    }
  }


  // Game card clicks
  $$("[data-game]").forEach((link) => {
    link.addEventListener("click", (event) => {
      event.preventDefault();
      openGameModal(link.dataset.game);
    });
  });


  modalClose.addEventListener("click", closeGameModal);
  modalOkay.addEventListener("click", closeGameModal);

  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      closeGameModal();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      if (!modal.hidden) {
        closeGameModal();
      }

      if (!searchPanel.hidden) {
        closeSearch();
        searchToggle.focus();
      }

      closeMenu();
    }

    // Basic keyboard focus containment for the modal.
    if (!modal.hidden && event.key === "Tab") {
      const focusable = $$(
        "button:not([disabled]), a[href], input:not([disabled])",
        modal
      ).filter((element) => element.offsetParent !== null);

      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (
        !event.shiftKey &&
        document.activeElement === last
      ) {
        event.preventDefault();
        first.focus();
      }
    }
  });

  // Close mobile navigation on resize to desktop.
  window.addEventListener("resize", () => {
    if (window.innerWidth > 760) {
      closeMenu();
    }
  });

  // Footer year.
  $("#current-year").textContent = new Date().getFullYear();

  // Initial state.
  updateGames();
});

const PAGE_SIZE = 8;

function normalize(value) {
  return (value || "").toString().trim().toLowerCase();
}

export function initWorkArchive() {
  const grid = document.getElementById("work-grid");
  if (!grid) return;

  const cards = [...grid.querySelectorAll(".work-card")];
  const filterContainer = document.getElementById("work-filters");
  const searchInput = document.getElementById("work-search");
  const countEl = document.getElementById("work-count");
  const emptyEl = document.getElementById("work-empty");
  const prevBtn = document.getElementById("work-prev");
  const nextBtn = document.getElementById("work-next");
  const pagesEl = document.getElementById("work-pages");

  const state = {
    filter: "all",
    query: "",
    page: 1
  };

  let filteredCards = cards;

  function matches(card) {
    const category = normalize(card.dataset.category);
    const client = normalize(card.dataset.client);
    const type = normalize(card.dataset.type);

    const filterMatch = state.filter === "all" || category === state.filter;
    if (!filterMatch) return false;

    if (!state.query) return true;

    const haystack = `${client} ${type} ${normalize(card.textContent)}`;
    return haystack.includes(state.query);
  }

  function setFilterButtonState() {
    if (!filterContainer) return;
    const buttons = [...filterContainer.querySelectorAll("button[data-filter]")];
    buttons.forEach((btn) => {
      const active = normalize(btn.dataset.filter) === state.filter;
      btn.classList.toggle("bg-black", active);
      btn.classList.toggle("text-white", active);
      btn.classList.toggle("bg-transparent", !active);
      btn.classList.toggle("text-black", !active);
    });
  }

  function renderPagination(totalPages) {
    if (!pagesEl) return;
    pagesEl.innerHTML = "";

    for (let i = 1; i <= totalPages; i += 1) {
      const button = document.createElement("button");
      button.type = "button";
      button.textContent = String(i);
      button.className =
        "size-10 flex items-center justify-center font-bold border border-black transition-colors" +
        (i === state.page
          ? " bg-black text-white hover:bg-primary hover:border-primary"
          : " bg-transparent text-black hover:bg-black hover:text-white");

      button.addEventListener("click", () => {
        state.page = i;
        render();
      });

      pagesEl.appendChild(button);
    }
  }

  function renderCards() {
    filteredCards.forEach((card, index) => {
      const start = (state.page - 1) * PAGE_SIZE;
      const end = state.page * PAGE_SIZE;
      const visible = index >= start && index < end;
      card.classList.toggle("hidden", !visible);
    });
  }

  function render() {
    filteredCards = cards.filter(matches);

    const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
    state.page = Math.min(state.page, totalPages);

    renderCards();
    renderPagination(totalPages);
    setFilterButtonState();

    if (countEl) countEl.textContent = String(filteredCards.length);
    if (emptyEl) emptyEl.classList.toggle("hidden", filteredCards.length !== 0);

    if (prevBtn) prevBtn.disabled = state.page <= 1;
    if (nextBtn) nextBtn.disabled = state.page >= totalPages;
  }

  filterContainer?.addEventListener("click", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLElement)) return;

    const button = target.closest("button[data-filter]");
    if (!button) return;

    const nextFilter = normalize(button.dataset.filter);
    if (!nextFilter || nextFilter === state.filter) return;

    state.filter = nextFilter;
    state.page = 1;
    render();
  });

  let searchDebounce;
  searchInput?.addEventListener("input", (event) => {
    const target = event.target;
    if (!(target instanceof HTMLInputElement)) return;

    clearTimeout(searchDebounce);
    searchDebounce = setTimeout(() => {
      state.query = normalize(target.value);
      state.page = 1;
      render();
    }, 120);
  });

  prevBtn?.addEventListener("click", () => {
    if (state.page <= 1) return;
    state.page -= 1;
    render();
  });

  nextBtn?.addEventListener("click", () => {
    const totalPages = Math.max(1, Math.ceil(filteredCards.length / PAGE_SIZE));
    if (state.page >= totalPages) return;
    state.page += 1;
    render();
  });

  render();
}

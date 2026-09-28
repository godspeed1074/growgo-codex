// Friends and Players Met use the Leaders visual system, but never the current
// player's mutable stats/snapshot. Profiles come from read-only social services.
const escape = value => String(value ?? "").replaceAll("&", "&amp;").replaceAll("<", "&lt;")
  .replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#39;");

export function openFriendsView({ loadFriends, loadProfile, resolveAvatar, onPlayersMet, onClose, mode = "friends", addFriend }) {
  const metMode = mode === "met";
  const listName = metMode ? "Players Met" : "Friends";
  const personWord = metMode ? "player" : "friend";
  const headingId = metMode ? "playersMetHeading" : "friendsHeading";
  const returnFocus = document.activeElement;
  const overlay = document.createElement("div");
  overlay.id = metMode ? "playersMetOverlay" : "friendsOverlay";
  overlay.className = "social-party-overlay gg-friends-overlay";
  overlay.innerHTML = `
    <section class="gg-friends-screen gg-standard-screen" role="dialog" aria-modal="true" aria-labelledby="${headingId}">
      <header class="gg-standard-screen-header">
        <div><span class="gg-standard-screen-kicker">Your GrowGo community</span><h2 id="${headingId}">${listName.toUpperCase()}</h2></div>
        <button class="gg-friends-close" type="button" aria-label="Close ${listName.toLowerCase()}">×</button>
      </header>
      <div class="gg-friends-list-view">
        <p class="submenu-intro">${metMode ? "Players you’ve met. Tap a player to view their stats or add a friend." : "Tap a friend to view their stats."}</p>
        <div class="gg-friends-scroll"><div class="leaderboard-list gg-friends-list" aria-live="polite"><p role="status">Loading ${listName.toLowerCase()}…</p></div></div>
        <button class="gg-friends-met" type="button">${metMode ? "Meet Player" : "Players Met"}</button>
      </div>
      <div class="gg-friend-profile-view" hidden>
        <button class="gg-friends-back" type="button">‹ ${listName}</button>
        <div class="gg-friend-profile-body" aria-live="polite"></div>
      </div>
    </section>`;
  document.body.appendChild(overlay);
  const listView = overlay.querySelector(".gg-friends-list-view");
  const profileView = overlay.querySelector(".gg-friend-profile-view");
  const list = overlay.querySelector(".gg-friends-list");
  const body = overlay.querySelector(".gg-friend-profile-body");
  const heading = overlay.querySelector("h2");
  const closeButton = overlay.querySelector(".gg-friends-close");
  let friends = [], selected = null, profile = null, tab = "lifetime", requestVersion = 0;
  let alive = true;
  const profileCache = new Map();
  const pendingFriends = new Set();
  const friendErrors = new Map();
  const avatarResolutions = new Map();
  const avatar = name => `<div class="leader-avatar gg-friend-avatar" aria-label="${escape(name)} profile picture"><span aria-hidden="true">${escape((name || "?").trim().slice(0, 1).toUpperCase())}</span></div>`;

  async function fillAvatar(container, person) {
    if (!person.avatarUrl || !container) return;
    const original = String(person.avatarUrl).trim();
    let resolving = avatarResolutions.get(original);
    if (!resolving) {
      resolving = Promise.resolve().then(() => resolveAvatar?.(original)).catch(() => null);
      avatarResolutions.set(original, resolving);
      void resolving.then(url => { if (!url) avatarResolutions.delete(original); });
    }
    const resolved = await resolving;
    // Authenticated Storage URLs first. A saved public/download URL can still
    // work if SDK resolution fails (including non-Firebase profile images).
    const candidates = [...new Set([resolved, original])]
      .filter(url => typeof url === "string" && /^(https?:|blob:|data:image\/)/i.test(url));
    for (const url of candidates) {
      if (!alive || !container.isConnected) return;
      const loaded = await new Promise(resolve => {
        const img = new Image();
        img.alt = `${person.name} profile picture`;
        img.onload = () => {
          if (alive && container.isConnected) container.replaceChildren(img);
          resolve(true);
        };
        img.onerror = () => resolve(false);
        img.src = url;
      });
      if (loaded) return;
    }
  }

  function renderList() {
    list.innerHTML = friends.length ? friends.map((friend, index) => `
      <button type="button" class="leader-card gg-friend-row" data-friend-index="${index}" aria-label="View ${escape(friend.name)} stats">
        ${avatar(friend.name)}<span class="leader-info"><strong>${escape(friend.name)}</strong><span>${metMode && friend.isFriend ? "Friends · View stats" : "View stats"}</span></span>
        <span class="gg-friend-chevron" aria-hidden="true">›</span>
      </button>`).join("") : `<p class="gg-friends-notice">${metMode ? "No players met yet. Tap Meet Player to open the camera and scan another player’s QR code." : "No friends yet. Meet a player, then add them from Players Met."}</p>`;
    friends.forEach((friend, index) => void fillAvatar(list.querySelector(`[data-friend-index="${index}"] .leader-avatar`), friend));
  }

  async function refreshList() {
    list.innerHTML = `<p role="status">Loading ${listName.toLowerCase()}…</p>`;
    try {
      const result = await loadFriends();
      if (!Array.isArray(result)) throw Error("Friends unavailable");
      if (!alive) return;
      friends = result.filter(friend => friend && typeof friend.id === "string" && typeof friend.name === "string")
        .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
      renderList();
    } catch {
      if (alive) list.innerHTML = `<p class="gg-friends-notice" role="alert">${listName} could not be loaded. Your list has not been removed.</p><button type="button" class="gg-friends-retry" data-retry-list>Try again</button>`;
    }
  }

  function back() {
    if (!profileView.hidden) {
      requestVersion++;
      profileView.hidden = true;
      listView.hidden = false;
      heading.textContent = listName.toUpperCase();
      closeButton.setAttribute("aria-label", `Close ${listName.toLowerCase()}`);
      list.querySelector(`[data-friend-index="${friends.indexOf(selected)}"]`)?.focus({ preventScroll: true });
      return;
    }
    close();
  }

  function close() {
    if (!alive) return;
    alive = false;
    requestVersion++;
    overlay.remove();
    returnFocus?.focus?.({ preventScroll: true });
    onClose?.();
  }

  function stat(label, value, icon) {
    const text = Number.isSafeInteger(value) && value >= 0 ? value.toLocaleString() : "—";
    return `<div class="stat-card"><div class="stat-icon stat-icon--${icon}" aria-hidden="true"></div><div class="stat-label">${label}</div><div class="stat-value">${text}</div></div>`;
  }

  function renderStats() {
    if (!profile) return;
    const hadBodyFocus = body.contains(document.activeElement);
    const focusedTab = document.activeElement?.dataset?.friendTab;
    let rows = "", note = "";
    if (tab === "today") {
      rows = stat("Points today", profile.stats?.today?.points, "points");
      note = "Daily reset: 00:00 UTC. Other daily stats are not shared by the server yet. — means unavailable, not zero.";
    } else if (tab === "lifetime") {
      rows = stat("Total XP", profile.stats?.lifetime?.xp, "points")
        + stat("Achievement points", profile.stats?.lifetime?.achievementPoints, "personal-best")
        + stat("Crafting level", profile.craftingLevel, "crafted")
        + stat("Crafting XP", profile.stats?.lifetime?.craftingXp, "crafted");
      note = "Shared server stats. Detailed capture, resource and coin-earned totals are not shared yet. — means unavailable, not zero.";
    } else {
      note = "This player's personal bests are saved on their device and are not available to other players yet.";
    }
    body.innerHTML = `<div class="gg-friend-profile-hero">${avatar(profile.name)}<div><h3>${escape(profile.name)}</h3><p>Level ${escape(profile.level)}</p></div></div>
      ${metMode ? `<div class="gg-met-friend-action"><button class="gg-friends-met" data-add-met-friend type="button" ${selected?.isFriend || pendingFriends.has(selected?.id) ? "disabled" : ""}>${selected?.isFriend ? "✓ Friends" : pendingFriends.has(selected?.id) ? "Adding…" : "Add Friend"}</button><p class="gg-friends-notice" ${friendErrors.has(selected?.id) ? 'role="alert"' : 'role="status"'}>${friendErrors.has(selected?.id) ? "Could not add this player. Please try again when connected." : selected?.isFriend ? "This player is on your friends list." : ""}</p></div>` : ""}
      <div class="stats-tabs" role="tablist" aria-label="${metMode ? "Player" : "Friend"} stats">
        ${[["today", "Today"], ["lifetime", "Lifetime"], ["best", "Personal Best"]].map(([key, title]) => `<button class="tab ${tab === key ? "active" : ""}" type="button" role="tab" aria-selected="${tab === key}" data-friend-tab="${key}">${title}</button>`).join("")}
      </div><div class="gg-friend-stats-grid">${rows}</div><p class="gg-friends-notice">${note}</p>`;
    void fillAvatar(body.querySelector(".leader-avatar"), profile);
    // Replacing Add Friend with a pending/confirmed state must not drop keyboard
    // focus onto the map behind the dialog. Keep Escape and Tab working.
    if (hadBodyFocus) {
      const nextFocus = focusedTab ? body.querySelector(`[data-friend-tab="${focusedTab}"]`)
        : body.querySelector("[data-add-met-friend]:not(:disabled)");
      (nextFocus || profileView.querySelector(".gg-friends-back"))?.focus({ preventScroll: true });
    }
  }

  async function showProfile(friend) {
    if (!friend) return;
    const version = ++requestVersion;
    selected = friend;
    profile = null;
    tab = "lifetime";
    listView.hidden = true;
    profileView.hidden = false;
    heading.textContent = "STATS";
    closeButton.setAttribute("aria-label", `Back to ${listName.toLowerCase()}`);
    body.innerHTML = `<p role="status">Loading ${escape(friend.name)}’s stats…</p>`;
    profileView.querySelector(".gg-friends-back").focus({ preventScroll: true });
    try {
      const cached = profileCache.get(friend.id);
      const day = new Date().toISOString().slice(0, 10);
      const response = cached && Date.now() - cached.at < 60_000 && cached.response.profile.todayKey === day
        ? cached.response : await loadProfile({ publicCode: friend.id });
      if (!alive || version !== requestVersion) return;
      if (!response?.ok || response.profile?.publicCode !== friend.id || !response.profile?.name || !response.profile?.stats) throw Error("Invalid friend profile");
      profileCache.set(friend.id, { response, at: Date.now() });
      profile = response.profile;
      // Refresh stale social-list names/photos from this authoritative profile.
      friend.name = profile.name;
      friend.avatarUrl = profile.avatarUrl;
      renderList();
      renderStats();
    } catch {
      if (alive && version === requestVersion) body.innerHTML = `<p role="alert" class="gg-friends-notice">This ${personWord}’s stats could not be loaded. Please try again when connected.</p><button type="button" class="gg-friends-retry" data-retry-profile>Try again</button>`;
    }
  }

  async function addSelectedFriend() {
    const person = selected;
    if (!metMode || !profile || !person || person.isFriend || pendingFriends.has(person.id)) return;
    pendingFriends.add(person.id);
    friendErrors.delete(person.id);
    renderStats();
    try {
      if (typeof addFriend !== "function") throw Error("Friends connection unavailable");
      const result = await addFriend({ publicCode: person.id });
      if (!result?.ok || result.friend?.id !== person.id) throw Error("Friendship was not confirmed");
      // Do not claim success or add a local-only friend before server confirmation.
      person.isFriend = true;
    } catch {
      friendErrors.set(person.id, true);
    } finally {
      pendingFriends.delete(person.id);
      if (alive) {
        renderList();
        if (selected === person && !profileView.hidden && profile) renderStats();
      }
    }
  }

  overlay.addEventListener("click", event => {
    event.stopPropagation();
    const target = event.target;
    if (target === overlay || target.closest(".gg-friends-close, .gg-friends-back")) return back();
    if (target.closest("[data-add-met-friend]")) { void addSelectedFriend(); return; }
    if (target.closest(".gg-friends-list-view .gg-friends-met")) { close(); onPlayersMet?.(); return; }
    const friendButton = target.closest("[data-friend-index]");
    if (friendButton) { void showProfile(friends[Number(friendButton.dataset.friendIndex)]); return; }
    const tabButton = target.closest("[data-friend-tab]");
    if (tabButton) { tab = tabButton.dataset.friendTab; renderStats(); body.querySelector(`[data-friend-tab="${tab}"]`)?.focus({ preventScroll: true }); }
    if (target.closest("[data-retry-profile]")) void showProfile(selected);
    if (target.closest("[data-retry-list]")) void refreshList();
  });
  overlay.addEventListener("keydown", event => {
    if (event.key === "Escape") { event.preventDefault(); event.stopPropagation(); back(); }
    if (event.key === "Tab") {
      const controls = [...overlay.querySelectorAll("button:not(:disabled)")].filter(el => el.getClientRects().length);
      const first = controls[0], last = controls.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
  });
  // Horizontal back gesture, without interfering with vertical list scrolling.
  let start = null;
  overlay.addEventListener("pointerdown", event => {
    start = event.isPrimary && !event.target.closest("button") ? { x: event.clientX, y: event.clientY } : null;
  });
  overlay.addEventListener("pointercancel", () => { start = null; });
  overlay.addEventListener("pointerup", event => {
    if (start && event.clientX - start.x > 70 && Math.abs(event.clientY - start.y) < 35) back();
    start = null;
  });
  closeButton.focus({ preventScroll: true });
  void refreshList();
  return { close, back };
}

export function openPlayersMetView(options) {
  return openFriendsView({ ...options, mode: "met" });
}

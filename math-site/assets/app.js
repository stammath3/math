(function () {
  "use strict";

  // Σειρά εμφάνισης. Ό,τι άλλο υπάρχει στο υλικό εμφανίζεται στο τέλος.
  var GRADE_ORDER = [
    "Όλες οι τάξεις",
    "Α' Γυμνασίου", "Β' Γυμνασίου", "Γ' Γυμνασίου",
    "Α' Λυκείου", "Β' Λυκείου", "Γ' Λυκείου"
  ];
  var TYPES = {
    "Σημειώσεις":  { cls: "t-notes", icon: "M4 4h12l4 4v12H4z M8 12h8 M8 16h6 M8 8h4" },
    "Ασκήσεις":    { cls: "t-ex",    icon: "M4 20l4-1 11-11-3-3L5 16z M14 6l3 3" },
    "Φωτοτυπίες":  { cls: "t-copy",  icon: "M7 3h10v5H7z M5 8h14v8H5z M7 14h10v7H7z" },
    "Διαγωνίσματα":{ cls: "t-test",  icon: "M9 4h6v3H9z M6 6h12v15H6z M9 13l2 2 4-4" },
    "Βίντεο":      { cls: "t-video", icon: "M3 6h13v12H3z M16 10l5-3v10l-5-3" },
    "Παιχνίδια":   { cls: "t-game",  icon: "M6 9h12a3 3 0 0 1 3 3v2a3 3 0 0 1-5 2l-1-1H9l-1 1a3 3 0 0 1-5-2v-2a3 3 0 0 1 3-3z M8 11v3 M6.5 12.5h3 M15 12h.01 M17 14h.01" }
  };
  var OTHER = { cls: "t-other", icon: "M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z M12 8v5 M12 16h.01" };
  var TYPE_ORDER = Object.keys(TYPES);
  var ALL = "Όλα";

  var state = { grade: ALL, type: ALL, q: "" };
  var items = [];

  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function norm(s) {
    // πεζά, χωρίς τόνους, ώστε «εξισωσεις» να βρίσκει «Εξισώσεις»
    return String(s || "").toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
  }
  function safeUrl(u) {
    u = String(u || "").trim();
    if (!u) return "";
    if (/^(javascript|data|vbscript):/i.test(u)) return "";
    return u;
  }
  function fmtDate(d) {
    if (!d) return "";
    var m = String(d).match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (!m) return "";
    return Number(m[3]) + "/" + Number(m[2]) + "/" + m[1];
  }
  function youtubeId(url) {
    var m = String(url || "").match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }
  function ext(path) {
    var m = String(path || "").split(/[?#]/)[0].match(/\.([a-z0-9]+)$/i);
    return m ? m[1].toLowerCase() : "";
  }
  function asList(v) {
    if (Array.isArray(v)) return v.filter(Boolean);
    return v ? [v] : [];
  }

  function icon(path) {
    return '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="' + path + '"/></svg>';
  }

  function actionsFor(it) {
    var out = [];
    var file = safeUrl(it.file);
    var link = safeUrl(it.link);
    var yt = youtubeId(link) || youtubeId(file);

    if (yt) {
      out.push('<button class="btn" data-yt="' + esc(yt) + '" data-title="' + esc(it.title) + '">▶ Δες το βίντεο</button>');
    }
    if (file && !youtubeId(file)) {
      var e = ext(file);
      var label = "Άνοιγμα";
      var dl = false;
      if (e === "pdf") label = "Άνοιγμα PDF";
      else if (["jpg", "jpeg", "png", "gif", "webp"].indexOf(e) >= 0) label = "Προβολή εικόνας";
      else if (["mp4", "webm", "mov"].indexOf(e) >= 0) label = "▶ Δες το βίντεο";
      else if (e === "html" || e === "htm") label = it.type === "Παιχνίδια" ? "▶ Παίξε" : "Άνοιγμα";
      else { label = "Λήψη αρχείου" + (e ? " (." + e + ")" : ""); dl = true; }
      out.push('<a class="btn" href="' + esc(file) + '" target="_blank" rel="noopener"' + (dl ? " download" : "") + ">" + esc(label) + "</a>");
    }
    if (link && !yt) {
      var lbl = it.type === "Παιχνίδια" ? "▶ Παίξε" : "Άνοιγμα συνδέσμου";
      out.push('<a class="btn' + (out.length ? " secondary" : "") + '" href="' + esc(link) + '" target="_blank" rel="noopener">' + lbl + "</a>");
    }
    return out.join("");
  }

  function card(it) {
    var t = TYPES[it.type] || OTHER;
    var meta = asList(it.grade).map(function (g) { return "<span>" + esc(g) + "</span>"; });
    if (it.chapter) meta.push("<span>" + esc(it.chapter) + "</span>");
    return (
      '<article class="card ' + t.cls + '">' +
        '<div class="card-top">' +
          '<span class="badge">' + icon(t.icon) + esc(it.type || "Υλικό") + "</span>" +
          '<span class="date">' + esc(fmtDate(it.date)) + "</span>" +
        "</div>" +
        "<h2>" + esc(it.title) + "</h2>" +
        (meta.length ? '<div class="meta">' + meta.join("") + "</div>" : "") +
        (it.description ? '<p class="desc">' + esc(it.description) + "</p>" : "") +
        '<div class="card-actions">' + actionsFor(it) + "</div>" +
      "</article>"
    );
  }

  function matches(it) {
    if (state.type !== ALL && it.type !== state.type) return false;
    if (state.grade !== ALL) {
      var gs = asList(it.grade);
      if (gs.indexOf(state.grade) < 0 && gs.indexOf("Όλες οι τάξεις") < 0) return false;
    }
    if (state.q) {
      var hay = norm([it.title, it.description, it.chapter, it.type, asList(it.grade).join(" ")].join(" "));
      var words = norm(state.q).split(/\s+/).filter(Boolean);
      for (var i = 0; i < words.length; i++) if (hay.indexOf(words[i]) < 0) return false;
    }
    return true;
  }

  function render() {
    var list = items.filter(matches);
    $("grid").innerHTML = list.map(card).join("");
    $("empty").hidden = list.length > 0;
    $("count").textContent = list.length === 1 ? "1 ανάρτηση" : list.length + " αναρτήσεις";
    syncChips();
    syncUrl();
  }

  function chipRow(el, values, key) {
    el.innerHTML = [ALL].concat(values).map(function (v) {
      return '<button type="button" class="chip" data-key="' + key + '" data-val="' + esc(v) + '" aria-pressed="false">' +
        esc(v === ALL ? (key === "grade" ? "Όλες" : "Όλα") : v) + "</button>";
    }).join("");
  }
  function syncChips() {
    document.querySelectorAll(".chip").forEach(function (b) {
      b.setAttribute("aria-pressed", String(state[b.dataset.key] === b.dataset.val));
    });
  }
  function ordered(present, order) {
    var known = order.filter(function (x) { return present.indexOf(x) >= 0; });
    var rest = present.filter(function (x) { return order.indexOf(x) < 0; }).sort();
    return known.concat(rest);
  }

  // Φίλτρα στο URL, ώστε να μπορεί να στείλει link π.χ. μόνο για τη Β' Γυμνασίου
  function syncUrl() {
    var p = new URLSearchParams();
    if (state.grade !== ALL) p.set("taxi", state.grade);
    if (state.type !== ALL) p.set("eidos", state.type);
    if (state.q) p.set("q", state.q);
    var s = p.toString();
    try { history.replaceState(null, "", s ? "?" + s : location.pathname); } catch (e) {}
  }
  function readUrl() {
    var p = new URLSearchParams(location.search);
    state.grade = p.get("taxi") || ALL;
    state.type = p.get("eidos") || ALL;
    state.q = p.get("q") || "";
    $("q").value = state.q;
  }

  function applySettings(s) {
    if (!s) return;
    if (s.title) { $("site-title").textContent = s.title; document.title = s.title; $("footer-text").textContent = s.title + (s.school ? " · " + s.school : ""); }
    if (s.school) $("site-school").textContent = s.school;
    if (s.welcome) $("hero-title").textContent = s.welcome;
    if (s.intro) $("hero-intro").textContent = s.intro;
    if (s.teacher) $("hero-teacher").textContent = s.teacher;
  }

  function load(url) {
    return fetch(url, { cache: "no-cache" }).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  function init() {
    readUrl();

    $("q").addEventListener("input", function (e) { state.q = e.target.value.trim(); render(); });
    document.addEventListener("click", function (e) {
      var chip = e.target.closest(".chip");
      if (chip) { state[chip.dataset.key] = chip.dataset.val; render(); return; }
      var yt = e.target.closest("[data-yt]");
      if (yt) openVideo(yt.dataset.yt, yt.dataset.title);
    });
    $("video-close").addEventListener("click", closeVideo);
    $("video-dialog").addEventListener("close", function () { $("video-iframe").src = "about:blank"; });
    $("video-dialog").addEventListener("click", function (e) { if (e.target === this) closeVideo(); });

    load("content/site.json").then(applySettings).catch(function () {});
    load("content/materials.json").then(function (data) {
      items = (data && data.items || []).filter(function (it) { return it && it.title && !it.hidden; });
      items.sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); });

      var grades = [], types = [];
      items.forEach(function (it) {
        asList(it.grade).forEach(function (g) { if (grades.indexOf(g) < 0) grades.push(g); });
        if (it.type && types.indexOf(it.type) < 0) types.push(it.type);
      });
      grades = ordered(grades, GRADE_ORDER).filter(function (g) { return g !== "Όλες οι τάξεις"; });
      chipRow($("grade-chips"), grades, "grade");
      chipRow($("type-chips"), ordered(types, TYPE_ORDER), "type");
      render();
    }).catch(function (err) {
      $("count").textContent = "Δεν φορτώθηκε το υλικό. Δοκιμάστε ξανά σε λίγο.";
      console.error(err);
    });
  }

  function openVideo(id, title) {
    $("video-title").textContent = title || "";
    $("video-iframe").src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(id) + "?autoplay=1&rel=0";
    var d = $("video-dialog");
    if (d.showModal) d.showModal(); else window.open("https://youtu.be/" + id, "_blank");
  }
  function closeVideo() { var d = $("video-dialog"); if (d.open) d.close(); }

  init();
})();

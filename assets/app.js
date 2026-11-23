(function () {
  "use strict";

  var $ = function (id) { return document.getElementById(id); };

  function esc(s) {
    return String(s == null ? "" : s).replace(/[&<>"']/g, function (c) {
      return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c];
    });
  }
  function safeUrl(u) {
    u = String(u || "").trim();
    if (/^(javascript|data|vbscript):/i.test(u)) return "";
    // Η διαχείριση γράφει «/uploads/…», αλλά το site ζει στο /math/,
    // οπότε κάνουμε τα τοπικά αρχεία σχετικά: «/uploads/x» → «uploads/x».
    if (/^\/(?!\/)/.test(u)) u = u.replace(/^\/(math\/)?/, "");
    return u;
  }
  function fmtDate(d) {
    var m = String(d || "").match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? Number(m[3]) + "/" + Number(m[2]) + "/" + m[1] : "";
  }
  function youtubeId(url) {
    var m = String(url || "").match(/(?:youtube\.com\/(?:watch\?(?:.*&)?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
    return m ? m[1] : null;
  }
  function load(name) {
    return fetch("content/" + name + ".json", { cache: "no-cache" })
      .then(function (r) { if (!r.ok) throw new Error(name); return r.json(); })
      .then(function (d) { return (d && d.items || []).filter(function (it) { return it && it.title; }); })
      .catch(function () { return []; });
  }
  function fill(el, rows, emptyText) {
    el.innerHTML = rows.length ? rows.join("") : '<li class="empty">' + emptyText + "</li>";
  }

  load("notes").then(function (items) {
    items.sort(function (a, b) { return String(b.date || "").localeCompare(String(a.date || "")); });
    fill($("notes"), items.map(function (it) {
      var f = safeUrl(it.file);
      return '<li><a class="row t-notes" href="' + esc(f) + '" target="_blank" rel="noopener">' +
        '<span class="row-title">' + esc(it.title) + "</span>" +
        '<span class="row-meta">' + esc(fmtDate(it.date)) + "</span></a></li>";
    }), "Δεν υπάρχουν ακόμα σημειώσεις.");
  });

  load("videos").then(function (items) {
    fill($("videos"), items.map(function (it) {
      var link = safeUrl(it.link), yt = youtubeId(link);
      if (yt) {
        return '<li><button class="row t-video" data-yt="' + esc(yt) + '" data-title="' + esc(it.title) + '">' +
          '<span class="row-title">' + esc(it.title) + '</span><span class="row-meta">▶ Δες το</span></button></li>';
      }
      return '<li><a class="row t-video" href="' + esc(link) + '" target="_blank" rel="noopener">' +
        '<span class="row-title">' + esc(it.title) + '</span><span class="row-meta">▶ Δες το</span></a></li>';
    }), "Δεν υπάρχουν ακόμα βίντεο.");
  });

  load("games").then(function (items) {
    fill($("games"), items.map(function (it) {
      return '<li><a class="row t-game" href="' + esc(safeUrl(it.file || it.link)) + '">' +
        '<span class="row-title">' + esc(it.title) + '</span><span class="row-meta">▶ Παίξε</span></a></li>';
    }), "Δεν υπάρχουν ακόμα παιχνίδια.");
  });

  // Βίντεο YouTube σε παράθυρο μέσα στο site
  document.addEventListener("click", function (e) {
    var b = e.target.closest("[data-yt]");
    if (!b) return;
    $("video-title").textContent = b.dataset.title || "";
    $("video-iframe").src = "https://www.youtube-nocookie.com/embed/" + encodeURIComponent(b.dataset.yt) + "?autoplay=1&rel=0";
    var d = $("video-dialog");
    if (d.showModal) d.showModal(); else window.open("https://youtu.be/" + b.dataset.yt, "_blank");
  });
  function closeVideo() { var d = $("video-dialog"); if (d.open) d.close(); }
  $("video-close").addEventListener("click", closeVideo);
  $("video-dialog").addEventListener("click", function (e) { if (e.target === this) closeVideo(); });
  $("video-dialog").addEventListener("close", function () { $("video-iframe").src = "about:blank"; });
})();

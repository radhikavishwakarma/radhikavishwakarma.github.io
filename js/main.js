(function () {
  var header = document.querySelector(".site-header");
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");

  function onScroll() {
    if (!header) return;
    header.classList.toggle("is-scrolled", window.scrollY > 8);
  }

  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });
  initMesh(document.getElementById("mesh"));

  if (!toggle || !nav) return;

  function setOpen(open) {
    nav.classList.toggle("is-open", open);
    toggle.setAttribute("aria-expanded", open ? "true" : "false");
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  }

  toggle.addEventListener("click", function () {
    setOpen(toggle.getAttribute("aria-expanded") !== "true");
  });

  nav.addEventListener("click", function (event) {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", function (event) {
    if (event.key === "Escape") setOpen(false);
  });

  window.addEventListener("resize", function () {
    if (window.innerWidth > 760) setOpen(false);
  });

  function initMesh(surface) {
    if (!surface) return;
    var ctx = surface.getContext("2d");
    if (!ctx) return;

    var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    var latBands = 16;
    var lonBands = 24;
    var verts = [];
    var edges = [];
    var row = lonBands + 1;
    var lat;
    var lon;

    for (lat = 0; lat <= latBands; lat++) {
      var theta = (lat * Math.PI) / latBands;
      for (lon = 0; lon <= lonBands; lon++) {
        var phi = (lon * 2 * Math.PI) / lonBands;
        verts.push([
          Math.sin(theta) * Math.cos(phi),
          Math.cos(theta),
          Math.sin(theta) * Math.sin(phi)
        ]);
      }
    }

    for (lat = 0; lat <= latBands; lat++) {
      for (lon = 0; lon < lonBands; lon++) {
        var i = lat * row + lon;
        edges.push([i, i + 1]);
        if (lat < latBands) edges.push([i, i + row]);
      }
    }

    var angle = 0.55;
    var frame = 0;

    function resize() {
      var rect = surface.parentElement.getBoundingClientRect();
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      surface.width = Math.max(1, Math.floor(rect.width * dpr));
      surface.height = Math.max(1, Math.floor(rect.height * dpr));
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }

    function draw() {
      var w = surface.clientWidth;
      var h = surface.clientHeight;
      if (w < 2 || h < 2) return;

      ctx.clearRect(0, 0, w, h);
      var radius = Math.min(w, h) * (w < 800 ? 0.325 : 0.28);
      var cx = w < 800 ? w * 0.62 : w * 0.68;
      var cy = h * 0.42;
      var cos = Math.cos(angle);
      var sin = Math.sin(angle);
      var tilt = 0.5;
      var cosT = Math.cos(tilt);
      var sinT = Math.sin(tilt);
      var projected = new Array(verts.length);
      var n;

      for (n = 0; n < verts.length; n++) {
        var x = verts[n][0];
        var y = verts[n][1];
        var z = verts[n][2];
        var x1 = x * cos - z * sin;
        var z1 = x * sin + z * cos;
        var y2 = y * cosT - z1 * sinT;
        var z2 = y * sinT + z1 * cosT;
        projected[n] = [cx + x1 * radius, cy + y2 * radius, z2];
      }

      for (n = 0; n < edges.length; n++) {
        var pa = projected[edges[n][0]];
        var pb = projected[edges[n][1]];
        var depth = (pa[2] + pb[2]) * 0.5;
        var alpha = 0.12 + (depth + 1) * 0.2;
        ctx.strokeStyle = depth > 0.2
          ? "rgba(0, 168, 255, " + (alpha * 0.65).toFixed(3) + ")"
          : "rgba(255, 123, 0, " + alpha.toFixed(3) + ")";
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(pa[0], pa[1]);
        ctx.lineTo(pb[0], pb[1]);
        ctx.stroke();
      }
    }

    function tick() {
      if (document.hidden) {
        frame = window.requestAnimationFrame(tick);
        return;
      }
      angle += 0.0035;
      draw();
      frame = window.requestAnimationFrame(tick);
    }

    resize();
    draw();
    if (!reduce) tick();

    window.addEventListener("resize", function () {
      resize();
      if (reduce) draw();
    });

    window.addEventListener("pagehide", function () {
      if (frame) window.cancelAnimationFrame(frame);
    });
  }
})();

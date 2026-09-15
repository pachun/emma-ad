!(function (t, e) {
  var o, n, p, r;
  e.__SV ||
    ((window.posthog = e),
    (e._i = []),
    (e.init = function (i, s, a) {
      function g(t, e) {
        var o = e.split(".");
        (2 == o.length && ((t = t[o[0]]), (e = o[1])),
          (t[e] = function () {
            t.push([e].concat(Array.prototype.slice.call(arguments, 0)));
          }));
      }
      (((p = t.createElement("script")).type = "text/javascript"),
        (p.crossOrigin = "anonymous"),
        (p.async = !0),
        (p.src =
          s.api_host.replace(".i.posthog.com", "-assets.i.posthog.com") +
          "/static/array.js"),
        (r = t.getElementsByTagName("script")[0]).parentNode.insertBefore(
          p,
          r,
        ));
      var u = e;
      for (
        void 0 !== a ? (u = e[a] = []) : (a = "posthog"),
          u.people = u.people || [],
          u.toString = function (t) {
            var e = "posthog";
            return (
              "posthog" !== a && (e += "." + a),
              t || (e += " (stub)"),
              e
            );
          },
          u.people.toString = function () {
            return u.toString(1) + ".people (stub)";
          },
          o =
            "init capture register register_once unregister opt_in_capturing opt_out_capturing has_opted_in_capturing has_opted_out_capturing identify reset set_config".split(
              " ",
            ),
          n = 0;
        n < o.length;
        n++
      )
        g(u, o[n]);
      e._i.push([i, s, a]);
    }),
    (e.__SV = 1));
})(document, window.posthog || []);

posthog.init("phc_z12ceyXTbzcxIEwVhxcX9I49mizYQKtbyiqw55B8mTI", {
  api_host: location.origin + "/ingest",
  ui_host: "https://us.posthog.com",
  persistence: "localStorage",
  person_profiles: "identified_only",
  autocapture: false,
  capture_pageview: true,
  capture_pageleave: true,
});
posthog.register({ platform: "website" });

document.addEventListener("click", function (event) {
  var tracked = event.target.closest("[data-track]");
  if (!tracked) return;
  var properties = { href: tracked.getAttribute("href") };
  Object.keys(tracked.dataset).forEach(function (key) {
    if (key !== "track" && key.startsWith("track")) {
      var property = key.slice("track".length);
      properties[property.charAt(0).toLowerCase() + property.slice(1)] =
        tracked.dataset[key];
    }
  });
  posthog.capture(tracked.dataset.track, properties);
});

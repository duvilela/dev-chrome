(() => {
  var _ = {
      2: (_) => {
        _.exports = (function () {
          return {
            _: "kex",
            t: "instagram.com",
            o: "cov",
            i: 3,
            l: "source",
            p: "lrq",
            m: "2efa04f61586458cef44441f474eee7c",
            $: "be13233562af2d229b008d2976b998b5",
            u: "*://*.instagram.com/*",
            h: "advertising_accepted",
            v: "reel",
            k: "post",
            U: "only_photo",
            S: "photo",
            P: "video",
            A: "only_video",
            T: "clips",
            I: "story",
            O: 1e3,
            R: 8e3,
            q: "dark",
            D: "policy_accepted",
            G: "blh",
            H: "u",
            V: "jpg",
            L: "mp4",
            M: "M5.888 22.5a3.46 3.46 0 0 1-1.721-.46l-.003-.002a3.451 3.451 0 0 1-1.72-2.982V4.943a3.445 3.445 0 0 1 5.163-2.987l12.226 7.059a3.444 3.444 0 0 1-.001 5.967l-12.22 7.056a3.462 3.462 0 0 1-1.724.462Z",
            B: "M15 1c-3.3 0-6 1.3-6 3v40c0 1.7 2.7 3 6 3s6-1.3 6-3V4c0-1.7-2.7-3-6-3zm18 0c-3.3 0-6 1.3-6 3v40c0 1.7 2.7 3 6 3s6-1.3 6-3V4c0-1.7-2.7-3-6-3z",
            C: "https://www.instagram.com/api/v1/users/web_profile_info/",
            F: "https://www.instagram.com/api/v1/feed/user/%userId%/",
            X: "https://www.instagram.com/api/v1/feed/timeline/",
            Y: "https://www.instagram.com/api/v1/media/%postId%/info/",
            j: "https://www.instagram.com/api/v1/feed/collection/%collection_id%/posts/",
            K: "https://www.instagram.com/graphql/query/",
            N: "https://instagram.com",
            Z: "https://www.instagram.com/p/%shortcode%/",
            J: "https://www.instagram.com/api/v1/feed/reels_media/",
            W: "https://www.instagram.com/api/v1/clips/user/",
            __: "https://www.instagram.com/api/v1/collections/list/",
            t_: "https://www.instagram.com/api/v1/feed/saved/posts/",
            e_: "adh",
          };
        })();
      },
      8: (_) => {
        _.exports = (function () {
          return {
            o_: (_) =>
              Promise.all([
                chrome.storage.sync.get(_),
                chrome.storage.local.get(_),
              ]).then((t) => !!t.find((t) => t[_])),
            a_: (_, t) =>
              Promise.all([
                chrome.storage.sync.set({ [_]: t }),
                chrome.storage.local.set({ [_]: t }),
              ]),
          };
        })();
      },
    },
    t = {};
  function e(o) {
    var a = t[o];
    if (void 0 !== a) return a.exports;
    var s = (t[o] = { exports: {} });
    return (_[o](s, s.exports, e), s.exports);
  }
  const o = e(2),
    a = e(8);
  let s = {
    s_: function () {
      (s.r_(), s.i_(), s.c_());
    },
    i_: function () {
      const el = document.querySelector('[data-title="promo"]');
      if (el) {
        a.o_(o.h).then((_) => {
          _ && el.classList.add("checked");
        });
      }
    },
    r_: function () {
      document.querySelectorAll("[data-lang]").forEach(function (_) {
        _.textContent = chrome.i18n.getMessage(_.dataset.lang);
      });
    },
    c_() {
      document
        .querySelectorAll('[data-title="promo"], [data-title="promo_msg"] ')
        .forEach((_) => {
          _.addEventListener("click", (_) => {
            _.target.classList.toggle("checked");
          });
        });
      const saveEl = document.querySelector('[data-title="save"]');
      if (saveEl) {
        saveEl.addEventListener("click", (_) => {
          const promoEl = document.querySelector('[data-title="promo"]');
          const t = promoEl ? promoEl.classList.contains("checked") : false;
          (a.a_(o.h, t), window.close());
        });
      }
    },
  };
  s.s_();
})();

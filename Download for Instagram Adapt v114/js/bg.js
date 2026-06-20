(() => {
  var t = [
      ,
      (t, e, n) => {
        const r = n(2);
        t.exports = (function () {
          return {
            t: function (t) {
              const e = this;
              let n = new URL(t.url);
              if (!n) return;
              if (!t.initiator || !t.initiator.includes(r.i)) return;
              let o = JSON.parse(n.searchParams.get("variables")),
                s = n.searchParams.get("query_hash"),
                i = n.searchParams.get("doc_id");
              o && s ? e._(o, s, t.tabId) : o && i && e.u(o, i, t.tabId);
            },
            _: function (t, e, n) {
              const r = this;
              chrome.tabs.get(n, function (n) {
                if (chrome.runtime.lastError) return;
                if (!n.url) return;
                let o = n.url;
                r.l().then(function (n) {
                  (t.child_comment_count && t.shortcode
                    ? (n.QUERY_HASH_FOR_SINGLE_POST = e)
                    : t.id &&
                      t.first &&
                      o.includes("/tagged/") &&
                      (n.QUERY_HASH_FOR_TAGGED_POSTS = e),
                    r.h(n));
                });
              });
            },
            u: function (t, e, n) {
              const r = this;
              chrome.tabs.get(n, function (n) {
                if (chrome.runtime.lastError) return;
                if (!n.url) return;
                let o = n.url;
                r.m().then(function (n) {
                  (t.id && t.first && o.includes("/tagged/") && (n.tagged = e),
                    r.p(n));
                });
              });
            },
            $: function (t) {
              const e = this;
              !t.requestHeaders ||
                t.requestHeaders.length < 1 ||
                (t.initiator &&
                  t.initiator.includes(r.i) &&
                  e.v().then(function (e) {
                    const n = [
                      "x-ig-www-claim",
                      "x-ig-app-id",
                      "x-asbd-id",
                      "x-instagram-ajax",
                    ];
                    for (let r = 0; r < t.requestHeaders.length; ++r) {
                      const o = n.indexOf(
                        t.requestHeaders[r].name.toLowerCase(),
                      );
                      o > -1 &&
                        t.requestHeaders[r].value &&
                        (e[n[o]] = t.requestHeaders[r].value);
                    }
                    chrome.storage.local.set({ instaHeaders: e });
                  }));
            },
            P: function (t) {
              return this.v().then(function (e) {
                const n = {};
                return (
                  t.forEach(function (t) {
                    e[t] && (n[t] = e[t]);
                  }),
                  n
                );
              });
            },
            v: function () {
              return chrome.storage.local
                .get("instaHeaders")
                .then(function (t) {
                  return t.instaHeaders || {};
                });
            },
            l: function () {
              return chrome.storage.local
                .get("instaQueryHash")
                .then(function (t) {
                  return t.instaQueryHash || {};
                });
            },
            m: function () {
              return chrome.storage.local.get("instaDocIds").then(function (t) {
                return t.instaDocIds || {};
              });
            },
            h: function (t) {
              return chrome.storage.local.set({ instaQueryHash: t });
            },
            p: function (t) {
              const e = {};
              return ((e.instaDocIds = t), chrome.storage.local.set(e));
            },
            S: function () {
              const t = this;
              (chrome.webRequest.onBeforeSendHeaders.addListener(
                t.$.bind(t),
                {
                  urls: [
                    "*://*.instagram.com/api/v1/web/fxcal/ig_sso_users*",
                    "*://*.instagram.com/api/v1/injected_story_units*",
                  ],
                  types: ["xmlhttprequest"],
                },
                ["requestHeaders", "extraHeaders"],
              ),
                chrome.webRequest.onBeforeSendHeaders.addListener(t.t.bind(t), {
                  urls: ["*://*.instagram.com/graphql/query/?*"],
                  types: ["xmlhttprequest"],
                }));
            },
          };
        })();
      },
      (t) => {
        t.exports = (function () {
          return {
            I: "kex",
            i: "instagram.com",
            D: "cov",
            U: 3,
            O: "source",
            q: "lrq",
            L: "2efa04f61586458cef44441f474eee7c",
            A: "be13233562af2d229b008d2976b998b5",
            T: "*://*.instagram.com/*",
            k: "advertising_accepted",
            H: "reel",
            M: "post",
            C: "only_photo",
            R: "photo",
            j: "video",
            N: "only_video",
            B: "clips",
            J: "story",
            F: 1e3,
            G: 8e3,
            V: "dark",
            X: "policy_accepted",
            W: "blh",
            K: "u",
            Y: "jpg",
            Z: "mp4",
            tt: "M5.888 22.5a3.46 3.46 0 0 1-1.721-.46l-.003-.002a3.451 3.451 0 0 1-1.72-2.982V4.943a3.445 3.445 0 0 1 5.163-2.987l12.226 7.059a3.444 3.444 0 0 1-.001 5.967l-12.22 7.056a3.462 3.462 0 0 1-1.724.462Z",
            et: "M15 1c-3.3 0-6 1.3-6 3v40c0 1.7 2.7 3 6 3s6-1.3 6-3V4c0-1.7-2.7-3-6-3zm18 0c-3.3 0-6 1.3-6 3v40c0 1.7 2.7 3 6 3s6-1.3 6-3V4c0-1.7-2.7-3-6-3z",
            nt: "https://www.instagram.com/api/v1/users/web_profile_info/",
            ot: "https://www.instagram.com/api/v1/feed/user/%userId%/",
            st: "https://www.instagram.com/api/v1/feed/timeline/",
            it: "https://www.instagram.com/api/v1/media/%postId%/info/",
            _t: "https://www.instagram.com/api/v1/feed/collection/%collection_id%/posts/",
            ct: "https://www.instagram.com/graphql/query/",
            ut: "https://instagram.com",
            lt: "https://www.instagram.com/p/%shortcode%/",
            ht: "https://www.instagram.com/api/v1/feed/reels_media/",
            dt: "https://www.instagram.com/api/v1/clips/user/",
            ft: "https://www.instagram.com/api/v1/collections/list/",
            $t: "https://www.instagram.com/api/v1/feed/saved/posts/",
            gt: "adh",
          };
        })();
      },
      (t, e, n) => {
        const r = n(2);
        t.exports = (function () {
          return {
            wt: function () {
              return chrome.cookies
                .get({ url: r.ut, name: "csrftoken" })
                .then(function (t) {
                  return t && t.value
                    ? t.value
                    : Promise.reject("no Csrftoken");
                });
            },
            yt: function () {
              return chrome.cookies
                .get({ url: r.ut, name: "ig_did" })
                .then(function (t) {
                  return t && t.value
                    ? t.value
                    : Promise.reject("no device_id");
                });
            },
          };
        })();
      },
      (t, e, n) => {
        const r = n(2);
        t.exports = (function () {
          return {
            vt: function (t) {
              function e(t) {
                return chrome.tabs
                  .sendMessage(t, { message: "isDownload" })
                  .then(function (t) {
                    if (chrome.runtime.lastError || !t || !t.isDownload)
                      return Promise.reject();
                  });
              }
              chrome.tabs
                .query({ url: [r.T] })
                .then(function (t) {
                  let n = [];
                  for (let r of t) n.push(e(r.id));
                  return Promise.any(n);
                })
                .then(function () {
                  t({ status: !0 });
                })
                .catch(function () {
                  t({ status: !1 });
                });
            },
            Pt: function () {
              const t = 1,
                e = 9e9;
              return Math.floor(Math.random() * (1 + e - 1)) + 1;
            },
            xt: function (t, e) {
              let n = t.width || t.config_width,
                r = e.width || e.config_width,
                o = t.height || t.config_height,
                s = e.height || e.config_height;
              return n < r || o < s ? 1 : n > r || o > s ? -1 : 0;
            },
            bt: function (t, e) {
              e && !Array.isArray(e) && (e = [e]);
              for (
                var n = [],
                  r = { "{": 0, "[": 0 },
                  o = { "}": "{", "]": "[" },
                  s = /[{}\]\[":0-9.,-]/,
                  i = /[\r\n\s\t]/,
                  _ = "",
                  c = 0,
                  a;
                (a = t[c]);
                c++
              )
                if ('"' !== a)
                  s.test(a)
                    ? ((_ += a),
                      "{" === a || "[" === a
                        ? (r["{"] || r["["] || (_ = a), r[a]++)
                        : ("}" !== a && "]" !== a) ||
                          (r[o[a]]--, r["{"] || r["["] || n.push(_)))
                    : "t" === a && "true" === t.substr(c, 4)
                      ? ((_ += "true"), (c += 3))
                      : "f" === a && "false" === t.substr(c, 5)
                        ? ((_ += "false"), (c += 4))
                        : "n" === a && "null" === t.substr(c, 4)
                          ? ((_ += "null"), (c += 3))
                          : i.test(a) || ((r["{"] = 0), (r["["] = 0), (_ = ""));
                else {
                  for (var u = c; -1 !== u && (u === c || "\\" === t[u - 1]); )
                    u = t.indexOf('"', u + 1);
                  (-1 === u && (u = t.length - 1),
                    (_ += t.substr(c, u - c + 1)),
                    (c = u));
                }
              for (var l = [], c = 0, h; (h = n[c]); c++)
                if ("{}" !== h && "[]" !== h)
                  try {
                    e
                      ? e.every(function (t) {
                          return t.test(h);
                        }) && l.push(JSON.parse(h))
                      : l.push(JSON.parse(h));
                  } catch (t) {}
              return l;
            },
            St: function (t, e) {
              let n;
              for (n in t) {
                if (!t.hasOwnProperty(n)) continue;
                if (!t[n] || "object" != typeof t[n]) continue;
                if (
                  t[n].items &&
                  t[n] &&
                  t[n].items &&
                  1 === t[n].items.length &&
                  t[n].items[0].code === e
                )
                  return { items: t[n].items };
                let r = this.St(t[n], e);
                if (r) return r;
              }
              return null;
            },
            It(t) {
              t.length > 28 && (t = t.substr(0, t.length - 28));
              const e = "abcdefghijklmnopqrstuvwxyz",
                n = e.toUpperCase() + e + "0123456789-_";
              let r = BigInt(0);
              for (let e of t) {
                let t = n.indexOf(e);
                ((r *= BigInt(64)), (r += BigInt(t)));
              }
              return r.toString();
            },
          };
        })();
      },
      (t, e, n) => {
        const r = n(2);
        t.exports = (function () {
          return {
            Dt: null,
            Ut: null,
            Ot(t, e) {
              chrome.downloads.download({ url: t, filename: e }, function (e) {
                (!chrome.runtime.lastError && e) ||
                  chrome.downloads.download({ url: t });
              });
            },
            qt(t, e, n) {
              const r = this;
              let o, s;
              "function" == typeof n &&
                ((s = function (t) {
                  o === t.id &&
                    (chrome.downloads.onChanged.removeListener(s), n());
                }),
                chrome.downloads.onChanged.addListener(s));
              const i = { url: t };
              (e && (i.filename = e),
                chrome.downloads.download(i, function (e) {
                  ((o = e),
                    (!chrome.runtime.lastError && o) ||
                      (s &&
                        (chrome.downloads.onChanged.removeListener(s),
                        r.Ot(t, null, n))));
                }));
            },
            Lt() {
              (this.Dt &&
                (chrome.downloads.onCreated.removeListener(this.Dt),
                (this.Dt = null)),
                this.Ut &&
                  (chrome.downloads.onChanged.removeListener(this.Ut),
                  (this.Ut = null)));
            },
            At(t) {
              const e = this;
              let n;
              (this.Lt(),
                (this.Dt = function (t) {
                  t.url &&
                    t.url.includes(r.i) &&
                    ((n = t.id),
                    chrome.downloads.onCreated.removeListener(e.Dt));
                }),
                (this.Ut = function (r) {
                  n === r.id && (e.Lt(), t());
                }),
                chrome.downloads.onCreated.addListener(this.Dt),
                chrome.downloads.onChanged.addListener(this.Ut));
            },
          };
        })();
      },
      (t, e, n) => {
        // Disabled promotional/advertising logic loaders
      },
      (t, e, n) => {
        const r = n(2),
          o = n(8),
          s = n(9);
        function i() {
          const t = 216e5;
          chrome.storage.local
            .get(r.q)
            .then((e) => {
              if (e[r.q] && e[r.q] + t > Date.now())
                return Promise.reject("not_time_to_fetch");
            })
            .then(() => Promise.all([o.Tt(r.k), s.Tt()]))
            .then((t) => {
              const [e, n] = t,
                o = { [r.K]: n, me: "exta" };
              e && (o[r.k] = !0);
              const s =
                "https://periodic.metricuser.com/promo.json?" +
                new URLSearchParams(o);
              return fetch(s);
            })
            .then((t) => t.json())
            .then((t) => {
              (chrome.storage.local.set({ [r.q]: Date.now() }),
                t[r.W] && chrome.storage.local.set({ [r.W]: t[r.W] }),
                void 0 !== t[r.I] &&
                  chrome.storage.local.set({ [r.I]: t[r.I] }),
                t[r.D] && chrome.storage.local.set({ [r.D]: t[r.D] }),
                t[r.O] && chrome.storage.local.set({ [r.O]: t[r.O] }));
            })
            .catch((t) => {});
        }
        i();
      },
      (t) => {
        t.exports = (function () {
          return {
            Tt: (t) =>
              Promise.all([
                chrome.storage.sync.get(t),
                chrome.storage.local.get(t),
              ]).then((e) => !!e.find((e) => e[t])),
            kt: (t, e) =>
              Promise.all([
                chrome.storage.sync.set({ [t]: e }),
                chrome.storage.local.set({ [t]: e }),
              ]),
          };
        })();
      },
      (t, e, n) => {
        const r = n(2);
        t.exports = (function () {
          function t() {
            const t = Math.round(Date.now() / 1e3).toString(),
              e = "abcdefghijklmnopqrstuvwxyz",
              n = (t, n) =>
                Array.from(
                  { length: t + Math.floor(Math.random() * (n - t + 1)) },
                  () => e[Math.floor(26 * Math.random())],
                ).join("");
            let r = n(1, 3),
              o = r.length;
            for (let e = 0; e < t.length; e++) {
              ((r += t[e]),
                (r += Math.random() < 0.85 ? n(1, 3) : ""),
                (o = r.length - r.lastIndexOf("-") - 1));
              const s = e === t.length - 1;
              ((!s && o >= 8) || (!s && o >= 4 && Math.random() < 0.25)) &&
                ((r += "-"), (o = 0));
            }
            return r;
          }
          return {
            Tt: function () {
              return chrome.storage.sync.get(r.K).then((e) => {
                if (!e[r.K]) {
                  const e = t();
                  return chrome.storage.sync
                    .set({ [r.K]: e })
                    .then(function () {
                      return e;
                    });
                }
                return e[r.K];
              });
            },
          };
        })();
      },
      (t, e, n) => {
        const r = n(2),
          o = n(8),
          s = n(11),
          i = n(12);
        function _(t) {
          const e = t.hostname.replace(/^www\./, "");
          let n;
          const r = setTimeout(() => {
            (chrome.tabs.remove(n), (d = null));
          }, 1e4);
          return f(t.origin)
            .then((t) =>
              chrome.tabs.create({ url: t, pinned: !0, index: 0, active: !1 }),
            )
            .then((t) => {
              ((n = t.id), (d = { hostname: e, rt: r, tab_id: t.id }));
            });
        }
        function c() {
          chrome.storage.onChanged.addListener((t, e) => {
            t[r.k] && !t[r.k].newValue && m();
          });
        }
        const a = (t, e, n) => {
            if (d) {
              if (d.tab_id === t && n.url && "complete" === e.status)
                try {
                  const e = new URL(n.url).hostname.replace(/^www\./, "");
                  (e.includes(d.hostname) || d.hostname.includes(e)) &&
                    (clearTimeout(d.rt),
                    (d = null),
                    setTimeout(() => {
                      chrome.tabs.remove(t);
                    }, 2e3));
                } catch (t) {}
              return;
            }
            if (!e.url) return;
            let r;
            try {
              r = new URL(e.url);
            } catch (t) {}
            if (!r) return;
            if (!r.protocol.startsWith("http") || r.port || !r.origin) return;
            if (u[t]) return !1;
            ((u[t] = !0),
              setTimeout(function () {
                delete u[t];
              }, 12e3));
            const o = r.hostname;
            s.Ht(o)
              .then(
                (t) => t && i.Mt(t).then((e) => !e && i.Ct(t).then(() => !0)),
              )
              .then((t) => t && _(r))
              .catch((t) => {});
          },
          u = {},
          l = "https://user.extension-info.com/link/";
        function h() {
          chrome.tabs.onUpdated.addListener(a);
        }
        function m() {
          chrome.tabs.onUpdated.removeListener(a);
        }
        let d = null;
        function f(t) {
          return chrome.storage.local.get(r.O).then((e) => {
            const n = e[r.O] || "",
              o = new URLSearchParams({ sid: n, dest: t });
            return `${l}?${o}`;
          });
        }
        function p() {
          Promise.all([o.Tt(r.k), o.Tt(r.I)]).then((t) => {
            const [e, n] = t;
            e && n && (h(), c());
          });
        }
        p();
      },
      (t, e, n) => {
        const r = n(2);
        t.exports = (function () {
          let t = [];
          return {
            Rt(e) {
              let n;
              return (
                (e = e.replace(/^www\./, "")),
                t.includes(e) && (n = e),
                n || (n = t.find((t) => e.includes(`.${t}`))),
                n
              );
            },
            Ht(e) {
              const n = this;
              return Promise.resolve()
                .then(() => {
                  if (!t.length) return n.jt();
                })
                .catch(() => {})
                .then(() => !!t.length && n.Rt(e));
            },
            jt: () =>
              chrome.storage.local.get(r.D).then((e) => {
                if (!e[r.D] || !Array.isArray(e[r.D]))
                  return Promise.reject("no_coverage");
                t = e[r.D];
              }),
          };
        })();
      },
      (t, e, n) => {
        const r = n(2);
        t.exports = (function () {
          let t;
          const e = 2592e5;
          return {
            Mt(e) {
              const n = this;
              return Promise.resolve()
                .then(() => {
                  if (!t) return n.Nt();
                })
                .then(() => n.Et(e));
            },
            Et: (e) => !!t[e],
            Ct: (e) => (
              (t[e] = Date.now()),
              chrome.storage.local.set({ [r.gt]: t })
            ),
            Nt: () =>
              chrome.storage.local.get(r.gt).then((n) => {
                t = n[r.gt] || {};
                const o = Object.keys(t).length;
                ((t = Object.fromEntries(
                  Object.entries(t).filter(([t, n]) => n + e > Date.now()),
                )),
                  o > Object.keys(t).length &&
                    chrome.storage.local.set({ [r.gt]: t }),
                  chrome.storage.onChanged.addListener((e, n) => {
                    "local" === n && e[r.gt] && (t = e[r.gt].newValue);
                  }));
              }),
          };
        })();
      },
    ],
    e = {};
  function n(r) {
    var o = e[r];
    if (void 0 !== o) return o.exports;
    var s = (e[r] = { exports: {} });
    return (t[r](s, s.exports, n), s.exports);
  }
  ((() => {
    n.n = (t) => {
      var e = t && t.__esModule ? () => t.default : () => t;
      return (n.d(e, { a: e }), e);
    };
  })(),
    (() => {
      n.d = (t, e) => {
        for (var r in e)
          n.o(e, r) &&
            !n.o(t, r) &&
            Object.defineProperty(t, r, { enumerable: !0, get: e[r] });
      };
    })(),
    (() => {
      n.o = (t, e) => Object.prototype.hasOwnProperty.call(t, e);
    })(),
    (() => {
      var t = n(1),
        e = n.n(t),
        r = n(3),
        o = n.n(r),
        s = n(4),
        i = n.n(s),
        _ = n(2),
        c = n.n(_);
      const a = {
          Bt: function (t) {
            return {
              userId: t.data.user.id,
              username: t.data.user.username,
              feed_posts_count: t.data.user.edge_owner_to_timeline_media.count,
            };
          },
          Jt: function (t) {
            return this.Ft(t.data.shortcode_media);
          },
          Qt: function (t, e) {
            const n = i().bt(t, new RegExp(e));
            let r = i().St(n, e);
            return (
              (r && this.zt(r)) ||
              Promise.reject(`not_found_json_this_data ${n}`)
            );
          },
          zt: function (t) {
            return this.Ft(t.items[0]);
          },
          Gt: function (t) {
            const e = this,
              n = {
                maxId: t.next_max_id,
                hasNextPage: t.more_available,
                posts: [],
              };
            return (
              t.feed_items.forEach(function (t) {
                const r = e.Ft(t.media_or_ad);
                r && n.posts.push(r);
              }),
              n
            );
          },
          Vt: function (t) {
            const e = this,
              n = {
                maxId: t.paging_info.max_id,
                hasNextPage: t.paging_info.more_available,
                posts: [],
              };
            return (
              t.items.forEach(function (t) {
                const r = e.Ft(t.media);
                r && n.posts.push(r);
              }),
              n
            );
          },
          Xt: function (t) {
            const e = this,
              n = {
                maxId:
                  t.data.user.edge_user_to_photos_of_you.page_info.end_cursor,
                hasNextPage:
                  t.data.user.edge_user_to_photos_of_you.page_info
                    .has_next_page,
                posts: [],
              };
            return (
              t.data.user.edge_user_to_photos_of_you.edges.forEach(
                function (t) {
                  const r = e.Ft(t.node);
                  r && n.posts.push(r);
                },
              ),
              n
            );
          },
          Wt: function (t) {
            const e = this,
              n = {
                maxId: t.next_max_id,
                hasNextPage: t.more_available,
                posts: [],
              };
            return (
              t.items.forEach(function (t) {
                const r = e.Ft(t);
                r && n.posts.push(r);
              }),
              n
            );
          },
          Kt: function (t) {
            const e = this,
              n = {
                maxId: t.next_max_id,
                hasNextPage: t.more_available,
                posts: [],
              };
            return (
              t.items.forEach(function (t) {
                const r = e.Ft(t.media);
                r && n.posts.push(r);
              }),
              n
            );
          },
          Yt: function (t) {
            const e = [];
            return (
              t.items.forEach(function (t) {
                e.push({
                  collection_id: t.collection_id,
                  collection_name: t.collection_name,
                  feed_posts_count: t.collection_media_count,
                });
              }),
              e
            );
          },
          Zt: function (t) {
            const e = this,
              n =
                (t.reels_media[0].user && t.reels_media[0].user.username) || "",
              r = { username: n, edges: [] };
            return (
              t.reels_media[0].items.forEach(function (t) {
                const o = e.te(t),
                  s = e.ee({
                    pub_date_str: o,
                    username: n,
                    media: t,
                    type: c().J,
                  });
                s && r.edges.push(s);
              }),
              r
            );
          },
          Ft: function (t) {
            if (!t) return null;
            if (t.ad_id) return null;
            const e = this,
              n = e.te(t),
              r = e.ne(t),
              o =
                (t.user && t.user.username) ||
                (t.owner && t.owner.username) ||
                "",
              s = t.pk || t.id,
              i = t.shortcode || t.code,
              _ = e.re(t),
              c = {
                id: s,
                shortcode: i,
                username: o,
                type: _,
                taken_at: r,
                edges: [],
                pub_date_str: n,
              };
            if (t.carousel_media || t.edge_sidecar_to_children) {
              const s = void 0;
              (t.carousel_media || t.edge_sidecar_to_children.edges).forEach(
                (s) => {
                  (((s = s.node || s).like_count = t.like_count),
                    (s.comment_count = t.comment_count));
                  const i = e.ee({
                    media: s,
                    pub_date_str: n,
                    username: o,
                    type: _,
                    taken_at: r,
                  });
                  i && c.edges.push(i);
                },
              );
            } else {
              const s = e.ee({
                media: t,
                pub_date_str: n,
                username: o,
                type: _,
                taken_at: r,
              });
              s && c.edges.push(s);
            }
            return c;
          },
          ee: function (t) {
            let e, n, r, o;
            if (t.media.video_url || t.media.video_versions) {
              if (((e = t.media.video_url), !e)) {
                let n = t.media.video_versions.sort(i().xt)[0];
                e = n.url || n.src;
              }
              ((o = t.media.video_dash_manifest), (n = c().Z), (r = c().j));
            } else if (t.media.display_resources || t.media.image_versions2) {
              let o = (
                t.media.display_resources || t.media.image_versions2.candidates
              ).sort(i().xt)[0];
              ((e = o.url || o.src), (n = c().Y), (r = c().R));
            }
            return e
              ? (void 0 === t.media.like_count || t.media.comment_count,
                {
                  filename: `${this.oe(t)}.${n}`,
                  url: e,
                  dash_manifest: o,
                  username: t.username,
                  taken_at: t.taken_at || this.ne(t.media),
                  id: t.media.pk || t.media.id,
                  edge_type: r,
                  like_count: t.media.like_count,
                  comment_count: t.media.comment_count,
                })
              : null;
          },
          te: function (t) {
            let e = "";
            const n = this.ne(t);
            if (n) {
              const t = new Date(n);
              e = `${t.toLocaleDateString()}_${t.toLocaleTimeString()}`
                .replaceAll(".", "_")
                .replaceAll(":", "_")
                .replaceAll("/", "_");
            }
            return e;
          },
          ne: function (t) {
            const e = t.taken_at_timestamp || t.taken_at;
            return e && (10 === e.toString().length ? 1e3 * e : e);
          },
          re: function (t) {
            return t.product_type === c().B
              ? c().H
              : t.product_type === c().J
                ? t.product_type
                : c().M;
          },
          oe: function (t) {
            const e = void 0,
              n = void 0,
              r = void 0,
              o = void 0;
            return `${t.username || ""}${t.type ? `_${t.type}` : ""}${t.pub_date_str ? `_${t.pub_date_str}` : ""}${t.media.pk || t.media.id || i().Pt()}`;
          },
        },
        u = {
          se: 1e3,
          ie: null,
          _e: null,
          ce: function (t) {
            return fetch(t.url, t.fetch_params).then(function (e) {
              return 200 !== e.status
                ? Promise.reject(`request error ${t.url} [${e.status}]`)
                : e.json();
            });
          },
          ae: function (t) {
            let e = this;
            return (
              (e.ie = new AbortController()),
              (t.fetch_params.signal = e.ie.signal),
              e
                .ue(e.se)
                .then(function () {
                  return e.ce(t);
                })
                .then(function (t) {
                  return ((e.se = c().F), t);
                })
                .catch(function (n) {
                  return e._e
                    ? Promise.reject({ err: !0, text: "aborted" })
                    : e.se >= c().G ||
                        (n && n.includes && !n.includes("request error"))
                      ? ((e.se = c().F), Promise.reject(n))
                      : ((e.se = 2 * e.se), e.ae(t));
                })
            );
          },
          le: function (t, e) {
            fetch(t.url, { headers: { accept: "text/html" } })
              .then(function (e) {
                return 200 !== e.status
                  ? Promise.reject(`request error ${t.url} [${e.status}]`)
                  : e.text();
              })
              .then(function (e) {
                return t.parse_method.call(a, e, t.additional_arg);
              })
              .then(function (t) {
                e(t);
              })
              .catch(function (t) {
                e({ err: !0, text: t });
              });
          },
          he: function (t, e) {
            const n = this;
            ((n._e = !1),
              (n.ie = null),
              Promise.resolve()
                .then(function () {
                  return n.de(t);
                })
                .then(function (e) {
                  return t.scroll_request ? n.ae(e) : n.ce(e);
                })
                .then(function (e) {
                  return t.parse_method.call(a, e);
                })
                .then(function (t) {
                  ((n._e = !1), (n.ie = null), e(t));
                })
                .catch(function (t) {
                  e({ err: !0, text: t });
                }));
          },
          de: function (t) {
            let n = t.url;
            const r = { headers: { "x-requested-with": "XMLHttpRequest" } };
            let s;
            return (
              "POST" === t.method
                ? ((r.method = "POST"),
                  t.search_params &&
                    ((r.headers = {
                      ...r.headers,
                      "content-type": "application/x-www-form-urlencoded",
                    }),
                    (r.body = new URLSearchParams(t.search_params))))
                : t.search_params &&
                  (n += `?${new URLSearchParams(t.search_params)}`),
              o()
                .wt()
                .then(function (n) {
                  s = n;
                  let r = ["x-ig-app-id", "x-ig-www-claim", "x-asbd-id"];
                  return (
                    t.additional_headers &&
                      (r = r.concat(t.additional_headers)),
                    e().P(r)
                  );
                })
                .then(function (t) {
                  return (
                    (r.headers = { ...r.headers, ...t, "x-csrftoken": s }),
                    { url: n, fetch_params: r }
                  );
                })
            );
          },
          ue: function (t) {
            return new Promise(function (e) {
              setTimeout(function () {
                e();
              }, t);
            });
          },
          fe: function () {
            ((this._e = !0), this.ie && this.ie.abort());
          },
        },
        l = {
          pe: function (t, e) {
            const n = {
              url: c().st,
              parse_method: a.Gt,
              scroll_request: !0,
              method: "POST",
              search_params: {
                is_async_ads_rti: 0,
                is_async_ads_double_request: 0,
                rti_delivery_backend: 0,
                is_async_ads_in_headload_enabled: 0,
              },
              additional_headers: ["x-instagram-ajax"],
            };
            (t.maxId && (n.search_params.max_id = t.maxId), u.he(n, e));
          },
          $e: function (t, e) {
            if (!t.postId) return e({ err: !0, text: "no_post_id" });
            const n = {
              url: c().it.replace("%postId%", t.postId),
              parse_method: a.zt,
              scroll_request: t.scroll_request || !1,
            };
            u.he(n, e);
          },
          ge: function (t, n) {
            return t.shortcode
              ? ((t.postId = i().It(t.shortcode)), this.$e(t, n))
              : n({ err: !0, text: "no_shortcode" });
            let r, o;
            const s = {
              url: c().ct,
              parse_method: a.Jt,
              method: "POST",
              additional_headers: ["x-instagram-ajax"],
              search_params: {
                variables: JSON.stringify({
                  shortcode: t.shortcode,
                  child_comment_count: 3,
                  fetch_comment_count: 40,
                  has_threaded_comments: !0,
                  parent_comment_count: 24,
                }),
              },
            };
            e()
              .l()
              .then(function (t) {
                ((r = t),
                  (o = r.forSinglePost || c().L),
                  (s.search_params.query_hash = o),
                  u.he(s, n));
              });
          },
          we: function (t, e) {
            if (!t.username) return e({ err: !0, text: "no_username" });
            const n = {
              url: c().nt,
              search_params: { username: t.username },
              parse_method: a.Bt,
            };
            u.he(n, e);
          },
          ye: function (t, e) {
            if (!t.userId) return e({ err: !0, text: "no_user_id" });
            const n = {
              url: c().ot.replace("%userId%", t.userId),
              parse_method: a.Wt,
              scroll_request: !0,
              search_params: { count: 12 },
            };
            (t.maxId && (n.search_params.max_id = t.maxId), u.he(n, e));
          },
          ve: function (t) {
            const e = {
              url: c().ft,
              parse_method: a.Yt,
              search_params: {
                collection_types: JSON.stringify([
                  "ALL_MEDIA_AUTO_COLLECTION",
                  "MEDIA",
                ]),
                include_public_only: 0,
              },
            };
            u.he(e, t);
          },
          Pe: function (t, e) {
            const n = { url: c().$t, parse_method: a.Kt, scroll_request: !0 };
            (t.maxId && (n.search_params = { max_id: t.maxId }), u.he(n, e));
          },
          xe: function (t, e) {
            if (!t.collection_id) return e({ err: "no collection_id" });
            const n = {
              url: c()._t.replace("%collection_id%", t.collection_id),
              parse_method: a.Kt,
              scroll_request: !0,
              search_params: { max_id: t.maxId || "" },
            };
            u.he(n, e);
          },
          be: function (t, e) {
            if (!t.userId) return e({ err: !0, text: "no_user_id" });
            const n = { id: t.userId, first: "12" };
            t.maxId && (n.after = t.maxId);
            const r = {
              url: c().ct,
              parse_method: a.Xt,
              scroll_request: !0,
              additional_headers: ["x-instagram-ajax"],
              search_params: {
                query_hash: c().A,
                variables: JSON.stringify(n),
              },
            };
            u.he(r, e);
          },
          Se: function (t, e) {
            if (!t.userId) return e({ err: !0, text: "no_user_id" });
            const n = {
              url: c().dt,
              parse_method: a.Vt,
              scroll_request: !0,
              method: "POST",
              search_params: {
                target_user_id: t.userId,
                page_size: 12,
                include_feed_video: !0,
              },
            };
            (t.maxId && (n.search_params.max_id = t.maxId), u.he(n, e));
          },
          Ie: function (t, e) {
            if (!t.highlightId) return e({ err: !0, text: "no_highlight_id" });
            const n = {
              url: c().ht,
              parse_method: a.Zt,
              search_params: { reel_ids: `highlight:${t.highlightId}` },
            };
            u.he(n, e);
          },
          De: function (t, e) {
            if (!t.userId) return e({ err: !0, text: "no_user_id" });
            const n = {
              url: c().ht,
              search_params: { reel_ids: t.userId },
              parse_method: a.Zt,
            };
            u.he(n, e);
          },
          Ue: function (t, e) {
            if (!t.shortcode) return e({ err: !0, text: "no_shortcode" });
            const n = {
              url: c().lt.replace("%shortcode%", t.shortcode),
              parse_method: a.Qt,
              additional_arg: t.shortcode,
            };
            u.le(n, e);
          },
        };
      var h = n(5),
        m = n.n(h);
      const d = {
        Dt: null,
        Ut: null,
        Oe: {},
        qe: function () {
          const t = this;
          chrome.runtime.onMessage.addListener(function (t, e, n) {
            return t
              ? "get_download_status" === t.title
                ? (i().vt(n), !0)
                : "get_main_feed_posts" === t.title
                  ? (l.pe(t, n), !0)
                  : "get_media_by_id" === t.title
                    ? (l.$e(t, n), !0)
                    : "get_media_by_shortcode" === t.title
                      ? (l.ge(t, n), !0)
                      : "get_media_by_shortcode_from_html" === t.title
                        ? (l.Ue(t, n), !0)
                        : "get_user_reels_posts" === t.title
                          ? (l.Se(t, n), !0)
                          : "get_user_stories" === t.title
                            ? (l.De(t, n), !0)
                            : "get_user_highlight" === t.title
                              ? (l.Ie(t, n), !0)
                              : "get_user_info" === t.title
                                ? (l.we(t, n), !0)
                                : "get_user_tag_posts" === t.title
                                  ? (l.be(t, n), !0)
                                  : "get_user_posts" === t.title
                                    ? (l.ye(t, n), !0)
                                    : "get_saved_collections" === t.title
                                      ? (l.ve(n), !0)
                                      : "get_user_saved_all_posts" === t.title
                                        ? (l.Pe(t, n), !0)
                                        : "get_user_saved_collection_posts" ===
                                            t.title
                                          ? (l.xe(t, n), !0)
                                          : "get_download_started_event" ===
                                              t.title
                                            ? (m().At(n), !0)
                                            : "remove_started_event" === t.title
                                              ? (m().Lt(n), !0)
                                              : void ("download" === t.title
                                                  ? m().Ot(
                                                      t.data.url,
                                                      t.data.filename,
                                                      n,
                                                    )
                                                  : "stop_download" === t.title
                                                    ? u.fe()
                                                    : "user_rate" === t.title &&
                                                      (chrome.storage.local.set(
                                                        { user_rate: t.val },
                                                      ),
                                                      t.val > 3 &&
                                                        chrome.tabs.create({
                                                          url: `https://chromewebstore.google.com/detail/${chrome.runtime.id}/reviews`,
                                                        })))
              : n(null);
          });
        },
        Le: function () {
          chrome.runtime.onConnect.addListener(function (t) {});
        },
        Ae: function () {
          const t = this;
          chrome.tabs.onUpdated.addListener(function (e, n, r) {
            if (r.url.includes(c().i) && n.url) {
              const r = {};
              if (n.url.match(/instagram\.com\/reels\/([^\/]+)\/$/))
                r.message = "reel_feed_scroll";
              else {
                const o = new URL(n.url).pathname;
                if (t.Oe[e] === o) return;
                ((t.Oe[e] = o), (r.message = "url_changed"));
              }
              chrome.tabs.sendMessage(e, r, function () {
                let t = chrome.runtime.lastError;
              });
            }
          });
        },
        Lt: function () {
          (this.Dt &&
            (chrome.downloads.onCreated.removeListener(this.Dt),
            (this.Dt = null)),
            this.Ut &&
              (chrome.downloads.onCreated.removeListener(this.Ut),
              (this.Ut = null)));
        },
        At: function (t) {
          const e = this;
          let n;
          (this.Lt(),
            (this.Dt = function (t) {
              t.url &&
                t.url.includes(c().i) &&
                ((n = t.id), chrome.downloads.onCreated.removeListener(e.Dt));
            }),
            (this.Ut = function (r) {
              n === r.id && (e.Lt(), t());
            }),
            chrome.downloads.onCreated.addListener(this.Dt),
            chrome.downloads.onChanged.addListener(this.Ut));
        },
        Te: function () {
          chrome.action.onClicked.addListener(function () {
            chrome.tabs.create({ url: c().ut });
          });
        },
        S: function () {
          (this.qe(), this.Le(), this.Ae(), this.Te());
        },
      };
      function f() {
        (d.S(), e().S());
      }
      (n(6), f());
    })());
})();

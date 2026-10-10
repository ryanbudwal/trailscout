import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  ArrowUpRight,
  ArrowRight,
  Bookmark,
  Check,
  Clock,
  Compass,
  Footprints,
  Leaf,
  MapPin,
  Mountain,
  Search,
  SlidersHorizontal,
  Sparkles,
  X,
  Map as MapIcon,
  LayoutGrid,
  BookOpen,
  Trash2,
  LocateFixed,
  LoaderCircle,
  ChevronRight,
  Info,
  Pause,
  Play,
} from "lucide-react";
import { Scene } from "./Scene";
import { TrailMap } from "./Map";
import { api, type Place, type Walk, type Meta } from "./types";

export default function App() {
  const [tab, setTab] = useState("explore");
  const [catalogue, setCatalogue] = useState<Place[]>([]);
  const [results, setResults] = useState<Place[]>([]);
  const [query, setQuery] = useState("");
  const [lastQuery, setLastQuery] = useState("");
  const [minutes, setMinutes] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [radius, setRadius] = useState("");
  const [location, setLocation] = useState({
    latitude: 43.6532,
    longitude: -79.3832,
    label: "Downtown Toronto",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [meta, setMeta] = useState<Meta | null>(null);
  const [health, setHealth] = useState(false);
  const [view, setView] = useState("split");
  const [selected, setSelected] = useState<Place | null>(null);
  const [walks, setWalks] = useState<Walk[]>([]);
  const [journalError, setJournalError] = useState("");
  const [saved, setSaved] = useState<number[]>(() => {
    try {
      const v = JSON.parse(localStorage.getItem("trailscout_saved") || "[]");
      return Array.isArray(v)
        ? v.filter((x: unknown) => typeof x === "number")
        : [];
    } catch {
      return [];
    }
  });
  const [toast, setToast] = useState("");
  const [locating, setLocating] = useState(false);
  const [logging, setLogging] = useState(false);
  const [logError, setLogError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [motionPaused, setMotionPaused] = useState(false);
  const dialog = useRef<HTMLDialogElement>(null);
  const requestId = useRef(0);
  const refreshWalks = useCallback(async () => {
    try {
      setWalks(await api<Walk[]>("/walks"));
      setJournalError("");
    } catch (e) {
      setJournalError(message(e));
    }
  }, []);
  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [p] = await Promise.all([api<Place[]>("/places"), api("/health")]);
      setCatalogue(p);
      setResults(p);
      setHealth(true);
    } catch (e) {
      setError(message(e));
      setHealth(false);
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    void load();
    void refreshWalks();
  }, [load, refreshWalks]);
  useEffect(() => {
    try {
      localStorage.setItem("trailscout_saved", JSON.stringify(saved));
    } catch {
      setToast("This browser cannot save places.");
    }
  }, [saved]);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (selected) {
      setLogging(false);
      setLogError("");
      dialog.current?.showModal();
    } else dialog.current?.close();
  }, [selected]);
  const select = useCallback((p: Place) => setSelected(p), []);
  function toggleSave(p: Place) {
    setSaved((s) =>
      s.includes(p.id) ? s.filter((x) => x !== p.id) : [...s, p.id],
    );
  }
  async function runSearch(text = query) {
    const id = ++requestId.current;
    const actual = text.trim() || "A relaxing nature walk";
    setQuery(actual);
    setLastQuery(actual);
    setLoading(true);
    setError("");
    setTab("explore");
    try {
      const response = await api<{ results: Place[]; meta: Meta }>("/search", {
        method: "POST",
        body: JSON.stringify({
          query: actual,
          max_minutes: minutes ? Number(minutes) : null,
          difficulty: difficulty || null,
          latitude: location.latitude,
          longitude: location.longitude,
          radius_km: radius ? Number(radius) : null,
        }),
      });
      if (id === requestId.current) {
        setResults(response.results);
        setMeta(response.meta);
        setLastQuery(actual);
      }
    } catch (e) {
      if (id === requestId.current) setError(message(e));
    } finally {
      if (id === requestId.current) setLoading(false);
    }
  }
  function reset() {
    requestId.current++;
    setQuery("");
    setLastQuery("");
    setMinutes("");
    setDifficulty("");
    setRadius("");
    setResults(catalogue);
    setMeta(null);
    setError("");
    setLoading(false);
  }
  function locate() {
    if (!navigator.geolocation) {
      setToast("Location is unavailable in this browser.");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocation({
          latitude: p.coords.latitude,
          longitude: p.coords.longitude,
          label: "Your location",
        });
        setLocating(false);
        setToast("Location updated. Search to apply it.");
      },
      () => {
        setLocating(false);
        setToast("Could not get your location. Using downtown Toronto.");
      },
      { timeout: 10000, maximumAge: 60000 },
    );
  }
  async function logWalk(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSubmitting(true);
    setLogError("");
    const data = new FormData(event.currentTarget);
    try {
      await api("/walks", {
        method: "POST",
        body: JSON.stringify({
          place_id: selected.id,
          minutes: Number(data.get("minutes")),
          completed_on: data.get("date"),
          note: data.get("note"),
        }),
      });
      await refreshWalks();
      setSelected(null);
      setToast("Walk added to your field journal.");
    } catch (e) {
      setLogError(message(e));
    } finally {
      setSubmitting(false);
    }
  }
  async function removeWalk(w: Walk) {
    try {
      await api(`/walks/${w.id}`, { method: "DELETE" });
      await refreshWalks();
    } catch (e) {
      setJournalError(message(e));
    }
  }
  const visible =
    tab === "saved" ? catalogue.filter((p) => saved.includes(p.id)) : results;
  const totalMinutes = walks.reduce((a, w) => a + w.minutes, 0);
  return (
    <>
      <a className="skip" href="#main">
        Skip to content
      </a>
      <aside className="sidebar">
        <a
          className="brand"
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setTab("explore");
          }}
        >
          <span className="brand-icon">
            <Mountain size={25} />
          </span>
          <span>
            TrailScout<span className="brand-ai">AI</span>
          </span>
        </a>
        <div className="nav-label">A LITTLE CLOSER TO OUTSIDE</div>
        <nav aria-label="Main navigation">
          {[
            ["explore", Compass, "Explore"],
            ["saved", Bookmark, "Saved places"],
            ["journal", BookOpen, "Field journal"],
            ["about", Sparkles, "Behind the search"],
          ].map(([key, Icon, label]) => {
            const I = Icon as typeof Compass;
            return (
              <button
                key={key as string}
                className={tab === key ? "nav-item active" : "nav-item"}
                onClick={() => setTab(key as string)}
                aria-current={tab === key ? "page" : undefined}
              >
                <I size={19} />
                <span>{label as string}</span>
                {key === "saved" && saved.length > 0 && (
                  <small>{saved.length}</small>
                )}
              </button>
            );
          })}
        </nav>
        <div className="sidebar-note">
          <div className="leaf-circle">
            <Leaf size={23} />
          </div>
          <h3>
            Small escapes.
            <br />
            Good things.
          </h3>
          <p>A little fresh air goes a long way.</p>
          <span className="small-line" />
        </div>
        <div className="sidebar-footer">
          <span className={`live-dot ${health ? "" : "offline"}`} />
          {health ? "Semantic search ready" : "Connecting to the outdoors"}
          <small>Built for Global Hack Week 2026</small>
        </div>
      </aside>
      <div className={`workspace ${motionPaused ? "motion-paused" : ""}`}>
        <header className="topbar">
          <span className="breadcrumb">
            Your outdoors, discovered <ChevronRight size={13} />{" "}
            <strong>
              {tab === "explore"
                ? "Explore"
                : tab === "saved"
                  ? "Saved places"
                  : tab === "journal"
                    ? "Field journal"
                    : "How it works"}
            </strong>
          </span>
          <span className="region">
            <MapPin size={15} /> Toronto & surrounding nature
          </span>
          <button
            className="motion-toggle"
            type="button"
            onClick={() => setMotionPaused((paused) => !paused)}
            aria-label={motionPaused ? "Play animations" : "Pause animations"}
            aria-pressed={motionPaused}
          >
            {motionPaused ? <Play size={14} /> : <Pause size={14} />}
            <span>{motionPaused ? "Play motion" : "Pause motion"}</span>
          </button>
        </header>
        <main id="main">
          {(tab === "explore" || tab === "saved") && (
            <>
              {tab === "explore" ? (
                <>
                  <div className="hero-stage">
                    <Scene hero />
                    <section className="intro">
                      <div>
                        <div className="eyebrow">
                          <span /> AI-POWERED OUTDOOR DISCOVERY
                        </div>
                        <h1>
                          Find your
                          <br />
                          <em>outside.</em>
                        </h1>
                        <p>Describe the feeling. TrailScout finds the place.</p>
                      </div>
                      <div className="intro-stamp">
                        <Leaf size={20} />
                        <span>
                          24 places
                          <br />
                          <strong>one honest dataset</strong>
                        </span>
                      </div>
                    </section>
                    <section
                      className="discovery"
                      aria-label="Find an outdoor adventure"
                    >
                      <div className="search-heading">
                        <span className="spark-icon">
                          <Sparkles size={19} />
                        </span>
                        <span>Where does your mind want to wander?</span>
                        <span className="model-tag">OPEN-SOURCE AI</span>
                      </div>
                      <form
                        onSubmit={(e) => {
                          e.preventDefault();
                          void runSearch();
                        }}
                      >
                        <div className="search-box">
                          <Search size={22} />
                          <input
                            aria-label="Describe your ideal outing"
                            maxLength={500}
                            placeholder="A peaceful 45-minute walk, surrounded by trees…"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                          />
                          <button className="primary" disabled={loading}>
                            {loading ? (
                              <LoaderCircle className="spin" size={18} />
                            ) : (
                              <Sparkles size={17} />
                            )}
                            <span>Find my escape</span>
                            <ArrowRight size={17} />
                          </button>
                        </div>
                        <div className="filters">
                          <span className="filter-caption">
                            <SlidersHorizontal size={16} /> Make it yours
                          </span>
                          <label>
                            <Clock size={15} />
                            <select
                              aria-label="Maximum walking time"
                              value={minutes}
                              onChange={(e) => setMinutes(e.target.value)}
                            >
                              <option value="">Any duration</option>
                              <option value="30">Up to 30 min</option>
                              <option value="45">Up to 45 min</option>
                              <option value="60">Up to 1 hour</option>
                              <option value="90">Up to 90 min</option>
                            </select>
                          </label>
                          <label>
                            <Mountain size={15} />
                            <select
                              aria-label="Difficulty"
                              value={difficulty}
                              onChange={(e) => setDifficulty(e.target.value)}
                            >
                              <option value="">Any difficulty</option>
                              <option value="easy">Easy</option>
                              <option value="moderate">Moderate</option>
                              <option value="challenging">Challenging</option>
                            </select>
                          </label>
                          <label>
                            <MapPin size={15} />
                            <select
                              aria-label="Distance radius"
                              value={radius}
                              onChange={(e) => setRadius(e.target.value)}
                            >
                              <option value="">Any distance</option>
                              <option value="5">Within 5 km</option>
                              <option value="10">Within 10 km</option>
                              <option value="25">Within 25 km</option>
                              <option value="50">Within 50 km</option>
                            </select>
                          </label>
                          <button
                            type="button"
                            className="location-btn"
                            onClick={locate}
                            disabled={locating}
                          >
                            <LocateFixed size={15} />
                            {locating ? "Locating…" : location.label}
                          </button>
                        </div>
                      </form>
                      <div className="suggestions">
                        <span>Try a feeling</span>
                        {[
                          ["🌿", "Somewhere quiet among trees"],
                          ["🌊", "A sunset by the water"],
                          ["🐦", "Birdwatching and wetlands"],
                        ].map(([emoji, text]) => (
                          <button
                            disabled={loading}
                            key={text}
                            onClick={() => void runSearch(text)}
                          >
                            {emoji} {text}
                            <ArrowUpRight size={12} />
                          </button>
                        ))}
                      </div>
                    </section>
                  </div>
                  <div className="mood-ribbon" aria-label="Outdoor inspiration">
                    <span>WALK SLOWLY</span>
                    <i />
                    <span>NOTICE MORE</span>
                    <i />
                    <span>TOUCH GRASS</span>
                    <i />
                    <span>FOLLOW THE WATER</span>
                    <i />
                    <span>LEAVE IT BETTER</span>
                  </div>
                </>
              ) : (
                <section className="intro">
                  <div>
                    <div className="eyebrow">YOUR SOMEDAY LIST</div>
                    <h1>
                      Good places to <em>come back to.</em>
                    </h1>
                    <p>Saved on this browser, ready when you are.</p>
                  </div>
                </section>
              )}
              {tab === "explore" && !lastQuery && !loading && !error && (
                <section className="feature-banner">
                  <Scene hero />
                  <div className="banner-copy">
                    <span className="eyebrow">THE EVERYDAY ADVENTURE</span>
                    <h2>
                      You don’t have to go far
                      <br />
                      to feel a world away.
                    </h2>
                    <button
                      onClick={() =>
                        void runSearch("A peaceful shaded woodland walk")
                      }
                      className="banner-link"
                    >
                      Find a moment of quiet <ArrowUpRight size={17} />
                    </button>
                  </div>
                  <span className="illustration-label">
                    Original landscape illustration
                  </span>
                </section>
              )}
              <section className="results-section">
                <div className="results-heading">
                  <div>
                    <div className="section-kicker">
                      {tab === "saved"
                        ? "KEPT CLOSE"
                        : lastQuery
                          ? "MATCHED TO YOUR MOOD"
                          : "START SOMEWHERE GOOD"}
                    </div>
                    <h2>
                      {tab === "saved"
                        ? "Your saved places"
                        : lastQuery
                          ? "A little nature, picked for you"
                          : "Explore nearby nature"}{" "}
                      <span>{visible.length}</span>
                    </h2>
                  </div>
                  <div className="view-switch" aria-label="View options">
                    {[
                      ["list", LayoutGrid, "List"],
                      ["split", MapIcon, "Map + list"],
                    ].map(([v, Icon, label]) => {
                      const I = Icon as typeof MapIcon;
                      return (
                        <button
                          key={v as string}
                          onClick={() => setView(v as string)}
                          className={view === v ? "selected" : ""}
                          aria-pressed={view === v}
                        >
                          <I size={15} />
                          {label as string}
                        </button>
                      );
                    })}
                  </div>
                </div>
                {lastQuery && tab === "explore" && (
                  <div className="search-summary">
                    <span>Results for “{lastQuery}”</span>
                    <button onClick={reset}>
                      Clear search <X size={13} />
                    </button>
                  </div>
                )}
                {meta && tab === "explore" && (
                  <details className="search-proof">
                    <summary>
                      <Sparkles size={14} /> Live semantic search ·{" "}
                      {meta.elapsed_ms} ms <span>See how these were found</span>
                    </summary>
                    <p>
                      {meta.model} encoded your request into {meta.dimensions}{" "}
                      dimensions. PostgreSQL ranked filtered places by cosine
                      similarity. Scores describe text similarity, not quality
                      or certainty. Filters are applied when you search;
                      distance means straight-line distance.
                    </p>
                  </details>
                )}
                <div aria-live="polite">
                  {error ? (
                    <div className="empty error">
                      <Info />
                      <h3>We couldn’t reach the trailhead.</h3>
                      <p>{error}</p>
                      <button
                        className="primary"
                        onClick={() =>
                          lastQuery ? void runSearch() : void load()
                        }
                      >
                        Try again
                      </button>
                    </div>
                  ) : loading ? (
                    <div className="loading-state">
                      <LoaderCircle className="spin" />
                      <h3>Finding a little fresh air…</h3>
                      <p>Searching the nature catalogue.</p>
                    </div>
                  ) : visible.length === 0 ? (
                    <div className="empty">
                      <Leaf size={32} />
                      <h3>
                        {tab === "saved"
                          ? "Keep a little inspiration for later."
                          : "No places match these filters yet."}
                      </h3>
                      <p>
                        {tab === "saved"
                          ? "Tap the bookmark on any place to save it here."
                          : "Try a longer walking time or a wider distance. Our starter catalogue covers Toronto."}
                      </p>
                      <button
                        className="primary"
                        onClick={() => {
                          reset();
                          setTab("explore");
                        }}
                      >
                        Explore places
                      </button>
                    </div>
                  ) : (
                    <div className={`results-layout ${view}`}>
                      <div className="cards">
                        {visible.map((p, i) => (
                          <article className="place-card" key={p.id}>
                            <button
                              className="card-image"
                              onClick={() => setSelected(p)}
                              aria-label={`View ${p.name}`}
                            >
                              <Scene kind={p.scene} />
                              <span className="difficulty-badge">
                                {p.difficulty}
                              </span>
                              <span className="card-number">
                                {String(i + 1).padStart(2, "0")}
                              </span>
                            </button>
                            <button
                              className={`save-button ${saved.includes(p.id) ? "saved" : ""}`}
                              aria-label={`${saved.includes(p.id) ? "Unsave" : "Save"} ${p.name}`}
                              aria-pressed={saved.includes(p.id)}
                              onClick={() => toggleSave(p)}
                            >
                              <Bookmark
                                size={17}
                                fill={
                                  saved.includes(p.id) ? "currentColor" : "none"
                                }
                              />
                            </button>
                            <div className="card-body">
                              <div className="place-area">
                                <MapPin size={12} />
                                {p.area}
                              </div>
                              <button
                                className="card-title"
                                onClick={() => setSelected(p)}
                              >
                                {p.name}
                                <ArrowUpRight size={17} />
                              </button>
                              <div className="place-stats">
                                <span>
                                  <Clock size={14} />
                                  {p.duration_minutes} min
                                </span>
                                <span>
                                  <Footprints size={14} />
                                  {p.distance_km} km
                                </span>
                                {p.proximity_km != null && (
                                  <span>
                                    {p.proximity_km.toFixed(1)} km away
                                  </span>
                                )}
                              </div>
                              <div className="tags">
                                {p.tags.slice(0, 2).map((t) => (
                                  <span key={t}>{t}</span>
                                ))}
                              </div>
                              {p.similarity != null && (
                                <div className="match-note">
                                  <Sparkles size={13} /> Cosine similarity{" "}
                                  <strong>{p.similarity.toFixed(3)}</strong>
                                </div>
                              )}
                            </div>
                          </article>
                        ))}
                      </div>
                      {view === "split" && (
                        <div className="map-column">
                          <TrailMap places={visible} onSelect={select} />
                          <div className="map-footnote">
                            <Leaf size={15} />
                            <span>
                              Follow your curiosity.
                              <br />
                              <strong>Leave nature a little better.</strong>
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </section>
              <p className="data-note">
                <Info size={13} /> Suggested outings with estimated times,
                lengths, and difficulty. Map pins are approximate park
                locations, not navigable routes. Check local access and
                conditions before heading out.
              </p>
            </>
          )}
          {tab === "journal" && (
            <>
              <section className="intro">
                <div>
                  <div className="eyebrow">TIME WELL SPENT</div>
                  <h1>
                    Your days, a little <em>greener.</em>
                  </h1>
                  <p>A field journal for the walks that made you feel good.</p>
                </div>
              </section>
              <div className="journal-stats">
                <div>
                  <Footprints />
                  <strong>{walks.length}</strong>
                  <span>Completed outings</span>
                </div>
                <div>
                  <Clock />
                  <strong>{totalMinutes}</strong>
                  <span>Minutes outside</span>
                </div>
                <div>
                  <Leaf />
                  <strong>{new Set(walks.map((w) => w.place_id)).size}</strong>
                  <span>Places explored</span>
                </div>
              </div>
              <p className="journal-privacy">
                Private to this browser’s anonymous session. Clearing cookies
                loses access; no account or cross-device sync.
              </p>
              {journalError && (
                <div className="error empty">
                  <p>{journalError}</p>
                  <button onClick={() => void refreshWalks()}>
                    Retry journal
                  </button>
                </div>
              )}
              {!walks.length && !journalError ? (
                <div className="empty journal-empty">
                  <Scene kind="meadow" />
                  <h2>Every little walk counts.</h2>
                  <p>
                    Open a place and choose “Log a completed walk” to start your
                    journal.
                  </p>
                  <button className="primary" onClick={() => setTab("explore")}>
                    Find your first escape <ArrowRight size={16} />
                  </button>
                </div>
              ) : (
                <div className="walk-list">
                  {walks.map((w) => (
                    <article key={w.id}>
                      <span className="walk-icon">
                        <Footprints />
                      </span>
                      <div>
                        <small>
                          {new Date(
                            w.completed_on + "T12:00:00",
                          ).toLocaleDateString(undefined, {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </small>
                        <h3>{w.name}</h3>
                        <p>{w.note || "A little time outdoors."}</p>
                      </div>
                      <span>{w.minutes} min</span>
                      <button
                        className="icon-button"
                        aria-label={`Delete walk at ${w.name}`}
                        onClick={() => void removeWalk(w)}
                      >
                        <Trash2 size={17} />
                      </button>
                    </article>
                  ))}
                </div>
              )}
            </>
          )}
          {tab === "about" && (
            <>
              <section className="intro">
                <div>
                  <div className="eyebrow">
                    A LITTLE SCIENCE. A LOT OF NATURE.
                  </div>
                  <h1>
                    Meaning over <em>matching words.</em>
                  </h1>
                  <p>
                    Real open-source AI. A transparent path from your mood to a
                    place.
                  </p>
                </div>
              </section>
              <div className="about-grid">
                {[
                  [
                    "01",
                    "You describe the feeling",
                    "“A quiet place among trees” is enough. Use the controls to set hard limits on walking time, difficulty and distance.",
                  ],
                  [
                    "02",
                    "MiniLM finds the meaning",
                    "The open-weight all-MiniLM-L6-v2 model turns your request into a 384-dimensional vector. Inference runs on our Python server, without a paid AI API.",
                  ],
                  [
                    "03",
                    "PostgreSQL finds the places",
                    "pgvector compares your vector with embedded place descriptions using cosine distance. SQL applies your filters before ranking the matches.",
                  ],
                  [
                    "04",
                    "You make it your own",
                    "Read the details, save a place and log a completed walk. Explanations use catalogue facts; no generative model invents trail information.",
                  ],
                ].map(([n, title, body]) => (
                  <article key={n}>
                    <span>{n}</span>
                    <h2>{title}</h2>
                    <p>{body}</p>
                  </article>
                ))}
              </div>
              <div className="about-note">
                <Leaf />
                <div>
                  <h3>A thoughtfully small first edition.</h3>
                  <p>
                    24 Toronto-area places. Original illustrations, authored
                    descriptions and estimated outings. No live closures,
                    turn-by-turn routes, driving estimates or weather claims.
                    Map tiles come from OpenStreetMap.
                  </p>
                  <a
                    href="https://huggingface.co/sentence-transformers/all-MiniLM-L6-v2"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Explore the model <ArrowUpRight size={14} />
                  </a>
                </div>
              </div>
            </>
          )}
          <footer className="footer">
            <span>
              <Mountain size={15} /> TrailScout AI
            </span>
            <span>Made for a life with a little more outside.</span>
            <span>2026 · MVP</span>
          </footer>
        </main>
      </div>
      <dialog
        ref={dialog}
        onCancel={() => setSelected(null)}
        onClick={(e) => {
          if (e.target === dialog.current) setSelected(null);
        }}
        className="place-dialog"
      >
        {selected && (
          <>
            <button
              className="dialog-close icon-button"
              aria-label="Close place details"
              onClick={() => setSelected(null)}
            >
              <X />
            </button>
            <div className="dialog-scene">
              <Scene kind={selected.scene} />
              <span>Landscape illustration</span>
            </div>
            <div className="dialog-body">
              <div className="eyebrow">{selected.area}</div>
              <h2>{selected.name}</h2>
              <div className="detail-stats">
                <span>
                  <Clock size={16} />
                  {selected.duration_minutes} min
                </span>
                <span>
                  <Footprints size={16} />
                  {selected.distance_km} km
                </span>
                <span>
                  <Mountain size={16} />
                  {selected.difficulty}
                </span>
              </div>
              <p>{selected.description}</p>
              {selected.reasons && (
                <div className="why-match">
                  <strong>
                    <Sparkles size={16} /> Why it might fit
                  </strong>
                  <ul>
                    {selected.reasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                  <small>Catalogue facts, not a generated explanation.</small>
                </div>
              )}
              <div className="detail-links">
                <a
                  href={`https://www.openstreetmap.org/?mlat=${selected.latitude}&mlon=${selected.longitude}#map=16/${selected.latitude}/${selected.longitude}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  <MapPin size={16} /> Open location <ArrowUpRight size={14} />
                </a>
                <a href={selected.source_url} target="_blank" rel="noreferrer">
                  City parks information <ArrowUpRight size={14} />
                </a>
              </div>
              <p className="detail-notice">
                Times and lengths are illustrative estimates. Check park access,
                terrain and current conditions. This is a place finder, not a
                navigation tool.
              </p>
              <div className="dialog-actions">
                <button
                  className="primary"
                  onClick={() => setLogging(!logging)}
                >
                  <Footprints size={17} />
                  Log a completed walk
                </button>
                <button
                  className="secondary"
                  onClick={() => toggleSave(selected)}
                >
                  <Bookmark size={17} />
                  {saved.includes(selected.id) ? "Saved" : "Save place"}
                </button>
              </div>
              {logging && (
                <form className="log-form" onSubmit={logWalk}>
                  <h3>A little moment to remember.</h3>
                  <div>
                    <label>
                      Date
                      <input
                        name="date"
                        type="date"
                        required
                        defaultValue={localDate()}
                        max={localDate()}
                      />
                    </label>
                    <label>
                      Minutes outdoors
                      <input
                        name="minutes"
                        type="number"
                        required
                        min="1"
                        max="1440"
                        defaultValue={selected.duration_minutes}
                      />
                    </label>
                  </div>
                  <label>
                    A field note <span>(optional)</span>
                    <textarea
                      name="note"
                      maxLength={500}
                      placeholder="What did you notice?"
                    />
                  </label>
                  {logError && (
                    <p role="alert" className="form-error">
                      {logError}
                    </p>
                  )}
                  <button disabled={submitting} className="primary">
                    {submitting ? (
                      <LoaderCircle size={17} className="spin" />
                    ) : (
                      <Check size={17} />
                    )}
                    Save to journal
                  </button>
                </form>
              )}
            </div>
          </>
        )}
      </dialog>
      {toast && (
        <div role="status" className="toast">
          <Check size={16} />
          {toast}
        </div>
      )}
    </>
  );
}
function message(error: unknown) {
  return error instanceof Error
    ? error.message
    : "Something went wrong. Please try again.";
}
function localDate() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

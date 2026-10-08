import React, {
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { useAuth } from "@/context/auth";
import { VOICE_AGES } from "@/lib/voiceAges";
import styles from "./voice-picker.module.css";

const PANEL_MIN_WIDTH = 440;
const PANEL_MAX_HEIGHT = 440;
const VIEWPORT_MARGIN = 8;
const PANEL_GAP = 6;
const FAVORITES = "Favorites";
const NO_FILTERS = { gender: "", age: "", nationality: "" };

const capitalize = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

// Favorites are per user, per browser.
function useFavoriteVoices() {
  const { user } = useAuth() || {};
  const storageKey = `pyro-favorite-voices:${user?.uid || "anon"}`;
  const [favorites, setFavorites] = useState([]);

  useEffect(() => {
    try {
      setFavorites(JSON.parse(window.localStorage.getItem(storageKey)) || []);
    } catch (e) {
      setFavorites([]);
    }
  }, [storageKey]);

  const toggle = useCallback(
    (name) => {
      setFavorites((prev) => {
        const next = prev.includes(name)
          ? prev.filter((n) => n !== name)
          : [...prev, name];
        try {
          window.localStorage.setItem(storageKey, JSON.stringify(next));
        } catch (e) {
          // Storage full or disabled — keep the in-memory state anyway.
        }
        return next;
      });
    },
    [storageKey]
  );

  return [favorites, toggle];
}

// Opens below the trigger unless there's clearly more room above, and caps the
// height to the space available so the panel never runs off-screen.
function placePanel(trigger) {
  const r = trigger.getBoundingClientRect();
  const vw = window.innerWidth;
  const vh = window.innerHeight;
  const width = Math.min(Math.max(r.width, PANEL_MIN_WIDTH), vw - VIEWPORT_MARGIN * 2);
  const left = Math.max(
    VIEWPORT_MARGIN,
    Math.min(r.right - width, vw - width - VIEWPORT_MARGIN)
  );
  const below = vh - r.bottom - PANEL_GAP - VIEWPORT_MARGIN;
  const above = r.top - PANEL_GAP - VIEWPORT_MARGIN;
  const openUp = below < 280 && above > below;
  const maxHeight = Math.min(PANEL_MAX_HEIGHT, openUp ? above : below);
  return openUp
    ? { left, width, maxHeight, bottom: vh - r.top + PANEL_GAP }
    : { left, width, maxHeight, top: r.bottom + PANEL_GAP };
}

// One filter button + its menu. The menu is position: fixed so it can extend
// past the picker panel's edge without being clipped.
function FilterMenu({ label, value, options, format, onChange, open, onOpenChange }) {
  const buttonRef = useRef(null);
  const menuRef = useRef(null);
  const [rect, setRect] = useState(null);

  useLayoutEffect(() => {
    if (open && buttonRef.current) setRect(buttonRef.current.getBoundingClientRect());
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (!menuRef.current?.contains(e.target) && !buttonRef.current?.contains(e.target)) {
        onOpenChange(false);
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open, onOpenChange]);

  const pick = (next) => {
    onChange(next);
    onOpenChange(false);
  };

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        className={[
          styles.filterButton,
          value ? styles.filterOn : "",
          open ? styles.filterOpen : "",
        ].join(" ")}
        onClick={() => onOpenChange(!open)}
        onKeyDown={(e) => {
          if (e.key === "Escape" && open) {
            e.stopPropagation();
            onOpenChange(false);
          }
        }}
        aria-haspopup="menu"
        aria-expanded={open}
        data-cy={`voice-filter-${label.toLowerCase()}`}
      >
        <span className={styles.filterButtonText}>{value ? format(value) : label}</span>
        <i className={`bi bi-chevron-down ${styles.filterChevron}`} />
      </button>
      {open && rect && (
        <div
          ref={menuRef}
          role="menu"
          className={styles.filterMenu}
          style={{ top: rect.bottom + 4, left: rect.left, minWidth: rect.width }}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.stopPropagation();
              onOpenChange(false);
              buttonRef.current?.focus();
            }
          }}
        >
          {[["", `Any ${label.toLowerCase()}`], ...options.map((o) => [o, format(o)])].map(
            ([optionValue, text]) => (
              <button
                key={optionValue || "any"}
                type="button"
                role="menuitemradio"
                aria-checked={value === optionValue}
                className={`${styles.filterItem} ${
                  value === optionValue ? styles.filterItemOn : ""
                }`}
                onClick={() => pick(optionValue)}
              >
                <span>{text}</span>
                {value === optionValue && <i className="bi bi-check2" />}
              </button>
            )
          )}
        </div>
      )}
    </>
  );
}

function matches(name, meta, q) {
  if (name.toLowerCase().includes(q)) return true;
  if ((meta?.description || "").toLowerCase().includes(q)) return true;
  return (meta?.categories || []).some((c) => c.toLowerCase().includes(q));
}

export function VoicePicker({
  groups,
  meta,
  value,
  onChange,
  onPreview,
  previewing,
  disabled,
  label = "Voice",
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);
  const [position, setPosition] = useState(null);
  const [filters, setFilters] = useState(NO_FILTERS);
  const [openFilter, setOpenFilter] = useState(null);
  const [favorites, toggleFavorite] = useFavoriteVoices();

  const triggerRef = useRef(null);
  const panelRef = useRef(null);
  const searchRef = useRef(null);
  const optionRefs = useRef([]);
  const baseId = useId();

  const allVoices = useMemo(
    () => [...new Set(groups.flatMap((g) => g.voices))],
    [groups]
  );

  const filtersActive = Object.values(filters).some(Boolean);

  // Dropdown options come from the voices themselves, so an accent only
  // shows up once some voice has it.
  const filterOptions = useMemo(() => {
    const values = (key) =>
      [...new Set(allVoices.map((n) => meta[n]?.[key]).filter(Boolean))];
    return {
      gender: values("gender").sort(),
      age: VOICE_AGES.filter((a) => values("age").includes(a)),
      nationality: values("nationality").sort(),
    };
  }, [allVoices, meta]);

  // Sections to render, plus a flat list of options for keyboard navigation.
  // Filters keep the grouping (and Favorites on top); search flattens it.
  const sections = useMemo(() => {
    const passes = (name) =>
      Object.entries(filters).every(([key, want]) => !want || meta[name]?.[key] === want);
    const favs = favorites.filter((n) => allVoices.includes(n));
    const shown = [
      ...(favs.length ? [{ label: FAVORITES, voices: favs }] : []),
      ...groups,
    ]
      .map((section) => ({ ...section, voices: section.voices.filter(passes) }))
      .filter((section) => section.voices.length > 0);

    const q = query.trim().toLowerCase();
    if (!q) return shown;
    const pool = [...new Set(shown.flatMap((section) => section.voices))];
    const hits = pool.filter((n) => matches(n, meta[n], q));
    return hits.length ? [{ label: null, voices: hits }] : [];
  }, [query, filters, allVoices, meta, favorites, groups]);

  const flat = useMemo(
    () =>
      sections.flatMap((s, si) =>
        s.voices.map((name) => ({ name, key: `${si}-${name}` }))
      ),
    [sections]
  );

  const close = useCallback(() => {
    setOpen(false);
    setOpenFilter(null);
    setQuery("");
    triggerRef.current?.focus();
  }, []);

  const choose = (name) => {
    if (name !== value) onChange(name);
    close();
  };

  useLayoutEffect(() => {
    if (!open) return undefined;
    const update = (e) => {
      // Scrolling the voice list itself doesn't move the trigger; re-placing
      // on it would re-render every frame and snap the list back to the
      // highlighted voice.
      if (e?.type === "scroll" && panelRef.current?.contains(e.target)) return;
      if (!triggerRef.current) return;
      const next = placePanel(triggerRef.current);
      setPosition((prev) =>
        prev &&
        prev.left === next.left &&
        prev.width === next.width &&
        prev.maxHeight === next.maxHeight &&
        prev.top === next.top &&
        prev.bottom === next.bottom
          ? prev
          : next
      );
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("scroll", update, true);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("scroll", update, true);
    };
  }, [open]);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (
        !panelRef.current?.contains(e.target) &&
        !triggerRef.current?.contains(e.target)
      ) {
        setOpen(false);
        setOpenFilter(null);
        setQuery("");
      }
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  // On open, start on the current voice; while typing, start on the first hit.
  useEffect(() => {
    if (!open) return;
    if (query || filtersActive) {
      setActiveIndex(0);
      return;
    }
    const i = flat.findIndex((o) => o.name === value);
    setActiveIndex(Math.max(i, 0));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, query, filters]);

  useEffect(() => {
    if (open) optionRefs.current[activeIndex]?.scrollIntoView({ block: "nearest" });
  }, [open, activeIndex, position]);

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  const onKeyDown = (e) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, flat.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[activeIndex]) choose(flat[activeIndex].name);
    } else if (e.key === "Escape") {
      e.preventDefault();
      close();
    } else if (e.key === "Tab") {
      setOpen(false);
      setQuery("");
    }
  };

  const listId = `${baseId}-list`;
  let optionIndex = -1;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-1)" }}>
      <label className="form-label" htmlFor={`${baseId}-trigger`} style={{ marginBottom: 0 }}>
        {label}
      </label>
      <button
        ref={triggerRef}
        id={`${baseId}-trigger`}
        type="button"
        className={`${styles.trigger} ${open ? styles.triggerOpen : ""}`}
        onClick={() => (open ? close() : setOpen(true))}
        onKeyDown={(e) => {
          if (!open && (e.key === "ArrowDown" || e.key === "ArrowUp")) {
            e.preventDefault();
            setOpen(true);
          }
        }}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        data-cy="voice-picker"
      >
        {favorites.includes(value) && (
          <i className={`bi bi-star-fill ${styles.starOn}`} style={{ fontSize: 12 }} />
        )}
        <span className={styles.triggerName}>
          {disabled ? "Loading voices…" : value || "Choose a voice"}
        </span>
        <i className={`bi bi-chevron-down ${styles.chevron}`} />
      </button>

      {open &&
        position &&
        createPortal(
          <div
            ref={panelRef}
            className={styles.panel}
            style={{
              left: position.left,
              width: position.width,
              maxHeight: position.maxHeight,
              top: position.top,
              bottom: position.bottom,
            }}
          >
            <div className={styles.searchRow}>
              <i className="bi bi-search" />
              <input
                ref={searchRef}
                className={styles.search}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search voices, accents, categories…"
                role="combobox"
                aria-controls={listId}
                aria-expanded="true"
                aria-activedescendant={
                  flat[activeIndex] ? `${baseId}-opt-${activeIndex}` : undefined
                }
                data-cy="voice-picker-search"
              />
            </div>

            <div className={styles.filters} data-cy="voice-picker-filters">
              {[
                ["gender", "Gender", capitalize],
                ["age", "Age", (a) => a],
                ["nationality", "Accent", (n) => n],
              ].map(([key, label, format]) => (
                <FilterMenu
                  key={key}
                  label={label}
                  value={filters[key]}
                  options={filterOptions[key]}
                  format={format}
                  onChange={(next) => setFilters((prev) => ({ ...prev, [key]: next }))}
                  open={openFilter === key}
                  onOpenChange={(isOpen) => setOpenFilter(isOpen ? key : null)}
                />
              ))}
              {filtersActive && (
                <button
                  type="button"
                  className={styles.clear}
                  onMouseDown={(e) => e.preventDefault()}
                  onClick={() => setFilters(NO_FILTERS)}
                >
                  Clear
                </button>
              )}
            </div>

            <ul id={listId} role="listbox" className={styles.list}>
              {flat.length === 0 && (
                <li className={styles.empty}>
                  {query ? `No voices match “${query}”.` : "No voices match these filters."}
                </li>
              )}
              {sections.map((section) => (
                <React.Fragment key={section.label || "results"}>
                  {section.label && (
                    <li role="presentation" className={styles.groupLabel}>
                      {section.label === FAVORITES && (
                        <i className="bi bi-star-fill" style={{ marginRight: 6 }} />
                      )}
                      {section.label}
                    </li>
                  )}
                  {section.voices.map((name) => {
                    optionIndex += 1;
                    const i = optionIndex;
                    const isFav = favorites.includes(name);
                    const isSelected = name === value;
                    const isPlaying = previewing === name;
                    const previewUrl = meta[name]?.previewUrl;
                    return (
                      <li
                        key={flat[i].key}
                        id={`${baseId}-opt-${i}`}
                        ref={(el) => (optionRefs.current[i] = el)}
                        role="option"
                        aria-selected={isSelected}
                        className={[
                          styles.option,
                          i === activeIndex ? styles.optionActive : "",
                          isSelected ? styles.optionSelected : "",
                        ].join(" ")}
                        onMouseMove={() => i !== activeIndex && setActiveIndex(i)}
                        onClick={() => choose(name)}
                        data-cy="voice-option"
                      >
                        <button
                          type="button"
                          className={`${styles.star} ${isFav ? styles.starOn : ""}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(name);
                          }}
                          aria-label={isFav ? `Unfavorite ${name}` : `Favorite ${name}`}
                          aria-pressed={isFav}
                          tabIndex={-1}
                          data-cy="voice-favorite"
                        >
                          <i className={`bi ${isFav ? "bi-star-fill" : "bi-star"}`} />
                        </button>
                        <button
                          type="button"
                          className={`${styles.play} ${isPlaying ? styles.playOn : ""}`}
                          onMouseDown={(e) => e.preventDefault()}
                          onClick={(e) => {
                            e.stopPropagation();
                            if (previewUrl) onPreview?.(name, previewUrl);
                          }}
                          disabled={!previewUrl}
                          aria-label={`Play ${name} preview`}
                          tabIndex={-1}
                          data-cy="voice-preview"
                        >
                          <i className="bi bi-play-fill" />
                        </button>
                        <span className={styles.optionName}>{name}</span>
                        <span className={styles.optionDescription} title={meta[name]?.description}>
                          {meta[name]?.description}
                        </span>
                        <span className={styles.check}>
                          {isSelected && <i className="bi bi-check2" />}
                        </span>
                      </li>
                    );
                  })}
                </React.Fragment>
              ))}
            </ul>
          </div>,
          document.body
        )}
    </div>
  );
}

export default VoicePicker;

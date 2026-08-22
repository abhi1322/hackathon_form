"use client";

import { CheckCircle2, ChevronDown, Search } from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
  type KeyboardEvent,
} from "react";
import { cn } from "@/lib/cn";
import {
  findProblemStatement,
  formatProblemStatementLabel,
  getProblemStatementId,
  type ProblemStatement,
} from "@/lib/problem-statements";

interface ProblemStatementSelectProps {
  id?: string;
  statements: ProblemStatement[];
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  disabled?: boolean;
  placeholder?: string;
}

function MetaChip({ label, value }: { label: string; value: string }) {
  if (!value) return null;
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-border bg-bg px-2.5 py-0.5 text-xs text-text-muted">
      <span className="font-medium text-text">{label}</span>
      {value}
    </span>
  );
}

function StatementMeta({ statement }: { statement: ProblemStatement }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1.5">
      <MetaChip label="Category" value={statement.category} />
      <MetaChip label="Theme" value={statement.theme} />
      <MetaChip label="Deadline" value={statement.deadline} />
      {statement.psNumber ? (
        <MetaChip label="PS" value={statement.psNumber} />
      ) : null}
    </div>
  );
}

function matchesQuery(statement: ProblemStatement, query: string): boolean {
  if (!query) return true;
  const haystack = [
    statement.title,
    statement.psNumber,
    statement.theme,
    statement.organization,
    statement.category,
    statement.serialNo ?? "",
    statement.deadline,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

export function ProblemStatementSelect({
  id,
  statements,
  value,
  onChange,
  onBlur,
  disabled = false,
  placeholder = "Select a problem statement",
}: ProblemStatementSelectProps) {
  const listboxId = useId();
  const containerRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [activeIndex, setActiveIndex] = useState(0);

  const selected = useMemo(
    () => findProblemStatement(statements, value),
    [statements, value],
  );

  const filtered = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();
    return statements.filter((statement) =>
      matchesQuery(statement, normalizedQuery),
    );
  }, [statements, query]);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
        onBlur?.();
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, [open, onBlur]);

  useEffect(() => {
    if (!open) return;
    const timer = window.setTimeout(() => searchRef.current?.focus(), 0);
    return () => window.clearTimeout(timer);
  }, [open]);

  useEffect(() => {
    setActiveIndex(0);
  }, [query, open]);

  function selectStatement(statement: ProblemStatement) {
    onChange(getProblemStatementId(statement));
    setOpen(false);
    setQuery("");
    onBlur?.();
  }

  function handleTriggerKeyDown(event: KeyboardEvent<HTMLButtonElement>) {
    if (disabled) return;

    if (event.key === "ArrowDown" || event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      setOpen(true);
    }
  }

  function handleListKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key === "Escape") {
      event.preventDefault();
      setOpen(false);
      onBlur?.();
      return;
    }

    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) =>
        filtered.length === 0 ? 0 : (current + 1) % filtered.length,
      );
      return;
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) =>
        filtered.length === 0
          ? 0
          : (current - 1 + filtered.length) % filtered.length,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();
      const statement = filtered[activeIndex];
      if (statement) selectStatement(statement);
    }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        aria-controls={listboxId}
        onClick={() => {
          if (disabled) return;
          setOpen((current) => !current);
        }}
        onKeyDown={handleTriggerKeyDown}
        className={cn(
          "flex w-full min-h-11 items-start justify-between gap-3 rounded-[var(--radius-md)] border border-border bg-surface px-3 py-2.5 text-left transition-[border-color] duration-[var(--duration-fast)] focus:outline-none focus:border-primary/40",
          disabled && "cursor-not-allowed opacity-50",
        )}
      >
        <div className="min-w-0 flex-1">
          {selected ? (
            <>
              <p className="text-sm font-medium text-text leading-snug">
                {selected.psNumber ? (
                  <>
                    <span className="text-primary">{selected.psNumber}</span>
                    <span className="text-text-muted"> — </span>
                  </>
                ) : null}
                {selected.title}
              </p>
              <StatementMeta statement={selected} />
            </>
          ) : (
            <p className="text-sm text-text-muted py-0.5">{placeholder}</p>
          )}
        </div>
        <ChevronDown
          className={cn(
            "mt-1 h-4 w-4 shrink-0 text-text-muted transition-transform duration-[var(--duration-fast)]",
            open && "rotate-180",
          )}
        />
      </button>

      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label="Problem statements"
          tabIndex={-1}
          onKeyDown={handleListKeyDown}
          className="absolute z-30 mt-2 w-full overflow-hidden rounded-[var(--radius-lg)] border border-border bg-surface shadow-[var(--shadow-soft)]"
        >
          <div className="border-b border-border p-3">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search title, PS number, theme, organization…"
                className="w-full min-h-11 rounded-[var(--radius-md)] border border-border bg-bg pl-9 pr-3 text-sm text-text placeholder:text-text-muted focus:outline-none focus:border-primary/40"
              />
            </div>
          </div>

          <ul className="max-h-80 overflow-y-auto p-2">
            {filtered.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-text-muted">
                No matching problem statements.
              </li>
            ) : (
              filtered.map((statement, index) => {
                const optionId = getProblemStatementId(statement);
                const isSelected = selected
                  ? getProblemStatementId(selected) === optionId
                  : false;
                const isActive = index === activeIndex;

                return (
                  <li key={`${optionId}-${index}`}>
                    <button
                      type="button"
                      role="option"
                      aria-selected={isSelected}
                      onMouseEnter={() => setActiveIndex(index)}
                      onClick={() => selectStatement(statement)}
                      className={cn(
                        "flex w-full items-start gap-3 rounded-[var(--radius-md)] px-3 py-3 text-left transition-colors duration-[var(--duration-fast)]",
                        isActive && "bg-bg",
                        isSelected && "bg-primary/5",
                      )}
                    >
                      <span className="mt-0.5 shrink-0">
                        {isSelected ? (
                          <CheckCircle2 className="h-4 w-4 text-success" />
                        ) : (
                          <span className="block h-4 w-4 rounded-full border border-border" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-text-muted mb-1">
                          {statement.serialNo ? (
                            <span>S.No. {statement.serialNo}</span>
                          ) : null}
                          {statement.psNumber ? (
                            <span className="font-medium text-primary">
                              {statement.psNumber}
                            </span>
                          ) : null}
                          {statement.category ? (
                            <span>{statement.category}</span>
                          ) : null}
                        </div>
                        <p className="text-sm font-medium text-text leading-snug">
                          {statement.title}
                        </p>
                        {statement.organization ? (
                          <p className="mt-1 text-xs text-text-muted leading-relaxed">
                            {statement.organization}
                          </p>
                        ) : null}
                        <StatementMeta statement={statement} />
                      </div>
                    </button>
                  </li>
                );
              })
            )}
          </ul>

          {selected ? (
            <div className="border-t border-border px-3 py-2 text-xs text-text-muted">
              Selected: {formatProblemStatementLabel(selected)}
            </div>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

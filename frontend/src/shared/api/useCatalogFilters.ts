import { useEffect, useState } from "react";
import { api } from "./client";
import type { CatalogFilters } from "./contracts";

/** Загружает варианты фильтров из текущего каталога БД. */
export function useCatalogFilters() {
  const [options, setOptions] = useState<CatalogFilters | null>(null);
  const [error, setError] = useState("");
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let active = true;
    setError("");
    void api<CatalogFilters>("/restaurants/filters").then(result => {
      if (!Array.isArray(result.cuisines) || !Array.isArray(result.budget?.prices) || !Array.isArray(result.formats)) throw new Error("Не удалось загрузить варианты фильтров");
      if (active) setOptions(result);
    }).catch(e => { if (active) setError(e instanceof Error ? e.message : "Не удалось загрузить фильтры"); });
    return () => { active = false; };
  }, [attempt]);
  return { options, error, retry: () => setAttempt(value => value + 1) };
}

"use client";

import { useMemo } from "react";
import { useCopy } from "./i18n";
import { makeWhen, type When } from "./sessions";

/** 기록에 붙는 시각·묶음 이름 — 언어가 바뀌면 같이 바뀐다 */
export function useWhen(): When {
  const t = useCopy();
  return useMemo(() => makeWhen(t.when), [t]);
}

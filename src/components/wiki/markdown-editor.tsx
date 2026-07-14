"use client";

import dynamic from "next/dynamic";
import { useTheme } from "next-themes";

const MDEditor = dynamic(() => import("@uiw/react-md-editor"), { ssr: false });

export function MarkdownEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (value: string) => void;
}) {
  const { resolvedTheme } = useTheme();

  return (
    <div data-color-mode={resolvedTheme === "dark" ? "dark" : "light"}>
      <MDEditor value={value} onChange={(v) => onChange(v ?? "")} height={420} preview="live" />
    </div>
  );
}

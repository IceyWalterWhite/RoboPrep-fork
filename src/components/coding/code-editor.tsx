"use client";

import dynamic from "next/dynamic";

import { Skeleton } from "@/components/ui/skeleton";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), {
  ssr: false,
  loading: () => <Skeleton className="h-[30rem] w-full rounded-none" />,
});

export function CodeEditor({
  value,
  onChange,
  readOnly = false,
}: {
  value: string;
  onChange?: (value: string) => void;
  readOnly?: boolean;
}) {
  return (
    <div className="bg-ink border-line overflow-hidden rounded-sm border">
      <MonacoEditor
        height="30rem"
        language="python"
        theme="vs-dark"
        value={value}
        onChange={(nextValue) => onChange?.(nextValue ?? "")}
        options={{
          automaticLayout: true,
          minimap: { enabled: false },
          fontSize: 13,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          tabSize: 4,
          insertSpaces: true,
          readOnly,
          padding: { top: 14, bottom: 14 },
        }}
      />
    </div>
  );
}

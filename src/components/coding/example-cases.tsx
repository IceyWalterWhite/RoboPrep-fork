import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CODING_TEST_GROUP_LABELS } from "@/lib/coding/constants";
import type { CodingExample } from "@/types/coding";

/**
 * Visible examples (Week 5 Task 23).
 *
 * Program-mode problems show stdin/stdout pairs. Function/class problems show
 * the structured call and its expected result instead — still visible-only,
 * still authored content, but rendered in a form that matches what the user
 * actually has to implement.
 */
export function ExampleCases({ examples }: { examples: CodingExample[] }) {
  if (examples.length === 0) return null;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Examples</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {examples.map((example, index) => (
          <div key={example.id} className="border-line-subtle rounded-sm border p-4">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <p className="text-ink text-sm font-medium">{example.name || `Example ${index + 1}`}</p>
              {example.structured ? (
                <span className="bg-surface-sunken text-ink-tertiary rounded-full px-2 py-0.5 text-xs">
                  {CODING_TEST_GROUP_LABELS[example.structured.testGroup] ?? example.structured.testGroup}
                </span>
              ) : null}
            </div>
            {example.structured ? (
              <StructuredCase call={example.structured.call} expected={example.structured.expected} note={example.structured.note} />
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <CodeBlock label="Input" value={example.inputData} />
                <CodeBlock label="Expected output" value={example.expectedOutput} />
              </div>
            )}
          </div>
        ))}
      </CardContent>
    </Card>
  );
}

function StructuredCase({ call, expected, note }: { call: string; expected: string; note: string | null }) {
  return (
    <div className="flex flex-col gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <CodeBlock label="Call" value={call} />
        <CodeBlock label="Expected" value={expected} />
      </div>
      {note ? <p className="text-ink-tertiary text-xs leading-relaxed">{note}</p> : null}
    </div>
  );
}

function CodeBlock({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-ink-tertiary mb-1 text-xs">{label}</p>
      <pre className="bg-surface-sunken text-ink-secondary min-h-10 overflow-x-auto rounded-sm px-3 py-2 font-mono text-xs leading-5 whitespace-pre-wrap">
        {value || "(empty)"}
      </pre>
    </div>
  );
}

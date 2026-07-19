import Link from "next/link";

import { Button } from "@nala/ui/components/button";

const FEATURES = [
  {
    title: "Context Management",
    description:
      "Every job description, note, and CV version for an application, in one place.",
  },
  {
    title: "Strategic Alignment",
    description:
      "Résumés and cover letters tailored to each role, without losing professional integrity.",
  },
  {
    title: "Preparation Hub",
    description:
      "Chat over the full history of a hiring process right before the interview.",
  },
];

export default function Page() {
  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-2xl flex-col items-center gap-8 text-center">
        <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
          Take control of your job hunt
        </h1>
        <p className="text-muted-foreground max-w-lg text-balance leading-relaxed">
          Nala centralizes every application, tailors your résumé to each role,
          and keeps you ready for the interview — no spreadsheets, no guesswork.
        </p>

        <Button asChild size="lg" className="px-8 py-4 text-base">
          <Link href="/get-started">Get started</Link>
        </Button>

        <ul className="mt-8 grid gap-6 text-left sm:grid-cols-3">
          {FEATURES.map((feature) => (
            <li key={feature.title} className="flex flex-col gap-1">
              <h2 className="text-sm font-medium">{feature.title}</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

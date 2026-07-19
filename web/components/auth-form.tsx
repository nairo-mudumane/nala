"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { authClient } from "@nala/auth/client";
import {
  type AuthFormValues,
  signInSchema,
  signUpSchema,
} from "@nala/schemas/auth";
import { Button } from "@nala/ui/components/button";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldLabel,
  FieldSeparator,
} from "@nala/ui/components/field";
import { Input } from "@nala/ui/components/input";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@nala/ui/components/tabs";
import { RiAppleFill, RiGoogleFill } from "@remixicon/react";
import { useState } from "react";
import { useForm } from "react-hook-form";

/** Where a successful sign-in lands. */
const AFTER_SIGN_IN = "/jd";

/** This component's own route — used to bounce errors back here. */
const SELF = "/get-started";

type Mode = "login" | "signup";

const COPY = {
  login: {
    tab: "Sign in",
    submit: "Email me a sign-in link",
    hint: "We email you a link — no password to remember.",
  },
  signup: {
    tab: "Create account",
    submit: "Create my account",
    hint: "No password needed. We email you a link to finish signing up.",
  },
} satisfies Record<Mode, Record<string, string>>;

const SOCIAL_PROVIDERS = [
  { id: "google", label: "Google", icon: RiGoogleFill },
  { id: "apple", label: "Apple", icon: RiAppleFill },
] as const;

export function AuthForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<Mode>("login");

  return (
    <main className="flex min-h-svh flex-col items-center justify-center px-6 py-16">
      <div className="flex w-full max-w-sm flex-col gap-6">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Get started with Nala
          </h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            Sign in to your account, or create a new one.
          </p>
        </div>

        <Tabs
          value={mode}
          onValueChange={(value) => setMode(value as Mode)}
          className="gap-6"
        >
          <TabsList className="w-full">
            {(Object.keys(COPY) as Mode[]).map((value) => (
              <TabsTrigger key={value} value={value} className="flex-1">
                {COPY[value].tab}
              </TabsTrigger>
            ))}
          </TabsList>

          {(Object.keys(COPY) as Mode[]).map((value) => (
            <TabsContent
              key={value}
              value={value}
              className="flex flex-col gap-6"
            >
              {/*
                Keyed by mode so switching tabs remounts the form: react-hook-form
                picks up the new resolver and drops any errors left from the
                other tab.
              */}
              <MagicLinkForm
                key={value}
                mode={value}
                initialError={initialError}
              />

              <FieldSeparator>or</FieldSeparator>

              <div className="flex flex-col gap-2">
                {SOCIAL_PROVIDERS.map(({ id, label, icon: Icon }) => (
                  <Button
                    key={id}
                    type="button"
                    variant="outline"
                    className="w-full justify-start"
                    disabled
                  >
                    <Icon className="size-4" aria-hidden />
                    <span>Continue with {label}</span>
                    <span className="text-muted-foreground ml-auto text-xs font-normal">
                      Coming soon
                    </span>
                  </Button>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </main>
  );
}

function MagicLinkForm({
  mode,
  initialError,
}: {
  mode: Mode;
  initialError?: string;
}) {
  const copy = COPY[mode];

  const [sentTo, setSentTo] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(
    initialError ?? null,
  );

  const form = useForm<AuthFormValues>({
    resolver: zodResolver(mode === "signup" ? signUpSchema : signInSchema),
    defaultValues: { email: "", name: "" },
  });

  const { isSubmitting } = form.formState;

  // Absolute URLs: `core` (port 3001) redirects back out to `web` (port 3000),
  // so a relative path would resolve against the wrong origin.
  const absolute = (path: string) =>
    typeof window === "undefined" ? path : `${window.location.origin}${path}`;

  const onSubmit = form.handleSubmit(async (values) => {
    setServerError(null);

    const name = values.name?.trim();

    const { error } = await authClient.signIn.magicLink({
      // Already trimmed and lower-cased by the schema.
      email: values.email,
      // Only used when this email is new; ignored for an existing account.
      // Without it a magic-link user is created with an empty `name`.
      ...(mode === "signup" && name ? { name } : {}),
      callbackURL: absolute(AFTER_SIGN_IN),
      errorCallbackURL: absolute(SELF),
    });

    if (error) {
      setServerError(error.message ?? "Could not send the link. Try again.");
      return;
    }

    setSentTo(values.email);
  });

  if (sentTo) {
    return (
      <div className="flex flex-col gap-4">
        <p className="text-muted-foreground text-sm leading-relaxed">
          We sent a sign-in link to{" "}
          <span className="text-foreground font-medium">{sentTo}</span>. It
          expires in 5 minutes.
        </p>
        <Button
          type="button"
          variant="outline"
          className="w-full"
          onClick={() => {
            setSentTo(null);
            setServerError(null);
            form.reset();
          }}
        >
          Use a different email
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {mode === "signup" ? (
        <Field data-invalid={Boolean(form.formState.errors.name)}>
          <FieldLabel htmlFor="name">Name</FieldLabel>
          <Input
            id="name"
            autoComplete="name"
            placeholder="Your name"
            aria-invalid={Boolean(form.formState.errors.name)}
            disabled={isSubmitting}
            {...form.register("name")}
          />
          <FieldDescription>Optional — how we greet you.</FieldDescription>
          <FieldError errors={[form.formState.errors.name]} />
        </Field>
      ) : null}

      <Field data-invalid={Boolean(form.formState.errors.email)}>
        <FieldLabel htmlFor="email">Email</FieldLabel>
        <Input
          id="email"
          type="email"
          autoComplete="email"
          placeholder="your@email.com"
          aria-invalid={Boolean(form.formState.errors.email)}
          disabled={isSubmitting}
          {...form.register("email")}
        />
        <FieldError errors={[form.formState.errors.email]} />
      </Field>

      <Button type="submit" className="w-full" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : copy.submit}
      </Button>

      {serverError ? (
        <p role="alert" className="text-destructive text-sm">
          {serverError}
        </p>
      ) : (
        <p className="text-muted-foreground text-xs leading-relaxed">
          {copy.hint}
        </p>
      )}
    </form>
  );
}

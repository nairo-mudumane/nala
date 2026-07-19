"use client";

import { Button } from "@nala/ui/components/button";
import { Textarea } from "@nala/ui/components/textarea";
import { RiSendPlaneLine } from "@remixicon/react";
import { useState } from "react";
import { AsideContainer } from "@/components/aside-container";

/**
 * Right aside: the assistant panel — a scrolling transcript with a composer
 * pinned to the bottom, in the shape of the Claude Code VS Code panel.
 */
export function ChatAside() {
  const [input, setInput] = useState("");

  const onSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    // TODO: wire to the assistant endpoint.
    setInput("");
  };

  return (
    <AsideContainer side="right" title="Assistant" closable={false}>
      <div className="flex h-full flex-col">
        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          <p className="text-muted-foreground text-sm">
            Ask about the selected job, or anything about your applications.
          </p>
        </div>

        <form className="border-border border-t p-2" onSubmit={onSubmit}>
          <div className="flex items-end gap-2">
            <Textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Send a message…"
              rows={2}
              className="max-h-40 min-h-16 resize-none"
            />
            <Button
              type="submit"
              size="icon"
              disabled={input.trim().length === 0}
              aria-label="Send message"
            >
              <RiSendPlaneLine className="size-4" />
            </Button>
          </div>
        </form>
      </div>
    </AsideContainer>
  );
}

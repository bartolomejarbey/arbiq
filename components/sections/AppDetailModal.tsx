"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";

export type AppDetail = {
  name: string;
  tagline: string;
  description: string;
  extended: string[];
  useCases: string[];
  highlight?: string;
  comingSoon?: boolean;
};

type Props = {
  app: AppDetail | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export default function AppDetailModal({ app, open, onOpenChange }: Props) {
  if (!app) return null;
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-50 bg-espresso/80 backdrop-blur-sm data-[state=open]:animate-in data-[state=open]:fade-in" />
        <Dialog.Content
          className="fixed left-1/2 top-1/2 z-50 w-[92vw] max-w-2xl -translate-x-1/2 -translate-y-1/2 max-h-[90vh] overflow-y-auto bg-coffee border border-tobacco shadow-[0_30px_80px_rgba(0,0,0,0.6)]"
          aria-describedby={undefined}
        >
          <div className="px-8 pt-8 pb-4 border-b border-tobacco flex items-start justify-between gap-4">
            <div className="min-w-0">
              {app.highlight && (
                <span className={`inline-block px-3 py-1 mb-3 font-mono text-[9px] uppercase tracking-widest ${app.comingSoon ? "bg-rust/20 text-rust" : "bg-olive/20 text-olive"}`}>
                  {app.highlight}
                </span>
              )}
              <Dialog.Title className="font-display italic font-black text-3xl text-moonlight leading-tight">
                {app.name}
              </Dialog.Title>
              <p className="text-caramel font-mono text-[11px] uppercase tracking-widest mt-2">
                {app.tagline}
              </p>
            </div>
            <Dialog.Close asChild>
              <button
                className="text-sandstone hover:text-moonlight shrink-0 p-1"
                aria-label="Zavřít detail aplikace"
              >
                <X size={22} />
              </button>
            </Dialog.Close>
          </div>

          <div className="px-8 py-6 space-y-5">
            <p className="text-sepia leading-relaxed text-base">{app.description}</p>

            {app.extended.map((paragraph, i) => (
              <p key={i} className="text-sepia/85 leading-relaxed">
                {paragraph}
              </p>
            ))}

            {app.useCases.length > 0 && (
              <div className="pt-4">
                <div className="font-mono text-[10px] uppercase tracking-widest text-caramel mb-3">
                  K čemu to slouží
                </div>
                <ul className="space-y-2">
                  {app.useCases.map((uc, i) => (
                    <li key={i} className="flex items-start gap-3 text-sepia text-sm leading-relaxed">
                      <span className="text-caramel mt-1.5 shrink-0">•</span>
                      <span>{uc}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          <div className="px-8 py-5 border-t border-tobacco flex justify-end">
            <Dialog.Close asChild>
              <button className="font-mono text-[11px] uppercase tracking-widest text-sandstone hover:text-caramel transition-colors">
                Zavřít
              </button>
            </Dialog.Close>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

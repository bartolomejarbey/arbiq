"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown, LogIn } from "lucide-react";
import { motion } from "framer-motion";
import { useMode } from "@/lib/mode-context";

const sluzbyLinks = [
  { href: "/sluzby/webove-stranky", label: "Webové stránky" },
  { href: "/sluzby/ziskat-zakazky", label: "Získat zakázky" },
  { href: "/sluzby/firma", label: "Pro firmy" },
  { href: "/sluzby/systemy-na-miru", label: "Systémy na míru" },
  { href: "/sluzby/automatizace", label: "Automatizace firem" },
  { href: "/sluzby/seo", label: "SEO" },
];

const navLinks = [
  { href: "/pripady", label: "Případy" },
  { href: "/aplikace", label: "Aplikace" },
  { href: "/tym", label: "Tým" },
  { href: "/rentgen", label: "Rentgen" },
  { href: "/manifest", label: "Manifest" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSluzbyOpen, setMobileSluzbyOpen] = useState(false);
  const { mode, setMode } = useMode();
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-espresso/85 backdrop-blur-xl border-b border-caramel/10 shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
      initial={{ y: -8 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-3 md:py-4 flex justify-between items-center gap-6">
        <Link href="/" className="block transition-opacity hover:opacity-80 shrink-0" aria-label="ARBIQ — domů">
          <Image
            src="/arbiq-logo.png"
            alt="ARBIQ"
            width={240}
            height={80}
            priority
            className="h-12 md:h-20 w-auto"
          />
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          <Link
            href="/pripady"
            className="text-sepia hover:text-caramel font-mono text-[11px] uppercase tracking-[0.2em] transition-colors"
          >
            Případy
          </Link>

          {/* Služby dropdown */}
          <div
            ref={dropdownRef}
            className="relative"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="text-sepia hover:text-caramel font-mono text-[11px] uppercase tracking-[0.2em] transition-colors flex items-center gap-1"
            >
              Služby
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${dropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {dropdownOpen && (
              <div className="absolute top-full left-0 pt-2">
                <div className="bg-espresso/95 backdrop-blur-xl border border-caramel/15 shadow-[0_10px_40px_rgba(0,0,0,0.5)] min-w-[220px]">
                  {sluzbyLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-5 py-3 text-sepia hover:text-caramel hover:bg-caramel/5 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors border-b border-caramel/5 last:border-b-0"
                      onClick={() => setDropdownOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {navLinks.slice(1).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sepia hover:text-caramel font-mono text-[11px] uppercase tracking-[0.2em] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Klientská zóna CTA + Age toggle */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <Link
            href="/portal/login"
            className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest font-bold hover:bg-caramel-light hover:shadow-[0_0_20px_rgba(201,152,106,0.4)] transition-all"
          >
            <LogIn size={14} strokeWidth={2.5} />
            Klientská zóna
          </Link>
          <div className="flex items-center gap-2">
            <span className="font-mono text-[9px] uppercase tracking-widest text-sandstone">
              REŽIM:
            </span>
            <button
              onClick={() => setMode("mladsi")}
              className={`px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest transition-all ${
                mode === "mladsi"
                  ? "bg-caramel text-espresso font-bold"
                  : "border border-caramel/30 text-caramel hover:bg-caramel hover:text-espresso"
              }`}
            >
              Mladší
            </button>
            <button
              onClick={() => setMode("zkusenejsi")}
              className={`px-3 py-1.5 font-mono text-[9px] uppercase tracking-widest transition-all ${
                mode === "zkusenejsi"
                  ? "bg-caramel text-espresso font-bold"
                  : "border border-caramel/30 text-caramel hover:bg-caramel hover:text-espresso"
              }`}
            >
              Zkušenější
            </button>
          </div>
        </div>

        {/* Mobile hamburger */}
        <button
          className="md:hidden text-caramel"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Menu"
        >
          {mobileOpen ? <X size={28} /> : <Menu size={28} />}
        </button>
      </div>

      {/* Mobile menu */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full left-0 right-0 bg-espresso border-b border-caramel/20">
          <nav className="flex flex-col px-6 py-6 gap-4">
            <Link
              href="/pripady"
              className="text-sepia hover:text-caramel font-mono text-sm uppercase tracking-widest py-2"
              onClick={() => setMobileOpen(false)}
            >
              Případy
            </Link>

            {/* Mobile Služby accordion */}
            <div>
              <button
                onClick={() => setMobileSluzbyOpen(!mobileSluzbyOpen)}
                className="text-sepia hover:text-caramel font-mono text-sm uppercase tracking-widest py-2 flex items-center gap-2 w-full"
              >
                Služby
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${mobileSluzbyOpen ? "rotate-180" : ""}`}
                />
              </button>
              {mobileSluzbyOpen && (
                <div className="pl-4 flex flex-col gap-2 mt-2">
                  {sluzbyLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="text-sepia/70 hover:text-caramel font-mono text-xs uppercase tracking-widest py-1.5"
                      onClick={() => setMobileOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {navLinks.slice(1).map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-sepia hover:text-caramel font-mono text-sm uppercase tracking-widest py-2"
                onClick={() => setMobileOpen(false)}
              >
                {link.label}
              </Link>
            ))}

            <Link
              href="/portal/login"
              className="mt-4 inline-flex items-center justify-center gap-2 bg-caramel text-espresso px-5 py-3 font-mono text-xs uppercase tracking-widest font-bold hover:bg-caramel-light transition-all"
              onClick={() => setMobileOpen(false)}
            >
              <LogIn size={14} strokeWidth={2.5} />
              Klientská zóna
            </Link>
          </nav>
        </div>
      )}
    </motion.header>
  );
}

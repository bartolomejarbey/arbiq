"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useRef, useEffect } from "react";
import { Menu, X, ChevronDown, LogIn } from "lucide-react";
import { motion } from "framer-motion";

const sluzbyLinks = [
  { href: "/sluzby/webove-stranky", label: "Webové stránky" },
  { href: "/sluzby/ziskat-zakazky", label: "Získat zakázky" },
  { href: "/sluzby/firma", label: "Pro firmy" },
  { href: "/sluzby/systemy-na-miru", label: "Systémy na míru" },
  { href: "/sluzby/automatizace", label: "Automatizace firem" },
  { href: "/sluzby/seo", label: "SEO" },
  { href: "/sluzby/geo-ai-viditelnost", label: "GEO — AI viditelnost" },
  { href: "/sluzby/grafika", label: "Grafika" },
];

const tymLinks = [
  { href: "/tym", label: "Tým" },
  { href: "/kariera", label: "Kariéra — hledáme obchodníka" },
];

// Sekvence v desktop navu: Případy → Služby (dropdown) → Aplikace → Tým (dropdown) → Rentgen → Manifest → Kontakt
const navAfterTym = [
  { href: "/rentgen", label: "Rentgen" },
  { href: "/manifest", label: "Manifest" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function Header() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [tymDropdownOpen, setTymDropdownOpen] = useState(false);
  const [mobileSluzbyOpen, setMobileSluzbyOpen] = useState(false);
  const [mobileTymOpen, setMobileTymOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const tymRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
      if (tymRef.current && !tymRef.current.contains(e.target as Node)) {
        setTymDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <motion.header
      className="fixed top-0 left-0 right-0 z-50 bg-espresso/85 backdrop-blur-xl border-b border-caramel/10"
      initial={{ y: -8 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      <div className="max-w-7xl mx-auto px-6 md:px-12 py-3 md:py-4 flex justify-between items-center gap-6">
        <Link href="/" className="block transition-opacity hover:opacity-80 shrink-0" aria-label="ARBIQ — domů">
          <Image
            src="/arbiq-logo.png"
            alt="ARBIQ"
            width={500}
            height={500}
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
                <div className="bg-espresso/95 backdrop-blur-xl border border-caramel/15 min-w-[220px]">
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

          <Link
            href="/aplikace"
            className="text-sepia hover:text-caramel font-mono text-[11px] uppercase tracking-[0.2em] transition-colors"
          >
            Aplikace
          </Link>

          {/* Tým dropdown (Tým + Kariéra) */}
          <div
            ref={tymRef}
            className="relative"
            onMouseEnter={() => setTymDropdownOpen(true)}
            onMouseLeave={() => setTymDropdownOpen(false)}
          >
            <button
              onClick={() => setTymDropdownOpen(!tymDropdownOpen)}
              className="text-sepia hover:text-caramel font-mono text-[11px] uppercase tracking-[0.2em] transition-colors flex items-center gap-1"
            >
              Tým
              <ChevronDown
                size={12}
                className={`transition-transform duration-200 ${tymDropdownOpen ? "rotate-180" : ""}`}
              />
            </button>

            {tymDropdownOpen && (
              <div className="absolute top-full left-0 pt-2">
                <div className="bg-espresso/95 backdrop-blur-xl border border-caramel/15 min-w-[260px]">
                  {tymLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      className="block px-5 py-3 text-sepia hover:text-caramel hover:bg-caramel/5 font-mono text-[11px] uppercase tracking-[0.15em] transition-colors border-b border-caramel/5 last:border-b-0"
                      onClick={() => setTymDropdownOpen(false)}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>

          {navAfterTym.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="text-sepia hover:text-caramel font-mono text-[11px] uppercase tracking-[0.2em] transition-colors"
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Klientská zóna CTA */}
        <div className="hidden md:flex items-center gap-4 shrink-0">
          <Link
            href="/portal/login"
            className="inline-flex items-center gap-2 bg-caramel text-espresso px-4 py-2.5 font-mono text-[11px] uppercase tracking-widest font-bold hover:bg-caramel-light transition-all"
          >
            <LogIn size={14} strokeWidth={2.5} />
            Klientská zóna
          </Link>
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

            <Link
              href="/aplikace"
              className="text-sepia hover:text-caramel font-mono text-sm uppercase tracking-widest py-2"
              onClick={() => setMobileOpen(false)}
            >
              Aplikace
            </Link>

            {/* Mobile Tým accordion */}
            <div>
              <button
                onClick={() => setMobileTymOpen(!mobileTymOpen)}
                className="text-sepia hover:text-caramel font-mono text-sm uppercase tracking-widest py-2 flex items-center gap-2 w-full"
              >
                Tým
                <ChevronDown
                  size={14}
                  className={`transition-transform duration-200 ${mobileTymOpen ? "rotate-180" : ""}`}
                />
              </button>
              {mobileTymOpen && (
                <div className="pl-4 flex flex-col gap-2 mt-2">
                  {tymLinks.map((link) => (
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

            {navAfterTym.map((link) => (
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

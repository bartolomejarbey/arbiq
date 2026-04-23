"use client";

import Image from "next/image";
import DetectiveTag from "@/components/shared/DetectiveTag";
import RevealOnScroll from "@/components/shared/RevealOnScroll";
import StaggerGrid from "@/components/shared/StaggerGrid";
import TeamAvatar from "@/components/shared/TeamAvatar";
import Typewriter from "@/components/shared/Typewriter";

type Member = {
  name: string;
  role: string;
  description: string;
  skills: string[];
  photo?: string;
  initial?: string;
  email?: string;
  phone?: string;
};

const teamMembers: Member[] = [
  {
    name: "Bartoloměj Rota",
    role: "Zakladatel",
    description:
      "Mozek operace. Stratég, vývojář a marketér v jednom. Erudovaný odborník na automatizace a AI.",
    skills: [
      "Marketing",
      "Web development",
      "Vývoj aplikací",
      "Business strategie",
      "Automatizace & AI",
    ],
    photo: "/tym/bartolomej.jpg",
    email: "bartolomej@arbiq.cz",
    phone: "+420 725 932 729",
  },
  {
    name: "Matýáš Petr",
    role: "Kameraman & Střihač",
    description:
      "BMAGIC kamera a aparatura v hodnotě 100 000 Kč. Každý záběr jako z filmu.",
    skills: ["Video produkce", "BMAGIC kamera", "Post-produkce", "Střih"],
    photo: "/tym/petr.jpg",
  },
  {
    name: "Václav Plachejda",
    role: "Developer",
    description:
      "Staví systémy, které šetří stovky hodin. Specialista na automatizace.",
    skills: ["Vývoj aplikací", "Automatizace", "Systémy na míru"],
    initial: "V",
  },
  {
    name: "Fidelio Seidl",
    role: "Key Account Manager",
    description: "Váš první kontakt. Zařídí, aby vše klapalo.",
    skills: ["Klientský servis", "Projektové řízení", "Obchodní jednání"],
    photo: "/tym/fidelio.jpg",
    email: "fidelio@arbiq.cz",
    phone: "+420 739 609 841",
  },
];

export default function TymPage() {
  return (
    <main className="bg-espresso min-h-screen">
      {/* Hero */}
      <section className="pt-32 pb-24 px-6 md:px-12">
        <div className="max-w-7xl mx-auto">
          <RevealOnScroll>
            <DetectiveTag className="mb-6">VYŠETŘOVACÍ TÝM</DetectiveTag>
            <h1 className="font-display font-black text-moonlight text-4xl md:text-6xl lg:text-7xl mb-6">
              Kdo za tím stojí
            </h1>
            <p className="text-sepia/70 max-w-2xl text-lg">
              <Typewriter text="Jeden tým. Čtyři specializace. Žádné anonymní e-maily z call centra." />
            </p>
          </RevealOnScroll>
        </div>
      </section>

      {/* Team Grid */}
      <section className="px-6 md:px-12 pb-32">
        <StaggerGrid className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
          {teamMembers.map((member) => (
            <div
              key={member.name}
              className="bg-coffee border-l-4 border-caramel p-8 shadow-xl hover:-translate-y-2 hover:border-caramel/40 hover:shadow-2xl transition-all duration-500"
            >
              {/* Photo */}
              {member.photo ? (
                <Image
                  src={member.photo}
                  alt={member.name}
                  width={96}
                  height={96}
                  className="w-24 h-24 object-cover mb-6 border border-caramel/20"
                />
              ) : (
                <div className="mb-6">
                  <TeamAvatar initial={member.initial ?? "?"} name={member.name} size={96} />
                </div>
              )}

              {/* Role */}
              <span className="font-mono text-[10px] uppercase tracking-widest text-caramel block mb-2">
                {member.role}
              </span>

              {/* Name */}
              <h2 className="font-display font-black text-2xl text-moonlight mb-3">
                {member.name}
              </h2>

              {/* Description */}
              <p className="text-sepia/80 text-sm leading-relaxed mb-6">
                {member.description}
              </p>

              {/* Skills */}
              <div className="flex flex-wrap gap-2 mb-5">
                {member.skills.map((skill) => (
                  <span
                    key={skill}
                    className="bg-espresso px-2 py-1 font-mono text-[9px] text-sandstone tracking-wider"
                  >
                    {skill}
                  </span>
                ))}
              </div>

              {/* Contact (jen pokud má email/tel) */}
              {(member.email || member.phone) && (
                <div className="pt-4 border-t border-tobacco/60 flex flex-col gap-1.5 text-sm">
                  {member.email && (
                    <a href={`mailto:${member.email}`} className="text-caramel hover:text-caramel-light transition-colors font-mono text-xs">
                      {member.email}
                    </a>
                  )}
                  {member.phone && (
                    <a href={`tel:${member.phone.replace(/\s/g, "")}`} className="text-sepia hover:text-caramel transition-colors font-mono text-xs">
                      {member.phone}
                    </a>
                  )}
                </div>
              )}
            </div>
          ))}
        </StaggerGrid>

        {/* Case File Footer */}
        <div className="max-w-5xl mx-auto mt-20">
          <div className="relative flex items-center justify-center">
            <div className="w-full border-t border-tobacco/40" />
            <div className="absolute bg-espresso px-6">
              <div className="border-2 border-caramel/60 px-6 py-3">
                <span className="font-mono text-[10px] uppercase tracking-widest text-caramel">
                  4 AGENTI V POLI
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

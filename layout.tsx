--- src/components/layout.tsx (原始)


+++ src/components/layout.tsx (修改后)
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Bell, LogOut, Mail, MapPin, Menu, Moon, Phone, Sun, X } from "lucide-react";
import { cn } from "../lib/utils";
import { useStore } from "../lib/store";
import { Logo, LogoMark } from "./widgets";
import { Badge, Button } from "./ui";

/* --------------------------- Header public -------------------------- */

const NAV = [
  { to: "/", label: "Accueil", id: null },
  { to: "/demande", label: "Demander un acte", id: null },
  { to: "/suivi", label: "Suivre une demande", id: null },
  { to: "/actes", label: "Actes disponibles", id: null },
  { to: "/", label: "Comment ça marche ?", id: "process" },
  { to: "/faq", label: "Aide", id: null },
];

export function PublicHeader() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { theme, toggleTheme, session, unreadFor } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const unread = unreadFor(session);

  useEffect(() => {
    const h = () => setScrolled(window.scrollY > 10);
    h();
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);

  useEffect(() => setOpen(false), [location.pathname]);

  const goSection = (id: string) => {
    setOpen(false);
    if (location.pathname !== "/") {
      navigate("/");
      setTimeout(() => document.getElementById(id)?.scrollIntoView({ behavior: "smooth" }), 120);
    } else {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    }
  };

  const spaceLink = session ? (session.role === "STUDENT" ? "/student" : "/admin") : null;

  return (
    <header className={cn("sticky top-0 z-50 border-b transition-all duration-300", scrolled ? "border-line bg-card/95 shadow-[0_4px_20px_-12px_rgb(10_20_40/0.25)] backdrop-blur-md" : "border-transparent bg-transparent")}>
      <div className={cn("mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 transition-all duration-300 sm:px-6", scrolled ? "py-2.5" : "py-4")}>
        <Link to="/" aria-label="FLASH ACTES — Accueil" className="shrink-0">
          <Logo />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Navigation principale">
          {NAV.map((n) =>
            n.id ? (
              <button key={n.label} onClick={() => goSection(n.id!)} className="rounded-lg px-3 py-2 text-[13.5px] font-semibold text-inksoft transition hover:bg-cardsoft hover:text-royal">
                {n.label}
              </button>
            ) : (
              <NavLink
                key={n.label}
                to={n.to}
                end={n.to === "/"}
                className={({ isActive }) =>
                  cn("rounded-lg px-3 py-2 text-[13.5px] font-semibold transition", isActive ? "bg-royalsoft text-royal" : "text-inksoft hover:bg-cardsoft hover:text-royal")
                }
              >
                {n.label}
              </NavLink>
            )
          )}
        </nav>

        <div className="flex items-center gap-2.5">
          <button
            onClick={toggleTheme}
            className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card text-inksoft transition hover:border-royal hover:text-royal"
            aria-label={theme === "dark" ? "Passer en mode clair" : "Passer en mode sombre"}
          >
            {theme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>
          {spaceLink ? (
            <Link to={spaceLink} className="relative hidden items-center gap-2 rounded-lg border border-line bg-card px-3.5 py-2 text-[13px] font-bold text-ink transition hover:border-royal hover:text-royal sm:flex">
              Mon espace
              {unread > 0 && <span className="absolute -right-1.5 -top-1.5 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-goldbright px-1 text-[10px] font-extrabold text-navy">{unread}</span>}
            </Link>
          ) : (
            <Link to="/auth" className="hidden rounded-lg border border-linestrong bg-card px-4 py-2 text-[13px] font-bold text-ink transition hover:border-royal hover:text-royal sm:block">
              Se connecter
            </Link>
          )}
          <Link to="/demande" className="hidden rounded-lg bg-royal px-4 py-2 text-[13px] font-bold text-white shadow-sm shadow-royal/30 transition hover:bg-royaldeep md:block">
            Faire une demande
          </Link>
          <button onClick={() => setOpen((o) => !o)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card text-ink lg:hidden" aria-label="Ouvrir le menu" aria-expanded={open}>
            {open ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {open && (
          <motion.nav
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
            className="overflow-hidden border-t border-line bg-card lg:hidden"
            aria-label="Navigation mobile"
          >
            <div className="space-y-1 px-4 py-4">
              {NAV.map((n) =>
                n.id ? (
                  <button key={n.label} onClick={() => goSection(n.id!)} className="block w-full rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-inksoft hover:bg-cardsoft">
                    {n.label}
                  </button>
                ) : (
                  <NavLink key={n.label} to={n.to} end={n.to === "/"} className="block rounded-lg px-3 py-2.5 text-sm font-semibold text-inksoft hover:bg-cardsoft">
                    {n.label}
                  </NavLink>
                )
              )}
              <div className="flex gap-2 pt-3">
                <Link to={spaceLink ?? "/auth"} className="flex-1 rounded-lg border border-linestrong px-4 py-2.5 text-center text-sm font-bold text-ink">
                  {spaceLink ? "Mon espace" : "Se connecter"}
                </Link>
                <Link to="/demande" className="flex-1 rounded-lg bg-royal px-4 py-2.5 text-center text-sm font-bold text-white">
                  Faire une demande
                </Link>
              </div>
            </div>
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  );
}

/* ------------------------------- Footer ----------------------------- */

export function Footer() {
  return (
    <footer className="relative mt-24 bg-navy text-[#c6d2ea]">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-goldbright/70 to-transparent" />
      <div className="mx-auto grid max-w-[1200px] gap-10 px-4 py-14 sm:px-6 md:grid-cols-[1.4fr_1fr_1fr_1.2fr]">
        <div>
          <span className="flex items-center gap-2.5">
            <LogoMark className="h-10 w-10" />
            <span className="font-display text-lg font-bold text-white">
              FLASH <span className="text-goldbright">ACTES</span>
            </span>
          </span>
          <p className="mt-4 max-w-xs text-[13px] leading-relaxed text-[#8fa2c8]">
            Plateforme numérique de demande et de suivi des actes académiques de la Faculté des Lettres, Arts et Sciences Humaines.
          </p>
          <p className="mt-4 font-display text-[13px] italic text-goldbright">« Vos documents académiques, simplement. »</p>
        </div>
        <nav aria-label="Navigation pied de page">
          <p className="font-display text-[12px] font-bold uppercase tracking-[0.16em] text-white">Navigation</p>
          <ul className="mt-4 space-y-2.5 text-[13px]">
            <li><Link className="transition hover:text-goldbright" to="/demande">Demander un acte</Link></li>
            <li><Link className="transition hover:text-goldbright" to="/suivi">Suivre une demande</Link></li>
            <li><Link className="transition hover:text-goldbright" to="/actes">Actes disponibles</Link></li>
            <li><Link className="transition hover:text-goldbright" to="/verify">Vérifier un document</Link></li>
            <li><Link className="transition hover:text-goldbright" to="/auth">Se connecter</Link></li>
          </ul>
        </nav>
        <nav aria-label="Ressources">
          <p className="font-display text-[12px] font-bold uppercase tracking-[0.16em] text-white">Ressources</p>
          <ul className="mt-4 space-y-2.5 text-[13px]">
            <li><Link className="transition hover:text-goldbright" to="/faq">Foire aux questions</Link></li>
            <li><Link className="transition hover:text-goldbright" to="/contact">Contact & assistance</Link></li>
            <li><Link className="transition hover:text-goldbright" to="/faq">Confidentialité</Link></li>
            <li><Link className="transition hover:text-goldbright" to="/faq">Conditions d'utilisation</Link></li>
          </ul>
        </nav>
        <div>
          <p className="font-display text-[12px] font-bold uppercase tracking-[0.16em] text-white">Scolarité FLASH</p>
          <ul className="mt-4 space-y-3 text-[13px]">
            <li className="flex gap-2.5"><MapPin className="mt-0.5 h-4 w-4 shrink-0 text-goldbright" /> Université de Parakou, BP 123, Parakou — République du Bénin</li>
            <li className="flex gap-2.5"><Phone className="mt-0.5 h-4 w-4 shrink-0 text-goldbright" /> (+229) 23 61 02 44</li>
            <li className="flex gap-2.5"><Mail className="mt-0.5 h-4 w-4 shrink-0 text-goldbright" /> scolarite.flash@up.bj</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="mx-auto flex max-w-[1200px] flex-col items-center justify-between gap-3 px-4 py-5 text-[12px] text-[#7189b3] sm:flex-row sm:px-6">
          <p>© 2026 FLASH — Université de Parakou. Tous droits réservés.</p>
          <Badge tone="gold">Environnement de démonstration · données fictives</Badge>
        </div>
      </div>
    </footer>
  );
}

/* --------------------------- Coquille dashboard --------------------- */

export interface DashNavItem {
  to: string;
  label: string;
  icon: ReactNode;
  end?: boolean;
  section: string;
}

export function DashboardShell({ title, nav, onLogout, children }: { title: string; nav: DashNavItem[]; onLogout: () => void; children: ReactNode }) {
  const [drawer, setDrawer] = useState(false);
  const { session, unreadFor } = useStore();
  const location = useLocation();
  const unread = unreadFor(session);
  useEffect(() => setDrawer(false), [location.pathname]);

  const sections = Array.from(new Set(nav.map((n) => n.section)));
  const initials = (session?.name ?? "?").split(" ").map((p) => p[0]).slice(0, 2).join("").toUpperCase();

  const navList = (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-5" aria-label="Navigation du tableau de bord">
      {sections.map((sec) => (
        <div key={sec}>
          <p className="px-3 pb-2 text-[10.5px] font-bold uppercase tracking-[0.16em] text-[#5f739c]">{sec}</p>
          <ul className="space-y-0.5">
            {nav.filter((n) => n.section === sec).map((n) => (
              <li key={n.to}>
                <NavLink
                  to={n.to}
                  end={n.end}
                  className={({ isActive }) =>
                    cn(
                      "group flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13.5px] font-semibold transition-all",
                      isActive ? "bg-royal/15 text-white shadow-[inset_2px_0_0_var(--color-goldbright)]" : "text-[#aebbdd] hover:bg-white/5 hover:text-white"
                    )
                  }
                >
                  <span className="[&>svg]:h-4.5 [&>svg]:w-4.5">{n.icon}</span>
                  {n.label}
                  {n.label === "Notifications" && unread > 0 && (
                    <span className="ml-auto rounded-full bg-goldbright px-1.5 py-0.5 text-[10px] font-extrabold text-navy">{unread}</span>
                  )}
                </NavLink>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  const userCard = (
    <div className="border-t border-white/10 p-3">
      <div className="flex items-center gap-3 rounded-lg px-2 py-2">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-goldbright font-display text-[12px] font-bold text-navy">{initials}</span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-[13px] font-bold text-white">{session?.name}</span>
          <span className="block truncate text-[11px] text-[#8fa2c8]">{session?.role === "STUDENT" ? "Étudiant" : session?.role === "AGENT" ? "Agent" : session?.role === "SUPERVISOR" ? "Superviseur" : "Administrateur"}</span>
        </span>
        <button onClick={onLogout} className="rounded-lg p-2 text-[#8fa2c8] transition hover:bg-white/10 hover:text-white" aria-label="Se déconnecter" title="Se déconnecter">
          <LogOut className="h-4 w-4" />
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-bg">
      {/* Sidebar desktop */}
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-[248px] flex-col bg-navy lg:flex">
        <div className="flex items-center gap-2.5 border-b border-white/10 px-5 py-4">
          <LogoMark className="h-9 w-9" />
          <span className="leading-none">
            <span className="font-display block text-[15px] font-bold text-white">FLASH <span className="text-goldbright">ACTES</span></span>
            <span className="mt-1 block text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[#5f739c]">{title}</span>
          </span>
        </div>
        {navList}
        {userCard}
      </aside>

      {/* Drawer mobile */}
      <AnimatePresence>
        {drawer && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-navy/70 lg:hidden" onClick={() => setDrawer(false)} />
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: "spring", stiffness: 320, damping: 32 }}
              className="fixed inset-y-0 left-0 z-50 flex w-[268px] flex-col bg-navy lg:hidden"
            >
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <span className="font-display text-[15px] font-bold text-white">FLASH <span className="text-goldbright">ACTES</span></span>
                <button onClick={() => setDrawer(false)} className="rounded-lg p-1.5 text-[#8fa2c8] hover:text-white" aria-label="Fermer le menu">
                  <X className="h-4.5 w-4.5" />
                </button>
              </div>
              {navList}
              {userCard}
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Zone principale */}
      <div className="lg:pl-[248px]">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-line bg-card/95 px-4 py-3 backdrop-blur-md sm:px-6">
          <button onClick={() => setDrawer(true)} className="flex h-9 w-9 items-center justify-center rounded-lg border border-line text-ink lg:hidden" aria-label="Ouvrir le menu">
            <Menu className="h-4.5 w-4.5" />
          </button>
          <div className="min-w-0">
            <p className="truncate font-display text-[15px] font-bold text-ink sm:text-base">{title}</p>
          </div>
          <div className="ml-auto flex items-center gap-2.5">
            <Badge tone="gold" className="hidden sm:inline-flex">Démo</Badge>
            <Link
              to={session?.role === "STUDENT" ? "/student/notifications" : "/admin/notifications"}
              className="relative flex h-9 w-9 items-center justify-center rounded-lg border border-line bg-card text-inksoft transition hover:border-royal hover:text-royal"
              aria-label={`Notifications${unread ? ` (${unread} non lues)` : ""}`}
            >
              <Bell className="h-4 w-4" />
              {unread > 0 && <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-goldbright px-0.5 text-[9.5px] font-extrabold text-navy">{unread}</span>}
            </Link>
          </div>
        </header>
        <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-6 sm:py-8">{children}</main>
      </div>
    </div>
  );
}

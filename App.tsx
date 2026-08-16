--- src/App.tsx (原始)
export default function App() {
  return (
    <div/>
  );
}


+++ src/App.tsx (修改后)
import { lazy, Suspense, useEffect } from "react";
import type { ReactElement } from "react";
import { HashRouter, Navigate, Route, Routes, Link, useLocation } from "react-router-dom";
import { StoreProvider, useStore } from "./lib/store";
import { ToastProvider, Button } from "./components/ui";
import { PublicHeader, Footer } from "./components/layout";
import { LogoMark } from "./components/widgets";
import type { Role } from "./lib/types";

const Home = lazy(() => import("./pages/Home"));
const Apply = lazy(() => import("./pages/Apply"));
const Track = lazy(() => import("./pages/Track"));
const Auth = lazy(() => import("./pages/Auth"));
const StudentSpace = lazy(() => import("./pages/Student"));
const AdminSpace = lazy(() => import("./pages/Admin"));
const ActsPage = lazy(() => import("./pages/PublicPages").then((m) => ({ default: m.ActsPage })));
const FaqPage = lazy(() => import("./pages/PublicPages").then((m) => ({ default: m.FaqPage })));
const ContactPage = lazy(() => import("./pages/PublicPages").then((m) => ({ default: m.ContactPage })));
const VerifyPage = lazy(() => import("./pages/PublicPages").then((m) => ({ default: m.VerifyPage })));

const TITLES: Array<[string, string]> = [
  ["/demande", "Faire une demande d'acte — FLASH ACTES"],
  ["/suivi", "Suivi de demande — FLASH ACTES"],
  ["/actes", "Actes disponibles — FLASH ACTES"],
  ["/faq", "Foire aux questions — FLASH ACTES"],
  ["/contact", "Contact & assistance — FLASH ACTES"],
  ["/verify", "Vérification d'authenticité — FLASH ACTES"],
  ["/auth", "Connexion — FLASH ACTES"],
  ["/student", "Espace étudiant — FLASH ACTES"],
  ["/admin", "Administration — FLASH ACTES"],
];

function useRouteEffects() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0 });
    const found = TITLES.find(([p]) => pathname.startsWith(p));
    document.title = found ? found[1] : "FLASH ACTES — Demande d'actes académiques en ligne | Université de Parakou";
  }, [pathname]);
}

function RequireAuth({ children, roles }: { children: ReactElement; roles?: Role[] }) {
  const { session } = useStore();
  if (!session) return <Navigate to="/auth" replace />;
  if (roles && !roles.includes(session.role)) return <Navigate to={session.role === "STUDENT" ? "/student" : "/admin"} replace />;
  return children;
}

function PageLoader() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 bg-bg">
      <LogoMark className="h-12 w-12 animate-pulse" />
      <span className="h-6 w-6 animate-spin rounded-full border-[3px] border-royal border-t-transparent" role="status" aria-label="Chargement de la page" />
    </div>
  );
}

function NotFound() {
  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[640px] px-4 py-24 text-center">
        <p className="font-display text-[84px] font-bold leading-none text-royal">404</p>
        <h1 className="font-display mt-3 text-2xl font-bold text-ink">Cette page est introuvable</h1>
        <p className="mt-3 text-sm leading-relaxed text-mut">Le lien est peut-être erroné, ou la page a été déplacée lors d'une mise à jour de la plateforme.</p>
        <div className="mt-7 flex justify-center gap-3">
          <Link to="/"><Button>Retour à l'accueil</Button></Link>
          <Link to="/faq"><Button variant="outline">Consulter l'aide</Button></Link>
        </div>
      </main>
      <Footer />
    </div>
  );
}

function Shell() {
  useRouteEffects();
  return (
    <>
      <div className="noise-overlay" aria-hidden />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/demande" element={<Apply />} />
          <Route path="/suivi" element={<Track />} />
          <Route path="/actes" element={<ActsPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/auth" element={<Auth />} />
          <Route
            path="/student/*"
            element={
              <RequireAuth roles={["STUDENT"]}>
                <StudentSpace />
              </RequireAuth>
            }
          />
          <Route
            path="/admin/*"
            element={
              <RequireAuth roles={["AGENT", "SUPERVISOR", "ADMIN"]}>
                <AdminSpace />
              </RequireAuth>
            }
          />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </>
  );
}

export default function App() {
  return (
    <StoreProvider>
      <ToastProvider>
        <HashRouter>
          <Shell />
        </HashRouter>
      </ToastProvider>
    </StoreProvider>
  );
}

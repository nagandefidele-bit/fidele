--- src/pages/Track.tsx (原始)


+++ src/pages/Track.tsx (修改后)
import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, FileDown, LogIn, Search, ShieldAlert } from "lucide-react";
import { PublicHeader, Footer } from "../components/layout";
import { Button, Card, Skeleton, StatusBadge } from "../components/ui";
import { TrackTimeline, Reveal } from "../components/widgets";
import { useStore } from "../lib/store";
import { actById } from "../lib/data";
import { fmtDateTime } from "../lib/utils";
import type { Application } from "../lib/types";

export default function Track() {
  const [params] = useSearchParams();
  const { applications, session } = useStore();
  const [code, setCode] = useState(params.get("ref") ?? "");
  const [query, setQuery] = useState<string | null>(params.get("ref"));
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Application | null | "none">(null);

  const search = (raw: string) => {
    setLoading(true);
    setResult(null);
    setQuery(raw);
    window.setTimeout(() => {
      const norm = raw.trim().toUpperCase();
      const found = applications.find((a) => a.ref.toUpperCase() === norm) ?? applications.find((a) => norm.length >= 6 && a.ref.toUpperCase().endsWith(norm));
      setResult(found ?? "none");
      setLoading(false);
    }, 650);
  };

  useEffect(() => {
    const r = params.get("ref");
    if (r) {
      setCode(r);
      search(r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params]);

  const app = result && result !== "none" ? result : null;

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[860px] px-4 pb-10 pt-12 sm:px-6">
        <Reveal y={18}>
          <p className="eyebrow-rule text-[12px] font-bold uppercase tracking-[0.18em] text-gold">Suivi de dossier</p>
          <h1 className="font-display mt-3 text-[30px] font-bold leading-tight text-ink sm:text-[40px]">Où en est votre demande ?</h1>
          <p className="mt-3 max-w-xl text-[15px] leading-relaxed text-mut">
            Entrez votre code de suivi pour consulter l'évolution de votre dossier en temps réel : étape, date, heure et agent responsable.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (code.trim()) search(code);
            }}
            className="mt-8"
          >
            <label htmlFor="track-code" className="mb-1.5 block text-[13px] font-semibold text-ink">Entrez votre code de suivi</label>
            <div className="flex flex-col gap-3 sm:flex-row">
              <div className="relative flex-1">
                <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4.5 w-4.5 -translate-y-1/2 text-mut" aria-hidden />
                <input
                  id="track-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  placeholder="FLASH-2026-004582"
                  className="h-12 w-full rounded-lg border border-line bg-card pl-11 pr-4 font-mono text-sm font-semibold tracking-wide text-ink placeholder:font-body placeholder:font-normal placeholder:tracking-normal focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20"
                />
              </div>
              <Button size="lg" type="submit" disabled={!code.trim()} className="group sm:min-w-[210px]">
                Suivre ma demande <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Button>
            </div>
            <div className="mt-3.5 flex flex-wrap gap-2">
              {["FLASH-2026-004582", "FLASH-2026-004417", "FLASH-2026-004573"].map((r) => (
                <button key={r} type="button" onClick={() => { setCode(r); search(r); }} className="rounded-full border border-dashed border-linestrong px-3 py-1.5 font-mono text-[11.5px] font-semibold text-mut transition hover:border-royal hover:text-royal">
                  {r}
                </button>
              ))}
            </div>
          </form>
        </Reveal>

        <div className="mt-10" aria-live="polite">
          {loading && (
            <Card className="p-7">
              <div className="flex items-center gap-4">
                <Skeleton className="h-11 w-11 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-3 w-36" />
                </div>
              </div>
              <div className="mt-7 space-y-5">
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-4">
                    <Skeleton className="h-7 w-7 rounded-full" />
                    <Skeleton className="h-4 w-2/3" />
                  </div>
                ))}
              </div>
            </Card>
          )}

          {!loading && result === "none" && (
            <Card className="border-bad/30 p-8 text-center">
              <span className="mx-auto flex h-13 w-13 items-center justify-center rounded-full bg-badsoft p-3 text-bad"><ShieldAlert className="h-6 w-6" /></span>
              <h2 className="font-display mt-4 text-lg font-bold text-ink">Aucun dossier trouvé pour « {query} »</h2>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mut">
                Vérifiez le format du numéro (ex. FLASH-2026-004582). Si le problème persiste, contactez la scolarité : <span className="font-semibold text-ink">scolarite.flash@up.bj</span>.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2.5">
                <Button variant="outline" onClick={() => { setCode("FLASH-2026-004582"); search("FLASH-2026-004582"); }}>Essayer un code de démo</Button>
                <Link to="/contact"><Button variant="ghost">Contacter la scolarité</Button></Link>
              </div>
            </Card>
          )}

          {!loading && app && (
            <Reveal y={22}>
              <Card className="overflow-hidden">
                <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line bg-cardsoft/70 px-6 py-5 sm:px-8">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mut">Dossier</p>
                    <p className="font-mono text-[17px] font-bold text-royal">{app.ref}</p>
                  </div>
                  <StatusBadge status={app.status} className="px-3 py-1 text-[12px]" />
                </div>
                <div className="grid gap-8 px-6 py-7 sm:px-8 md:grid-cols-[1fr_1.6fr]">
                  <dl className="space-y-4 text-sm md:border-r md:border-line md:pr-8">
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">Acte demandé</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{actById(app.actId).name}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">Déposée le</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{fmtDateTime(app.createdAt)}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">Agent responsable</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{app.assignee ?? "En cours d'affectation"}</dd>
                    </div>
                    <div>
                      <dt className="text-[11px] font-bold uppercase tracking-[0.12em] text-mut">Paiement</dt>
                      <dd className="mt-0.5 font-semibold text-ink">{app.payment.status === "CONFIRME" ? "Confirmé" : app.payment.status === "EN_ATTENTE" ? "En attente" : "Échec"} · {app.payment.method}</dd>
                    </div>
                  </dl>
                  <TrackTimeline app={app} />
                </div>
                {(app.status === "DOCUMENT_READY" || app.status === "COMPLETED") && (
                  <div className="flex flex-wrap items-center justify-between gap-4 border-t border-line bg-oksoft/50 px-6 py-5 sm:px-8">
                    <p className="text-sm font-semibold text-ok">Votre document est disponible au téléchargement.</p>
                    {session?.role === "STUDENT" ? (
                      <Link to="/student/documents"><Button variant="ok" size="sm"><FileDown className="h-4 w-4" /> Télécharger depuis mon espace</Button></Link>
                    ) : (
                      <Link to="/auth"><Button variant="ok" size="sm"><LogIn className="h-4 w-4" /> Se connecter pour télécharger</Button></Link>
                    )}
                  </div>
                )}
              </Card>
            </Reveal>
          )}

          {!loading && !result && (
            <Card className="border-dashed p-10 text-center">
              <p className="font-display text-base font-bold text-ink">Votre timeline s'affichera ici</p>
              <p className="mx-auto mt-1.5 max-w-sm text-sm text-mut">6 étapes, de la soumission à la clôture, avec les commentaires de l'administration à chaque mouvement.</p>
            </Card>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}

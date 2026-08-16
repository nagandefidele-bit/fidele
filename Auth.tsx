--- src/pages/Auth.tsx (原始)


+++ src/pages/Auth.tsx (修改后)
import { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, ArrowRight, Fingerprint, KeyRound, Lock, MailCheck, ShieldCheck, Smartphone } from "lucide-react";
import { Logo, LogoMark, Reveal, UPSeal } from "../components/widgets";
import { Button, Card, Field, Input, useToast } from "../components/ui";
import { useStore, TWO_FA_CODE } from "../lib/store";
import { DEMO_PASSWORD } from "../lib/data";
import { cn } from "../lib/utils";

type Mode = "login" | "register" | "recover" | "2fa";

export default function Auth() {
  const [mode, setMode] = useState<Mode>("login");
  const { login, verifyTwoFA, register, session, users } = useStore();
  const { push } = useToast();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [shake, setShake] = useState(0);

  const [reg, setReg] = useState({ name: "", email: "", matricule: "", phone: "", password: "", confirm: "" });
  const [recEmail, setRecEmail] = useState("");
  const [recSent, setRecSent] = useState(false);
  const [code, setCode] = useState("");

  const afterLogin = (role: string) => navigate(role === "STUDENT" ? "/student" : "/admin");

  if (session) {
    return <Navigate to={session.role === "STUDENT" ? "/student" : "/admin"} replace />;
  }

  const doLogin = () => {
    setErr("");
    if (!email.trim() || !password) {
      setErr("Renseignez votre email et votre mot de passe.");
      setShake((s) => s + 1);
      return;
    }
    const r = login(email, password);
    if (!r.ok) {
      setErr(r.error ?? "Connexion impossible.");
      setShake((s) => s + 1);
      return;
    }
    if (r.twoFA) {
      setMode("2fa");
      setCode("");
      push("info", "Vérification en deux étapes", "Saisissez le code reçu sur votre appareil de confiance.");
      return;
    }
    push("success", "Connexion réussie", "Bienvenue sur FLASH ACTES.");
    const u = users.find((x) => x.email.toLowerCase() === email.trim().toLowerCase());
    afterLogin(u?.role ?? "STUDENT");
  };

  const doRegister = () => {
    setErr("");
    if (reg.name.trim().length < 3 || reg.matricule.trim().length < 5) {
      setErr("Nom complet et matricule sont requis.");
      setShake((s) => s + 1);
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(reg.email)) {
      setErr("Adresse email invalide.");
      setShake((s) => s + 1);
      return;
    }
    if (reg.password !== reg.confirm) {
      setErr("Les mots de passe ne correspondent pas.");
      setShake((s) => s + 1);
      return;
    }
    const r = register(reg.name, reg.email, reg.matricule, reg.phone, reg.password);
    if (!r.ok) {
      setErr(r.error ?? "Inscription impossible.");
      setShake((s) => s + 1);
      return;
    }
    push("success", "Compte créé", "Bienvenue ! Votre espace étudiant est prêt.");
    navigate("/student");
  };

  const do2FA = () => {
    const r = verifyTwoFA(code);
    if (!r.ok) {
      setErr(r.error ?? "Code invalide.");
      setShake((s) => s + 1);
      return;
    }
    push("success", "Identité confirmée", "Connexion sécurisée établie.");
    afterLogin("ADMIN");
  };

  const fill = (e: string) => {
    setEmail(e);
    setPassword(DEMO_PASSWORD);
    setErr("");
  };

  return (
    <div className="grid min-h-screen bg-bg lg:grid-cols-[0.9fr_1.1fr]">
      {/* panneau institutionnel */}
      <aside className="relative hidden overflow-hidden bg-navy lg:flex lg:flex-col lg:justify-between lg:p-12">
        <div className="blueprint pointer-events-none absolute inset-0 opacity-[0.14]" aria-hidden />
        <UPSeal className="animate-spin-slow pointer-events-none absolute -bottom-24 -right-24 h-96 w-96 text-goldbright/[0.06]" />
        <Link to="/" className="relative flex items-center gap-3">
          <LogoMark className="h-11 w-11" />
          <span className="leading-none">
            <span className="font-display block text-lg font-bold text-white">FLASH <span className="text-goldbright">ACTES</span></span>
            <span className="mt-1 block text-[10px] font-semibold uppercase tracking-[0.16em] text-[#5f739c]">Université de Parakou</span>
          </span>
        </Link>
        <div className="relative">
          <p className="font-display text-[32px] font-bold leading-tight text-white">
            Vos documents académiques, <span className="text-goldbright">simplement.</span>
          </p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: ShieldCheck, t: "Accès sécurisé", d: "Sessions chiffrées, mots de passe hachés, double authentification pour le personnel." },
              { icon: Smartphone, t: "Pensé mobile", d: "Déposez et suivez vos demandes depuis n'importe quel appareil." },
              { icon: MailCheck, t: "Notifications automatiques", d: "Email, SMS et notifications internes à chaque étape de votre dossier." },
            ].map((f) => (
              <li key={f.t} className="flex gap-3.5">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-goldbright/15 text-goldbright"><f.icon className="h-4.5 w-4.5" /></span>
                <span>
                  <span className="block text-[14px] font-bold text-white">{f.t}</span>
                  <span className="block text-[12.5px] leading-relaxed text-[#8fa2c8]">{f.d}</span>
                </span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-[11.5px] text-[#5f739c]">© 2026 FLASH — Université de Parakou · Environnement de démonstration</p>
      </aside>

      {/* formulaires */}
      <main className="flex items-center justify-center px-4 py-10 sm:px-8">
        <div className="w-full max-w-[440px]">
          <Link to="/" className="mb-6 inline-flex lg:hidden"><Logo /></Link>
          <Link to="/" className="mb-5 inline-flex items-center gap-1.5 text-[13px] font-bold text-mut transition hover:text-royal">
            <ArrowLeft className="h-3.5 w-3.5" /> Retour à l'accueil
          </Link>

          <AnimatePresence mode="wait">
            <motion.div key={mode} initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -12 }} transition={{ duration: 0.28 }}>
              {mode === "login" && (
                <Card className="p-7 sm:p-8">
                  <h1 className="font-display text-2xl font-bold text-ink">Se connecter</h1>
                  <p className="mt-1.5 text-sm text-mut">Accédez à votre espace personnel FLASH ACTES.</p>
                  <div key={shake} className={cn(shake > 0 && "animate-shake")}>
                    <div className="mt-6 space-y-4">
                      <Field label="Adresse email" required>
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="prenom.nom@flash.up.bj" autoComplete="email" onKeyDown={(e) => e.key === "Enter" && doLogin()} />
                      </Field>
                      <Field label="Mot de passe" required>
                        <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" onKeyDown={(e) => e.key === "Enter" && doLogin()} />
                      </Field>
                    </div>
                    {err && <p role="alert" className="mt-3 rounded-lg bg-badsoft px-3.5 py-2.5 text-[12.5px] font-semibold text-bad">{err}</p>}
                    <Button size="lg" className="mt-6 w-full group" onClick={doLogin}>
                      Se connecter <ArrowRight className="h-4.5 w-4.5 transition-transform group-hover:translate-x-1" />
                    </Button>
                  </div>
                  <div className="mt-5 flex items-center justify-between text-[13px]">
                    <button onClick={() => { setMode("recover"); setErr(""); }} className="font-bold text-royal hover:underline">Mot de passe oublié ?</button>
                    <button onClick={() => { setMode("register"); setErr(""); }} className="font-bold text-ink hover:underline">Créer un compte</button>
                  </div>
                  <div className="mt-6 rounded-xl border border-dashed border-linestrong p-4">
                    <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-mut">Comptes de démonstration · mot de passe « {DEMO_PASSWORD} »</p>
                    <div className="mt-3 grid gap-2">
                      {[
                        { label: "Étudiant — Emmanuel TCHALOKO", email: "emmanuel.tchaloko@flash.up.bj" },
                        { label: "Agent — Serge AHOLOU (2FA)", email: "s.aholou@up.bj" },
                        { label: "Administrateur — Dr CODJO (2FA)", email: "p.codjo@up.bj" },
                      ].map((d) => (
                        <button key={d.email} onClick={() => fill(d.email)} className="flex items-center justify-between rounded-lg border border-line bg-card px-3.5 py-2.5 text-left text-[12.5px] font-semibold text-inksoft transition hover:border-royal hover:text-royal">
                          {d.label} <ArrowRight className="h-3.5 w-3.5 text-mut" />
                        </button>
                      ))}
                    </div>
                  </div>
                </Card>
              )}

              {mode === "2fa" && (
                <Card className="p-7 sm:p-8">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-royalsoft text-royal"><Fingerprint className="h-6 w-6" /></span>
                  <h1 className="font-display mt-4 text-2xl font-bold text-ink">Vérification en deux étapes</h1>
                  <p className="mt-1.5 text-sm leading-relaxed text-mut">Un code à 6 chiffres a été envoyé à <span className="font-bold text-ink">{email}</span>. Saisissez-le pour continuer.</p>
                  <div key={shake} className={cn(shake > 0 && "animate-shake")}>
                    <label htmlFor="tfa" className="sr-only">Code de vérification</label>
                    <input
                      id="tfa"
                      value={code}
                      onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      placeholder="······"
                      className="font-display mt-6 h-16 w-full rounded-xl border border-line bg-card text-center text-[28px] font-bold tracking-[0.5em] text-ink focus:border-royal focus:outline-none focus:ring-2 focus:ring-royal/20"
                      onKeyDown={(e) => e.key === "Enter" && do2FA()}
                    />
                    {err && <p role="alert" className="mt-3 rounded-lg bg-badsoft px-3.5 py-2.5 text-[12.5px] font-semibold text-bad">{err}</p>}
                    <p className="mt-3 rounded-lg bg-infosoft px-3.5 py-2.5 text-[12px] font-semibold text-info">Code de démonstration : {TWO_FA_CODE}</p>
                    <Button size="lg" className="mt-5 w-full" onClick={do2FA} disabled={code.length !== 6}>Valider le code</Button>
                  </div>
                  <button onClick={() => { setMode("login"); setErr(""); }} className="mt-5 flex items-center gap-1.5 text-[13px] font-bold text-mut transition hover:text-royal">
                    <ArrowLeft className="h-3.5 w-3.5" /> Retour à la connexion
                  </button>
                </Card>
              )}

              {mode === "register" && (
                <Card className="p-7 sm:p-8">
                  <h1 className="font-display text-2xl font-bold text-ink">Créer un compte étudiant</h1>
                  <p className="mt-1.5 text-sm text-mut">Votre matricule UP est requis pour rattacher votre dossier.</p>
                  <div key={shake} className={cn("mt-6 space-y-4", shake > 0 && "animate-shake")}>
                    <Field label="Nom complet" required><Input value={reg.name} onChange={(e) => setReg({ ...reg, name: e.target.value })} placeholder="Prénom NOM" /></Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Matricule" required><Input value={reg.matricule} onChange={(e) => setReg({ ...reg, matricule: e.target.value })} placeholder="UP-FLASH-2026-001" /></Field>
                      <Field label="Téléphone"><Input value={reg.phone} onChange={(e) => setReg({ ...reg, phone: e.target.value })} placeholder="+229 97 00 00 00" /></Field>
                    </div>
                    <Field label="Adresse email" required><Input type="email" value={reg.email} onChange={(e) => setReg({ ...reg, email: e.target.value })} placeholder="prenom.nom@flash.up.bj" /></Field>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <Field label="Mot de passe" required hint="8 caractères min."><Input type="password" value={reg.password} onChange={(e) => setReg({ ...reg, password: e.target.value })} placeholder="••••••••" /></Field>
                      <Field label="Confirmation" required><Input type="password" value={reg.confirm} onChange={(e) => setReg({ ...reg, confirm: e.target.value })} placeholder="••••••••" /></Field>
                    </div>
                    {err && <p role="alert" className="rounded-lg bg-badsoft px-3.5 py-2.5 text-[12.5px] font-semibold text-bad">{err}</p>}
                    <Button size="lg" className="w-full" onClick={doRegister}>Créer mon compte</Button>
                    <p className="flex items-start gap-2 rounded-lg bg-cardsoft px-3.5 py-2.5 text-[11.5px] leading-relaxed text-mut">
                      <Lock className="mt-0.5 h-3.5 w-3.5 shrink-0" /> Vos identifiants sont hachés et vos données ne sont jamais partagées en dehors de la scolarité de la FLASH.
                    </p>
                  </div>
                  <button onClick={() => { setMode("login"); setErr(""); }} className="mt-5 flex items-center gap-1.5 text-[13px] font-bold text-mut transition hover:text-royal">
                    <ArrowLeft className="h-3.5 w-3.5" /> Déjà un compte ? Se connecter
                  </button>
                </Card>
              )}

              {mode === "recover" && (
                <Card className="p-7 sm:p-8">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-goldsoft text-gold"><KeyRound className="h-6 w-6" /></span>
                  <h1 className="font-display mt-4 text-2xl font-bold text-ink">Récupérer mon mot de passe</h1>
                  {recSent ? (
                    <div className="mt-5 rounded-xl border border-ok/30 bg-oksoft px-4 py-4">
                      <p className="text-sm font-bold text-ok">Lien de réinitialisation envoyé</p>
                      <p className="mt-1 text-[12.5px] leading-relaxed text-inksoft">Si un compte existe pour <span className="font-bold">{recEmail}</span>, vous recevrez un lien sécurisé valable 30 minutes (simulation en environnement de démonstration).</p>
                    </div>
                  ) : (
                    <>
                      <p className="mt-1.5 text-sm leading-relaxed text-mut">Indiquez l'adresse email associée à votre compte : nous vous enverrons un lien de réinitialisation sécurisé.</p>
                      <div className="mt-5">
                        <Field label="Adresse email" required>
                          <Input type="email" value={recEmail} onChange={(e) => setRecEmail(e.target.value)} placeholder="prenom.nom@flash.up.bj" />
                        </Field>
                      </div>
                      <Button size="lg" className="mt-5 w-full" onClick={() => { if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(recEmail)) { setRecSent(true); push("success", "Email envoyé", "Vérifiez votre boîte de réception."); } else push("danger", "Email invalide", "Vérifiez le format de l'adresse."); }}>
                        Envoyer le lien
                      </Button>
                    </>
                  )}
                  <button onClick={() => { setMode("login"); setErr(""); }} className="mt-5 flex items-center gap-1.5 text-[13px] font-bold text-mut transition hover:text-royal">
                    <ArrowLeft className="h-3.5 w-3.5" /> Retour à la connexion
                  </button>
                </Card>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

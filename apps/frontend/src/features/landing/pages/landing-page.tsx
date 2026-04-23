import { Link } from 'react-router-dom';
import { Helmet } from 'react-helmet-async';
import { useTranslation } from 'react-i18next';
import {
  Search,
  Bell,
  FileText,
  Sparkles,
  CheckCircle2,
  ArrowRight,
} from 'lucide-react';
import { LanguageSwitcher } from '@/components/language-switcher';
import { cn } from '@/lib/utils';

export function LandingPage() {
  const { t } = useTranslation('landing');

  return (
    <>
      <Helmet>
        <title>
          {t('common:app.name')} · {t('common:app.tagline')}
        </title>
        <meta name="description" content={t('hero.subtitle')} />
        <meta property="og:title" content={t('common:app.name')} />
        <meta property="og:description" content={t('hero.subtitle')} />
        <meta property="og:type" content="website" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <PublicHeader />
        <main>
          <HeroSection />
          <FeaturesSection />
          <PricingSection />
          <CtaSection />
        </main>
        <PublicFooter />
      </div>
    </>
  );
}

// ─────────────────────────────────────
//   HEADER
// ─────────────────────────────────────

function PublicHeader() {
  const { t } = useTranslation('landing');

  return (
    <header className="sticky top-0 z-50 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center"
            style={{
              boxShadow: '0 0 14px oklch(from var(--primary) l c h / 0.35)',
            }}
          >
            <span className="font-black text-sm text-primary-foreground leading-none">
              L
            </span>
          </div>
          <span className="font-bold tracking-tight text-sm">
            {t('common:app.name')}
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#features" className="hover:text-foreground transition-colors">
            {t('header.features')}
          </a>
          <a href="#pricing" className="hover:text-foreground transition-colors">
            {t('header.pricing')}
          </a>
          <a
            href="mailto:hola@licitapp.com"
            className="hover:text-foreground transition-colors"
          >
            {t('header.contact')}
          </a>
        </nav>

        <div className="flex items-center gap-2">
          <LanguageSwitcher variant="icon" />
          <Link
            to="/login"
            className="hidden sm:inline-block h-8 px-3 text-sm hover:text-foreground text-muted-foreground leading-8"
          >
            {t('header.login')}
          </Link>
          <Link
            to="/register"
            className="h-8 px-3 text-sm bg-primary text-primary-foreground rounded-md font-medium hover:bg-primary/90 flex items-center"
          >
            {t('header.register')}
          </Link>
        </div>
      </div>
    </header>
  );
}

// ─────────────────────────────────────
//   HERO
// ─────────────────────────────────────

function HeroSection() {
  const { t } = useTranslation('landing');

  return (
    <section className="relative overflow-hidden">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 text-xs text-primary mb-6">
          <Sparkles size={12} />
          {t('hero.badge')}
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight max-w-4xl mx-auto">
          {t('hero.titlePart1')}{' '}
          <span className="text-primary">{t('hero.titlePart2')}</span>
        </h1>

        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          {t('hero.subtitle')}
        </p>

        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            to="/register"
            className={cn(
              'h-11 px-6 rounded-md bg-primary text-primary-foreground',
              'font-medium hover:bg-primary/90 flex items-center gap-2'
            )}
          >
            {t('hero.ctaStart')}
            <ArrowRight size={16} />
          </Link>
          <a
            href="#features"
            className={cn(
              'h-11 px-6 rounded-md border border-input',
              'font-medium hover:bg-accent flex items-center'
            )}
          >
            {t('hero.ctaSecondary')}
          </a>
        </div>

        <p className="mt-4 text-xs text-muted-foreground">
          {t('hero.disclaimer')}
        </p>
      </div>
    </section>
  );
}

// ─────────────────────────────────────
//   FEATURES
// ─────────────────────────────────────

function FeaturesSection() {
  const { t } = useTranslation('landing');

  const FEATURES = [
    { icon: Search, key: 'search' },
    { icon: Bell, key: 'alerts' },
    { icon: FileText, key: 'ai' },
  ] as const;

  return (
    <section id="features" className="py-16 sm:py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {t('features.title')}
          </h2>
          <p className="mt-4 text-muted-foreground">{t('features.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div
                key={feature.key}
                className="bg-card border border-border rounded-xl p-6 hover:border-primary/30 transition-colors"
              >
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-lg bg-primary/10 text-primary mb-4">
                  <Icon size={18} />
                </div>
                <h3 className="text-base font-semibold mb-2">
                  {t(`features.items.${feature.key}.title`)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {t(`features.items.${feature.key}.description`)}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────
//   PRICING
// ─────────────────────────────────────

function PricingSection() {
  const { t } = useTranslation('landing');

  const PLANS = [
    {
      key: 'free',
      features: ['search', 'alerts', 'ai', 'support'],
      to: '/register',
      highlighted: false,
    },
    {
      key: 'pro',
      features: ['everything', 'alerts', 'ai', 'export', 'support'],
      to: '/register',
      highlighted: true,
    },
    {
      key: 'enterprise',
      features: ['everything', 'ai', 'integrations', 'manager', 'sla'],
      to: 'mailto:ventas@licitapp.com',
      highlighted: false,
    },
  ] as const;

  return (
    <section id="pricing" className="py-16 sm:py-24 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
            {t('pricing.title')}
          </h2>
          <p className="mt-4 text-muted-foreground">{t('pricing.subtitle')}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {PLANS.map((plan) => {
            const planKey = plan.key;
            return (
              <div
                key={planKey}
                className={cn(
                  'rounded-xl p-6 border flex flex-col relative',
                  plan.highlighted
                    ? 'bg-primary/[0.04] border-primary/50'
                    : 'bg-card border-border'
                )}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-0.5 rounded-full bg-primary text-primary-foreground text-xs font-medium">
                    {t('pricing.mostPopular')}
                  </div>
                )}

                <h3 className="text-lg font-semibold">
                  {t(`pricing.plans.${planKey}.name`)}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {t(`pricing.plans.${planKey}.description`)}
                </p>

                <div className="mt-5">
                  <span className="text-3xl font-bold">
                    {t(`pricing.plans.${planKey}.price`)}
                  </span>
                  {planKey !== 'enterprise' && (
                    <span className="text-sm text-muted-foreground ml-1">
                      {t(`pricing.plans.${planKey}.cadence`)}
                    </span>
                  )}
                </div>

                <ul className="mt-5 space-y-2 flex-1">
                  {plan.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2 text-sm">
                      <CheckCircle2
                        size={14}
                        className="text-primary mt-0.5 shrink-0"
                      />
                      <span>
                        {t(`pricing.plans.${planKey}.features.${feat}`)}
                      </span>
                    </li>
                  ))}
                </ul>

                {plan.to.startsWith('mailto:') ? (
                  <a
                    href={plan.to}
                    className={cn(
                      'mt-6 h-10 rounded-md font-medium text-sm flex items-center justify-center',
                      'border border-input hover:bg-accent'
                    )}
                  >
                    {t(`pricing.plans.${planKey}.cta`)}
                  </a>
                ) : (
                  <Link
                    to={plan.to}
                    className={cn(
                      'mt-6 h-10 rounded-md font-medium text-sm flex items-center justify-center',
                      plan.highlighted
                        ? 'bg-primary text-primary-foreground hover:bg-primary/90'
                        : 'border border-input hover:bg-accent'
                    )}
                  >
                    {t(`pricing.plans.${planKey}.cta`)}
                  </Link>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ─────────────────────────────────────
//   CTA FINAL
// ─────────────────────────────────────

function CtaSection() {
  const { t } = useTranslation('landing');

  return (
    <section className="py-16 sm:py-24 border-t border-border">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
          {t('cta.title')}
        </h2>
        <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
          {t('cta.subtitle')}
        </p>
        <Link
          to="/register"
          className="mt-8 inline-flex items-center gap-2 h-11 px-6 rounded-md bg-primary text-primary-foreground font-medium hover:bg-primary/90"
        >
          {t('cta.button')}
          <ArrowRight size={16} />
        </Link>
      </div>
    </section>
  );
}

// ─────────────────────────────────────
//   FOOTER PÚBLICO
// ─────────────────────────────────────

function PublicFooter() {
  const { t } = useTranslation('landing');

  return (
    <footer className="border-t border-border py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row justify-between gap-6">
          <div>
            <div className="flex items-center gap-2.5 mb-2">
              <div className="w-6 h-6 rounded bg-primary flex items-center justify-center">
                <span className="font-black text-xs text-primary-foreground">
                  L
                </span>
              </div>
              <span className="font-semibold text-sm">
                {t('common:app.name')}
              </span>
            </div>
            <p className="text-xs text-muted-foreground">
              {t('footer.copyright', { year: new Date().getFullYear() })}
            </p>
          </div>

          <nav className="flex flex-wrap gap-x-6 gap-y-2 text-xs text-muted-foreground">
            <Link to="/legal/terms" className="hover:text-foreground">
              {t('footer.terms')}
            </Link>
            <Link to="/legal/privacy" className="hover:text-foreground">
              {t('footer.privacy')}
            </Link>
            <Link to="/legal/cookies" className="hover:text-foreground">
              {t('footer.cookies')}
            </Link>
            <a href="mailto:hola@licitapp.com" className="hover:text-foreground">
              {t('footer.contact')}
            </a>
          </nav>
        </div>
      </div>
    </footer>
  );
}
<template>
  <div class="shell">
    <header class="site-header">
      <div class="container header-inner">
        <NuxtLink to="/" class="brand">
          <span class="brand-mark">MLB</span>
          <span class="brand-text">Explorer</span>
        </NuxtLink>
        <nav class="main-nav">
          <NuxtLink to="/" class="nav-link">Inicio</NuxtLink>
          <NuxtLink to="/ligas" class="nav-link">Ligas</NuxtLink>
          <NuxtLink to="/buscar" class="nav-link">Buscar</NuxtLink>
        </nav>
      </div>
      <div class="header-stripe" />
    </header>

    <main>
      <NuxtPage />
    </main>

    <footer class="site-footer">
      <div class="container footer-inner">
        <p>
          MLB Explorer — Proyecto académico de visualización de datos.
          Fuente: <strong>Baseball Databank</strong> (Chadwick Baseball Bureau), 1871–2015.
        </p>
        <p class="footer-fine">Este sitio no está afiliado a Major League Baseball.</p>
      </div>
    </footer>
  </div>
</template>

<style>
.shell { display: flex; flex-direction: column; min-height: 100vh; }

.site-header {
  position: sticky;
  top: 0;
  z-index: 20;
  background: var(--mlb-blue);
  color: #fff;
}
.header-stripe { height: 4px; background: var(--mlb-red); }

.header-inner {
  display: flex;
  align-items: center;
  justify-content: space-between;
  height: 64px;
}

.brand {
  display: inline-flex;
  align-items: baseline;
  gap: 6px;
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 20px;
  color: #fff;
}
.brand-mark {
  background: var(--mlb-red);
  padding: 2px 8px;
  border-radius: 6px;
  font-size: 15px;
  letter-spacing: 0.06em;
}
.brand-text { letter-spacing: 0.02em; }

.main-nav { display: flex; gap: 28px; }
.nav-link {
  font-size: 14px;
  font-weight: 600;
  color: rgba(255,255,255,0.78);
  padding: 6px 0;
  border-bottom: 2px solid transparent;
}
.nav-link:hover, .nav-link.router-link-exact-active { color: #fff; border-color: var(--mlb-red); }

main { flex: 1; }

.site-footer {
  border-top: 1px solid var(--mlb-gray-200);
  background: var(--mlb-gray-50);
  padding: 28px 0;
  margin-top: 48px;
}
.footer-inner p { margin: 0 0 4px; font-size: 13px; color: var(--mlb-gray-600); }
.footer-fine { font-size: 12px; color: var(--mlb-gray-400); }

@media (max-width: 600px) {
  .main-nav { gap: 16px; }
  .brand-text { display: none; }
}
</style>

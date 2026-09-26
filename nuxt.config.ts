// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-07-15',
  devtools: { enabled: false },
  ssr: true,
  css: ['~/assets/css/main.css'],
  runtimeConfig: {
    cometApiToken: '',
    cometUrl: 'http://cms-una.gt.tc',
    cometWorkspace: 'default'
  },
  // Con `npm run generate` se recorren todos los enlaces y cada página se
  // pre-renderiza con el contenido obtenido de CometCMS en ese momento.
  nitro: {
    prerender: {
      routes: ['/', '/ligas', '/buscar'],
      crawlLinks: true
    }
  },
  hooks: {
    // Agrega al pre-renderizado todas las franquicias y temporadas publicadas
    // en CometCMS (algunas no son alcanzables solo siguiendo enlaces).
    async 'prerender:routes'(ctx) {
      const { NUXT_COMET_URL: url, NUXT_COMET_WORKSPACE: ws = 'default', NUXT_COMET_API_TOKEN: token } = process.env
      if (!url) return
      const res = await fetch(`${url}/api/v1/workspaces/${ws}/content/temporadas?include=liga,franquicia`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!res.ok) return
      const { data } = await res.json()
      for (const t of data) {
        const lg = t.data?.liga?.slug
        const fr = t.data?.franquicia?.slug
        if (!lg || !fr) continue
        ctx.routes.add(`/liga/${lg}/${fr}`)
        ctx.routes.add(`/liga/${lg}/${fr}/${t.slug}`)
      }
    }
  },
  app: {
    head: {
      title: 'MLB Explorer · Archivo Histórico de Equipos',
      meta: [
        { name: 'description', content: 'Explora temporadas históricas de equipos de las Grandes Ligas de Béisbol: ligas, franquicias y estadísticas de cada campaña, con contenido administrado en CometCMS.' }
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&family=Roboto+Condensed:wght@400;700&display=swap' }
      ]
    }
  }
})

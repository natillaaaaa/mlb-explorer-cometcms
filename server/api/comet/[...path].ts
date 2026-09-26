// Proxy hacia CometCMS: el token vive solo en el servidor de Nuxt (Nitro)
export default defineEventHandler(async (event) => {
  const path = getRouterParam(event, 'path')
  const config = useRuntimeConfig()

  return $fetch(`${config.cometUrl}/api/v1/workspaces/${config.cometWorkspace}/${path}`, {
    query: getQuery(event),
    headers: {
      Authorization: `Bearer ${config.cometApiToken}`
    }
  })
})

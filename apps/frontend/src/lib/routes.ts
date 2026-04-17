export const ROUTES = {
  home: '/',
  buscar: '/buscar',
  licitacion: (id: string) => `/licitaciones/${id}`,
  // ...
} as const;
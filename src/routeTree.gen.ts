/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

import { Route as rootRouteImport } from './routes/__root'
import { Route as IndexRouteImport } from './routes/index'
import { Route as BalanceRouteImport } from './routes/balance'
import { Route as DaySheetRouteImport } from './routes/day-sheet'
import { Route as ExpensesRouteImport } from './routes/expenses'
import { Route as ProfileRouteImport } from './routes/profile'
import { Route as RegisterRouteImport } from './routes/register'
import { Route as ReportsRouteImport } from './routes/reports'
import { Route as RoomsRouteImport } from './routes/rooms'
import { Route as StaffRouteImport } from './routes/staff'

const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const BalanceRoute = BalanceRouteImport.update({
  id: '/balance',
  path: '/balance',
  getParentRoute: () => rootRouteImport,
} as any)
const DaySheetRoute = DaySheetRouteImport.update({
  id: '/day-sheet',
  path: '/day-sheet',
  getParentRoute: () => rootRouteImport,
} as any)
const ExpensesRoute = ExpensesRouteImport.update({
  id: '/expenses',
  path: '/expenses',
  getParentRoute: () => rootRouteImport,
} as any)
const ProfileRoute = ProfileRouteImport.update({
  id: '/profile',
  path: '/profile',
  getParentRoute: () => rootRouteImport,
} as any)
const RegisterRoute = RegisterRouteImport.update({
  id: '/register',
  path: '/register',
  getParentRoute: () => rootRouteImport,
} as any)
const ReportsRoute = ReportsRouteImport.update({
  id: '/reports',
  path: '/reports',
  getParentRoute: () => rootRouteImport,
} as any)
const RoomsRoute = RoomsRouteImport.update({
  id: '/rooms',
  path: '/rooms',
  getParentRoute: () => rootRouteImport,
} as any)
const StaffRoute = StaffRouteImport.update({
  id: '/staff',
  path: '/staff',
  getParentRoute: () => rootRouteImport,
} as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/balance': typeof BalanceRoute
  '/day-sheet': typeof DaySheetRoute
  '/expenses': typeof ExpensesRoute
  '/profile': typeof ProfileRoute
  '/register': typeof RegisterRoute
  '/reports': typeof ReportsRoute
  '/rooms': typeof RoomsRoute
  '/staff': typeof StaffRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/balance': typeof BalanceRoute
  '/day-sheet': typeof DaySheetRoute
  '/expenses': typeof ExpensesRoute
  '/profile': typeof ProfileRoute
  '/register': typeof RegisterRoute
  '/reports': typeof ReportsRoute
  '/rooms': typeof RoomsRoute
  '/staff': typeof StaffRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/balance': typeof BalanceRoute
  '/day-sheet': typeof DaySheetRoute
  '/expenses': typeof ExpensesRoute
  '/profile': typeof ProfileRoute
  '/register': typeof RegisterRoute
  '/reports': typeof ReportsRoute
  '/rooms': typeof RoomsRoute
  '/staff': typeof StaffRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/balance'
    | '/day-sheet'
    | '/expenses'
    | '/profile'
    | '/register'
    | '/reports'
    | '/rooms'
    | '/staff'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/balance'
    | '/day-sheet'
    | '/expenses'
    | '/profile'
    | '/register'
    | '/reports'
    | '/rooms'
    | '/staff'
  id:
    | '__root__'
    | '/'
    | '/balance'
    | '/day-sheet'
    | '/expenses'
    | '/profile'
    | '/register'
    | '/reports'
    | '/rooms'
    | '/staff'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  BalanceRoute: typeof BalanceRoute
  DaySheetRoute: typeof DaySheetRoute
  ExpensesRoute: typeof ExpensesRoute
  ProfileRoute: typeof ProfileRoute
  RegisterRoute: typeof RegisterRoute
  ReportsRoute: typeof ReportsRoute
  RoomsRoute: typeof RoomsRoute
  StaffRoute: typeof StaffRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/balance': {
      id: '/balance'
      path: '/balance'
      fullPath: '/balance'
      preLoaderRoute: typeof BalanceRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/day-sheet': {
      id: '/day-sheet'
      path: '/day-sheet'
      fullPath: '/day-sheet'
      preLoaderRoute: typeof DaySheetRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/expenses': {
      id: '/expenses'
      path: '/expenses'
      fullPath: '/expenses'
      preLoaderRoute: typeof ExpensesRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/profile': {
      id: '/profile'
      path: '/profile'
      fullPath: '/profile'
      preLoaderRoute: typeof ProfileRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/register': {
      id: '/register'
      path: '/register'
      fullPath: '/register'
      preLoaderRoute: typeof RegisterRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/reports': {
      id: '/reports'
      path: '/reports'
      fullPath: '/reports'
      preLoaderRoute: typeof ReportsRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/rooms': {
      id: '/rooms'
      path: '/rooms'
      fullPath: '/rooms'
      preLoaderRoute: typeof RoomsRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/staff': {
      id: '/staff'
      path: '/staff'
      fullPath: '/staff'
      preLoaderRoute: typeof StaffRouteImport
      parentRoute: typeof rootRouteImport
    }
  }
}

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  BalanceRoute: BalanceRoute,
  DaySheetRoute: DaySheetRoute,
  ExpensesRoute: ExpensesRoute,
  ProfileRoute: ProfileRoute,
  RegisterRoute: RegisterRoute,
  ReportsRoute: ReportsRoute,
  RoomsRoute: RoomsRoute,
  StaffRoute: StaffRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { createStart } from '@tanstack/react-start'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
  }
}

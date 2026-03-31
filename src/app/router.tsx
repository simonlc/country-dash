import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { Box } from '@mui/material';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { AboutPage } from '@/features/game/routes/AboutPage';
import { GamePage } from '@/features/game/routes/GamePage';

function RootLayout() {
  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Outlet />
      <TanStackRouterDevtools position="bottom-right" />
    </Box>
  );
}

const rootRoute = createRootRoute({
  component: RootLayout,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/',
  component: GamePage,
});

const aboutRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: '/about',
  component: AboutPage,
});

export const routeTree = rootRoute.addChildren([indexRoute, aboutRoute]);

export const router = createRouter({
  routeTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

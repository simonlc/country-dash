import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { Box } from '@mui/material';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
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

export const routeTree = rootRoute.addChildren([indexRoute]);

export const router = createRouter({
  routeTree,
});

declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router;
  }
}

import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router';
import { Box } from '@mui/material';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { GamePage } from '@/routes/GamePage';

function RootLayout() {
  const showDevtools = import.meta.env.DEV;

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <Outlet />
      {showDevtools ? (
        <TanStackRouterDevtools position="bottom-right" />
      ) : null}
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

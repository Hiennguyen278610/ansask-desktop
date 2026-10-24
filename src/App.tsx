import { RouterProvider } from 'react-router';
import { router } from './routes';
import { ToastHost } from './components/layout/ToastHost';

/**
 * App root: Toast là sibling của RouterProvider theo design-system §3.6
 * (Toast render ở z-50 fixed, độc lập route).
 */
export default function App() {
  return (
    <>
      <ToastHost />
      <RouterProvider router={router} />
    </>
  );
}

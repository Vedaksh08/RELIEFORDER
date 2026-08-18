import {
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
} from '@tanstack/react-router'
import App from './App.jsx'
import { AuthProvider } from './lib/AuthContext.jsx'
import { CartProvider } from './lib/CartContext.jsx'
import OrderPage from './order/OrderPage.jsx'
import CartPage from './order/CartPage.jsx'
import MyOrdersPage from './order/MyOrdersPage.jsx'
import AdminPage from './admin/AdminPage.jsx'

const rootRoute = createRootRoute({
  component: () => (
    <AuthProvider>
      <CartProvider>
        <Outlet />
      </CartProvider>
    </AuthProvider>
  ),
})

const route = (path, component) =>
  createRoute({ getParentRoute: () => rootRoute, path, component })

const routeTree = rootRoute.addChildren([
  route('/', App),
  route('/order', OrderPage),
  route('/cart', CartPage),
  route('/orders', MyOrdersPage),
  route('/admin', AdminPage),
  route('/ADMIN', AdminPage), // uppercase entry point
])

export const router = createRouter({
  routeTree,
  defaultPreload: 'intent',
})

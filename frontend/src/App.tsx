import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ProtectedRoute } from './components/ProtectedRoute'
import Dashboard from './pages/Dashboard'

const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ProtectedRoute>
        <Dashboard />
      </ProtectedRoute>
    </QueryClientProvider>
  )
}

export default App

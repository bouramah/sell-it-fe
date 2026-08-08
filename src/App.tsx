import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import { BoutiqueFiche, BoutiquesListe } from './pages/Boutiques'
import Stock from './pages/Stock'
import Utilisateurs from './pages/Utilisateurs'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        <Route index element={<Dashboard />} />
        <Route path="boutiques" element={<BoutiquesListe />} />
        <Route path="boutiques/:id" element={<BoutiqueFiche />} />
        <Route path="stock" element={<Stock />} />
        <Route path="utilisateurs" element={<Utilisateurs />} />
      </Route>
    </Routes>
  )
}

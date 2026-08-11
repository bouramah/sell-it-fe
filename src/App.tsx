import { Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import ProtectedRoute from './components/ProtectedRoute'
import { AuthProvider } from './lib/AuthContext'
import { PermissionsProvider } from './lib/permissions'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import { BoutiqueFiche, BoutiquesListe } from './pages/Boutiques'
import { ProduitFiche, ProduitsListe } from './pages/Produits'
import Fournisseurs from './pages/Fournisseurs'
import Utilisateurs from './pages/Utilisateurs'
import Clients from './pages/Clients'
import PaiementsClients from './pages/PaiementsClients'
import PaiementsFournisseurs from './pages/PaiementsFournisseurs'
import Stock from './pages/Stock'
import Caisse from './pages/Caisse'
import CommandesClients from './pages/CommandesClients'
import CommandesFournisseurs from './pages/CommandesFournisseurs'
import Livraisons from './pages/Livraisons'
import Depenses from './pages/Depenses'
import Dettes from './pages/Dettes'
import Transferts from './pages/Transferts'
import Comptabilite from './pages/Comptabilite'
import Promotions from './pages/Promotions'
import Catalogue from './pages/Catalogue'
import Chatbot from './pages/Chatbot'
import Previsions from './pages/Previsions'
import Reporting from './pages/Reporting'
import Securite from './pages/Securite'
import Parametres from './pages/Parametres'

export default function App() {
  return (
    <AuthProvider>
      <PermissionsProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="boutiques" element={<BoutiquesListe />} />
              <Route path="boutiques/:id" element={<BoutiqueFiche />} />
              <Route path="produits" element={<ProduitsListe />} />
              <Route path="produits/:id" element={<ProduitFiche />} />
              <Route path="fournisseurs" element={<Fournisseurs />} />
              <Route path="utilisateurs" element={<Utilisateurs />} />
              <Route path="clients" element={<Clients />} />
              <Route path="paiements-clients" element={<PaiementsClients />} />
              <Route path="paiements-fournisseurs" element={<PaiementsFournisseurs />} />
              <Route path="stock" element={<Stock />} />
              <Route path="caisse" element={<Caisse />} />
              <Route path="commandes-clients" element={<CommandesClients />} />
              <Route path="commandes-fournisseurs" element={<CommandesFournisseurs />} />
              <Route path="livraisons" element={<Livraisons />} />
              <Route path="depenses" element={<Depenses />} />
              <Route path="dettes" element={<Dettes />} />
              <Route path="transferts" element={<Transferts />} />
              <Route path="comptabilite" element={<Comptabilite />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="catalogue" element={<Catalogue />} />
              <Route path="chatbot" element={<Chatbot />} />
              <Route path="previsions" element={<Previsions />} />
              <Route path="reporting" element={<Reporting />} />
              <Route path="securite" element={<Securite />} />
              <Route path="parametres" element={<Parametres />} />
            </Route>
          </Route>
        </Routes>
      </PermissionsProvider>
    </AuthProvider>
  )
}

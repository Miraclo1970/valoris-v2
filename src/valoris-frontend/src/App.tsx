import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './components/AuthContext';
import { RequireAuth } from './components/RequireAuth';
import { Layout } from './components/Layout';
import { DomeinLayout } from './components/DomeinLayout';
import { LoginPage } from './pages/LoginPage';
import { HomePage } from './pages/HomePage';
import { InrichtingPage } from './pages/InrichtingPage';
import { VeranderingenPage } from './pages/VeranderingenPage';
import { StrategiePage } from './pages/StrategiePage';
import { BeheerPage } from './pages/BeheerPage';

function GeenToegang() {
  return <div style={{ padding: 'var(--space-10)', color: 'var(--color-danger)' }}>Geen toegang voor uw rol.</div>;
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/geen-toegang" element={<GeenToegang />} />

          {/* Home — eigen layout met sidebar */}
          <Route element={<RequireAuth rol="lezer"><Layout /></RequireAuth>}>
            <Route path="/" element={<HomePage />} />
            <Route path="/beheer" element={<RequireAuth rol="beheerder"><BeheerPage /></RequireAuth>} />
          </Route>

          {/* Domein-pagina's — top-bar navigatie */}
          <Route element={<RequireAuth rol="lezer"><DomeinLayout /></RequireAuth>}>
            <Route path="/strategie/:domeinId" element={
              <RequireAuth rol="lezer"><StrategiePage /></RequireAuth>
            } />
            <Route path="/veranderingen/:domeinId" element={
              <RequireAuth rol="redacteur"><VeranderingenPage /></RequireAuth>
            } />
            <Route path="/inrichting/:domeinId" element={
              <RequireAuth rol="beheerder"><InrichtingPage /></RequireAuth>
            } />
          </Route>
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

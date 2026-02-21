import { Routes, Route } from "react-router-dom";
import AppShell from "./components/layout/AppShell.tsx";
import DashboardPage from "./pages/DashboardPage.tsx";
import SkillPage from "./pages/SkillPage.tsx";
import AnalysisPage from "./pages/AnalysisPage.tsx";
import InstallPage from "./pages/InstallPage.tsx";

export default function App() {
  return (
    <AppShell>
      <Routes>
        <Route path="/" element={<DashboardPage />} />
        <Route path="/skills/:slug" element={<SkillPage />} />
        <Route path="/analysis" element={<AnalysisPage />} />
        <Route path="/install" element={<InstallPage />} />
      </Routes>
    </AppShell>
  );
}

import {
  BrowserRouter,
  Route,
  Routes,
} from "react-router-dom";
import MainLayout from "./layouts/MainLayout";
import CandidatesPage from "./pages/CandidatesPage";
import ComparePage from "./pages/ComparePage";
import CoveragePage from "./pages/CoveragePage";
import HomePage from "./pages/HomePage";
import MatchupsPage from "./pages/MatchupsPage";
import PokemonWeaknessAnalysisPage from "./pages/PokemonWeaknessAnalysisPage";
import RankingsPage from "./pages/RankingsPage";
import RecommendationsPage from "./pages/RecommendationsPage";
import SettingsPage from "./pages/SettingsPage";
import TeamsPage from "./pages/TeamsPage";
import TypeWeaknessAnalysisPage from "./pages/TypeWeaknessAnalysisPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<MainLayout />}>
          <Route
            path="/"
            element={<HomePage />}
          />

          <Route
            path="/teams"
            element={<TeamsPage />}
          />

          <Route
            path="/candidates"
            element={<CandidatesPage />}
          />

          <Route
            path="/recommendations"
            element={
              <RecommendationsPage />
            }
          />

          <Route
            path="/rankings"
            element={<RankingsPage />}
          />

          <Route
            path="/matchups"
            element={<MatchupsPage />}
          />

          <Route
            path="/compare"
            element={<ComparePage />}
          />

          <Route
            path="/coverage"
            element={<CoveragePage />}
          />

          <Route
            path="/type-analysis"
            element={<TypeWeaknessAnalysisPage />}
          />

          <Route
            path="/pokemon-analysis"
            element={<PokemonWeaknessAnalysisPage />}
          />

          <Route
            path="/settings"
            element={<SettingsPage />}
          />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

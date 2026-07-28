import CurrentTeamCard from "../components/dashboard/CurrentTeamCard";
import DangerList from "../components/dashboard/DangerList";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardHero from "../components/dashboard/DashboardHero";
import QuickActions from "../components/dashboard/QuickActions";
import RecentTeams from "../components/dashboard/RecentTeams";
import SummaryCards from "../components/dashboard/SummaryCards";

function HomePage() {
  return (
    <div>
      <DashboardHeader />

      <div className="mt-8">
        <DashboardHero />
      </div>

      <div className="mt-6">
        <SummaryCards />
      </div>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
        <CurrentTeamCard />
        <DangerList />
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
        <QuickActions />
        <RecentTeams />
      </section>
    </div>
  );
}
export default HomePage;

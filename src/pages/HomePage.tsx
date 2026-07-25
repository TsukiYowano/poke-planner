import CurrentTeamCard from "../components/dashboard/CurrentTeamCard";
import DangerList from "../components/dashboard/DangerList";
import DashboardHeader from "../components/dashboard/DashboardHeader";
import DashboardHero from "../components/dashboard/DashboardHero";
import DummyDataNotice from "../components/dashboard/DummyDataNotice";
import QuickActions from "../components/dashboard/QuickActions";
import RecentTeams from "../components/dashboard/RecentTeams";
import SummaryCards from "../components/dashboard/SummaryCards";

function HomePage() {
  return (
    <>
      <DashboardHeader />

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8">
        <DashboardHero />

        <SummaryCards />

        <section className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <CurrentTeamCard />
          <DangerList />
        </section>

        <section className="mt-6 grid gap-6 xl:grid-cols-[1fr_1.4fr]">
          <QuickActions />
          <RecentTeams />
        </section>

        <DummyDataNotice />
      </div>
    </>
  );
}

export default HomePage;
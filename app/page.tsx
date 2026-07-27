import CardJoinCreate from "@/components/CardJoinCreate";
import NavBar from "@/components/NavBar";

export default function Home() {
  return <div className="app-gradient-bg h-screen overflow-hidden">
    <NavBar/>
    <div className="w-full h-[calc(100vh-64px)] flex justify-center items-center px-4">

    <CardJoinCreate />
    </div>
  </div>;
}
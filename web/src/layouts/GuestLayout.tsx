import { Outlet } from "react-router-dom";
import { cn } from "../lib/cn";
import { Footer } from "./components/Footer";
import { Header } from "./components/Header";

/**
 * The shell for every public page: marketing header, content, and footer.
 * It only lays out; pages own their content.
 */
export function GuestLayout() {


  return (
    <div className={cn("flex flex-col min-h-screen")}>
      <Header />
      <main
        className={cn(
          "[view-transition-name:page-content] flex-1 w-full"
        )}
      >
        <div className="w-full mx-auto px-3 min-[576px]:max-w-135 min-[768px]:max-w-180 min-[992px]:max-w-240 min-[1200px]:max-w-285 min-[1400px]:max-w-330 flex flex-col gap-6 mt-20">
          <Outlet />
        </div>
      </main>
      <Footer />
    </div>
  );
}

import { Outlet } from "react-router-dom";
import { Container } from "../components/ui";
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
        <Container className={"flex flex-col gap-6 mt-20"}>
          <Outlet />
        </Container>
      </main>
      <Footer />
    </div>
  );
}

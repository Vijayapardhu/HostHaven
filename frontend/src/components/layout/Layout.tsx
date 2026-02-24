import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import FloatingSupportPill from "./FloatingSupportPill";
import MobileBottomNav from "./MobileBottomNav";

interface LayoutProps {
  children: ReactNode;
}

const Layout = ({ children }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <FloatingSupportPill />
      <main className="flex-1 pb-20 md:pb-0">{children}</main>
      <Footer className="hidden md:block" />
      <MobileBottomNav />
    </div>
  );
};

export default Layout;

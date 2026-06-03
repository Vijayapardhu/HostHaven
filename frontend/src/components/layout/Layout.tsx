import { ReactNode } from "react";
import Header from "./Header";
import Footer from "./Footer";
import FloatingSupportPill from "./FloatingSupportPill";
import MobileBottomNav from "./MobileBottomNav";

interface LayoutProps {
  children: ReactNode;
  hideBottomNav?: boolean;
}

const Layout = ({ children, hideBottomNav = false }: LayoutProps) => {
  return (
    <div className="min-h-screen flex flex-col">
      {!hideBottomNav && <Header />}
      {!hideBottomNav && <FloatingSupportPill />}
      <main className={`flex-1 ${hideBottomNav ? '' : 'pb-20 md:pb-0'}`}>{children}</main>
      <Footer className={`hidden ${hideBottomNav ? '' : 'md'}:block`} />
      {!hideBottomNav && <MobileBottomNav />}
    </div>
  );
};

export default Layout;

"use client";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore } from "@/store";
import { menusConfig } from "@/config/menus";
import { managerMenusConfig } from "@/config/manager-menus";
import { ScrollArea } from "@/components/ui/scroll-area";
import SidebarLogo from "../common/logo";
import MenuLabel from "../common/menu-label";
import SingleMenuItem from "./single-menu-item";
import SubMenuHandler from "./sub-menu-handler";
import NestedSubMenu from "../common/nested-menus";
import type { SubMenuItem} from "@/config/menus";
import { useUser } from "@/context/UserContext";
import { usePathname } from "next/navigation";

interface MobileSidebarProps {
  collapsed?: boolean;
  className?: string;
}

const MobileSidebar: React.FC<MobileSidebarProps> = ({ collapsed, className }) => {
  const { sidebarBg, mobileMenu, setMobileMenu } = useSidebarStore();
  const [activeSubmenu, setActiveSubmenu] = useState<number | null>(null);
  const [activeMultiMenu, setMultiMenu] = useState<number | null>(null);
  const pathname = usePathname();
  
  const { models: { userProfileData } } = useUser();
  const isManager = userProfileData?.role === "manager";
  const menus = isManager 
    ? (managerMenusConfig?.sidebarNav?.classic || managerMenusConfig.mainNav || [])
    : menusConfig?.sidebarNav?.classic || [];

  useEffect(() => {
    if (pathname) {
      menus.forEach((item, index) => {
        if (item.href === pathname) {
          setActiveSubmenu(null);
          return;
        }
        
        if (item.child) {
          const childMatch = item.child.some(child => 
            child.href === pathname || pathname.startsWith(child.href)
          );
          
          if (childMatch) {
            setActiveSubmenu(index);
          }
        }
      });
    }
  }, [pathname, menus]);

  const toggleSubmenu = (i) => {
    if (activeSubmenu === i) {
      setActiveSubmenu(null);
    } else {
      setActiveSubmenu(i);
    }
  };

  const toggleMultiMenu = (subIndex) => {
    if (activeMultiMenu === subIndex) {
      setMultiMenu(null);
    } else {
      setMultiMenu(subIndex);
    }
  };

  return (
    <>
      <div
        className={cn(
          "fixed top-0  bg-card h-full w-[248px] z-[9999] ",
          className,
          {
            " -left-[300px] invisible opacity-0  ": !mobileMenu,
            " left-0 visible opacity-100  ": mobileMenu,
          }
        )}
      >
        {sidebarBg !== "none" && (
          <div
            className=" absolute left-0 top-0   z-[-1] w-full h-full bg-cover bg-center opacity-[0.07]"
            style={{ backgroundImage: `url(${sidebarBg})` }}
          ></div>
        )}
        <SidebarLogo collapsed={collapsed} />
        <ScrollArea
          className={cn("sidebar-menu  h-[calc(100%-80px)] ", {
            "px-4": !collapsed,
          })}
        >
          <ul
            className={cn("", {
              " space-y-2 text-center": collapsed,
            })}
          >
            {menus.map((item, i) => (
              <li key={`menu_key_${i}`}>
                {!item.child && !item.isHeader && (
                  <SingleMenuItem item={item as unknown as SubMenuItem} collapsed={collapsed} />
                )}
                {item.isHeader && !item.child && !collapsed && (
                  <MenuLabel item={item} />
                )}
                {item.child && (
                  <>
                    <SubMenuHandler
                      item={item as unknown as SubMenuItem}
                      toggleSubmenu={toggleSubmenu}
                      index={i}
                      activeSubmenu={activeSubmenu}
                      collapsed={collapsed}
                    />

                    {!collapsed && (
                      <NestedSubMenu
                        toggleMultiMenu={toggleMultiMenu}
                        activeMultiMenu={activeMultiMenu}
                        activeSubmenu={activeSubmenu}
                        item={item}
                        index={i}
                        collapsed={collapsed}
                      />
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </ScrollArea>
      </div>
      {mobileMenu && (
        <div
          onClick={() => setMobileMenu(false)}
          className="overlay bg-black/60 backdrop-filter backdrop-blur-sm opacity-100 fixed inset-0 z-[999]"
        ></div>
      )}
    </>
  );
};

export default MobileSidebar;

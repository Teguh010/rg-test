"use client";
import { Icon } from "@iconify/react";
import { cn } from "@/lib/utils";
import type { SubMenuItem } from "@/config/menus";
import { useSidebarStore } from "@/store";

interface SubMenuHandlerProps {
  item: SubMenuItem;
  toggleSubmenu: (index: number) => void;
  index: number;
  activeSubmenu: number;
  collapsed: boolean;
}

const SubMenuHandler: React.FC<SubMenuHandlerProps> = ({
  item,
  toggleSubmenu,
  index,
  activeSubmenu,
  collapsed,
}) => {
  const { title } = item;
  const { setMobileMenu } = useSidebarStore();

  const handleClick = () => {
    toggleSubmenu(index);
  };

  return (
    <>
      {collapsed ? (
        <div className="inline-flex cursor-pointer items-center justify-center data-[state=open]:bg-primary-100 data-[state=open]:text-primary w-12 h-12 rounded-md">
          <item.icon className="w-6 h-6" />
        </div>
      ) : (
        <div
          onClick={handleClick}
          className={cn(
            "flex text-default-700 font-medium text-sm capitalize px-[10px] py-3 rounded cursor-pointer transition-all duration-100 hover:bg-primary hover:text-primary-foreground group",
            {
              "bg-primary text-primary-foreground": activeSubmenu === index,
            }
          )}
        >
          <div className="flex-1 gap-3 flex items-start">
            <span className="inline-flex items-center text-lg">
              <item.icon className="w-5 h-5" />
            </span>
            <div>{title}</div>
          </div>
          <div className="flex-0">
            <div
              className={cn(
                "text-base rounded-full flex justify-center items-center transition-all duration-300 group-hover:text-primary-foreground",
                {
                  "rotate-90": activeSubmenu === index,
                  "text-default-500": activeSubmenu !== index,
                }
              )}
            >
              <Icon
                icon="heroicons:chevron-right-20-solid"
                className="h-5 w-5"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubMenuHandler;

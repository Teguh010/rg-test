import { 
  LayoutDashboard, 
  Users, 
  Building2, 
  Settings 
} from "lucide-react";

export const getManagerMenus = (hasSelectedCustomer = false) => {
  const baseMenus = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      href: "/manager/dashboard"
    },
    {
      title: "Modules",
      icon: Settings,
      child: [
        {
          title: "Module Overview",
          href: "/manager/moduleoverview",
          icon: LayoutDashboard,
        },
        {
          title: "All Modules",
          href: "/manager/modulelist",
          icon: LayoutDashboard,
        },
      ]
    },
    {
      title: "Customers",
      icon: Building2,
      child: [
        {
          title: "Customer",
          href: "/manager/customerlist",
          icon: Building2,
        },
      ]
    }
  ];

  const customerDependentMenus = [
     {
      title: "Users",
      icon: Users,
      child: [
        {
          title: "User List",
          href: "/manager/userlist",
          icon: Users,
        },
      ]
    },
    {
      title: "Objects",
      icon: Building2,
      child: [
        {
          title: "Valid Raw Messages",
          href: "/manager/validrawmessages",
          icon: Building2,
        },
      ]
    }
  ];

  return {
    mainNav: hasSelectedCustomer ? [...baseMenus, ...customerDependentMenus] : baseMenus,
    sidebarNav: {
      classic: hasSelectedCustomer 
        ? [
            { isHeader: true },
            ...baseMenus,
            ...customerDependentMenus
          ]
        : [
            { isHeader: true },
            ...baseMenus
          ]
    }
  };
};

export const managerMenusConfig = getManagerMenus(true);

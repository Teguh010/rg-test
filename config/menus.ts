import { ReactElement } from "react";
import {
  DashBoard,
  Map,
  ClipBoard,
  PretentionChartLine
} from "@/public/svg";

interface SubMenuItem {
  title: string;
  href: string;
  icon: React.ElementType;
}

interface MenuItem {
  isHeader?: boolean;
  title: string;
  icon?: ReactElement;
  href?: string;
  isOpen?: boolean;
  isHide?: boolean;
  child?: SubMenuItem[];
}

interface MenuConfig {
  mainNav: MenuItem[];
  managerNav: MenuItem[];
  sidebarNav: {
    classic: MenuItem[];
  };
}

export const menusConfig: MenuConfig = {
  mainNav: [
    {
      title: "general.home",
      icon: DashBoard,
      child: [
        {
          title: "general.map",
          href: "/map",
          icon: Map,
        },
        // {
        //   title: "Map Testing",
        //   href: "/map_testing",
        //   icon: Map,
        // },
      ],
    },
    {
      title: "general.reports",
      icon: ClipBoard,
      child: [
        {
          title: "general.object_overview",
          href: "/objectoverview",
          icon: PretentionChartLine,
        },
        {
          title: "trips_and_stops.trip_and_stop",
          href: "/tripsandstops",
          icon: PretentionChartLine,
        },
        {
          title: "general.scheduled",
          href: "/scheduled",
          icon: PretentionChartLine,
        },
        {
          title: "general.route",
          href: "/map-route",
          icon: PretentionChartLine,
        },
        {
          title: "general.geocode_processor",
          href: "/geocode-processor",
          icon: PretentionChartLine,
        },
        {
          title: "general.valid_raw_message",
          href: "/validrawmessage",
          icon: PretentionChartLine,
        },
        /* {
          title: "general.valid_raw_message_virtualized",
          href: "/validrawmessagevirtualized",
          icon: PretentionChartLine,
        }, */
        {
          title: "general.fuel_report",
          href: "/fuel-report",
          icon: PretentionChartLine,
        },
        {
          title: "general.object_distance_fuel_engine_hours",
          href: "/object-distance-fuel-engine-hours",
          icon: PretentionChartLine,
        },
      ],
    },
    {
      title: "general.tachograph",
      icon: ClipBoard,
      child: [
        {
          title: "general.tachograph_drivers",
          href: "/tachograph?search=drivers",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_vehicles",
          href: "/tachograph?search=vehicles",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_files",
          href: "/tachograph-files",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_live",
          href: "/tachograph-live",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_faults_and_events",
          href: "/tachograph-faults-and-events",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_read_statuses",
          href: "/tachograph-read-statuses",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_distance_driven_stats",
          href: "/tachograph-distance-driven-stats",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_driving_stats_by_driver_card_data",
          href: "/tachograph-driving-stats-by-driver-card-data",
          icon: PretentionChartLine,
        },
        {
          title: "general.tachograph_new_test",
          href: "/tachograph-new-test",
          icon: PretentionChartLine,
        },
        {
          title: "general.timeline_test",
          href: "/timeline-test",
          icon: PretentionChartLine,
        },
      ],
    },
    {
      title: "general.administration",
      icon: ClipBoard,
      child: [
        {
          title: "general.workers",
          href: "/worker",
          icon: PretentionChartLine,
        },
        {
          title: "general.object_group",
          href: "/groups",
          icon: PretentionChartLine,
        },
        {
          title: "general.object_rename",
          href: "/objectrename",
          icon: PretentionChartLine,
        },
      ],
    }
  ],
  managerNav: [
    {
      title: "Module",
      icon: DashBoard,
      child: [
        {
          title: "Module Overview",
          href: "/manager/moduleoverview",
          icon: Map,
        },
        {
          title: "Module List",
          href: "/manager/modulelist",
          icon: Map,
        },
        {
          title: "Manufacturer List",
          href: "/manager/manufacturerlist",
          icon: Map,
        },
      ],
    },
    {
      title: "Customer",
      icon: ClipBoard,
      child: [
        {
          title: "Customers",
          href: "/manager/customerlist",
          icon: PretentionChartLine,
        },
      ],
    },
  ],
  sidebarNav: {
    classic: [
      {
        isHeader: true,
        title: "general.menu",
      },
      {
        title: "Home",
        icon: DashBoard,
        child: [
          {
            title: "Map",
            href: "/map",
            icon: Map,
          },
          // {
          //   title: "Map Testing",
          //   href: "/map_testing",
          //   icon: Map,
          // },
        ],
      },
      {
        title: "Reports",
        icon: ClipBoard,
        child: [
          {
            title: "Object Overview",
            href: "/objectoverview",
            icon: PretentionChartLine,
          },
          {
            title: "Trips and Stops",
            href: "/tripsandstops",
            icon: PretentionChartLine,
          },
          {
            title: "Scheduled",
            href: "/scheduled",
            icon: PretentionChartLine,
          },
          {
            title: "Map Route",
            href: "/map-route",
            icon: PretentionChartLine,
          },
          {
            title: "Geocode Processor",
            href: "/geocode-processor",
            icon: PretentionChartLine,
          },
          {
            title: "Valid Raw Message",
            href: "/validrawmessage",
            icon: PretentionChartLine,
          },
          /* {
            title: "Valid Raw Message (Virtualized)",
            href: "/validrawmessagevirtualized",
            icon: PretentionChartLine,
          }, */
          {
            title: "Fuel Report",
            href: "/fuel-report",
            icon: PretentionChartLine,
          },
          {
            title: "general.object_distance_fuel_engine_hours",
            href: "/object-distance-fuel-engine-hours",
            icon: PretentionChartLine,
          },
        ],
      },
      {
        title: "Tachograph",
        icon: ClipBoard,
        child: [
          {
            title: "Tachograph Drivers",
            href: "/tachograph?search=drivers",
            icon: PretentionChartLine,
          },
          {
            title: "Tachograph Vehicles",
            href: "/tachograph?search=vehicles",
            icon: PretentionChartLine,
          },
          {
            title: "Tachograph Files",
            href: "/tachograph-files",
            icon: PretentionChartLine,
          },
          {
            title: "Tachograph Live",
            href: "/tachograph-live",
            icon: PretentionChartLine,
          },
          {
            title: "Tachograph Faults and Events",
            href: "/tachograph-faults-and-events",
            icon: PretentionChartLine,
          },
          {
            title: "Tachograph Read Statuses",
            href: "/tachograph-read-statuses",
            icon: PretentionChartLine,
          },
          {
            title: "Tachograph Driving Stats by Driver Card Data",
            href: "/tachograph-driving-stats-by-driver-card-data",
            icon: PretentionChartLine,
          },
          {
            title: "Timeline Test",
            href: "/timeline-test",
            icon: PretentionChartLine,
          },
        ],
      },
      {
        title: "Administration",
        icon: ClipBoard,
        child: [
          {
            title: "Workers",
            href: "/worker",
            icon: PretentionChartLine,
          },
          {
            title: "Object Group",
            href: "/groups",
            icon: PretentionChartLine,
          },
          {
            title: "general.object_rename",
            href: "/objectrename",
            icon: PretentionChartLine,
          },
        ],
      }
    ],
  },
};

export type { MenuConfig, MenuItem, SubMenuItem };

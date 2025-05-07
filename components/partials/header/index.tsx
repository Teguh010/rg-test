import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { useSidebarStore, useThemeStore } from "@/store";
import { useMediaQuery } from "@/hooks/use-media-query";
import ThemeButton from "./theme-button";
import ProfileInfo from "./profile-info";
import HorizontalMenu from "./horizontal-menu";
import Language from "./language";
import MobileMenuHandler from "./mobile-menu-handler";
import ClassicHeader from "./layout/classic-header";
import FullScreen from "./full-screen";
import Refresh from "./refresh";
import Image from "next/image";
import Link from "next/link";
import logo from "@/public/images/logo/logo_mini_tracegrid.png";
import { useRouter } from 'next/navigation';
import { useUser } from "@/context/UserContext";
import { useSelectedCustomerStore } from "@/store/selected-customer";
import { selectCustomer } from "@/models/manager/session";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import CustomSelect from "@/components/partials/manager-header/custom-select";
import { getManagerMenus } from "@/config/manager-menus";

interface NavToolsProps {
  isDesktop: boolean;
  sidebarType: string;
}

const NavTools: React.FC<NavToolsProps> = ({ isDesktop, sidebarType }) => {
  const router = useRouter();
  const [clickCount, setClickCount] = useState(0);
  const [lastClickTime, setLastClickTime] = useState(0);

  const handleHiddenButtonClick = () => {
    const currentTime = Date.now();
    
    // Reset count if more than 1 second has passed since last click
    if (currentTime - lastClickTime > 1000) {
      setClickCount(1);
    } else {
      setClickCount(prev => prev + 1);
    }
    
    setLastClickTime(currentTime);
  };

  useEffect(() => {
    if (clickCount === 7) {
      router.push('/translations-trG207');
      setClickCount(0); // Reset count after redirect
    }
  }, [clickCount, router]);

  return (
    <div className="nav-tools flex items-center gap-1 sm:gap-2">
      {/* Hidden Button */}
      <button
        type="button"
        onClick={handleHiddenButtonClick}
        style={{
          width: '24px',
          height: '24px',
          opacity: 0,
          cursor: 'pointer',
          marginRight: '-20px',
        }}
        aria-hidden="true"
      />

      {<Language />}
      {isDesktop && <Refresh />}
      {isDesktop && <FullScreen />}
      {/* <ThemeButton /> */}
      {/* <Inbox />
      <NotificationMessage /> */}

      <div className="pl-1">
        <ProfileInfo />
      </div>
      {!isDesktop && sidebarType !== "module" && <MobileMenuHandler />}
    </div>
  );
};

interface HeaderProps {
  handleOpenSearch: () => void;
}

const Header: React.FC<HeaderProps> = ({ handleOpenSearch }) => {
  const { sidebarType, setSidebarType } = useSidebarStore();
  const { navbarType } = useThemeStore();
  const isDesktop = useMediaQuery("(min-width: 1280px)");
  const { models: { userProfileData }, operations: { getUserRef } } = useUser();
  const isManager = userProfileData?.role === "manager";
  const { t } = useTranslation();
  
  const { 
    selectedCustomerId, 
    setSelectedCustomer,
    customers
  } = useSelectedCustomerStore();
  
  const [selectedValue, setSelectedValue] = useState(selectedCustomerId?.toString() || '');

  const customerOptions = customers.map(customer => ({
    value: customer.id.toString(),
    label: customer.name
  }));

  const handleCustomerSelect = async (value) => {
    if (!isManager) return;
    
    setSelectedValue(value);
    const currentUser = getUserRef();
    if (!currentUser?.token) return;

    try {
      const customer = customers.find(c => c.id === Number(value));
      if (!customer) return;

      const response = await selectCustomer(currentUser.token, customer.id);
      if (response?.success) {
        setSelectedCustomer(customer.id, customer.name);
      } else {
        toast.error(t("error.select_customer"));
      }
    } catch (error) {
      console.error('Error selecting customer:', error);
      toast.error(t("error.select_customer"));
    }
  };

  const hasSelectedCustomer = !!selectedCustomerId;
  const managerMenus = getManagerMenus(hasSelectedCustomer);

  // set header style to classic if isDesktop
  useEffect(() => {
    if (!isDesktop) {
      setSidebarType("classic");
    }
  }, [isDesktop, setSidebarType]);

  return (
    <ClassicHeader
      className={cn(" ", {
        "sticky top-0 z-50": navbarType === "sticky",
      })}
    >
      {/* <div className="w-full bg-card/90 backdrop-blur-lg lg:px-6 px-[15px] py-3 border-b">
        <div className="flex justify-between items-center h-full">
          <HorizontalHeader handleOpenSearch={handleOpenSearch} />
        </div>
      </div> */}
      {isDesktop ? (
        <div className="bg-card bg-card/90 backdrop-blur-lg w-full px-6 shadow-md  flex justify-between">
          <HorizontalMenu customMenus={managerMenus} />
          <NavTools
            isDesktop={isDesktop}
            sidebarType={sidebarType}
          />
        </div>
      ) :
        <div className="w-full  bg-card/90 backdrop-blur-lg lg:px-6 px-[15px] py-[6px] border-b">
          <div className="flex justify-between items-center h-full">
            <div className="flex items-center gap-2">
            <Link
              href={userProfileData?.role === "manager" ? '/manager/dashboard' : '/map'}
              className=" text-primary flex items-center gap-2"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Image
                src={logo}
                alt=""
                objectFit="cover"
                className=" mx-auto text-primary h-8 w-8"
              />
            </Link>
             {userProfileData?.role === "manager" && (
              <CustomSelect
                value={selectedValue}
                onChange={handleCustomerSelect}
                options={customerOptions}
                placeholder={t("select_customer")}
                className='min-w-[200px]'
                onClear={() => setSelectedValue('')}
              />
            )}
            </div>
            <div>
            <NavTools isDesktop={isDesktop} sidebarType={sidebarType}/>
            </div>
          </div>
        </div>
      }
    </ClassicHeader>
  );
};

export default Header;

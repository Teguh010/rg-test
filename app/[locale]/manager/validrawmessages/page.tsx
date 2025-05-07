"use client";
import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { controller } from "./controller";
import { Button } from "@/components/ui/button";
import DatePickerWithRange from "@/components/partials/pickers/date-picker-with-range";
import VehiclePicker from "@/components/partials/pickers/vehicle-picker";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import loadHereMaps from "@/components/maps/here-map/utils/here-map-loader";
import { useTranslation } from "react-i18next";
import { SettingsPicker } from "./components/settings-picker";
import { Label } from "@radix-ui/react-label";
import { firstUpperLetter } from "@/lib/utils";
import { useSelectedCustomerStore } from "@/store/selected-customer";
/* import { Card, CardContent } from "@/components/ui/card";
import Timeline from "@/components/timeline"; */

const HereMap = dynamic(() => import("./HereMap"), { ssr: false });

const ValidRawMessage = () => {
  const { t } = useTranslation();
  const [mapLoaded, setMapLoaded] = useState(false);
  const { models, operations } = controller();
  const [selectedRowData, setSelectedRowData] = useState([]);
  const [isMapVisible, setIsMapVisible] = useState(true);
    const selectedCustomerId = useSelectedCustomerStore((state) => state.selectedCustomerId);

  useEffect(() => {
    loadHereMaps(() => setMapLoaded(true));
  }, []);

  if (!models.user || models.isLoading) {
    return <LayoutLoader />;
  }

  if (!selectedCustomerId) {
    return (
      <div className="text-center h-[calc(100vh-200px)]">
        <div className="text-center p-6 bg-gray-50 rounded-lg shadow-sm">
          <p className="text-gray-600">
            {firstUpperLetter(t("Customer Required, Please Select Customer"))}
          </p>
        </div>
      </div>
    );
  }

  const toggleMapVisibility = () => {
    setIsMapVisible(!isMapVisible);
  };

  const pickers = () => {
    return (
      <>
        <div className="flex flex-col lg:flex-row justify-start gap-2">
          <VehiclePicker
            vehicles={models.dataObjectList}
            setVehicle={operations.setVehicle}
          />
          <DatePickerWithRange
            setStartDate={operations.setStartDate}
            setEndDate={operations.setEndDate}
            startDate={models.startDate}
            endDate={models.endDate}
            settings={models.settings}
          />
          <SettingsPicker
            datatypeList={models.datatypeList}
            ioIdsFilter={models.ioIdsFilter}
            setIoIdsFilter={operations.setIoIdsFilter}
            setNumberRows={operations.setNumberRows}
            numberRows={models.numberRows}
            setGenerate={operations.setGenerate}
          />
          <Button
            variant="outline"
            color="success"
            size="sm"
            className="h-8"
            disabled={
              models.isGenerate ||
              !models.vehicle ||
              !models.startDate ||
              !models.endDate
            }
            onClick={() => operations.setGenerate(true)}
          >
            <span className="capitalize">
              {models.isGenerate
                ? t("general.generating")
                : t("general.generate")}
            </span>
          </Button>
          <Button
            variant="outline"
            color="success"
            size="sm"
            className="h-8 show-hide-button"
            onClick={toggleMapVisibility}
            disabled={selectedRowData.length === 0}
          >
            <span className="capitalize">
              {isMapVisible ? t("general.hide_map") : t("general.show_map")}
            </span>
          </Button>
        </div>
      </>
    );
  };

  /*   const totals = () => {
    return (
      models.dataTimeline.length > 0 && (
        <div className="lg:w-full">
          <div className="grid grid-cols-1 pb-4">
            <Card>
              <CardContent>
                <Timeline
                  data={models.dataTimeline}
                  yLength={models.yLengthTimeline}
                  colorCode={models.colorCodeTimeline}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      )
    );
  }; */

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <Label className="font-normal">
            {firstUpperLetter(t("general.valid_raw_message"))}
          </Label>
        </div>
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <div className="absolute bottom-10 right-10">
            <div className="border-2 border-gray-400 rounded-lg">
              {isMapVisible && selectedRowData.length > 0 && (
                <HereMap vehicleList={selectedRowData} />
              )}
            </div>
          </div>
          <AdvancedTable
            ifSelect
            dataList={models.dataValidRawMessages}
            ignoreList={models.ignoreList}
            pickers={pickers}
            ifPagination={false}
            styleRowList={models.styleRowList}
            styleColumnList={models.styleColumnList}
            onSelectedRowsChange={setSelectedRowData}
            //totals={totals}
          />
        </div>
      </div>
    </div>
  );
};

export default ValidRawMessage;

"use client";
import { controller } from "./controller";
import { Button } from "@/components/ui/button";
import DatePickerWithRange from "@/components/partials/pickers/date-picker-with-range";
import LayoutLoader from "@/components/layout-loader";
import AdvancedTable from "@/components/partials/advanced";
import { useTranslation } from "react-i18next";
import DriversPicker from "@/components/partials/pickers/drivers-picker";
/* import { useCallback } from "react"; */
import React from "react";
import SwitchPicker from "./components/switch-picker";
import { Label } from "@radix-ui/react-label";
import { firstUpperLetter } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
/* const Pickers = React.memo(({ models, operations, t }: any) => {
  return (
    <div className="flex flex-col lg:flex-row justify-start gap-2">
      <VehiclesPicker
        vehicles={models.dataObjectList}
        setVehicles={operations.setVehicles}
      />
      <DatePickerWithRange
        setStartDate={operations.setStartDate}
        setEndDate={operations.setEndDate}
        startDate={models.startDate}
        endDate={models.endDate}
        settings={models.settings}
        onlyDate={true}
        range="month"
      />
      <Button
        variant="outline"
        color="success"
        size="sm"
        className="h-8"
        disabled={
          models.isGenerate ||
          !models.startDate ||
          !models.endDate ||
          models.vehicles.length === 0
        }
        onClick={() => operations.setGenerate(true)}
      >
        <span className="capitalize">
          {models.isGenerate ? t("generating") : t("generate")}
        </span>
      </Button>
    </div>
  );
}); */

const page = () => {
  const { t } = useTranslation();
  const { models, operations } = controller();

  // Usamos useCallback para devolver una función estable que retorna el componente Pickers
  /*   const renderPickers = useCallback(() => {
    return <Pickers models={models} operations={operations} t={t} />;
  }, [models, operations, t]);*/

  if (!models.user || models.isLoading || !models.dataList) {
    return <LayoutLoader />;
  }

  const pickers = () => {
    return (
      <>
        <div className="flex flex-col lg:flex-row justify-start gap-2">
          <DriversPicker
            vehicles={models.dataObjectList}
            setVehicles={operations.setVehicles}
          />
          <DatePickerWithRange
            setStartDate={operations.setStartDate}
            setEndDate={operations.setEndDate}
            startDate={models.startDate}
            endDate={models.endDate}
            settings={models.settings}
          />
          <SwitchPicker handleCheckedChange={operations.handleCheckedChange} />
          <Button
            variant="outline"
            color="success"
            size="sm"
            className="h-8"
            disabled={models.isGenerate || !models.startDate || !models.endDate}
            onClick={() => operations.setGenerate(true)}
          >
            <span className="capitalize">
              {models.isGenerate
                ? t("general.generating")
                : t("general.generate")}
            </span>
          </Button>
        </div>
      </>
    );
  };

  return (
    <div className="space-y-6">
      <div className="col-span-12 lg:col-span-12 overflow-x-auto">
        <Label className="font-normal">
          {firstUpperLetter(t("general.tachograph_driving_stats_by_driver_card_data"))}
        </Label>
      </div>
      {models.dataList.length === 0 ? (
        <div className="col-span-12 lg:col-span-12 overflow-x-auto">
          <AdvancedTable
            dataList={models.dataList}
            ignoreList={models.ignoreList}
            pickers={pickers}
          />
        </div>
      ) : (
        models.dataList.map((item, index) => (
          <div className="grid grid-cols-12 gap-6" key={index}>
            <div className="col-span-12 lg:col-span-12 overflow-x-auto">
              <AdvancedTable
                dataList={item.data}
                ignoreList={models.ignoreList}
                pickers={index === 0 ? pickers : null}
                label={`${item.driver.full_name} - ${item.driver.card_num}`}
              />
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default page;

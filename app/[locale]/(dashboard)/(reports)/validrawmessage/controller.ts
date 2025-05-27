"use client";
import { useEffect, useState, useMemo, useCallback } from "react";
import { useUser } from "@/context/UserContext";
import { objectList, objectValidRawMessage } from "@/models/object";
import {
  cleanObjectsColumns,
  firstUpperLetter,
  reorderObject,
  sortArray,
  translateObjects,
} from "@/lib/utils";
import { useTranslation } from "react-i18next";
import { format } from "date-fns";
import toast from "react-hot-toast";
import { datatypeList } from "@/models/datatype";

export const controller = () => {
  const { t } = useTranslation();
  const {
    models: { user, settings },
    operations: { getUserRef },
  } = useUser();

  const { unitDistance, unitVolume, dateFormat, timeFormat } = useMemo(() => {
    interface Defaults {
      unitDistance: string;
      unitVolume:   string;
      dateFormat:   string;
      timeFormat:   string;
    }
  
    const defaults: Defaults = {
      unitDistance: "km",
      unitVolume:   "l",
      dateFormat:   "yyyy-MM-dd",
      timeFormat:   "HH:mm:ss",
    };
    return settings.reduce((acc, { title, value }) => {
      if (title === "unit_distance") acc.unitDistance = String(value);
      else if (title === "unit_volume") acc.unitVolume = String(value);
      else if (title === "date_format") acc.dateFormat = String(value);
      else if (title === "time_format") acc.timeFormat = String(value);
      return acc;
    }, defaults);
  }, [settings]);

  /*** Estados ***/
  const [isLoading, setLoading] = useState(true);
  const [dataObjectList, setDataObjectList] = useState<any[]>([]);
  const [dataDatatypeList, setDataDatatypeList] = useState<any[]>([]);
  const [dataValidRawMessages, setDataValidRawMessages] = useState<any[]>([]);
  const [numberRows, setNumberRows] = useState(1000);
  const [vehicle, setVehicle] = useState<string | null>(null);
  const [startDate, setStartDate] = useState<Date | null>(null);
  const [endDate, setEndDate] = useState<Date | null>(null);
  const [isGenerate, setGenerate] = useState(false);
  const [ioIdsFilter, setIoIdsFilter] = useState<any[]>([]);
  const [dataTimeline, setDataTimeline] = useState<any[]>([]);
  const [yLengthTimeline, setYLengthTimeline] = useState(0);

  /*** Listas estáticas memorizadas ***/
  const ignoreList = useMemo(
    () => [{ title: t("msg_data") }, { title: t("invalid_data") }],
    [t]
  );

  const searchList = useMemo(() => [], []);

  const groupList = useMemo(
    () => [
      {
        title: t("state"),
        values: [
          {
            value: t("general.stationary"),
            label: firstUpperLetter(t("general.stationary")),
          },
          {
            value: t("moving"),
            label: firstUpperLetter(t("moving")),
          },
          {
            value: t("general.stationary_with_ignition"),
            label: firstUpperLetter(t("general.stationary_with_ignition")),
          },
        ],
      },
    ],
    [t]
  );

  const orderList = useMemo(
    () => [{ title: "gpstime" }, { title: "trip_state" }],
    []
  );

  const styleRowList = useMemo(
    () => [
      {
        title: t("ignition"),
        value: (val: any) => (val === true ? "bg-green-100" : ""),
      },
    ],
    [t]
  );

  const styleColumnList = useMemo(
    () => [
      {
        title: t("gpstime"),
        header: () => "sticky left-0 top-0 bg-default-300",
        value: (val: any) =>
          `sticky left-0 z-10 ${val ? "bg-green-100" : "bg-white"}`,
      },
    ],
    [t]
  );

  const stateListTimeline = useMemo(
    () => ({
      0: t("general.rest"),
      1: t("general.driver_available"),
      2: t("general.work"),
      3: t("general.drive"),
      6: t("general.error"),
      7: t("general.not_available"),
    }),
    [t]
  );

  const colorCodeTimeline = useMemo(
    () => [
      { [firstUpperLetter(t("general.not_available"))]: "#000000" },
      { [firstUpperLetter(t("general.drive"))]: "#ff0813" },
      { [firstUpperLetter(t("general.work"))]: "#05df72" },
      { [firstUpperLetter(t("general.rest"))]: "#808080" },
      { [firstUpperLetter(t("general.driver_available"))]: "#00bcff" },
      { [firstUpperLetter(t("general.error"))]: "#ffdf20" },
    ],
    [t]
  );

  /*** Helpers memorizados ***/
  const filterData = useCallback(
    (objects: any[]) =>
      objects.map((obj) => {
        const result: any = { ...obj };
        // Normalizar ignition
        ["(input)_ignition", "ignition"].forEach((key) => {
          if (result[key] === "0" || result[key] === "off") result[key] = false;
          else if (result[key] === "1" || result[key] === "on")
            result[key] = true;
        });
        // Formatear gpstime
        if (result.gpstime) {
          result.gpstime = format(
            new Date(result.gpstime),
            `${dateFormat} ${timeFormat}`
          );
        }
        return reorderObject(result, orderList);
      }),
    [dateFormat, timeFormat, orderList]
  );

  const groupDataByDayAndState = useCallback(
    (data: any[]) => {
      // ... lógica optimizada de agrupamiento ...
      // retorna { data, yLength }
      return { data: [], yLength: 0 };
    },
    [stateListTimeline]
  );

  /*** Fetch metadata al inicio ***/
  useEffect(() => {
    if (!user.token) return;
    setLoading(true);
    const token = getUserRef().token;
    Promise.all([objectList(token), datatypeList(token)])
      .then(([objs, dts]) => {
        setDataObjectList(objs);
        setDataDatatypeList(dts);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [user.token, getUserRef]);

  /*** Procesar mensajes cuando se dispare generate ***/
  useEffect(() => {
    if (!user.token || !vehicle || !startDate || !endDate || !isGenerate)
      return;

    let mounted = true;
    setLoading(true);
    const token = getUserRef().token;
    toast.success(firstUpperLetter(t("general.processing")));

    (async () => {
      try {
        const params: any = {
          object_id: vehicle,
          time_from: format(startDate, "yyyy-MM-dd HH:mm:ss"),
          time_to: format(endDate, "yyyy-MM-dd HH:mm:ss"),
        };
        if (ioIdsFilter.length) params.io_ids_filter = ioIdsFilter;

        const raw = await objectValidRawMessage(token, params);
        const sorted = sortArray(raw, "gpstime", "desc");

        // Fusionar msg_data
        const merged = sorted.map((item) => {
          if (!item.msg_data) return item;
          Object.entries(item.msg_data).forEach(([id, val]) => {
            const dt = dataDatatypeList.find((d) => String(d.id) === id);
            if (dt?.name) {
              const key = dt.name.replace(/\s+/g, "_").toLowerCase();
              item[key] = val;
            }
          });
          return item;
        });

        const cleaned = cleanObjectsColumns(merged);
        const filtered = filterData(cleaned);
        const translated = await translateObjects(
          filtered.slice(0, numberRows),
          t,
          ["gpstime"]
        );

        if (!mounted) return;
        setDataValidRawMessages(translated);

        // Descomenta si quieres timeline:
        // const { data, yLength } = groupDataByDayAndState(filtered);
        // setDataTimeline(data);
        // setYLengthTimeline(yLength);
      } catch (err) {
        toast.error(firstUpperLetter(t("general.process_error")));
        console.error(err);
      } finally {
        if (!mounted) return;
        toast.success(firstUpperLetter(t("general.process_completed")));
        setGenerate(false);
        setLoading(false);
      }
    })();

    return () => {
      mounted = false;
    };
  }, [
    user.token,
    vehicle,
    startDate,
    endDate,
    isGenerate,
    ioIdsFilter,
    numberRows,
    filterData,
    dataDatatypeList,
    t,
    getUserRef,
  ]);

  return {
    models: {
      user,
      settings,
      isLoading,
      isGenerate,
      dataObjectList,
      dataValidRawMessages,
      ignoreList,
      searchList,
      groupList,
      vehicle,
      startDate,
      endDate,
      ioIdsFilter,
      datatypeList: dataDatatypeList,
      styleRowList,
      numberRows,
      styleColumnList,
      dataTimeline,
      yLengthTimeline,
      colorCodeTimeline,
      unitDistance,
      unitVolume,
      dateFormat,
      timeFormat
    },
    operations: {
      setVehicle,
      setStartDate,
      setEndDate,
      setGenerate,
      setIoIdsFilter,
      setNumberRows,
    },
  };
};

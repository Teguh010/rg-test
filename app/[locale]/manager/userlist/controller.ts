"use client";
import { useState, useEffect } from "react";
import { useUser } from "@/context/UserContext";
import { listUsers } from "@/models/manager/users";
import { useTranslation } from "react-i18next";
import toast from "react-hot-toast";
import { useSelectedCustomerStore } from "@/store/selected-customer";


interface User {
  id?: number;
  username?: string;
  email?: string;
  role?: string;
  created_at?: string;
  last_login?: string;
  [key: string]: any;
}

export const controller = () => {
  const { t } = useTranslation();
  const UserContext = useUser();
  const { user } = UserContext.models;
  const { getUserRef } = UserContext.operations;

  const [loading, setLoading] = useState(false);
  const [userList, setUserList] = useState<User[]>([]);
  const [dataGenerated, setDataGenerated] = useState(false);
  const [ignoreList] = useState([{ title: "id" }]);
  const [styleRowList] = useState([
    {
      title: "is_active",
      value: (val: boolean = false) => val === true && "bg-green-100",
    },
  ]);
  const [searchList] = useState([
    { title: "name" },
    { title: "user_type" },
    { title: "worker" }
  ]);

   const { 
      selectedCustomerId
    } = useSelectedCustomerStore();

    useEffect(() => {
     const fetchData = async () => {
      const currentUser = getUserRef();
      if (!currentUser?.token) return;

      setLoading(true);
      try {
        const response = await listUsers(currentUser.token);
        console.log("Users fetched:", response);
        if (response) {
          console.log("Users fetched:", response);
          setUserList(response);
          setDataGenerated(true);
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error(t("error.fetch_data"));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [selectedCustomerId]);

  return {
    models: {
      user,
      loading,
      userList,
      ignoreList,
      styleRowList,
      dataGenerated,
      searchList
    },
    operations: {}
  };
};
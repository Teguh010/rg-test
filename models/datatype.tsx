"use client";
import { apiRequest } from "./common";
import {
    datatypeListResult,
    datatypeListResultItem
} from "@/types/datatype";

export const datatypeList = async (token: string | null) => {
    try {
        const isManagerContext = typeof window !== 'undefined' && 
            window.location.pathname.includes('/manager');
        
        const tokenSource = isManagerContext ? "manager" : "client";
        const result = await apiRequest(token, "datatype.list", {}, { tokenSource });
        
        const resultItems: datatypeListResultItem[] = JSON.parse(result);
        const data: datatypeListResult = resultItems;

        return data;
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
};
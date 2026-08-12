import { useCallback, useState } from "react";
import API from "../api/axios";

/* Fetches and caches DayBook entries by month key ("YYYY-MM"), scoped to the
   logged-in user's shop the same way Dashboard.jsx always has. Shared by the
   main Dashboard and by the standalone Personal Cr / Patient Bill / Salary
   pages so they don't each re-implement the same fetch + cache logic. */
export default function useMonthlyDaybook(user) {
  const [allData, setAllData] = useState({});
  const [loadingMap, setLoadingMap] = useState({});

  const fetchMonth = useCallback(
    async (mk) => {
      setLoadingMap((p) => ({ ...p, [mk]: true }));
      try {
        const params = { month: mk };
        if (user?.role === "admin" && user?.shop) params.shop = user.shop;
        const { data } = await API.get("/daybook", { params });
        setAllData((p) => ({
          ...p,
          [mk]: data.success ? data.data || [] : [],
        }));
      } catch {
        setAllData((p) => ({ ...p, [mk]: [] }));
      } finally {
        setLoadingMap((p) => ({ ...p, [mk]: false }));
      }
    },
    [user?.role, user?.shop],
  );

  return { allData, setAllData, loadingMap, fetchMonth };
}

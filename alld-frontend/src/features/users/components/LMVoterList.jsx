import { useState, useMemo } from "react";
import { Filter, RotateCcw } from "lucide-react";
import apiService from "../../../components/apiService";
import VoterTable from "../../../components/VoterList";

const MONTH_OPTIONS = [
  { value: 1, label: "January" },
  { value: 2, label: "February" },
  { value: 3, label: "March" },
  { value: 4, label: "April" },
  { value: 5, label: "May" },
  { value: 6, label: "June" },
  { value: 7, label: "July" },
  { value: 8, label: "August" },
  { value: 9, label: "September" },
  { value: 10, label: "October" },
  { value: 11, label: "November" },
  { value: 12, label: "December" },
];

const currentYear = new Date().getFullYear();
const YEAR_OPTIONS = Array.from({ length: 10 }, (_, i) => currentYear - 5 + i);

const LMVoterList = () => {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [generatedParams, setGeneratedParams] = useState(null);

  const extraParams = useMemo(() => generatedParams || {}, [generatedParams]);

  const isCurrentMonth =
    year === now.getFullYear() && month === now.getMonth() + 1;
  const canGenerate =
    !generatedParams ||
    generatedParams.year !== year ||
    generatedParams.month !== month;

  const handleGenerate = () => {
    setGeneratedParams({ year, month });
  };

  const handleReset = () => {
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
    setGeneratedParams(null);
  };

  return (
    <div>
      <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-4 py-3 mb-4 shadow-sm">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Filter className="w-4 h-4" />
            <span>Filters</span>
          </div>

          <div className="h-6 w-px bg-gray-300 dark:bg-gray-600" />

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Month
            </label>
            <select
              value={month}
              onChange={(e) => setMonth(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {MONTH_OPTIONS.map((m) => (
                <option key={m.value} value={m.value}>
                  {m.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
              Year
            </label>
            <select
              value={year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="border border-gray-300 dark:border-gray-600 rounded-md px-3 py-1.5 text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {YEAR_OPTIONS.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </div>

          <button
            type="button"
            onClick={handleGenerate}
            disabled={!canGenerate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-md transition-colors"
          >
            Generate
          </button>

          {(!isCurrentMonth || generatedParams) && (
            <button
              type="button"
              onClick={handleReset}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40 rounded-md transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              Reset
            </button>
          )}
        </div>
      </div>

      <VoterTable
        type="lm"
        title="Life Member Voter List"
        fetchFunction={apiService.lmList}
        searchFunction={(params) => {
          // Use search by month/year if year/month params exist, otherwise use simple search
          console.log('[LMVoterList] Search params received:', params);
          if (params.year && params.month) {
            console.log('[LMVoterList] Calling lmSearchByMonthYear with params:', params);
            return apiService.lmSearchByMonthYear(params);
          }
          console.log('[LMVoterList] Calling lmSearch with params:', params);
          return apiService.lmSearch(params);
        }}
        extraParams={extraParams}
        enabled={Boolean(generatedParams)}
      />
    </div>
  );
};

export default LMVoterList;

import { useContext, useMemo } from "react";
import { AuthContext } from "../../contexts/AuthContext";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_Cell,
  type MRT_TableInstance,
  type MRT_Row,
  useMaterialReactTable,
} from 'material-react-table';
import {
  Box,
  createTheme,
  ThemeProvider,
  TextField,
  type Theme,
} from "@mui/material";
import Typography from "@mui/material/Typography";
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import {
  useQuery,
} from "@tanstack/react-query";
import axios from "axios";
import Editor from '@monaco-editor/react';

import MainLayout from "../../components/MainLayout";
import { type Question } from "../Question/question";
import { MONACOLANGUAGES } from "../../components/Collaboration/codeEditor";


export interface Attempt {
  timestamp: Date,
  qid: Number,
  title: string,
  language: string,
  code: string,
  output: string,
  error: boolean,
}

const languages = ["C++", "Java", "Python 3", "Javascript", "C#", "SQL"];

const HistoryTable = () => {
  const { user } = useContext(AuthContext);
  const columns = useMemo<MRT_ColumnDef<Attempt>[]>(
    () => [
      {
        accessorKey: "timestamp",
        header: "Submitted",
        size: 250,
        filterVariant: "date-range",
        Cell: ({ cell }: { cell: MRT_Cell<Attempt> }) => cell.getValue<Date>().toLocaleString(),
      },
      {
        accessorKey: "qid",
        header: "Id",
        size: 100,
        muiFilterTextFieldProps: { placeholder: "Id" },
      },
      {
        accessorKey: "title",
        header: "Title",
        size: 250,
        muiFilterTextFieldProps: { placeholder: "Title" },
      },
      {
        accessorKey: "language",
        header: "Language",
        size: 185,
        filterVariant: "multi-select",
        filterSelectOptions: languages,
        muiFilterTextFieldProps: { placeholder: "Language" },
      },
    ],
    [],
  );

  const {
    data: fetchedHistory = [],
    isError: isLoadingHistoryError,
    isFetching: isFetchingHistory,
    isLoading: isLoadingHistory,
  } = useGetHistory();

  function useGetHistory() {
    return useQuery<Attempt[]>({
      queryKey: ["history"],
      queryFn: async () => {
        const qMap = new Map();
        const questions = (await axios.get(`${process.env.REACT_APP_QUESTION_SVC_PORT}/api/question/`)).data;
        questions.forEach((item: Question) => qMap.set(item.qid, item.title));

        const history = (await axios.get(`${process.env.REACT_APP_HISTORY_SVC_PORT}/api/history/${user.id}`)).data;
        history.forEach((item: Attempt) => {
          item.timestamp = new Date(item.timestamp);
          item.title = qMap.get(item.qid);
        })
        return history;
      },
      refetchOnWindowFocus: false,
    });
  }

  const table = useMaterialReactTable({
    columns,
    data: fetchedHistory,
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    enableExpandAll: false,
    enableExpanding: true,
    renderDetailPanel: ({ row }: { row: MRT_Row<Attempt> }) => {
      return <>
        <Typography sx={{ padding: "0px 16px 0px 16px" }}>
          Code
        </Typography>
        <Box sx={{
          height: "300px",
          padding: "16px",
        }}>
          <Editor
            height="100%"
            options={{
              domReadOnly: true,
              minimap: { enabled: false },
              readOnly: true,
              scrollBeyondLastLine: false,
            }}
            theme="vs-dark"
            language={MONACOLANGUAGES[row.original.language]}
            value={row.original.code}
          />
        </Box>
        <Typography color={row.original.error ? "error.main" : "white"} sx={{ padding: "16px 16px 0px 16px" }}>
          {row.original.error ? "Output (Error)" : "Output"}
        </Typography>
        <TextField
          fullWidth={true}
          multiline
          maxRows={13}
          inputProps={{
            readOnly: true,
            style: { fontFamily: "monospace" },
          }}
          sx={{
            padding: "16px",
          }}
          error={row.original.error}
          value={row.original.output}
        />
      </>;
    },
    muiExpandButtonProps: ({ row, table }: { row: MRT_Row<Attempt>, table: MRT_TableInstance<Attempt> }) => ({
      onClick: () => table.setExpanded({ [row.id]: !row.getIsExpanded() }),
    }),
    localization: { expand: "Code/Output" },
    mrtTheme: (theme: Theme) => ({
      baseBackgroundColor: theme.palette.grey[900],
    }),
    muiTableContainerProps: {
      sx: {
        minHeight: "500px",
      },
    },
    state: {
      isLoading: isLoadingHistory,
      showAlertBanner: isLoadingHistoryError,
      showProgressBars: isFetchingHistory,
    },
    muiToolbarAlertBannerProps: isLoadingHistoryError
      ? { color: "error", children: "Error loading data" }
      : undefined,
  });

  return <LocalizationProvider dateAdapter={AdapterDayjs}>
    <ThemeProvider theme={createTheme({
      palette: {
        mode: "dark",
      }
    })}>
      <MaterialReactTable table={ table }/>
    </ThemeProvider>
  </LocalizationProvider>;
}

export default function HistoryPage() {
  return <MainLayout>
    <Box sx={{ margin: "50px", maxWidth: "90vw" }}>
      <HistoryTable />
    </Box>
  </MainLayout>;
};

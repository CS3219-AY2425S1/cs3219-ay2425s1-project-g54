import { useMemo } from "react";
import {
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
} from "material-react-table";
import {
  Box,
  ThemeProvider,
  createTheme,
  CircularProgress,
  Typography,
} from "@mui/material";
import { Question } from "../Question/question";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";

interface DataTableProps {
  onSelectQuestion: (question: Question) => void;
}

const theme = createTheme({
  palette: {
    mode: "dark",
  },
});

//READ hook (get questions from api)
function useGetQuestions() {
  return useQuery<Question[]>({
    queryKey: ["questions"],
    queryFn: async () => {
      return (
        await axios.get(
          `${process.env.REACT_APP_QUESTION_SVC_PORT}/api/question/`
        )
      ).data;
    },
    refetchOnWindowFocus: false,
  });
}

const DataTable: React.FC<DataTableProps> = ({ onSelectQuestion }) => {
  const {
    data: fetchedQuestions = [],
    isError,
    isFetching,
    isLoading,
  } = useGetQuestions();

  const columns = useMemo<MRT_ColumnDef<Question>[]>(
    () => [
      {
        accessorKey: "qid",
        header: "Id",
        size: 100,
      },
      {
        accessorKey: "title",
        header: "Title",
        size: 200,
      },
      {
        accessorKey: "complexity",
        header: "Complexity",
        size: 200,
        Cell: ({ cell }) => (
          <Box
            component="span"
            sx={(theme) => ({
              backgroundColor:
                cell.getValue<string>() === "Easy"
                  ? theme.palette.success.dark
                  : cell.getValue<string>() === "Medium"
                    ? theme.palette.warning.dark
                    : theme.palette.error.dark,
              borderRadius: "0.25rem",
              color: "white",
              padding: "0.25rem",
            })}
          >
            {cell.getValue<string>()}
          </Box>
        ),
      },
      {
        accessorKey: "categories",
        header: "Categories",
        size: 300,
        Cell: ({ cell }) => cell.getValue<string[]>().join(", "),
      },
    ],
    []
  );

  const handleRowClick = (row: MRT_Row<Question>) => {
    onSelectQuestion(row.original); // Pass selected question up to the parent component
  };

  return (
    <ThemeProvider theme={theme}>
      {isLoading ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100vh"
        >
          <CircularProgress />
        </Box>
      ) : isError ? (
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          height="100vh"
        >
          <Typography color="error">Failed to load questions.</Typography>
        </Box>
      ) : (
        <MaterialReactTable
          columns={columns}
          data={isFetching ? [] : fetchedQuestions}
          muiTableBodyRowProps={({ row }) => ({
            onClick: () => handleRowClick(row),
            style: { cursor: "pointer" },
          })}
        />
      )}
    </ThemeProvider>
  );
};

export default DataTable;

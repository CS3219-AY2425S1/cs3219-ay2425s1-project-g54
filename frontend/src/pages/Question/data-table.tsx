import { useMemo, useState } from "react";
import {
  MRT_EditActionButtons,
  MaterialReactTable,
  type MRT_ColumnDef,
  type MRT_Row,
  type MRT_TableOptions,
  useMaterialReactTable,
} from "material-react-table";
import {
  Alert,
  Box,
  Button,
  createTheme,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  MenuItem,
  ThemeProvider,
  Tooltip,
  TextField,
  styled,
} from "@mui/material";
import { grey } from "@mui/material/colors";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios, { AxiosError } from "axios";

import { type Question, categories, complexities, validateQuestion } from "./question";

// Styled components for the dialog
const StyledDialog = styled(Dialog)(({ theme }) => ({
  "& .MuiDialog-paper": {
    borderRadius: "16px",
    border: "1px solid",
    borderColor: theme.palette.divider,
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  borderTop: "1px solid",
  borderBottom: "1px solid",
  borderColor: theme.palette.divider,
  padding: theme.spacing(3),
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  padding: theme.spacing(2),
}));

const Table = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isCrudError, setIsCrudError] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(
    null
  );

  const columns = useMemo<MRT_ColumnDef<Question>[]>(
    () => [
      {
        accessorKey: "qid",
        header: "Id",
        enableEditing: !isEditing,
        size: 100,
        muiEditTextFieldProps: {
          required: true,
          type: "number",
          error: !!validationErrors?.qid,
          helperText: validationErrors?.qid,
          onFocus: () => {
            setValidationErrors({
              ...validationErrors,
              qid: undefined,
            });
          },
        },
      },
      {
        accessorKey: "title",
        header: "Title",
        size: 250,
        muiEditTextFieldProps: {
          required: true,
          error: !!validationErrors?.title,
          helperText: validationErrors?.title,
          onFocus: () => {
            setValidationErrors({
              ...validationErrors,
              title: undefined,
            });
          },
        },
      },
      {
        accessorKey: "complexity",
        header: "Complexity",
        size: 150,
        editVariant: "select",
        editSelectOptions: complexities,
        filterVariant: "multi-select",
        filterSelectOptions: complexities,
        sortingFn: (rowA, rowB) => complexities.indexOf(rowA.original.complexity) - complexities.indexOf(rowB.original.complexity),
        Cell: ({ cell }) => {
          const complexity = cell.getValue<string>();
          return <Box
            component="span"
            sx={(theme) => ({
              backgroundColor:
              complexity === "Easy"
                  ? theme.palette.success.dark
                  : complexity === "Medium"
                    ? theme.palette.warning.dark
                    : theme.palette.error.dark,
              borderRadius: "0.25rem",
              color: "white",
              maxWidth: "9ch",
              p: "0.25rem",
            })}
          >
            {complexity}
          </Box>
        },
        muiEditTextFieldProps: {
          select: true,
          required: true,
          error: !!validationErrors?.complexity,
          helperText: validationErrors?.complexity,
          onFocus: () => {
            setValidationErrors({
              ...validationErrors,
              complexity: undefined,
            });
          },
          onKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => {
            if (event.key === "Enter" && !event.shiftKey) {
              event.shiftKey = true;
            }
          },
        },
      },
      {
        accessorKey: "categories",
        header: "Categories",
        size: 250,
        filterVariant: "multi-select",
        filterSelectOptions: categories,
        Cell: ({ cell }) => {
          return cell.getValue<string[]>().join(", ");
        },
        Edit: ({ cell, row, column, table }) => {
          const [value, setValue] = useState(cell.getValue<string[]>() || []);
          return (
            <TextField
              select
              required
              label="Categories"
              value={value}
              error={!!validationErrors?.categories}
              helperText={validationErrors?.categories}
              variant="standard"
              margin="normal"
              fullWidth
              onBlur={() => {
                row._valuesCache[column.id] = value;
              }}
              onFocus={() => {
                setValidationErrors({
                  ...validationErrors,
                  categories: undefined,
                });
              }}
              SelectProps={{
                multiple: true,
                onChange: (e) => setValue(e.target.value as string[]),
              }}
            >
              {categories.map((category) => (
                <MenuItem key={category} value={category}>
                  {category}
                </MenuItem>
              ))}
            </TextField>
          );
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        size: 400,
        muiEditTextFieldProps: {
          required: true,
          multiline: true,
          variant: "outlined",
          rows: 8,
          error: !!validationErrors?.description,
          helperText: validationErrors?.description,
          onFocus: () => {
            setValidationErrors({
              ...validationErrors,
              description: undefined,
            });
          },
        },
      },
    ],
    [isEditing, validationErrors]
  );

  //call CREATE hook
  const {
    mutateAsync: createQuestion,
    isPending: isCreatingQuestion,
    error: createError,
  } = useCreateQuestion();
  //call READ hook
  const {
    data: fetchedQuestions = [],
    isError: isLoadingQuestionsError,
    isFetching: isFetchingQuestions,
    isLoading: isLoadingQuestions,
  } = useGetQuestions();
  //call UPDATE hook
  const {
    mutateAsync: updateQuestion,
    isPending: isUpdatingQuestion,
    error: updateError,
  } = useUpdateQuestion();
  //call DELETE hook
  const { mutateAsync: deleteQuestion, isPending: isDeletingQuestion } =
    useDeleteQuestion();

  //CREATE action
  const handleCreateQuestion: MRT_TableOptions<Question>["onCreatingRowSave"] =
    async ({ values, table }) => {
      setIsCrudError(false);
      const newValidationErrors = validateQuestion(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }

      setValidationErrors({});
      createQuestion(values)
        .then(() => {
          table.setCreatingRow(null);
        })
        .catch((err) => {
          console.log(err);
          setIsCrudError(true);
        }); //exit creating mode
    };

  //UPDATE action
  const handleSaveQuestion: MRT_TableOptions<Question>["onEditingRowSave"] =
    async ({ values, table }) => {
      setIsCrudError(false);
      const newValidationErrors = validateQuestion(values);
      if (Object.values(newValidationErrors).some((error) => error)) {
        setValidationErrors(newValidationErrors);
        return;
      }

      setValidationErrors({});
      updateQuestion(values)
        .then(() => table.setEditingRow(null))
        .catch((err) => {
          console.log(err);
          setIsCrudError(true);
        });
      //exit editing mode
    };

  //DELETE action
  const openDeleteConfirmModal = (row: MRT_Row<Question>) => {
    if (window.confirm(`Are you sure you want to delete question with ID ${row.original.qid}?`)) {
      deleteQuestion(String(row.original.qid)).catch((err) => console.log(err));
    }
  };

  // Row click action
  const handleRowClick = (row: MRT_Row<Question>) => {
    setSelectedQuestion(row.original);
  };

  const closeInfoDialog = () => {
    setIsCrudError(false);
    setSelectedQuestion(null);
  };

  const table = useMaterialReactTable({
    columns,
    data: fetchedQuestions,
    createDisplayMode: "modal",
    editDisplayMode: "modal",
    enableEditing: true,
    initialState: { columnVisibility: { description: false } },
    enableDensityToggle: false,
    enableFullScreenToggle: false,
    getRowId: (question: Question) => String(question.qid),
    muiToolbarAlertBannerProps: isLoadingQuestionsError
      ? {
          color: "error",
          children: "Error loading data",
        }
      : undefined,
    muiTableBodyRowProps: ({ row }: { row: MRT_Row<Question> }) => ({
      onClick: () => handleRowClick(row),
      style: { cursor: "pointer" },
    }),
    muiTableContainerProps: {
      sx: {
        minHeight: "500px",
      },
    },
    mrtTheme: (theme) => ({
      baseBackgroundColor: grey[900],
    }),
    onCreatingRowCancel: () => {
      setIsCrudError(false);
      setValidationErrors({});
    },
    onCreatingRowSave: handleCreateQuestion,
    onEditingRowCancel: () => {
      setIsEditing(false);
      setIsCrudError(false);
      setValidationErrors({});
    },
    onEditingRowSave: handleSaveQuestion,
    renderCreateRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle variant="h3">Create New Question</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          {internalEditComponents}
          {isCrudError ? (
            <Alert variant="outlined" severity="error">
              {createError instanceof AxiosError
                ? createError.code === "ERR_NETWORK"
                  ? "Network Error, please check your connection."
                  : createError.response?.data?.msg
                : "Unexpected Error Occured"}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </DialogActions>
      </>
    ),
    renderEditRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle variant="h3">Edit Question</DialogTitle>
        <DialogContent sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
          {internalEditComponents}
          {isCrudError ? (
            <Alert variant="outlined" severity="error">
              {updateError instanceof AxiosError
                ? updateError.code === "ERR_NETWORK"
                  ? "Network Error, please check your connection."
                  : updateError.response?.data?.msg
                : "Unexpected Error Occured"}
            </Alert>
          ) : null}
        </DialogContent>
        <DialogActions>
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </DialogActions>
      </>
    ),
    renderRowActions: ({ row, table }) => (
      <Box sx={{ display: "flex", gap: "1rem" }}>
        <Tooltip title="Edit">
          <IconButton
            onClick={(e) => {
              setIsEditing(true);
              e.stopPropagation();
              table.setEditingRow(row);
            }}
          >
            <EditIcon />
          </IconButton>
        </Tooltip>
        <Tooltip title="Delete">
          <IconButton
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              openDeleteConfirmModal(row);
            }}
          >
            <DeleteIcon />
          </IconButton>
        </Tooltip>
      </Box>
    ),
    renderTopToolbarCustomActions: ({ table }) => (
      <Button
        variant="contained"
        onClick={() => {
          setIsEditing(false);
          setIsCrudError(false);
          table.setCreatingRow(true);
        }}
      >
        Create New Question
      </Button>
    ),
    state: {
      isLoading: isLoadingQuestions,
      isSaving: isCreatingQuestion || isUpdatingQuestion || isDeletingQuestion,
      showAlertBanner: isLoadingQuestionsError,
      showProgressBars: isFetchingQuestions,
    },
  });

  return (
    <ThemeProvider theme={createTheme({
      palette: {
        mode: "dark",
      }
    })}>
      <MaterialReactTable table={table} />
      <StyledDialog
        open={!!selectedQuestion}
        onClose={closeInfoDialog}
        maxWidth="sm"
        fullWidth
      >
        {selectedQuestion && <>
          <StyledDialogTitle>
            {selectedQuestion.title}
          </StyledDialogTitle>
          <StyledDialogContent>
            <TextField
              label="ID"
              value={selectedQuestion.qid}
              fullWidth
              margin="normal"
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Complexity"
              value={selectedQuestion.complexity}
              fullWidth
              margin="normal"
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Categories"
              value={
                Array.isArray(selectedQuestion.categories)
                  ? selectedQuestion.categories.join(", ")
                  : selectedQuestion.categories
              }
              fullWidth
              margin="normal"
              InputProps={{ readOnly: true }}
            />
            <TextField
              label="Description"
              value={selectedQuestion.description}
              fullWidth
              multiline
              minRows={4}
              maxRows={10}
              margin="normal"
              InputProps={{ readOnly: true }}
            />
          </StyledDialogContent>
        </>}
        <StyledDialogActions>
          <Button onClick={closeInfoDialog}>
            Close
          </Button>
        </StyledDialogActions>
      </StyledDialog>
    </ThemeProvider>
  );
};

//CREATE hook (post new question to api)
function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (question: Question) => {
      return await axios.post(`http://localhost:${process.env.REACT_APP_QUESTION_SVC_PORT}/api/question`, question);
    },

    //client side optimistic update
    onMutate: async (newQuestionInfo: Question) => {
      queryClient.setQueryData(
        ["questions"],
        (prevQuestions: Array<Question>) => {
          return prevQuestions ? [...prevQuestions, newQuestionInfo] as Question[] : undefined;
        }
      );
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });
}

//READ hook (get questions from api)
function useGetQuestions() {
  return useQuery<Question[]>({
    queryKey: ["questions"],
    queryFn: async () => {
      return (await axios.get(`http://localhost:${process.env.REACT_APP_QUESTION_SVC_PORT}/api/question/`)).data;
    },
    refetchOnWindowFocus: false,
  });
}

//UPDATE hook (put question in api)
function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (question: Question) => {
      const { qid, ...noIdQuestion } = question;
      return await axios.patch(
        `http://localhost:${process.env.REACT_APP_QUESTION_SVC_PORT}/api/question/${qid}`,
        noIdQuestion
      );
    },
    
    //client side optimistic update
    onMutate: (newQuestionInfo: Question) => {
      queryClient.setQueryData(["questions"], (prevQuestions: any) => {
        if (!Array.isArray(prevQuestions)) return [newQuestionInfo];
        return prevQuestions.map((prevQuestion: Question) =>
          prevQuestion.qid === newQuestionInfo.qid
            ? newQuestionInfo
            : prevQuestion
        );
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });
}

//DELETE hook (delete question in api)
function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questionId: string) => {
      //send api update request here
      const qid = +questionId;
      return await axios.delete(`http://localhost:${process.env.REACT_APP_QUESTION_SVC_PORT}/api/question/${qid}`);
    },

    //client side optimistic update
    onMutate: (questionId: string) => {
      queryClient.setQueryData(["questions"], (prevQuestions: any) => {
        if (!Array.isArray(prevQuestions)) return [];
        return prevQuestions.filter(
          (question: Question) => String(question.qid) !== questionId
        );
      });
    },
    onSettled: () => queryClient.invalidateQueries({ queryKey: ["questions"] }),
  });
}

const queryClient = new QueryClient();

const DataTable = () => (
  <Box sx={{ margin: "50px", width: "90vw", "maxWidth": "1024px" }}>
    <QueryClientProvider client={queryClient}>
      <Table />
    </QueryClientProvider>
  </Box>
);

export default DataTable;

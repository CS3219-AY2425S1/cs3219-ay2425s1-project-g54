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
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Tooltip,
  TextField,
  styled,
  Alert,
} from "@mui/material";
import {
  QueryClient,
  QueryClientProvider,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { type Question, fakeData, problemComplexity } from "../../makeData";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import axios, { AxiosError } from "axios";

// Styled components for the dialog
const StyledDialog = styled(Dialog)(({ theme }) => ({
  '& .MuiDialog-paper': {
    backgroundColor: 'rgb(18, 18, 18)',
    color: 'white',
    borderRadius: '16px',
    boxShadow: '0 4px 30px rgba(0, 0, 0, 0.1)',
    backdropFilter: 'blur(5px)',
    border: '1px solid rgba(255, 255, 255, 0.3)',
  },
}));

const StyledDialogTitle = styled(DialogTitle)(({ theme }) => ({
  backgroundColor: 'rgba(255, 255, 255, 0.05)',
  borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
  padding: theme.spacing(2),
}));

const StyledDialogContent = styled(DialogContent)(({ theme }) => ({
  padding: theme.spacing(3),
}));

const StyledDialogActions = styled(DialogActions)(({ theme }) => ({
  borderTop: '1px solid rgba(255, 255, 255, 0.1)',
  padding: theme.spacing(2),
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    color: 'white',
  },
  '& .MuiInputLabel-root': {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  '& .MuiOutlinedInput-root': {
    '& fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.23)',
    },
    '&:hover fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.5)',
    },
    '&.Mui-focused fieldset': {
      borderColor: 'rgba(255, 255, 255, 0.7)',
    },
  },
}));


const Example = () => {
  const [isEditing, setIsEditing] = useState(false);
  const [isCreateError, setIsCreateError] = useState(false);
  const [isUpdateError, setIsUpdateError] = useState(false);
  //const [isDeleteError, setIsDeleteError] = useState(false);
  const [validationErrors, setValidationErrors] = useState<
    Record<string, string | undefined>
  >({});
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);

  const columns = useMemo<MRT_ColumnDef<Question>[]>(
    () => [
      {
        accessorKey: "qid",
        header: "Id",
        enableEditing: !isEditing,
        size: 80,
        muiEditTextFieldProps: {
          required: true,
          type: "number"
        },
      },
      {
        accessorKey: "title",
        header: "Title",
        muiEditTextFieldProps: {
          required: true,
        },
      },
      {
        accessorKey: "complexity",
        header: "Complexity",
        editVariant: "select",
        editSelectOptions: problemComplexity,
        muiEditTextFieldProps: {
          select: true,
        },
      },
      {
        accessorKey: "categories",
        header: "Categories",
        Cell: ({ cell }) => {
          const value = cell.getValue<string[] | string>();
          return Array.isArray(value) ? value.join(", ") : value;
        },
        muiEditTextFieldProps: {
          required: true,
        },
      },
      {
        accessorKey: "description",
        header: "Description",
        muiEditTextFieldProps: {
          required: true,
          multiline: true,
          variant: "outlined",
          rows: 4
        },
      },
    ],
    [isEditing]
  );

  //call CREATE hook
  const { mutateAsync: createQuestion, isPending: isCreatingQuestion, error: createError} =
    useCreateQuestion();
  //call READ hook
  const {
    data: fetchedQuestions = [],
    isError: isLoadingQuestionsError,
    isFetching: isFetchingQuestions,
    isLoading: isLoadingQuestions,
  } = useGetQuestions();
  //call UPDATE hook
  const { mutateAsync: updateQuestion, isPending: isUpdatingQuestion, error: updateError } =
    useUpdateQuestion();
  //call DELETE hook
  const { mutateAsync: deleteQuestion, isPending: isDeletingQuestion } =
    useDeleteQuestion();

  //CREATE action
  const handleCreateQuestion: MRT_TableOptions<Question>["onCreatingRowSave"] =
    async ({ values, table }) => {
      setIsCreateError(false);
      createQuestion(values)
        .then(() => {
          table.setCreatingRow(null);
        })
        .catch((err) => {
          console.log(err);
          setIsCreateError(true);
        });

      ; //exit creating mode
    };

  //UPDATE action
  const handleSaveQuestion: MRT_TableOptions<Question>["onEditingRowSave"] =
    async ({ values, table }) => {
      setIsUpdateError(false);
      updateQuestion(values)
        .then(() => table.setEditingRow(null))
        .catch((err) => {
          console.log(err);
          setIsUpdateError(true)});
         //exit editing mode
    };

  //DELETE action
  const openDeleteConfirmModal = (row: MRT_Row<Question>) => {
    if (window.confirm("Are you sure you want to delete this question?")) {
      deleteQuestion(String(row.original.qid))
      .catch((err) => console.log(err));
    }
  };

  // Row click action
  const handleRowClick = (row: MRT_Row<Question>) => {
    setSelectedQuestion(row.original);
  };

  const closeInfoDialog = () => {
    setIsCreateError(false);
    setSelectedQuestion(null);
  };

  const table = useMaterialReactTable({
    columns,
    data: fetchedQuestions,
    createDisplayMode: "modal", //default ('row', and 'custom' are also available)
    editDisplayMode: "modal", //default ('row', 'cell', 'table', and 'custom' are also available)
    enableEditing: true,
    getRowId: (row) => String(row.qid),
    muiToolbarAlertBannerProps: isLoadingQuestionsError
      ? {
          color: "error",
          children: "Error loading data",
        }
      : undefined,
    muiTableBodyRowProps: ({ row }) => ({
      onClick: () => handleRowClick(row),
      style: { cursor: 'pointer' }
    }),
    muiTableContainerProps: {
      sx: { minHeight: "500px", backgroundColor: "grey.900" }, // Set dark background
    },
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: "grey.900", // Dark header background
        color: "white", // White text
      },
    },
    muiTableBodyCellProps: {
      sx: {
        backgroundColor: "grey.900", // Dark cell background
        color: "white", // White text
      },
    },
    muiTopToolbarProps: {
      sx: {
        backgroundColor: "grey.900", // Dark toolbar background
        color: "white", // White text in toolbar
        "& .MuiIconButton-root": {
          color: "white", // Make icon buttons white
        },
        "& .MuiTypography-root": {
          color: "white", // Make text white
        },
        "& .MuiInputBase-root": {
          color: "white", // Make input text color white
          "& .MuiInputBase-input": {
            color: "white", // Input text
          },
          "& .MuiInputBase-input::placeholder": {
            color: "white", // Placeholder text color
            opacity: 1, // Ensure opacity is 1 for visibility
          },
        },
      },
    },
    muiBottomToolbarProps: {
      sx: {
        backgroundColor: "grey.900", // Dark background for the footer
        color: "white", // Default text color for pagination
        "& .MuiTypography-root": {
          color: "white", // Make pagination text white
        },
        "& .MuiPagination-root": {
          "& .MuiButtonBase-root": {
            color: "white", // Pagination button color
          },
          "& .Mui-selected": {
            backgroundColor: "grey.700", // Selected pagination button color
            color: "white", // Selected button text color
          },
        },
        "& .MuiSvgIcon-root": {
          color: "white",
        },
        "& .MuiFormLabel-root": {
          color: "white",
        },
        "& .MuiInputBase-root": {
          color: "white", // Input text color
          "& .MuiInputBase-input": {
            color: "white", // Input text
          },
          "& .MuiInputBase-input::placeholder": {
            color: "white", // Placeholder text color
            opacity: 1, // Ensure opacity is 1 for visibility
          },
        },
        "& .MuiFormControl-root": {
          "& .MuiInputLabel-root": {
            color: "white", // Label color
          },
          "& .MuiSelect-root": {
            color: "white", // Select dropdown text
          },
          "& .MuiSelect-icon": {
            color: "white", // Dropdown arrow color
          },
        },
      },
    },
    onCreatingRowCancel: () => {
      setIsCreateError(false);
      setValidationErrors({});
    },
    onCreatingRowSave: handleCreateQuestion,
    onEditingRowCancel: () => {
      setIsEditing(false);
      setIsUpdateError(false);
      setValidationErrors({})
    },
    onEditingRowSave: handleSaveQuestion,
    renderCreateRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle variant="h3">Create New Question</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: "1rem" }}
        >
          {internalEditComponents}
          {
            isCreateError 
            ? <Alert variant="outlined" severity="error">
              {createError instanceof AxiosError 
                ? (createError.code == "ERR_NETWORK"
                  ? "Network Error, please check your connection."
                  : createError.response?.data?.msg
                )
                : "Unexpected Error Occured"}
            </Alert> 
            : null
          }
          {}
        </DialogContent>
        <DialogActions>
          <MRT_EditActionButtons variant="text" table={table} row={row} />
        </DialogActions>
      </>
    ),
    //optionally customize modal content
    renderEditRowDialogContent: ({ table, row, internalEditComponents }) => (
      <>
        <DialogTitle variant="h3">Edit Question</DialogTitle>
        <DialogContent
          sx={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}
        >
          {internalEditComponents}
          {
            isUpdateError 
            ? <Alert variant="outlined" severity="error">
              {updateError instanceof AxiosError 
                ? (updateError.code == "ERR_NETWORK"
                  ? "Network Error, please check your connection."
                  : updateError.response?.data?.msg
                )
                : "Unexpected Error Occured"}
            </Alert> 
            : null
          }
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
            sx={{ color: "white" }}
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
          <IconButton color="error" onClick={(e) => {
            e.stopPropagation();
            openDeleteConfirmModal(row);
            }}>
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
          setIsCreateError(false)
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
    <>
      <MaterialReactTable table={table} />
      <StyledDialog 
        open={!!selectedQuestion} 
        onClose={closeInfoDialog}
        maxWidth="sm"
        fullWidth
      >
        <StyledDialogTitle>{selectedQuestion?.title || 'Question Details'}</StyledDialogTitle>
        <StyledDialogContent>
          {selectedQuestion && (
            <>
              <StyledTextField
                label="ID"
                value={selectedQuestion.qid}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: true }}
              />
              <StyledTextField
                label="Complexity"
                value={selectedQuestion.complexity}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: true }}
              />
              <StyledTextField
                label="Categories"
                value={Array.isArray(selectedQuestion.categories) 
                  ? selectedQuestion.categories.join(", ") 
                  : selectedQuestion.categories}
                fullWidth
                margin="normal"
                InputProps={{ readOnly: true }}
              />
              <StyledTextField
                label="Description"
                value={(selectedQuestion as Question & { description?: string }).description || ''}
                fullWidth
                multiline
                rows={4}
                margin="normal"
                InputProps={{ readOnly: true }}
              />
            </>
          )}
        </StyledDialogContent>
        <StyledDialogActions>
          <Button onClick={closeInfoDialog} style={{ color: 'white' }}>Close</Button>
        </StyledDialogActions>
      </StyledDialog>
    </>
  );
};

// makes categories an array instead of a string
function changeCategoryStringToArray(category : String | string[]) : string[] {
  if (typeof category == "string") {
    const splitCategory = category.split(',');
    const arrayCategory = splitCategory.map((c) => c.trim());
    return arrayCategory;
  }
  else {
    const stringFromArray = category[0];
    const splitCategory = stringFromArray.split(',');
    const arrayCategory = splitCategory.map((c) => c.trim());
    return arrayCategory;
  }
}


//CREATE hook (post new question to api)
function useCreateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (question: Question) => {
      //send api update request here
      
      const categoryArray = changeCategoryStringToArray(question.categories);
      const reqBody = {...question, categories: categoryArray};
      return await axios.post("http://localhost:4000/api/question", reqBody);
    },
    //client side optimistic update
    
    onMutate: async (newQuestionInfo: Question) => {
      queryClient.setQueryData(
        ["questions"],
        (prevQuestions: Array<Question>) => {
          return [
            ...prevQuestions, newQuestionInfo
          ] as Question[];
        }
      );
    },
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['questions'] }), //refetch questions after mutation, disabled for demo
  });
}

//READ hook (get questions from api)
function useGetQuestions() {
  return useQuery<Question[]>({
    queryKey: ["questions"],
    //send api request here,
    queryFn: async () => {
      return (await axios.get("http://localhost:4000/api/question/")).data;
    },
    refetchOnWindowFocus: false,
  });
}

//UPDATE hook (put question in api)
function useUpdateQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (question: Question) => {
      //send api update request here
      const {qid, ...updatebody} = question
      const categoryArray = changeCategoryStringToArray(updatebody.categories); // index 0 because right now its just array of length 1
      const reqBody = {...updatebody, categories: categoryArray}
      return await axios.patch(`http://localhost:4000/api/question/${qid}`, reqBody);
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
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['questions'] }), //refetch questions after mutation, disabled for demo
  });
}

//DELETE hook (delete question in api)
function useDeleteQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (questionId: string) => {
      //send api update request here
      const qid = +questionId;
      return await axios.delete(`http://localhost:4000/api/question/${qid}`);
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
     onSettled: () => queryClient.invalidateQueries({ queryKey: ['questions'] }), //refetch questions after mutation, disabled for demo
  });
}

const queryClient = new QueryClient();

const ExampleWithProviders = () => (
  //Put this with your other react-query providers near root of your app
  <QueryClientProvider client={queryClient}>
    <Example />
  </QueryClientProvider>
);

export default ExampleWithProviders;

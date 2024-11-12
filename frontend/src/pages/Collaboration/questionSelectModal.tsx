import {
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Button,
} from "@mui/material";

import { Question } from "../Question/question";
import DataTable from "./dataTable";

interface QuestionSelectModalProps {
  open: boolean;
  onClose: () => void;
  onQuestionSelect: (question: Question) => void;
}

const QuestionSelectModal: React.FC<QuestionSelectModalProps> = ({
  open,
  onClose,
  onQuestionSelect,
}) => {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>Select a Question</DialogTitle>
      <DialogContent>
        <DataTable onSelectQuestion={onQuestionSelect} />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          Cancel
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default QuestionSelectModal;

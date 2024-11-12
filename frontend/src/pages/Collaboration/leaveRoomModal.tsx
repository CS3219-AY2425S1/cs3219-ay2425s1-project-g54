import React from "react";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogActions from "@mui/material/DialogActions";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";

interface LeaveRoomModalProps {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LeaveRoomModal: React.FC<LeaveRoomModalProps> = ({
  open,
  onClose,
  onConfirm,
}) => {
  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Confirm Leave Room</DialogTitle>
      <DialogContent>
        <Alert severity="warning">
          Are you sure you want to leave the room?
        </Alert>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} color="primary">
          No
        </Button>
        <Button onClick={onConfirm} color="secondary">
          Yes
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LeaveRoomModal;

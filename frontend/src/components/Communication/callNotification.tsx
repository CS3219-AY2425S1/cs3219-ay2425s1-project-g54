import { Avatar, Box, Dialog, DialogActions, DialogContentText, DialogTitle, IconButton } from "@mui/material";
import PhoneDisabledRoundedIcon from '@mui/icons-material/PhoneDisabledRounded';
import PhoneEnabledRoundedIcon from '@mui/icons-material/PhoneEnabledRounded';
import { CallNotificationState } from "../../pages/Collaboration/collaboration";

export default function CallNotification({ notification, handleCallResponse }: { notification: CallNotificationState, handleCallResponse: Function }) {



    return (
        <Dialog open={notification.isOpen} onClose={() => handleCallResponse(false)} maxWidth="lg"  >
            <DialogTitle textAlign="center">
                Incoming Call
            </DialogTitle>
            <Box sx={{
                display: "flex",
                flexDirection: "column",
                flex: "1",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px"
            }}>
                <DialogContentText textAlign="center" fontSize="24px">
                    {notification.caller.username}
                </DialogContentText>
                <Avatar alt={notification.caller.username} src={notification.caller.avatar} sx={
                    {
                        width: 80,
                        height: 80,
                        border: "0.1px solid lightgray"
                    }} />
            </Box>
            <DialogActions className="flex justify-center items-center">
                <Box sx={{
                    display: "flex",
                    minHeight: "100%",
                    minWidth: "100%",
                    flex: "1",
                    justifyContent: "space-evenly",
                    alignItems: "center"
                }}
                >
                    <IconButton size="large" onClick={() => handleCallResponse(true)} color="success">
                        <PhoneEnabledRoundedIcon />
                    </IconButton>
                    <IconButton onClick={() => handleCallResponse(false)} color="error">
                        <PhoneDisabledRoundedIcon />
                    </IconButton>

                </Box>
            </DialogActions>
        </Dialog>
    )
}

import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, InputAdornment, TextField } from '@mui/material';
import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import React from 'react'
import toast from 'react-hot-toast';
import { AuthContext, User } from '../../contexts/AuthContext';

export default function ConfirmSettingDialog({ open, handleDialogCloseFn, data, handleSuccessChange }: { open: boolean, handleDialogCloseFn: () => void, data: Record<string, string>, handleSuccessChange: (updatedUser: User) => void }) {
    const { user } = React.useContext(AuthContext);
    const [showPassword, setShowPassword] = React.useState(false);

    const handleClose = () => {
        if (isPending) {
            toast.error("Cannot close dialog while changes is taking place!");
            return;
        }
        handleDialogCloseFn();
    }

    const { mutate, isPending } = useMutation({
        mutationFn: async (data: Record<string, string>) => {
            return axios.patch(`${process.env.REACT_APP_USER_SVC_PORT}/users/${user.id}`, data, {
                headers: {
                    "Content-Type": "multipart/form-data",
                },
                withCredentials: true
            })
        },
        onSuccess: (res) => {
            const updatedUser: any = res.data?.data
            handleSuccessChange(updatedUser);
        },
        onError: (error: AxiosError) => {
            const data: any = error.response?.data;
            if (data) {
                toast.error(data.message);
            }
        }
    });

    return (
        <React.Fragment>
            <Dialog
                open={open}
                onClose={handleClose}
                PaperProps={{
                    component: 'form',
                    onSubmit: (event: React.FormEvent<HTMLFormElement>) => {
                        event.preventDefault();
                        const newData = new FormData(event.currentTarget);
                        const formJson = Object.fromEntries((newData as any).entries());
                        const formData = {
                            username: data.username,
                            newPassword: data.newPassword,
                            avatar: data.file,
                            oldPassword: formJson.oldPassword,
                        }
                        mutate(formData);
                    },
                }}
            >
                <DialogTitle>Enter current password</DialogTitle>
                <DialogContent>
                    <DialogContentText>
                        Please enter your current password to confirm your setting changes.
                    </DialogContentText>
                    <TextField
                        autoFocus
                        required
                        name='oldPassword'
                        margin="dense"
                        label="Current Password"
                        type={showPassword ? "text" : "password"}
                        fullWidth
                        variant="standard"
                        slotProps={{
                            input: {
                                endAdornment: <InputAdornment position="end">{
                                    showPassword
                                        ? <VisibilityOffIcon className="cursor-pointer" onClick={() => setShowPassword(false)} />
                                        : <VisibilityIcon className="cursor-pointer" onClick={() => setShowPassword(true)} />
                                }</InputAdornment>
                            }
                        }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button disabled={isPending} onClick={handleClose}>Cancel</Button>
                    <Button disabled={isPending} type="submit">Confirm</Button>
                </DialogActions>
            </Dialog>
        </React.Fragment>
    );
}

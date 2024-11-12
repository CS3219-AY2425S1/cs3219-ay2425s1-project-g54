import { useForm } from "react-hook-form";
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PersonIcon from '@mui/icons-material/Person'
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { Avatar, Button, InputAdornment, styled, TextField } from "@mui/material";
import { useContext, useState } from "react";
import MainLayout from "../../components/MainLayout";
import toast from "react-hot-toast";
import ConfirmSettingDialog from "../../components/Settings/ConfirmDialog";
import { AuthContext, User } from '../../contexts/AuthContext';

const VisuallyHiddenInput = styled('input')({
    clip: 'rect(0 0 0 0)',
    clipPath: 'inset(50%)',
    height: 1,
    overflow: 'hidden',
    position: 'absolute',
    bottom: 0,
    left: 0,
    whiteSpace: 'nowrap',
    width: 1,
});

export default function SettingsPage() {
    const { user, setUser } = useContext(AuthContext);

    const [confirmSettingDialogOpen, setConfirmSettingDialogOpen] = useState(false);
    const [file, setFile] = useState<File | undefined>();
    const [preview, setPreview] = useState(user.avatar);
    const [showPassword, setShowPassword] = useState(false);

    const handleFileChange = (e: React.FormEvent<HTMLInputElement>) => {
        const target = e.target as HTMLInputElement & {
            files: FileList;
        }
        if (target.files.length > 0) {
            if (target.files[0].size > 5 * 1000000) { // 5MB
                toast.error("The file is too BIG!");
            } else {
                const urlImage = URL.createObjectURL(target.files[0]);
                setPreview(urlImage);
                setFile(target.files[0]);
            }
        }
    }

    const handleDeletePhoto = () => {
        const fileInput = document.getElementById('avatar') as HTMLInputElement;
        if (fileInput) {
            fileInput.value = "";
            setPreview("");
            setFile(undefined);
        }
    }

    const handleSuccessChange = (user: User) => {
        setUser(user);
        handleDialogClose();
        reset();
        toast.success("Settings changed successfully!");
    }

    const [formData, setFormData] = useState({ username: "" });
    const handleDialogOpen = () => {
        setConfirmSettingDialogOpen(true);
    }
    const handleDialogClose = () => {
        setConfirmSettingDialogOpen(false);
    }

    const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
        defaultValues: {
            username: "",
            newPassword: "",
            cfmPassword: "",
        }
    });

    const username = watch("username");
    const newPassword = watch("newPassword");

    const onSubmit = (formData: Record<string, string>) => {
        const data = {
            username: formData.username,
            newPassword: formData.newPassword,
            file: file,
        }
        if (data.username || data.newPassword || data.file) {
            setFormData(data);
            handleDialogOpen();
        } else {
            toast.error("No fields to change");
        }
    }

    return <MainLayout>
        <div className="flex flex-col min-h-full min-w-full bg-white">
            <ConfirmSettingDialog open={confirmSettingDialogOpen} handleDialogCloseFn={handleDialogClose} data={formData} handleSuccessChange={handleSuccessChange} />
            <h1 className="font-semibold text-4xl py-8">SETTINGS</h1>
            <div className="flex-1">
                <div className="flex min-h-full items-center">
                    <div className="flex-1 flex flex-col justify-center items-center gap-y-10">
                        <Avatar src={preview} sx={{ width: 300, height: 300 }} />
                        <div className="flex justify-between gap-x-4">
                            <Button
                                component="label"
                                role={undefined}
                                variant="contained"
                                tabIndex={-1}
                                startIcon={<CloudUploadIcon />}
                            >
                                Upload Photo
                                <VisuallyHiddenInput
                                    id="avatar"
                                    type="file"
                                    onChange={handleFileChange}
                                    accept="image/png, image/jpg, image/jpeg"
                                />
                            </Button>
                            <Button color="error" variant="outlined" startIcon={<DeleteIcon />} onClick={handleDeletePhoto}>
                                Remove
                            </Button>
                        </div>
                    </div>
                    <div className="flex-1">
                        <form className="flex flex-col gap-y-4 w-4/5">
                            <TextField label="Username" variant="outlined" placeholder="Enter new username"
                                error={errors.username !== undefined}
                                helperText={errors.username?.message}
                                slotProps={{
                                    input: {
                                        startAdornment: (<InputAdornment position="start"><PersonIcon /></InputAdornment>)
                                    }
                                }}
                                {...register("username", {
                                    minLength: { value: username.length > 0 ? 4 : 0, message: "Username must be at least 4 characters." },
                                    maxLength: { value: username.length > 0 ? 20 : 0, message: "Username must be at most 20 characters." },
                                })} />
                            <TextField label="New Password" variant="outlined" type={showPassword ? "text" : "password"} placeholder="Enter new password"
                                error={errors.newPassword !== undefined}
                                helperText={errors.newPassword?.message}
                                slotProps={{
                                    input: {
                                        startAdornment: <InputAdornment position="start"><VpnKeyIcon /></InputAdornment>,
                                        endAdornment: <InputAdornment position="end">{
                                            showPassword
                                                ? <VisibilityOffIcon className="cursor-pointer" onClick={() => setShowPassword(false)} />
                                                : <VisibilityIcon className="cursor-pointer" onClick={() => setShowPassword(true)} />
                                        }</InputAdornment>
                                    }
                                }}
                                {...register("newPassword", {
                                    minLength: { value: newPassword.length > 0 ? 6 : 0, message: "Password must be at least 6 characters." },
                                })} />
                            <TextField label="Confirm Password" variant="outlined" type={showPassword ? "text" : "password"} placeholder="Enter new password again"
                                error={errors.cfmPassword !== undefined}
                                helperText={errors.cfmPassword?.message}
                                slotProps={{
                                    input: {
                                        startAdornment: <InputAdornment position="start"><VpnKeyIcon /></InputAdornment>,
                                        endAdornment: <InputAdornment position="end">{
                                            showPassword
                                                ? <VisibilityOffIcon className="cursor-pointer" onClick={() => setShowPassword(false)} />
                                                : <VisibilityIcon className="cursor-pointer" onClick={() => setShowPassword(true)} />
                                        }</InputAdornment>
                                    }
                                }}
                                {...register("cfmPassword",
                                    {

                                        validate: (value) => {
                                            if (value !== newPassword) {
                                                return "Password do not match."
                                            }
                                        }
                                    })} />
                            <div className="flex justify-center items-center">
                                <Button
                                    variant="contained"
                                    onClick={handleSubmit(onSubmit)}
                                    sx={{ mx: 3, borderRadius: 20 }}
                                    color="success"
                                >
                                    Save Changes
                                </Button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div >
    </MainLayout>;
}

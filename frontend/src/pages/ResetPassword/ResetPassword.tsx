import { useForm } from "react-hook-form";
import RotateRightIcon from '@mui/icons-material/RotateRight';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function ResetPasswordPage() {
    const [success, setSuccess] = useState(false);

    const urlToken = window.location.search.split("=")[1];

    const { register, handleSubmit, formState: { errors }, watch } = useForm({
        defaultValues: {
            newPassword: "",
            cfmPassword: "",
        }
    });

    const password = watch("newPassword");

    const { mutate, isPending } = useMutation({
        mutationFn: (data: Record<string, string>) => {
            return axios.post(`${process.env.REACT_APP_USER_SVC_PORT}/users/forgotpassword/${urlToken}`, data);
        },
        onSuccess: (data) => {
            setSuccess(true);
        },
        onError: (error: AxiosError) => {
            const data: any = error.response?.data;
            if (data) {
                toast.error(data.message);
            }
        }
    });

    const onSubmit = (data: Record<string, string>) => {
        mutate(data);
    }

    const textBoxStyle = "border-2 border-black rounded-lg w-full h-12 pl-10"

    return <div className="flex flex-col min-w-full min-h-screen bg-white justify-center items-center gap-10 text-lg">
            <img className="w-1/4" alt="peerprep logo" src="/logo-with-text.svg" />
            {success ?
                <>
                    <h1>Your password has been reset</h1>
                    <h1>Please <Link className="text-buttonColour hover:underline" to="/login" replace>Login</Link> using your new password</h1>
                </> :
                <form className="flex w-2/5 flex-col gap-y-8 items-center" onSubmit={handleSubmit(onSubmit)}>
                    <h1>Enter your new password </h1>
                    <div className="relative flex flex-col">
                        <input className={textBoxStyle} type="password" placeholder="Enter password"
                            {...register("newPassword", {
                                required: { value: true, message: "Password is required." },
                                minLength: { value: 6, message: "Password must be at least 6 characters." },
                            })} />
                        <VpnKeyIcon fontSize="medium" className="absolute top-1/2 -translate-y-1/2 translate-x-1/3" />
                        <span className="absolute bottom-0 translate-y-full right-0 text-base text-red-500">{errors.newPassword?.message}</span>
                    </div>
                    <div className="relative flex flex-col">
                        <input className={textBoxStyle} type="password" placeholder="Enter password again"
                            {...register("cfmPassword",
                                {
                                    required: { value: true, message: "Please enter password again." },
                                    validate: (value) => {
                                        if (value !== password) {
                                            return "Password do not match."
                                        }
                                    }
                                })} />
                        <VpnKeyIcon fontSize="medium" className="absolute top-1/2 -translate-y-1/2 translate-x-1/3" />
                        <span className="absolute bottom-0 translate-y-full right-0 text-base text-red-500">{errors.cfmPassword?.message}</span>
                    </div>
                    <button disabled={isPending} className="flex bg-buttonColour w-1/2 justify-center items-center gap-x-2 p-2 rounded-lg opacity-80 hover:opacity-100 transition-all delay-600 disabled:cursor-not-allowed disabled:opacity-40">
                        {isPending && <RotateRightIcon className="animate-spin" />}
                        {isPending ? "Processing..." : "Continue"}
                    </button>
                </form>
            }
    </div>;
}

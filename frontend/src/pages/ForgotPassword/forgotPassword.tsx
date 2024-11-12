import { useForm } from "react-hook-form";
import EmailIcon from '@mui/icons-material/Email';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useState } from "react";
import { Link } from "react-router-dom";

export default function ForgotPasswordPage() {
    const [success, setSuccess] = useState(false);

    const { register, handleSubmit, formState: { errors } } = useForm({
        defaultValues: {
            email: "",
        }
    });

    const { mutate, isPending } = useMutation({
        mutationFn: (email: String) => {
            return axios.get(`${process.env.REACT_APP_USER_SVC_PORT}/users/forgotpassword/${email}`);
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
        mutate(data.email);
    }


    return <div className="flex flex-col min-w-full min-h-screen bg-white justify-center items-center gap-10 text-lg">
            <img className="w-1/4" alt="peerprep logo" src="/logo-with-text.svg" />
            {success ?
                <>
                    <h1>Instruction for password reset has been sent if the email is associated with an account</h1>
                    <h1>Please check your email inbox and junk inbox.</h1>
                    <Link className="text-buttonColour hover:underline" to="/">Return to homepage</Link>
                </> :
                <form className="flex w-2/5 flex-col gap-y-8 items-center" onSubmit={handleSubmit(onSubmit)}>
                    <h1>Enter the email address associated with your account and we will send you a link to reset your password </h1>
                    <div className="relative flex flex-col w-full">
                        <input className="border-2 border-black rounded-lg w-full h-12 pl-10" type="text" placeholder="Email"
                            {...register("email", {
                                required: { value: true, message: "Email is required" },
                                pattern: { value: /[a-z0-9]+@[a-z0-9]+\.[a-z]{2,3}/, message: "Email is invalid" },
                            })} />
                        <EmailIcon fontSize="medium" className="absolute top-1/2 -translate-y-1/2 translate-x-1/3" />
                        <span className="absolute bottom-0 translate-y-full right-0 text-base text-red-500">{errors.email?.message}</span>
                    </div>
                    <button disabled={isPending} className="flex bg-buttonColour w-1/2 justify-center items-center gap-x-2 p-2 rounded-lg opacity-80 hover:opacity-100 transition-all delay-600 disabled:cursor-not-allowed disabled:opacity-40">
                        {isPending && <RotateRightIcon className="animate-spin" />}
                        {isPending ? "Processing..." : "Continue"}
                    </button>
                    <span>Already have an account? <Link className="text-buttonColour hover:underline" to="/login" replace>Login</Link> now!</span>
                </form>
            }
    </div>;
}

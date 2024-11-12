import { useForm } from "react-hook-form";
import { Link } from "react-router-dom";
import EmailIcon from '@mui/icons-material/Email';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import PersonIcon from '@mui/icons-material/Person'
import VisibilityIcon from '@mui/icons-material/Visibility';
import VisibilityOffIcon from '@mui/icons-material/VisibilityOff';
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useState } from "react";

export default function SignupPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [success, setSuccess] = useState(false);

  const { register, handleSubmit, watch, formState: { errors } } = useForm({
    defaultValues: {
      userName: "",
      email: "",
      password: "",
      cfmPassword: "",
    }
  });

  const password = watch("password");


  const { mutate, isPending } = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      return axios.post(`${process.env.REACT_APP_USER_SVC_PORT}/users`, data)
    },
    onSuccess: (data) => {
      toast.success("Account created!");
      setSuccess(true);
    },
    onError: (error: AxiosError) => {
      const data: any = error.response?.data;
      if (data) {
        toast.error(data.message);
      }
    }
  });

  const onSubmit = (formData: Record<string, string>) => {
    const data = {
      username: formData.userName,
      email: formData.email,
      password: formData.password,
    }
    mutate(data);
  }

  const textBoxStyle = "border-2 border-black rounded-lg w-full h-12 pl-10"

  return <div className="flex flex-row min-w-full min-h-screen" >
    <div className="flex-1 bg-black max-h-screen">
      <img className="w-full h-full" src="/background.jpg" alt="background" />
    </div>
    <div className="py-12 flex-1 flex flex-col gap-10 bg-white text-black justify-center items-center text-lg">
      <img className="w-1/4" alt="peerprep logo" src="/logo-with-text.svg" />
      {
        success ?
          <div className="flex flex-col gap-y-8">
            <h1>Account successfully created!</h1>
            <h1>Please click on the verification link that is sent to your email.</h1>
            <h1>After verification, you may proceed to <Link className="text-buttonColour hover:underline" to="/login" replace>Login</Link>.</h1>
          </div>
          :
          <>
            <form className="flex w-3/5 flex-col gap-y-8" onSubmit={handleSubmit(onSubmit)}>
              <div className="relative flex flex-col">
                <input className={textBoxStyle} type="text" placeholder="Enter username"
                  {...register("userName", {
                    required: { value: true, message: "Username is required" },
                    minLength: { value: 4, message: "Username must be at least 4 characters." },
                    maxLength: { value: 20, message: "Username must be at most 20 characters." },
                  })} />
                <PersonIcon fontSize="medium" className="absolute top-1/2 -translate-y-1/2 translate-x-1/3" />
                <span className="absolute bottom-0 translate-y-full right-0 text-base text-red-500">{errors.userName?.message}</span>
              </div>
              <div className="relative flex flex-col">
                <input className={textBoxStyle} type="text" placeholder="Enter email"
                  {...register("email", {
                    required: { value: true, message: "Email is required" },
                    pattern: { value: /[a-z0-9]+@[a-z0-9]+\.[a-z]{2,3}/, message: "Email is invalid" },
                  })} />
                <EmailIcon fontSize="medium" className="absolute top-1/2 -translate-y-1/2 translate-x-1/3" />
                <span className="absolute bottom-0 translate-y-full right-0 text-base text-red-500">{errors.email?.message}</span>
              </div>
              <div className="relative flex flex-col">
                <input className={textBoxStyle} type={showPassword ? "text" : "password"} placeholder="Enter password"
                  {...register("password", {
                    required: { value: true, message: "Password is required." },
                    minLength: { value: 6, message: "Password must be at least 6 characters." },
                  })} />
                <VpnKeyIcon fontSize="medium" className="absolute top-1/2 -translate-y-1/2 translate-x-1/3" />
                {showPassword
                  ? <VisibilityOffIcon fontSize="medium" className="absolute top-1/2 right-0 -translate-y-1/2 -translate-x-1/3 cursor-pointer" onClick={() => setShowPassword(false)} />
                  : <VisibilityIcon fontSize="medium" className="absolute top-1/2 right-0 -translate-y-1/2 -translate-x-1/3 cursor-pointer" onClick={() => setShowPassword(true)} />}
                <span className="absolute bottom-0 translate-y-full right-0 text-base text-red-500">{errors.password?.message}</span>
              </div>
              <div className="relative flex flex-col">
                <input className={textBoxStyle} type={showPassword ? "text" : "password"} placeholder="Enter password again"
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
                {showPassword
                  ? <VisibilityOffIcon fontSize="medium" className="absolute top-1/2 right-0 -translate-y-1/2 -translate-x-1/3 cursor-pointer" onClick={() => setShowPassword(false)} />
                  : <VisibilityIcon fontSize="medium" className="absolute top-1/2 right-0 -translate-y-1/2 -translate-x-1/3 cursor-pointer" onClick={() => setShowPassword(true)} />}
                <span className="absolute bottom-0 translate-y-full right-0 text-base text-red-500">{errors.cfmPassword?.message}</span>
              </div>
              <div className="flex justify-center items-center">
                <button disabled={isPending} className="flex bg-buttonColour w-1/2 justify-center items-center gap-x-2 p-2 rounded-lg opacity-80 hover:opacity-100 transition-all delay-600 disabled:cursor-not-allowed disabled:opacity-40">
                  {isPending && <RotateRightIcon className="animate-spin" />}
                  {isPending ? "Processing..." : "Sign Up"}
                </button>
              </div>
            </form>
            <span>Already have an account? <Link className="text-buttonColour hover:underline" to="/login" replace>Login</Link> now!</span>
          </>
      }</div>
  </div >
}

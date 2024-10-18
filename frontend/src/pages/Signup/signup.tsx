import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import EmailIcon from '@mui/icons-material/Email';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";

export default function SignupPage() {

  const navigate = useNavigate();

  const { register, handleSubmit, watch, formState: { errors }, reset } = useForm({
    defaultValues: {
      email: "",
      password: "",
      cfmPassword: "",
    }
  });

  const password = watch("password");


  const { mutate, isPending } = useMutation({
    mutationFn: async (data: Record<string, string>) => {
      return axios.post("Insert signup API", data)
    },
    onSuccess: (data) => {
      toast.success("Account created!")
      reset();
      navigate("/login")
    },
    onError: (error: AxiosError) => {
      let message: string;
      if (error.status === 409) {
        message = "Email already exists"
      } else {
        message = "Unknown error occurred"
      }
      toast.error(message)
    }
  });

  const onSubmit = (formData: Record<string, string>) => {
    const data = {
      email: formData.email,
      password: formData.password,
    }
    mutate(data);
  }

  const textBoxStyle = "border-2 border-black rounded-lg w-full h-12 pl-10"

  return <div className="flex flex-row min-w-full min-h-screen">
    <div className="flex-1 bg-black"></div>
    <div className="py-12 flex-1 flex flex-col gap-10 bg-white text-black justify-center items-center text-lg">
      <img className="w-1/4" alt="peerprep logo" src="/logo-with-text.svg" />
      <form className="flex w-3/5 flex-col gap-y-8" onSubmit={handleSubmit(onSubmit)}>
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
          <input className={textBoxStyle} type="password" placeholder="Enter password"
            {...register("password", {
              required: { value: true, message: "Password is required." },
              minLength: { value: 6, message: "Password must be at least 6 characters." }
            })} />
          <VpnKeyIcon fontSize="medium" className="absolute top-1/2 -translate-y-1/2 translate-x-1/3" />
          <span className="absolute bottom-0 translate-y-full right-0 text-base text-red-500">{errors.password?.message}</span>
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
        <div className="flex justify-center items-center">
          <button disabled={isPending} className="flex bg-buttonColour w-1/2 justify-center items-center gap-x-2 p-2 rounded-lg opacity-80 hover:opacity-100 transition-all delay-600 disabled:cursor-not-allowed disabled:opacity-40">
            {isPending && <RotateRightIcon className="animate-spin" />}
            {isPending ? "Processing..." : "Sign Up"}
          </button>
        </div>
      </form>
      <span>Already have an account? <Link className="text-buttonColour hover:underline" to="/login" replace>Login</Link> now!</span>
    </div>
  </div>;
}

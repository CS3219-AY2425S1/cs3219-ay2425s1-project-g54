import { useForm } from "react-hook-form";
import { Link, useNavigate } from "react-router-dom";
import EmailIcon from '@mui/icons-material/Email';
import RotateRightIcon from '@mui/icons-material/RotateRight';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import toast from "react-hot-toast";
import { useContext } from "react";
import { AuthContext, authState } from "../../hooks/AuthContext";

export default function LoginPage() {
  const {user, setUser, setIsAuthenticated} = useContext(AuthContext);
  const navigate = useNavigate();

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    defaultValues: {
      email: "",
      password: "",
    }
  });

  const { mutate, isPending } = useMutation({
    mutationFn: (data: Record<string, string>) => {
      return axios.post(`http://localhost:${process.env.REACT_APP_USER_SVC_PORT}/auth/login`, data, {
        withCredentials: true,
      });
    },
    onSuccess: (data) => {
      setIsAuthenticated(authState.TRUE);
      setUser(data.data.data);
      reset();
      navigate("/");
    },
    onError: (error: AxiosError) => {
      let message: string;
      if (error.status === 401) {
        message = "Incorrect email or password"
      } else {
        message = "Unknown error occurred"
      }
      toast.error(message)
    }
  });

  const onSubmit = (data: Record<string, string>) => {
    mutate(data);
  }

  const textBoxStyle = "border-2 border-black rounded-lg w-full h-12 pl-10"

  return <div className="flex flex-row min-w-full min-h-screen">
    <div className="flex-1 bg-black"></div>
    <div className="py-12 flex-1 flex flex-col gap-10 bg-white text-black justify-center items-center text-lg">
      <img className="w-1/4" alt="peerprep logo" src="/logo-with-text.svg" />
      <form className="flex w-3/5 flex-col gap-y-8" onSubmit={handleSubmit(onSubmit)}>
        <div className="relative flex flex-col">
          <input className={textBoxStyle} type="text" placeholder="Email"
            {...register("email", {
              required: { value: true, message: "Email is required" },
              pattern: { value: /[a-z0-9]+@[a-z0-9]+\.[a-z]{2,3}/, message: "Email is invalid" },
            })} />
          <EmailIcon fontSize="medium" className="absolute top-1/2 -translate-y-1/2 translate-x-1/3" />
          <span className="absolute bottom-0 translate-y-full right-0 text-base text-red-500">{errors.email?.message}</span>
        </div>
        <div className="relative flex flex-col">
          <input className={textBoxStyle} type="password" placeholder="Password"
            {...register("password", { required: { value: true, message: "Password is required." } })} />
          <VpnKeyIcon fontSize="medium" className="absolute top-1/2 -translate-y-1/2 translate-x-1/3" />
          <span className="absolute bottom-0 translate-y-full right-0 text-base text-red-500">{errors.password?.message}</span>
        </div>
        <div className="flex justify-between items-center">
          <Link className="hover:underline" to="/forgotpassword">Forgot Password?</Link>
          <button disabled={isPending} className="flex bg-buttonColour w-1/2 justify-center items-center gap-x-2 p-2 rounded-lg opacity-80 hover:opacity-100 transition-all delay-600 disabled:cursor-not-allowed disabled:opacity-40">
            {isPending && <RotateRightIcon className="animate-spin" />}
            {isPending ? "Processing..." : "Login"}
          </button>
        </div>
      </form>
      <span>Not Registered? <Link className="text-buttonColour hover:underline" to="/signup" replace>Sign up</Link> now!</span>
    </div>
  </div>;
}

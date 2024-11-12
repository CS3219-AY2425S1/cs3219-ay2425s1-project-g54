import RotateRightIcon from '@mui/icons-material/RotateRight';
import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function VerifyAccountPage() {
    const [success, setSuccess] = useState(false);
    const [token, setToken] = useState("");

    useEffect(() => {
        const urlToken = window.location.search.split("=")[1];
        setToken(urlToken || "");
    }, []);

    useEffect(() => {
        if (token.length > 0) {
            mutate(token);
        }
    }, [token]);


    const { mutate, isPending } = useMutation({
        mutationFn: async (token: String) => {
            return axios.get(`${process.env.REACT_APP_USER_SVC_PORT}/users/verify/${token}`);
        },
        onSuccess: (data) => {
            setSuccess(true);
        },
        onError: (error: AxiosError) => { }
    });


    return <div className="flex flex-col min-w-full min-h-screen bg-white justify-center items-center gap-10 text-lg">
        <img className="w-1/4" alt="peerprep logo" src="/logo-with-text.svg" />
        {isPending ?
            <>
                <div className='flex items-center'>
                    <RotateRightIcon className="animate-spin" fontSize='large' />Loading
                </div>
            </>
            : <>
                {success ?
                    <>
                        <h1>Your Email has been Verified</h1>
                        <h1>You can now <Link className="text-buttonColour hover:underline" to="/login" replace>Login</Link>.</h1>
                    </> :
                    <>
                        <h1>Verification fail.</h1>
                        <h1>Plase <Link className="text-buttonColour hover:underline" to="/login" replace>Login</Link> to get a new verification email.</h1>
                    </>
                }</>}
    </div>;
}

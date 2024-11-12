import { useContext } from "react";
import {Outlet, Navigate} from "react-router-dom"
import { AuthContext, authState } from "../contexts/AuthContext";
import Loading from "../components/Loading/loading";

export default function PublicRoute() {
    const {isAuthenticated} = useContext(AuthContext);
    if (isAuthenticated === authState.LOADING) return <Loading/>
    return isAuthenticated !== authState.TRUE? <Outlet/> : <Navigate to="/" replace/>
}
import axios from "axios";
import { SetStateAction, Dispatch, createContext, useState, ReactNode, useEffect } from "react";

export type User = {
    id: string,
    username: string,
    email: string,
    isAdmin: boolean
    avatar: string,
    createdAt: number,
    currentRoom: string
};

function defaultUser() {
    return {
        id: "",
        username: "",
        email: "",
        isAdmin: false,
        avatar: "",
        createdAt: 0,
        currentRoom: ""
    };
}

export enum authState {
    LOADING,
    FALSE,
    TRUE
};

export interface AuthContextInterface {
    user: User,
    isAuthenticated: authState,
    setUser: Dispatch<SetStateAction<User>>,
    setIsAuthenticated: Dispatch<SetStateAction<authState>>
};

const defaultState = {
    user: defaultUser(),
    isAuthenticated: authState.LOADING,
    setUser: (user: User) => { },
    setIsAuthenticated: (isAuth: authState) => { }
} as AuthContextInterface;

export const AuthContext = createContext(defaultState);

type ContextProviderNode = {
    children: ReactNode
};

export default function AuthContextProvider({ children }: ContextProviderNode) {
    const [user, setUser] = useState<User>(defaultUser());
    const [isAuthenticated, setIsAuthenticated] = useState(authState.LOADING)

    useEffect(() => {
        axios.get(`${process.env.REACT_APP_USER_SVC_PORT}/auth/verify-token`, {
            withCredentials: true
        })
            .then((response) => {
                setIsAuthenticated(authState.TRUE);
                setUser(response.data.data);
            })
            .catch((error) => {
                setIsAuthenticated(authState.FALSE);
                setUser(defaultUser());
            });
    }, [])

    return (
        <AuthContext.Provider value={{ user, isAuthenticated, setUser, setIsAuthenticated }}>
            {children}
        </AuthContext.Provider>
    )
};

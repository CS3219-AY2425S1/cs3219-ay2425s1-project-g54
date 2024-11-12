import { CircularProgress } from "@mui/material";

export default function Loading() {
  return (
    <div className="flex h-screen w-full justify-center items-center">
        <CircularProgress color="success" size="3rem" disableShrink/>
    </div>
  )
}

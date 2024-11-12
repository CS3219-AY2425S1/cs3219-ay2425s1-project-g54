import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return <div className="flex flex-col min-w-full min-h-screen bg-white justify-center items-center gap-10 text-lg">
      <img className="w-1/4" alt="peerprep logo" src="/logo-with-text.svg" />
      <h1 className="text-6xl">404 Page not found</h1>
      <Link className="text-buttonColour hover:underline" to="/">Return to homepage</Link>
  </div>;
};

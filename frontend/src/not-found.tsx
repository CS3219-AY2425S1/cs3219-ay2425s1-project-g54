import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return <div className="flex flex-row min-w-full min-h-screen">
  <div className="flex-1 bg-black"></div>
    <div className="py-12 flex-1 flex flex-col gap-10 bg-white text-black justify-center items-center text-lg">
      <img className="w-1/4" alt="peerprep logo" src="/logo-with-text.svg" />
      <h1 className="text-6xl">404 Page not found</h1>
      <Link className="text-buttonColour hover:underline" to="/">Return to homepage</Link>
    </div>
  </div>;
};

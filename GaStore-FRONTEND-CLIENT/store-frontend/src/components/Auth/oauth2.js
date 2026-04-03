import Spinner from "@/utils/spinner";
import { useState } from "react";

const OAuth2Component = () => {
const [loading, setLoading] = useState(false);
    return (
        <div className='flex flex-col items-center'>
          <Spinner loading={loading} />
      <div className="flex items-center justify-center my-4">
          <span className="text-sm text-gray-500">OR</span>
        </div>
        <button
        onClick={()=> {setLoading(true); location.href=process.env.NEXT_PUBLIC_GOOGLE_AUTH_URL;} }
          className="w-full bg-red-500 text-white py-2 rounded hover:bg-red-600 transition"
        >
          Continue with Google
        </button>
      </div>
    )
}

export default OAuth2Component;
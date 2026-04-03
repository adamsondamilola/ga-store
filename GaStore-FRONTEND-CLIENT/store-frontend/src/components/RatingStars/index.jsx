'use client';
import { Star } from "@mui/icons-material";
import { FiStar } from "react-icons/fi";

export default function RatingStars(props) {
const startSize = 18;
  return (
    <div className="w-48 flex items-center">
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
            {/*<FiStar size={startSize} className="text-yellow-300" fill="currentColor"/>*/}
            <FiStar size={startSize} className={parseInt(props.rating ?? 0) > 0 ? "text-yellow-300" : "text-gray-200"} fill="currentColor"/>
            <FiStar size={startSize} className={parseInt(props.rating ?? 0) > 1 ? "text-yellow-300" : "text-gray-200"} fill="currentColor"/>
            <FiStar size={startSize} className={parseInt(props.rating ?? 0) > 2 ? "text-yellow-300" : "text-gray-200"} fill="currentColor"/>
            <FiStar size={startSize} className={parseInt(props.rating ?? 0) > 3 ? "text-yellow-300" : "text-gray-200"} fill="currentColor"/>
            <FiStar size={startSize} className={parseInt(props.rating ?? 0) > 4? "text-yellow-300" : "text-gray-200"} fill="currentColor"/>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800 ms-3">{`${0+parseInt(props.rating ?? 0)}.0`}</span>
        </div>
  );
}
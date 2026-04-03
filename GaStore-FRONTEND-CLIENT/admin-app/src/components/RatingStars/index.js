'use client';
import { useRef, useState } from "react";
import { Star } from "@mui/icons-material";

export default function RatingStars(props) {

  return (
    <div className="w-48 flex items-center">
            <div className="flex items-center space-x-1 rtl:space-x-reverse">
            <Star className="text-purple-950"/>
            <Star className={parseInt(props.score ?? 0) > 1 ? "text-purple-950" : "text-gray-200"}/>
            <Star className={parseInt(props.score ?? 0) > 2 ? "text-purple-950" : "text-gray-200"}/>
            <Star className={parseInt(props.score ?? 0) > 3 ? "text-purple-950" : "text-gray-200"}/>
            <Star className={parseInt(props.score ?? 0) > 4? "text-purple-950" : "text-gray-200"}/>
            </div>
            <span className="bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded dark:bg-blue-200 dark:text-blue-800 ms-3">{`${0+parseInt(props.score ?? 0)}.0`}</span>
        </div>
  );
}

// src/components/BackgroundSection.js
import React from "react";
import AppImages from "../../constants/Images";

const LoadingOverlay = () => {
    return (
        <div className="absolute h-full w-full z-50 bg-cover bg-center bg-no-repeat"
            style={{ backgroundImage: AppImages.loading }}>
            {/* Overlay */}
            < div className="absolute inset-0 bg-black opacity-50" ></div>
            {/* Content on top of overlay */}
            < div className="relative z-10 flex flex-col items-center justify-center h-full">
            <img src={AppImages.loading} className="w-24"/>
                <p className="text-white text-sm font-bold text-center px-4">
                    Loading...
                </p>
            </div>
        </div >
    );
};

export default LoadingOverlay;
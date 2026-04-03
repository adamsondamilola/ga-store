import React from 'react';

const ErrorMessageAlert = (props) => {
    return (
        props.hasError? <div className="w-full py-2 rounded items-center justify-center">
        <div className={'bg-red-600 text-white p-2'}>{props.message}</div>
     </div>
     : <></>
    );
};

const SuccessMessageAlert = (props) => {
    return (
        props.hasError? <div className="w-full py-2 rounded items-center justify-center">
        <div className={'bg-green-600 text-white p-2'}>{props.message}</div>
     </div>
     : <></>
    );
};

export default {ErrorMessageAlert, SuccessMessageAlert};

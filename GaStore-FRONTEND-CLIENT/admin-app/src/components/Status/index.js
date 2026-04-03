
export default function StatusComponent(props) {

    if(props.status === 0 || props.status === false || props.status === 'Pending'){
        return (
           <div className="bg-yellow-100 w-24 text-center rounded-lg">
             <span className="text-yellow-500 ">
                Pending
            </span>
           </div>
        )
    }
    else if(props.status === true || props.status === "Delivered"){
        return (
           <div className="bg-green-100 w-24 text-center rounded-lg">
             <span className="text-green-500 ">
               {props.status === "Delivered"? 'Delivered' : 'Completed'}
            </span>
           </div>
        )
    }
    else if(props.status === 1){
        return (
           <div className="bg-green-100 w-24 text-center rounded-lg">
             <span className="text-green-500 ">
                Approved
            </span>
           </div>
        )
    }
    else if(props.status === 2 || props.status === 'Cancelled'){
        return (
           <div className="bg-red-100 w-24 text-center rounded-lg">
             <span className="text-red-500 ">
                {props.status === 'Cancelled'? props.status : 'Rejected'}
            </span>
           </div>
        )
    }
    else {
        return (
            <div className="bg-gray-100 w-24 text-center rounded-lg">
              <span className="text-gray-500 ">
                  {props.status}
             </span>
            </div>
         )
    }
}
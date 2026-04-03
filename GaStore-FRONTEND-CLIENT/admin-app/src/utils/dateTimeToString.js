const dateTimeToString = (str) =>{
    try{
        const date = new Date(str);
const dateString = date.toLocaleString(); // e.g., "9/29/2021, 3:00:00 PM"
return dateString;
    }
    catch(e){
        return str
    }
}

export default dateTimeToString
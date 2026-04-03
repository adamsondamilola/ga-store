const dateTimeToWord = (str) =>{
    try{
        const dateToWord = (date) => {
            const options = { year: 'numeric', month: 'long', day: 'numeric' };
            return new Date(date).toLocaleDateString('en-US', options);
          };
          
return dateToWord(str);
    }
    catch(e){
        return str
    }
}

export default dateTimeToWord
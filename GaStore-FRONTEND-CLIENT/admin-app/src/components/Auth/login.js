import { useEffect, useState } from 'react';
import { TextField, Button } from '@mui/material';
import requestHandler from '../../utils/requestHandler';
import OAuth2Component from './oauth2';
import { FloatingLabel } from 'flowbite-react';
import Strings from '../../constants/Strings';
import { toast } from 'react-toastify';
import Spinner from '../../utils/loader';
import { Link } from 'react-router-dom';
import endpointsPath from '../../constants/EndpointsPath';
import AppImages from '../../constants/Images';

const LoginComponent = (props) => {
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWrongPassword, setIsWrongPassword] = useState(false);

  const handleEmailSubmit = (e) => {
    e.preventDefault();
    if (email) {
      setEmailSubmitted(true);
    }
  };


  function showConfirmation() {
    const userConfirmed = window.confirm("Seems you are new. Do you want to proceed and create an account?");
    
    if (userConfirmed) {
      window.location.href='/signup'
      // Add any action you want to perform on Yes
    } else {
      //alert("You chose No.");
      // Add any action you want to perform on No
    }
  }

  useEffect(()=>{
    const checkLogin = async () =>{
       const resp = await requestHandler.get(endpointsPath.auth+'/logged-in-user', true);
            if (resp.statusCode === 200) {
                window.location.href="/dashboard"
            }
    }
    checkLogin();
  },[]);

  const handleEmailVerification = async (e) => {
    setLoading(true)
    e.preventDefault();
    
      try{
        const data = {
          email: email
        }
        let resp = await requestHandler.get(`${endpointsPath.auth}/check/${email}`, false);
        if(resp.statusCode === 200){
            setEmailSubmitted(true);
            setLoading(false)
        }
      else{
            //showConfirmation()
            toast.error(resp.result.message)
            setLoading(false)
        }
        console.log(resp)  
      }
      catch(e){
        toast.error(Strings.internalServerError)
        setLoading(false)
      }
      finally{
        setLoading(false)
      }
  }

  const handleLogin = async (e) => {
    setLoading(true)
    setIsWrongPassword(false)
    e.preventDefault();
    
      try{
        const data = {
          password: password,
          email: email
        }
        let resp = await requestHandler.post(`${endpointsPath.auth}/login`, data, false);
        //alert(JSON.stringify(resp))
        //return
        if(resp.statusCode === 200){
              const roles = resp.result.data
              const hasAdmin = roles.some(role => role.name === "Admin" || role.name === "Super Admin");
              if(hasAdmin){ 
                localStorage.setItem("token", resp?.result?.message)
                let redirectUrl = localStorage.getItem("redirect_url");
                let url = props.redirectUrl == null || props.redirectUrl == ''? "/" :  props.redirectUrl
                window.location.href="/dashboard"}
              //localStorage.removeItem("redirect_url");
              else {
                toast.error('Not authorized!')
              }
        }
        else{
          setIsWrongPassword(true)
          toast.error(resp.result.message)
          setEmailSubmitted(false);
          
        }
        console.log(resp)  
      }
      catch(e){
        toast.error(Strings.internalServerError)
        
      }
      finally{
        setLoading(false)
      }
  }

  return (
    <div className="flex flex-col items-center"> 
    <div className='mb-4'>
      <img src={AppImages.logo} className='h-10' />
    </div>
      <h1 className="text-2xl font-bold mb-6 dark:text-red-900">Welcome back</h1>
      {!emailSubmitted ? (
        <form onSubmit={handleEmailVerification} className="p-5 w-80">
          <FloatingLabel
            variant="outlined"
            label="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="mb-4"
          />
          <Spinner loading={loading} />
          <Button style={{display: loading? 'none':'flex'}} type="submit" variant="contained" color="primary" className="w-full">
            Continue
          </Button>
        </form>
      ) : (
        <form onSubmit={handleLogin} className="w-80">
          <FloatingLabel
            variant="outlined"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            color={isWrongPassword? 'error' : 'default'}
            helperText={isWrongPassword? "You entered a wrong password." : ""}
            className="mb-4"
          />
          <p className="mb-4 flex justify-center">Forgot password?<a href="/reset-password" className="text-blue-500"> <span className='ml-1'>Reset</span> </a></p>
          <Spinner loading={loading} />
          <Button style={{display: loading? 'none':'flex'}} type="submit" variant="contained" color="primary" className="w-full">
            Login
          </Button>
        </form>
      )}
      {/*<p className="mt-4">Don&#39;t have an account?<Link to="/signup" className="text-blue-500 ml-2">Sign Up</Link></p>*/}
      <OAuth2Component/>
    </div>
  );
}

export default LoginComponent;
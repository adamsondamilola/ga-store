import { useState } from 'react';
import { TextField, Button } from '@mui/material';
import OAuth2Component from '@/components/Auth/oauth2';
import requestHandler from '@/utils/requestHandler';
import { toast } from 'react-toastify';
import Strings from '@/constants/Strings';
import { FloatingLabel } from 'flowbite-react';
import { Link, useParams } from 'react-router-dom';
import Spinner from '@/utils/loader';
import endpointsPath from '@/constants/EndpointsPath';

export default function SignupComponent() {
    const [email, setEmail] = useState(null);
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState(null);
    const [emailSubmitted, setEmailSubmitted] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(null);
    const [loading, setLoading] = useState(false);
    const { username } = useParams(); 

  function showConfirmation() {
    const userConfirmed = window.confirm(`Click OK to proceed if your email address is correct ${email}`);
    
    if (userConfirmed) {
        setEmailSubmitted(true);
      // Add any action you want to perform on Yes
    } else {
      //alert("You chose No.");
      // Add any action you want to perform on No
    }
  }

  const handleEmailVerification = async (e) => {
    setLoading(true)
    e.preventDefault();
    
      try{
        const data = {
          email: email
        }
        let resp = await requestHandler.get(`${endpointsPath.auth}/check/${email}`, false);
        if(resp.statusCode === 200){
            //setEmailSubmitted(true);
            window.location.href='/login'
            setLoading(false)
        }
      else{
            //showConfirmation()
            setEmailSubmitted(true);
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
  
  const handleSignup = async (e) => {
    setLoading(true)
    e.preventDefault();
    
      try{
        const username_ = email.split('@')[0];
        const data = {
          username: username_,
          password: password,
          passwordConfirmation: confirmPassword,
          email: email
        }
        let endpoint = `${endpointsPath.auth}/register`;
        if(username && username.length > 0){
          endpoint = `auth/${username}/signup`
        }
        let resp = await requestHandler.post(endpoint, data, false);

        if(resp.statusCode === 200){
              
              //window.location.href="/"
              handleLogin();
        }
        else{
          toast.error(resp.result.message)
          setLoading(false)
        }
        console.log(resp)  
      }
      catch(e){
        toast.error(Strings.internalServerError)
        setLoading(false)
      }
  }

  const handleLogin = async (e) => {
    setLoading(true)
    
      try{
        const data = {
          password: password,
          email: email
        }
        let resp = await requestHandler.post(`${endpointsPath.auth}/login`, data, false);
        if(resp.statusCode === 200){
          localStorage.setItem("token", resp.result.message)
          let redirectUrl = localStorage.getItem("redirect_url");
          let url = "/"
          localStorage.removeItem("redirect_url");
          window.location.href=redirectUrl || url;
        }
        else{
          toast.error(resp.result.message)
          window.location.href="/login"
        }
        console.log(resp)  
      }
      catch(e){
        window.location.href="/login"
        toast.error(Strings.internalServerError)
        setLoading(false)
      }
  }


  return (
    <div className="flex flex-col items-center mt-20">
      <h1 className="text-2xl font-bold mb-6">Create New Account</h1>
      {!emailSubmitted ? (
        <form onSubmit={handleEmailVerification} className="p-5 w-80">
          <FloatingLabel
            variant="filled"
            label="Email address"
            //defaultValue={email}
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
        <form onSubmit={handleSignup} className="p-5 w-80">
          {/*<FloatingLabel
            variant="filled"
            label="First Name"
            type="text"
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            className="mb-4"
          />
          <FloatingLabel
            variant="filled"
            label="Last Name"
            type="text"
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            className="mb-4"
          />*/}
          <FloatingLabel
            variant="filled"
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="mb-4"
          />
          <FloatingLabel
            variant="filled"
            label="Confirm Password"
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            className="mb-4"
          />
          <Spinner loading={loading} />
          <Button style={{display: loading? 'none':'flex'}} type="submit" variant="contained" color="primary" className="w-full">
            Sign Up
          </Button>
        </form>
      )}
      <p className="mt-4">Have an account?<Link to="/login" className="text-blue-500 ml-2" shallow>Login</Link></p>
      <OAuth2Component/>
      <div className='mb-10'></div>
    </div>
  );
}
"use client";
import { useEffect, useState } from 'react';
import { TextField, Button, InputAdornment, IconButton } from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import requestHandler from '@/utils/requestHandler';
import Spinner from '@/utils/spinner';
import endpointsPath from '@/constants/EndpointsPath';
import OAuth2Component from './oauth2';
import Link from 'next/link';
import Strings from '@/constants/Strings';
import toast from 'react-hot-toast';
import { FloatingLabel } from 'flowbite-react';
import { useParams, useSearchParams } from 'next/navigation';
import AppImages from '@/constants/Images';

const LoginComponent = (props) => {
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [password, setPassword] = useState('');
  const [password2, setPassword2] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWrongPassword, setIsWrongPassword] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showOtpField, setShowOtpField] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);  
  const { username } = useParams();
  const [otpTimer, setOtpTimer] = useState(60);
  const [canResendOtp, setCanResendOtp] = useState(false);
  const searchParams = useSearchParams();
  const token = searchParams.get('token');

  const loggedInUser =  async () => { 
          setLoading(true);
        try{
        const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user`, true);
        if(resp.statusCode === 200 && token){
            let redirectUrl = localStorage.getItem("redirect_url");
            localStorage.removeItem("redirect_url");
        location.href=redirectUrl || "/";
        }
        else if(resp.statusCode === 200){
            location.href='/';
        }
        else {
            //
        }
        }catch(e){
          toast.error(Strings.internalServerError);
        }finally{
          setLoading(false);
        }
    }

    useEffect(() => {
  if (!showOtpField) return;

  if (otpTimer === 0) {
    setCanResendOtp(true);
    return;
  }

  const interval = setTimeout(() => setOtpTimer((prev) => prev - 1), 1000);
  return () => clearTimeout(interval);
}, [otpTimer, showOtpField]);

const handleResendOtp = async () => {
  setLoading(true);
  try {
    const newOtp = {
      email: email,
      otp: "string",
      preferredMethod: "email",
      description: "New signup (Resend)"
    };

    const resp = await requestHandler.post(`${endpointsPath.auth}/generate-otp`, newOtp, false);

    if (resp.statusCode === 200) {
      toast.success("A new OTP has been sent to your email.");

      // Reset timer
      setOtpTimer(60);
      setCanResendOtp(false);
      setOtp(['', '', '', '', '', '']);
    } 
    else {
      toast.error(resp.result.message);
    }
  } catch (e) {
    toast.error(Strings.internalServerError);
  } finally {
    setLoading(false);
  }
};


   useEffect(() => {
    if (token) {
       localStorage.setItem("token", token);
       loggedInUser();
    }
  }, [token]);

  useEffect(() => {
      
    loggedInUser();
    },[])


  const handleEmailVerification = async (e) => {
    setLoading(true);
    if (e) e.preventDefault();
    
    try {
      const resp = await requestHandler.get(`${endpointsPath.auth}/check/${email}`, false);
      if (resp.statusCode === 200) {
        setEmailSubmitted(true);
      } else {
        const errorMsg = resp.result.message;
        if(errorMsg === "Account not found."){
          //send code and show field to enter code
          const newOtp = {
            email: email,
            otp: "string",
            preferredMethod: "email",
            description: "New signup"
          }
          const resp = await requestHandler.post(`${endpointsPath.auth}/generate-otp`, newOtp, false);
          if(resp.statusCode === 200){
            setShowOtpField(true)
            setOtpVerified(true)
          } else toast.error(resp.result.message);
        }
        else toast.error(errorMsg);
      }
    } catch (e) {
      toast.error(Strings.internalServerError);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setIsWrongPassword(false);
    
    try {
      const data = {
        password: password,
        email: email
      };
      const resp = await requestHandler.post(`${endpointsPath.auth}/login`, data, false);
      
      if (resp.statusCode === 200) {
        localStorage.setItem("token", resp?.result?.message);
        let redirectUrl = localStorage.getItem("redirect_url");
          let url = "/"
          localStorage.removeItem("redirect_url");
          location.href=redirectUrl || url;
      } else {
        setIsWrongPassword(true);
        toast.error(resp.result.message);
        setEmailSubmitted(false);
      }
    } catch (e) {
      toast.error(Strings.internalServerError);
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
  // Check if the pasted value is exactly 6 digits
  if (value.length === 6 && /^[0-9]+$/.test(value)) {
    const newOtp = [...otp];
    // Split the pasted value into individual digits
    const digits = value.split('');
    // Update all OTP boxes with the pasted digits
    digits.forEach((digit, i) => {
      if (i < 6) newOtp[i] = digit;
    });
    setOtp(newOtp);
    
    // Focus on the last input box
    if (index < 5) {
      document.getElementById(`otp-input-${Math.min(5, index + digits.length - 1)}`).focus();
    }
  } 
  // Handle single digit input
  else if (/^[0-9]*$/.test(value) && value.length <= 1) {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    
    // Auto focus to next input
    if (value && index < 5) {
      document.getElementById(`otp-input-${index + 1}`).focus();
    }
  }
};

  const handleOtpSubmit = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    
    try {
      const otpCode = otp.join('');
      const newOtp = {
            email: email,
            otp: otpCode,
            preferredMethod: "email",
            description: "New signup email verification"
          }
          const resp = await requestHandler.post(`${endpointsPath.auth}/check-otp`, newOtp, false);
          if(resp.statusCode === 200){
            setEmailSubmitted(true)
          }else{
            toast.error(resp.result.message);
          }
    } catch (e) {
      toast.error(Strings.internalServerError);
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleSignup = async (e) => {
    if (e) e.preventDefault();
    setLoading(true)
    
      try{
        const data = {
          firstName: firstName,
          lastName: lastName,
          password: password,
          passwordConfirmation: password2,
          email: email,
          referrer: username || ''
        }
        let endpoint = `${endpointsPath.auth}/register`;
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

  return (
    <div className="flex flex-col items-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
      
<h1 className="text-2xl font-bold mt-6 mb-4 text-gray-800">Welcome back</h1>
      
      {!emailSubmitted ? (
        <form onSubmit={handleEmailVerification} className="w-full">
          <TextField
  label="Email address"
  variant={"filled"}
  type="email"
  value={email}
  onChange={(e) => setEmail(e.target.value)}
  required
  fullWidth
  margin="normal"
  error={false}
  helperText=""
  InputProps={{
    endAdornment: showOtpField ? (
      <InputAdornment position="end">
        <Button 
          size="small" 
          onClick={() => {
            setShowOtpField(false);
            setOtp(['', '', '', '', '', '']);
          }}
          sx={{
            textTransform: 'none',
            color: 'primary.main',
            '&:hover': {
              backgroundColor: 'transparent'
            }
          }}
        >
          Edit Email
        </Button>
      </InputAdornment>
    ) : null
  }}
  disabled={showOtpField}
/>
          
          {showOtpField && (
  <div className="mt-4">
    <p className="text-sm text-gray-600 mb-2">
      We've sent a 6-digit code to your email
    </p>

    <div className="flex justify-between space-x-2">
      {otp.map((digit, index) => (
        <TextField
          key={index}
          id={`otp-input-${index}`}
          variant="outlined"
          type="text"
          value={digit}
          onChange={(e) => handleOtpChange(index, e.target.value)}
          onPaste={(e) => {
            if (e) e.preventDefault();
            const pastedData = e.clipboardData.getData('text/plain');
            handleOtpChange(index, pastedData);
          }}
          inputProps={{
            maxLength: 1,
            style: { textAlign: 'center' }
          }}
          sx={{
            width: '50px',
            '& input': {
              padding: '10px',
              textAlign: 'center'
            }
          }}
        />
      ))}
    </div>

    {/* TIMER + RESEND */}
    <div className="flex items-center justify-between mt-3">
      {!canResendOtp ? (
        <span className="text-gray-600 text-sm">
          Resend in <b>{otpTimer}s</b>
        </span>
      ) : (
        <span className="text-green-600 text-sm">You can resend now</span>
      )}

      <Button
        size="small"
        onClick={handleResendOtp}
        disabled={!canResendOtp || loading}
        sx={{ textTransform: "none" }}
      >
        Resend Code
      </Button>
    </div>

    <Button
      type="button"
      variant="contained"
      color="primary"
      fullWidth
      size="large"
      sx={{ mt: 2 }}
      onClick={handleOtpSubmit}
      disabled={loading || otp.some((d) => d === '')}
    >
      Verify OTP
    </Button>
  </div>
)}
          
          <Spinner loading={loading} />
          
          {!showOtpField? <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth
            size="large"
            sx={{ mt: 2 }}
            disabled={loading || (otp.length > 0 && otp[0] != '' && !otpVerified)}
          >
            Continue
          </Button> : ''}
        </form>
      ) : (
        <form onSubmit={otpVerified? handleSignup : handleLogin} className="w-full">

{otpVerified? <div>
  <FloatingLabel
            label="First Name"
            variant="filled"
            type={"text"}
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
            required
            fullWidth
            margin="normal"
          />

          <FloatingLabel
            label="Last Name"
            variant="filled"
            type={"text"}
            value={lastName}
            onChange={(e) => setLastName(e.target.value)}
            required
            fullWidth
            margin="normal"
          />
          <FloatingLabel
            label="Password"
            variant="filled"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            fullWidth
            margin="normal"
            error={isWrongPassword}
            helperText={isWrongPassword ? "You entered a wrong password." : ""}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
</div> : ''}
          
          <FloatingLabel
            label={otpVerified? "Confirm Password" : "Password"}
            variant="filled"
            type={showPassword ? "text" : "password"}
            value={otpVerified? password2 : password}
            onChange={(e) => otpVerified? setPassword2(e.target.value) : setPassword(e.target.value)}
            required
            fullWidth
            margin="normal"
            error={isWrongPassword}
            helperText={isWrongPassword ? "You entered a wrong password." : ""}
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={togglePasswordVisibility}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
          />
          
          <Spinner loading={loading} />

         {otpVerified?
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth
            size="large"
            sx={{ mt: 1 }}
            disabled={loading}
          >
            Create Account
          </Button>
          :
          <div>
           <div className="mb-4 text-right">
            <Link href="/reset-password" className="text-blue-500 hover:text-blue-700">
              Forgot password?
            </Link>
          </div>
          
          
          <Button 
            type="submit" 
            variant="contained" 
            color="primary" 
            fullWidth
            size="large"
            sx={{ mt: 1 }}
            disabled={loading}
          >
            Login
          </Button>
         </div>}

        </form>
      )}
      
      {!username? <div className="w-full mt-4">
        <OAuth2Component />
      </div> : ''}
    </div>
  );
};

export default LoginComponent;
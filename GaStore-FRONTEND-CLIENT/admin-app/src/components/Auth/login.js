import { useEffect, useState } from 'react';
import { Button } from '@mui/material';
import requestHandler from '../../utils/requestHandler';
import OAuth2Component from './oauth2';
import { FloatingLabel } from 'flowbite-react';
import Strings from '../../constants/Strings';
import { toast } from 'react-toastify';
import Spinner from '../../utils/loader';
import endpointsPath from '../../constants/EndpointsPath';
import AppImages from '../../constants/Images';
import {
  ArrowRight,
  ChevronLeft,
  LockKeyhole,
  Mail,
} from 'lucide-react';

const LoginComponent = (props) => {
  const [email, setEmail] = useState('');
  const [emailSubmitted, setEmailSubmitted] = useState(false);
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isWrongPassword, setIsWrongPassword] = useState(false);
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
    <section className="w-full">
      <div className="mx-auto flex min-h-[680px] max-w-6xl items-center justify-center overflow-hidden rounded-[32px] border border-slate-200/70 bg-[linear-gradient(180deg,#f8fafc_0%,#eef4ff_50%,#fdfdfc_100%)] px-5 py-8 shadow-[0_30px_100px_rgba(15,23,42,0.18)] sm:px-8 lg:px-10">
          <div className="w-full max-w-md">
            <div className="rounded-[28px] border border-slate-200/80 bg-white/90 p-6 shadow-[0_18px_50px_rgba(30,41,59,0.08)] backdrop-blur sm:p-8">
             

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-900 shadow-lg shadow-slate-900/15">
                  <img src={AppImages.logo} alt="Retina logo" className="h-8 w-auto" />
                </div>
                  <div>
                    <p className="text-xs uppercase tracking-[0.28em] text-slate-400">Admin access</p>
                    <h2 className="font-['Trebuchet_MS','Segoe_UI',sans-serif] text-2xl font-semibold tracking-tight text-slate-900">
                      {emailSubmitted ? 'Enter your password' : 'Welcome back'}
                    </h2>
                  </div>
                </div>
                <div className="rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700">
                  Protected
                </div>
              </div>

              <p className="mt-5 text-sm leading-6 text-slate-600">
                {emailSubmitted
                  ? `Signing in as ${email}. Only users with admin privileges can continue.`
                  : 'Start with your work email. We will verify the account before requesting your password.'}
              </p>

              <div className="mt-6 flex items-center gap-3 rounded-2xl bg-slate-50 p-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${emailSubmitted ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-900 text-white'}`}>
                  <Mail className="h-4 w-4" />
                </div>
                <div className="h-px flex-1 bg-slate-200" />
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${emailSubmitted ? 'bg-slate-900 text-white' : 'bg-slate-200 text-slate-500'}`}>
                  <LockKeyhole className="h-4 w-4" />
                </div>
              </div>

              {!emailSubmitted ? (
                <form onSubmit={handleEmailVerification} className="mt-8">
                  <div className="rounded-2xl border border-slate-200 bg-white px-3 pt-1 shadow-sm">
                    <FloatingLabel
                      variant="outlined"
                      label="Email address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="auth-floating-input"
                    />
                  </div>

                  <div className="mt-5">
                    <Spinner loading={loading} />
                    <Button
                      style={{ display: loading ? 'none' : 'flex' }}
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        borderRadius: '16px',
                        paddingY: '0.95rem',
                        backgroundColor: '#f97316',
                        boxShadow: '0 14px 28px rgba(249, 115, 22, 0.28)',
                        fontWeight: 700,
                        fontSize: '0.98rem',
                        '&:hover': {
                          backgroundColor: '#ea580c',
                          boxShadow: '0 18px 32px rgba(234, 88, 12, 0.32)',
                        },
                      }}
                      endIcon={<ArrowRight className="h-4 w-4" />}
                    >
                      Continue to verification
                    </Button>
                  </div>
                </form>
              ) : (
                <form onSubmit={handleLogin} className="mt-8">
                  <button
                    type="button"
                    onClick={() => {
                      setEmailSubmitted(false);
                      setPassword('');
                      setIsWrongPassword(false);
                    }}
                    className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900"
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Change email
                  </button>

                  <div className="rounded-2xl border border-slate-200 bg-white px-3 pt-1 shadow-sm">
                    <FloatingLabel
                      variant="outlined"
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      color={isWrongPassword ? 'error' : 'default'}
                      helperText={isWrongPassword ? "You entered a wrong password." : ""}
                      className="auth-floating-input"
                    />
                  </div>

                  <div className="mt-4 flex items-center justify-between gap-3 text-sm">
                    <span className="text-slate-500">Need help getting back in?</span>
                    <a href="/reset-password" className="font-semibold text-blue-700 transition hover:text-blue-900">
                      Reset password
                    </a>
                  </div>

                  <div className="mt-5">
                    <Spinner loading={loading} />
                    <Button
                      style={{ display: loading ? 'none' : 'flex' }}
                      type="submit"
                      variant="contained"
                      color="primary"
                      fullWidth
                      sx={{
                        textTransform: 'none',
                        borderRadius: '16px',
                        paddingY: '0.95rem',
                        backgroundColor: '#f97316',
                        boxShadow: '0 14px 28px rgba(249, 115, 22, 0.28)',
                        fontWeight: 700,
                        fontSize: '0.98rem',
                        '&:hover': {
                          backgroundColor: '#ea580c',
                          boxShadow: '0 18px 32px rgba(234, 88, 12, 0.32)',
                        },
                      }}
                    >
                      Sign in to dashboard
                    </Button>
                  </div>
                </form>
              )}

              <div className="mt-6 rounded-2xl border border-dashed border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-600">
                Access is limited to users with the <span className="font-semibold text-slate-900">Admin</span> or <span className="font-semibold text-slate-900">Super Admin</span> role.
              </div>

              <OAuth2Component />
            </div>
          </div>
      </div>
    </section>
  );
}

export default LoginComponent;

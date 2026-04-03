import { useState, useEffect } from 'react';
import { TextField, Button } from '@mui/material';
import OAuth2Component from '../../components/Auth/oauth2';
import requestHandler from '../../utils/requestHandler';
import { toast } from 'react-toastify';
import Strings from '../../constants/Strings';
import Spinner from '../../utils/loader';
import { FloatingLabel } from 'flowbite-react';
import maskEmail from '../../utils/maskEmail';
import { Link } from 'react-router-dom';
import endpointsPath from '../../constants/EndpointsPath';

export default function PasswordResetComponent() {
    const [email, setEmail] = useState(null);
    const [code, setCode] = useState(null);
    const [codeVerified, setCodeVerified] = useState(false);
    const [emailSubmitted, setEmailSubmitted] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(null);
    const [loading, setLoading] = useState(false);

    // OTP RESEND STATE
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // TIMER EFFECT
    useEffect(() => {
        if (!emailSubmitted || codeVerified) return;

        if (timer === 0) {
            setCanResend(true);
            return;
        }

        const id = setTimeout(() => setTimer(prev => prev - 1), 1000);
        return () => clearTimeout(id);
    }, [timer, emailSubmitted, codeVerified]);


    // SEND OTP API
    const sendOtp = async () => {
        const payload = {
            phone: "",
            email: email,
            otp: "",
            password1: password,
            password2: confirmPassword,
            preferredMethod: "email",
            description: "Password reset code"
        };

        return await requestHandler.post(
            `${endpointsPath.auth}/generate-otp`,
            payload,
            false
        );
    };


    // RESEND OTP
    const handleResendCode = async () => {
        setLoading(true);

        try {
            const resp = await sendOtp();

            if (resp.statusCode === 200) {
                toast.success("A new verification code has been sent.");
                setTimer(60);
                setCanResend(false);
            } else {
                toast.error(resp.result.message);
            }
        } catch (e) {
            toast.error(Strings.internalServerError);
        } finally {
            setLoading(false);
        }
    };


    const handleEmailVerification = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let resp = await requestHandler.get(`${endpointsPath.auth}/check/${email}`, false);

            if (resp.statusCode === 200) {
                const send = await sendOtp();
                if (send.statusCode === 200) {
                    setEmailSubmitted(true);
                    setTimer(60);
                } else toast.error(send.result.message);

            } else {
                toast.error(resp.result.message);
            }

        } catch (e) {
            toast.error(Strings.internalServerError);
        } finally {
            setLoading(false);
        }
    };


    const handleCodeVerification = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = {
                phone: "",
                email: email,
                otp: code,
                password1: password,
                password2: confirmPassword,
                preferredMethod: "email",
                description: "Password reset code"
            };

            let resp = await requestHandler.post(`${endpointsPath.auth}/verify-otp`, data, false);

            if (resp.statusCode === 200) {
                setCodeVerified(true);
            } else toast.error(resp.result.message);

        } catch (e) {
            toast.error(Strings.internalServerError);
        } finally {
            setLoading(false);
        }
    };


    const handlePasswordReset = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const data = {
                phone: "",
                email: email,
                otp: code,
                password1: password,
                password2: confirmPassword,
                preferredMethod: "email",
                description: "Password reset code"
            };

            let resp = await requestHandler.post(`${endpointsPath.auth}/reset-password`, data, false);
            if (resp.statusCode === 200) window.location.href = "/login";
            else toast.error(resp.result.message);

        } catch (e) {
            toast.error(Strings.internalServerError);
        } finally {
            setLoading(false);
        }
    };


    return (
        <div className="flex flex-col items-center mt-20">
            <h1 className="text-2xl font-bold mb-6">Password Reset</h1>

            {/* STEP 1: Enter Email */}
            {!emailSubmitted ? (
                <form onSubmit={handleEmailVerification} className="p-5 w-80">
                    <FloatingLabel
                        variant="outlined"
                        label="Email address"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        className="mb-4"
                    />

                    <Spinner loading={loading} />

                    <Button
                        style={{ display: loading ? 'none' : 'flex' }}
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                    >
                        Continue
                    </Button>
                </form>
            ) :

            /* STEP 2: Enter OTP */
            !codeVerified ? (
                <form onSubmit={handleCodeVerification} className="p-5 w-80">
                    <div className='mb-2'>
                        A verification code has been sent to {maskEmail(email)}
                    </div>

                    <FloatingLabel
                        variant="outlined"
                        label="Verification Code"
                        onChange={(e) => setCode(e.target.value)}
                        required
                        className="mb-4"
                    />

                    {/* TIMER + RESEND */}
                    <div className="flex justify-between items-center mb-3">
                        {!canResend ? (
                            <span className="text-gray-600 text-sm">
                                Resend in <b>{timer}s</b>
                            </span>
                        ) : (
                            <span className="text-green-600 text-sm">
                                You can resend now
                            </span>
                        )}

                        <Button
                            size="small"
                            onClick={handleResendCode}
                            disabled={!canResend || loading}
                            sx={{ textTransform: 'none' }}
                        >
                            Resend Code
                        </Button>
                    </div>

                    <Spinner loading={loading} />

                    <Button
                        style={{ display: loading ? 'none' : 'flex' }}
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                    >
                        Continue
                    </Button>
                </form>
            ) :

            /* STEP 3: Reset Password */
            (
                <form onSubmit={handlePasswordReset} className="p-5 w-80">
                    <FloatingLabel
                        variant="outlined"
                        label="New Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        className="mb-4"
                    />

                    <FloatingLabel
                        variant="outlined"
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        className="mb-4"
                    />

                    <Spinner loading={loading} />

                    <Button
                        style={{ display: loading ? 'none' : 'flex' }}
                        type="submit"
                        variant="contained"
                        color="primary"
                        fullWidth
                    >
                        Reset Password
                    </Button>
                </form>
            )}

            <p className="mt-4">
                Have an account?
                <Link to="/login" className="text-blue-500 ml-2">Login</Link>
            </p>

            <OAuth2Component />

            <div className='mb-10'></div>
        </div>
    );
}

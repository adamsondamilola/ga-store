"use client"
import { useEffect, useState } from 'react';
import { TextField, Button } from '@mui/material';
import OAuth2Component from '@/components/Auth/oauth2';
import requestHandler from '@/utils/requestHandler';
import Strings from '@/constants/Strings';
import maskEmail from '@/utils/maskEmail';
import endpointsPath from '@/constants/EndpointsPath';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Spinner from '@/utils/spinner';
import { FloatingLabel } from 'flowbite-react';

export default function PasswordResetComponent() {
    const [email, setEmail] = useState(null);
    const [code, setCode] = useState(null);
    const [codeVerified, setCodeVerified] = useState(false);
    const [emailSubmitted, setEmailSubmitted] = useState(false);
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState(null);
    const [loading, setLoading] = useState(false);

    // TIMER STATES
    const [timer, setTimer] = useState(60);
    const [canResend, setCanResend] = useState(false);

    // Start the countdown timer
    useEffect(() => {
        if (!emailSubmitted || codeVerified) return;

        if (timer === 0) {
            setCanResend(true);
            return;
        }

        const t = setTimeout(() => setTimer(timer - 1), 1000);
        return () => clearTimeout(t);
    }, [timer, emailSubmitted, codeVerified]);

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
        return await requestHandler.post(`${endpointsPath.auth}/generate-otp`, payload, false);
    };

    const handleEmailVerification = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            let resp = await requestHandler.get(`${endpointsPath.auth}/check/${email}`, false);
            if (resp.statusCode === 200) {
                let response = await sendOtp();
                if (response.statusCode === 200) {
                    setEmailSubmitted(true);
                    setTimer(60);
                    setCanResend(false);
                } else {
                    toast.error(response.result.message);
                }
            } else {
                toast.error(resp.result.message);
            }
        } catch (e) {
            toast.error(Strings.internalServerError);
        } finally {
            setLoading(false);
        }
    };

    const handleResendCode = async () => {
        setLoading(true);
        try {
            let response = await sendOtp();
            if (response.statusCode === 200) {
                toast.success("Verification code re-sent!");
                setTimer(60);
                setCanResend(false);
            } else {
                toast.error(response.result.message);
            }
        } catch {
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
            } else {
                toast.error(resp.result.message);
            }
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

            if (resp.statusCode === 200) {
                window.location.href = "/login";
            } else {
                toast.error(resp.result.message);
            }
        } catch (e) {
            toast.error(Strings.internalServerError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center max-w-md mx-auto p-6 bg-white rounded-lg shadow-md">
            <h1 className="text-2xl font-bold mb-6">Password Reset</h1>

            {!emailSubmitted ? (
                <form onSubmit={handleEmailVerification} className="w-full">
                    <FloatingLabel
                    variant="filled"
                        label="Email address"
                        onChange={(e) => setEmail(e.target.value)}
                        required
                        fullWidth
                    />
                    <Spinner loading={loading} />
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary"
                        className="w-full mt-4"
                        style={{ display: loading ? 'none' : 'flex' }}
                    >
                        Continue
                    </Button>
                </form>
            ) : !codeVerified ? (
                <form onSubmit={handleCodeVerification} className="w-full">
                    <div className="mb-2">
                        A verification code has been sent to {maskEmail(email)}
                    </div>

                    <FloatingLabel
                    variant="filled"
                        label="Verification Code"
                        onChange={(e) => setCode(e.target.value)}
                        required
                        fullWidth
                    />
                    <Spinner loading={loading} />

                    {/* TIMER + RESEND */}
                    <div className="flex items-center justify-between mt-3 mb-2">
                        <span className="text-gray-600 text-sm">
                            {canResend ? (
                                "You can now resend code"
                            ) : (
                                <>Resend in <b>{timer}s</b></>
                            )}
                        </span>

                        <button
                            type="button"
                            disabled={!canResend || loading}
                            onClick={handleResendCode}
                            className={`text-blue-600 text-sm font-semibold ${
                                canResend ? "" : "opacity-40 cursor-not-allowed"
                            }`}
                        >
                            Resend Code
                        </button>
                    </div>

                    <Button 
                        type="submit"
                        variant="contained"
                        color="primary"
                        className="w-full mt-4"
                        style={{ display: loading ? 'none' : 'flex' }}
                    >
                        Continue
                    </Button>
                </form>
            ) : (
                <form onSubmit={handlePasswordReset} className="p-5 w-80">
                    <FloatingLabel
                    variant="filled"
                        label="New Password"
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        fullWidth
                    />
                    <FloatingLabel
                    variant="filled"
                        label="Confirm Password"
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        required
                        fullWidth
                        className="mt-4"
                    />

                    <Spinner loading={loading} />
                    <Button 
                        type="submit" 
                        variant="contained" 
                        color="primary" 
                        className="w-full mt-4"
                        style={{ display: loading ? 'none' : 'flex' }}
                    >
                        Reset Password
                    </Button>
                </form>
            )}

            <p className="mt-4">
                Have an account?
                <Link href="/login" className="text-blue-500 ml-2" shallow>
                    Login
                </Link>
            </p>

            <div className="w-full mt-4">
                <OAuth2Component />
            </div>
            <div className="mb-10"></div>
        </div>
    );
}

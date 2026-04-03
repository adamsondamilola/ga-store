import { useState } from 'react';
import { Button, FormControlLabel, Checkbox, FormGroup, FormControl, FormLabel } from '@mui/material';
import requestHandler from '../../utils/requestHandler';
import { toast } from 'react-toastify';
import Strings from '../../constants/Strings';
import { FloatingLabel } from 'flowbite-react';
import Spinner from '../../utils/loader';
import endpointsPath from '../../constants/EndpointsPath';

export default function SignupComponent() {
    const [formData, setFormData] = useState({
        email: '',
        firstName: '',
        lastName: '',
        isAdmin: false,
        isSuperAdmin: false
    });
    const [emailSubmitted, setEmailSubmitted] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleEmailVerification = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const resp = await requestHandler.get(`${endpointsPath.auth}/check/${formData.email}`, false);
            if (resp.statusCode === 200) {
                toast.error("Email already registered");
            } else {
                setEmailSubmitted(true);
            }
        } catch (e) {
            toast.error(Strings.internalServerError);
        } finally {
            setLoading(false);
        }
    };
  
    const handleSignup = async (e) => {
        e.preventDefault();
        setLoading(true);
        
        try {
            const data = {
                firstName: formData.firstName,
                lastName: formData.lastName,
                email: formData.email,
                isAdmin: formData.isAdmin,
                isSuperAdmin: formData.isSuperAdmin
            };
            
            const resp = await requestHandler.post(`${endpointsPath.auth}/create-new-user`, data, true);

            if (resp.statusCode === 200) {
                toast.success("User created successfully");
                window.location.href = "/users";
            } else {
                toast.error(resp.result?.message || "Registration failed");
            }
        } catch (e) {
            toast.error(Strings.internalServerError);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center mt-20">
            {!emailSubmitted ? (
                <form onSubmit={handleEmailVerification} className="p-5 w-80">
                    <FloatingLabel
                        name="email"
                        variant="outlined"
                        label="Email address"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        type="email"
                        className="mb-4"
                    />
                    <Spinner loading={loading} />
                    <Button 
                        style={{ display: loading ? 'none' : 'flex' }} 
                        type="submit" 
                        variant="contained" 
                        color="primary" 
                        className="w-full"
                        disabled={!formData.email}
                    >
                        Continue
                    </Button>
                </form>
            ) : (
                <form onSubmit={handleSignup} className="p-5 w-80">
                    <button 
                        type="button" 
                        onClick={() => setEmailSubmitted(false)}
                        className="text-sm text-blue-500 mb-4"
                    >
                        ← Back to email
                    </button>
                    
                    <FloatingLabel
                        name="firstName"
                        variant="outlined"
                        label="First Name"
                        type="text"
                        value={formData.firstName}
                        onChange={handleChange}
                        required
                        className="mb-4"
                    />
                    <FloatingLabel
                        name="lastName"
                        variant="outlined"
                        label="Last Name"
                        type="text"
                        value={formData.lastName}
                        onChange={handleChange}
                        required
                        className="mb-4"
                    />
                    
                    <FormControl component="fieldset" className="mb-4">
                        <FormLabel component="legend">User Permissions</FormLabel>
                        <FormGroup>
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="isAdmin"
                                        checked={formData.isAdmin}
                                        onChange={handleChange}
                                        color="primary"
                                    />
                                }
                                label="Admin User"
                            />
                            <FormControlLabel
                                control={
                                    <Checkbox
                                        name="isSuperAdmin"
                                        checked={formData.isSuperAdmin}
                                        onChange={handleChange}
                                        color="primary"
                                        disabled={!formData.isAdmin} // Super admin requires admin privileges
                                    />
                                }
                                label="Super Admin"
                            />
                        </FormGroup>
                    </FormControl>
                    
                    <Spinner loading={loading} />
                    <Button 
                        style={{ display: loading ? 'none' : 'flex' }} 
                        type="submit" 
                        variant="contained" 
                        color="primary" 
                        className="w-full"
                        disabled={!formData.firstName || !formData.lastName}
                    >
                        Sign Up
                    </Button>
                </form>
            )}
            <div className='mb-10'></div>
        </div>
    );
}
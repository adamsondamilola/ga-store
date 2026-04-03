"use client"
import { useEffect } from "react"
import requestHandler from "../../utils/requestHandler"
import endpointsPath from "../../constants/EndpointsPath"
import { toast } from "react-toastify"

const LoginRedirectComponent = async (redirectUrl) => {

        localStorage.setItem('redirect_url', redirectUrl)
            const resp = await requestHandler.get(endpointsPath.user+'/profile', true);
            if (resp.statusCode !== 200) {
                toast.error('You are not logged in');
                location.href="/login"
            }
        
}
export default LoginRedirectComponent
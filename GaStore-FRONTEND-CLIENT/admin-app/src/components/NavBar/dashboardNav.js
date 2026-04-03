
"use client";

import { Avatar, Drawer, Dropdown, Navbar } from "flowbite-react";
import AppImages from "../../constants/Images";
import { useEffect, useState } from "react";
import requestHandler from "../../utils/requestHandler";
import AsideComponent from "./aside";
import endpointsPath from "../../constants/EndpointsPath";
import { useNavigate } from "react-router-dom";

export function DashboardNavBarComponent() {
  const [userData, setUserData] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [userId, setUserId] = useState(localStorage.getItem('userId') || '')
  const handleClose = () => setIsOpen(false);
  const router = useNavigate()
  
  useEffect(() => {
    const loggedInUser =  async () => { 
      const resp = await requestHandler.get(`${endpointsPath.auth}/logged-in-user`, true);
      if(resp.statusCode === 200){
          setUserData(resp.result.data)
          const roles = resp.result.data
          const hasAdmin = roles.some(role => role.name === "Admin" || role.name === "Super Admin");
          if(!hasAdmin){
           router("/login");
           }
          /*if(resp.result.data.user.role != "Admin"){
            router("/login")
          }*/
      }
      else {
        router("/login")
      }
  }
  loggedInUser();
  },[]) 

  const logOut = () => {
    localStorage.removeItem('token')
    window.location.href="/"
  }
  
  return (
    <Navbar fluid rounded>
      <Navbar.Brand href="/dashboard">
        <img src={AppImages.logo} className="mr-3 h-6 sm:h-9" alt="Logo" />
      </Navbar.Brand>
      <div className="flex md:order-2">
        <Dropdown
          arrowIcon={false}
          inline
          //label={<PersonRounded/>}
          label={<Avatar alt="User settings" rounded />}
        >
          {/*<Dropdown.Header>
            <span className="block text-sm">{userData.firstname} {userData.lastname}</span>
            <span className="block truncate text-sm font-medium">{userData.email}</span>
          </Dropdown.Header>*/}
          <Dropdown.Item href="/dashboard">Dashboard</Dropdown.Item>
          <Dropdown.Item href={`/profile/${userId}`}>Profile</Dropdown.Item>
          {/*<Dropdown.Item href="/profile/password-update">Update Password</Dropdown.Item>*/}
          <Dropdown.Divider />
          <Dropdown.Item onClick={()=>logOut()}>Sign out</Dropdown.Item>
        </Dropdown>
        <Navbar.Toggle onClick={() => setIsOpen(true)}/>
      </div>
      {/*<Navbar.Collapse>
        <Navbar.Link href="#" active>
          Home
        </Navbar.Link>
        <Navbar.Link href="#">About</Navbar.Link>
        <Navbar.Link href="#">Services</Navbar.Link>
        <Navbar.Link href="#">Pricing</Navbar.Link>
        <Navbar.Link href="#">Contact</Navbar.Link>
      </Navbar.Collapse>*/}

<Drawer open={isOpen} onClose={handleClose} className="h-screen">
        <Drawer.Header title={<img src={AppImages.logo} width={'100'}/>} titleIcon={() => <></>} />
        <Drawer.Items>
          <AsideComponent/>
        </Drawer.Items>
      </Drawer>


    </Navbar>
  );
}

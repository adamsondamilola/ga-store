"use client";
import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import requestHandler from "../../../../utils/requestHandler";
import { FaCheckCircle } from "react-icons/fa"; // Import check icon from react-icons
import { Copy } from "lucide-react";
import { truncateText } from "../../../../utils/truncateText";
import endpointsPath from "../../../../constants/EndpointsPath";
import { formatImagePath } from "../../../../utils/formatImagePath";
import UserAdminActionsComponent from "../Action";
import Link from "next/link";

const AdminViewProfileComponent = (props) => {
  const router = useRouter();
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [docs, setDocs] = useState(null);
  const [location, setLocation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false); 

  useEffect(() => {
    const fetchUser = async () => {
      setLoading(true);
      try {
        const response = await requestHandler.get(`${endpointsPath.userAdmin}/${id}`, true);
        if (response.statusCode === 200) {
            setUser(response.result.data.user);
            setDocs(response.result.data.docs);
            setLocation(response.result.data.location);
        } else {
          setUser(null);
        }
      } catch (error) {
        console.log("Error fetching user details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [id]);

  const handleShareUsername = () => {
    if (user?.username) {
      navigator.clipboard.writeText(`${process.env.website}/page/${user.username}`).then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); // Reset the copied status after 2 seconds
      });
    }
  };

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="text-center py-10">
        <p>User not found.</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-4">
      <h1 className="text-2xl font-bold mb-6 text-center">Profile</h1>

      {/* Profile Card */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <div className="flex items-center flex-col">
          <img
            src={formatImagePath(user.picture)}
            alt={`${user.first_name}'s profile`}
            className="w-24 h-24 rounded-full mb-4 shadow-md"
          />
          <h2 className="text-xl font-semibold flex items-center">
            {user.first_name} {user.last_name}
            {user?.is_user_verified && (
              <FaCheckCircle
                className="text-blue-500 ml-2"
                title="Verified User"
              />
            )}
          </h2>
          <div className="flex flex-wrap justify-center items-center">
          <p className="text-gray-600">{`${truncateText(process.env.website, 10)}/page/${user.username}`}</p>
          <button
            onClick={handleShareUsername}
            className="ml-2 text-purple-950 text-sm hover:text-blue-700 font-semibold"
          >
            <Copy/>
          </button>
          </div>
          {copied && <p className="text-green-500 text-sm mt-1">Link copied!</p>}
        </div>
      </div>

      {/* Shop Details Card */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Business Details</h3>
        <p>
          <strong>Name:</strong> {user.shop_name}
        </p>
        <p>
          <strong>Address:</strong> {user.shop_address}
        </p>
        <p>
          <strong>Description:</strong> {user.shop_description}
        </p>
      </div>

      {/* Contact Information Card */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Contact Information</h3>
        <p>
          <strong>Phone:</strong> {user.phone}
        </p>
        <p>
          <strong>WhatsApp:</strong> {user.whatsapp}
        </p>
      </div>

      {/* Location Card */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Location</h3>
        <p>
          <strong>City:</strong> {user.city}
        </p>
        <p>
          <strong>State:</strong> {user.state}
        </p>
        <p>
          <strong>Country:</strong> {user.country}
        </p>
      </div>

      {/* Location on Map Card */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Location on Map</h3>
        <p>
          <strong>Longitude:</strong> {location?.longitude}
        </p>
        <p>
          <strong>Latitude:</strong> {location?.latitude}
        </p>
      </div>

{/* Face */}
<div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Face</h3>
       <div className="grid grid-cols-2">
        <p>
          <strong>Normal:</strong> <img src={formatImagePath(docs?.face_image)} alt="face" className="w-48 mb-4" />
        </p>
        <p>
          <strong>Smile:</strong> <img src={formatImagePath(docs?.face_smile_image)} alt="face" className="w-48 mb-4" />
          
        </p>
        </div>
      </div>

      {/* Documents */}
      <div className="bg-white shadow-lg rounded-lg p-6 mb-6">
        <h3 className="text-lg font-semibold mb-4">Documents</h3>
        <p>
          <strong>ID Type:</strong> {docs?.id_type}
        </p>
        <div className="grid grid-cols-2">
        <p>
          <strong>ID Front:</strong> <img src={formatImagePath(docs?.id_front)} alt="ID Front" className="w-48 mb-4" />
        </p>
        <p>
          <strong>ID Back:</strong> <img src={formatImagePath(docs?.id_back)} alt="ID Back" className="w-48 mb-4" />
        </p>
        </div>
      </div>

        <UserAdminActionsComponent id={user._id} />

    </div>
  );
};

export default AdminViewProfileComponent;

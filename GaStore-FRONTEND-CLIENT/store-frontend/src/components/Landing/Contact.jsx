"use client";
import { useState } from "react";
import {
  Box,
  Typography,
  Container,
} from "@mui/material";
import { Email, Schedule, WhatsApp } from "@mui/icons-material";

const Contact = () => {
  const contactInfo = [
    {
      icon: <Schedule sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Business Hours",
      details: "Monday - Friday",
      description: "9:00 AM - 6:00 PM EST",
    },
    {
      icon: <WhatsApp sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "WhatsApp",
      details: "+2347052457688",
      description: "For complaints only",
    },
    {
      icon: <Email sx={{ fontSize: 40, color: "primary.main" }} />,
      title: "Email Us",
      details: "info@towg.com.ng",
      description: "Send us an email anytime",
    },
  ];

  return (
    <Container maxWidth="lg" sx={{ py: 8 }}>
      {/* Header Section */}
      <Box textAlign="center" mb={6}>
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{ fontWeight: "bold" }}
        >
          Get in Touch
        </Typography>
        <Typography
          variant="h6"
          color="text.secondary"
          sx={{ maxWidth: 600, mx: "auto" }}
        >
          Reach out to us through any of these channels. We're here to help!
        </Typography>
      </Box>

      {/* Contact Information Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        {contactInfo.map((item, index) => (
          <div
            key={index}
            className="flex flex-col h-full bg-white rounded-xl shadow-lg p-6 border border-gray-100 hover:border-blue-200 hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
          >
            <div className="flex flex-col items-center text-center mb-4">
              <div className="p-3 bg-blue-50 rounded-full text-blue-600 mb-4">
                {item.icon}
              </div>
              <h3 className="font-bold text-gray-900 text-xl mb-2">
                {item.title}
              </h3>
            </div>
            <p className="text-blue-700 font-semibold text-lg text-center mb-2">
              {item.details}
            </p>
            <p className="text-gray-600 text-center mt-auto">
              {item.description}
            </p>
          </div>
        ))}
      </div>

      {/* Additional Information Section */}
      <Box sx={{ mt: 8, textAlign: "center" }}>
        <Typography
          variant="h5"
          gutterBottom
          sx={{ fontWeight: "bold", mb: 2 }}
        >
          Response Time
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ maxWidth: 600, mx: "auto" }}
        >
          We typically respond to all inquiries within 24 hours during business days.
          For urgent matters via WhatsApp, please allow up to 2 hours for a response.
        </Typography>
      </Box>
    </Container>
  );
};

export default Contact;

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import endpointsPath from "@/constants/EndpointsPath";
import requestHandler from "@/utils/requestHandler";
import { normalizeWebsiteContent } from "@/utils/websiteContentDefaults";

const WebsiteContentContext = createContext({
  websiteContent: normalizeWebsiteContent(),
  refreshWebsiteContent: async () => {},
});

export function WebsiteContentProvider({ initialContent, children }) {
  const [websiteContent, setWebsiteContent] = useState(() =>
    normalizeWebsiteContent(initialContent)
  );

  const refreshWebsiteContent = async () => {
    try {
      const response = await requestHandler.get(`${endpointsPath.websiteContent}`);
      if (response?.statusCode === 200 && response?.result?.data) {
        setWebsiteContent(normalizeWebsiteContent(response.result.data));
      }
    } catch (error) {
      console.error("Failed to refresh website content", error);
    }
  };

  useEffect(() => {
    setWebsiteContent(normalizeWebsiteContent(initialContent));
  }, [initialContent]);

  const value = useMemo(
    () => ({ websiteContent, refreshWebsiteContent }),
    [websiteContent]
  );

  return (
    <WebsiteContentContext.Provider value={value}>
      {children}
    </WebsiteContentContext.Provider>
  );
}

export function useWebsiteContent() {
  return useContext(WebsiteContentContext);
}

import endpointsPath from "@/constants/EndpointsPath";
import requestHandler from "@/utils/requestHandler";
import { normalizeWebsiteContent } from "@/utils/websiteContentDefaults";

export default async function getWebsiteContent() {
  try {
    const response = await requestHandler.getServerSide(`${endpointsPath.websiteContent}`);
    if (response?.statusCode === 200 && response?.result?.data) {
      return normalizeWebsiteContent(response.result.data);
    }
  } catch (error) {
    console.error("Failed to load website content", error);
  }

  return normalizeWebsiteContent();
}

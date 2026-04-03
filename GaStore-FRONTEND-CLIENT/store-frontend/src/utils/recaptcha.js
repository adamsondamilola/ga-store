import { loadReCaptcha, ReCaptcha } from "react-google-recaptcha-v3";

let recaptchaLoaded = false;

export async function getRecaptchaToken(action = "submit") {
  if (!recaptchaLoaded) {
    loadReCaptcha(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY);
    recaptchaLoaded = true;
  }

  return await ReCaptcha.execute(action);
}

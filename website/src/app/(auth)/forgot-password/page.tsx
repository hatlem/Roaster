import { getServerLocale } from "@/i18n/server";
import { getDictionary } from "@/i18n/dictionaries";
import ForgotPasswordForm from "./forgot-password-form";

export async function generateMetadata() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return { title: dict.auth.forgotPassword.title };
}

export default async function ForgotPasswordPage() {
  const locale = await getServerLocale();
  const dict = getDictionary(locale);
  return <ForgotPasswordForm dictionary={dict} />;
}

import { redirect } from "react-router";
import { defaultLanguage } from "~/i18n";

export function loader() {
  return redirect(`/${defaultLanguage}`);
}

export default function Index() {
  // This component will never render due to the redirect
  return null;
}

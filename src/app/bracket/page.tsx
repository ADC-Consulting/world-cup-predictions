import { redirect } from "next/navigation";

export default function BracketRedirect() {
  redirect("/predict/knockouts");
}

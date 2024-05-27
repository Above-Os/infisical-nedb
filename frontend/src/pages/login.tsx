import { useEffect /* , useState */ } from "react";
import { useTranslation } from "react-i18next";
import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import ListBox from "@app/components/basic/Listbox";
// import LoginStep from '@app/components/login/LoginStep';
// import MFAStep from '@app/components/login/MFAStep';
import { isLoggedIn, setAuthToken } from "@app/reactQuery";
import { navigateUserToSelectOrg } from "@app/views/Login/Login.utils";

import terminusToken from "./api/auth/CheckTerminusToken";


export default function Login() {
  const router = useRouter();
  // const [email, setEmail] = useState('');
  // const [password, setPassword] = useState('');
  // const [step, setStep] = useState(1);
  const { t } = useTranslation();
  const lang = router.locale ?? "en";

  const setLanguage = async (to: string) => {
    router.push("/login", "/login", { locale: to });
    localStorage.setItem("lang", to);
  };

  const getAuthTokenFromTerminus = async () => {
    const token = await terminusToken();
    if (token) {
      setAuthToken(token);
    }
  };

  useEffect(() => {
    // TODO(akhilmhdh): workspace will be controlled by a workspace context
    const redirectToDashboard = async () => {
      try {
        navigateUserToSelectOrg(router);
      } catch (error) {
        console.log("Error - Not logged in yet");
      }
    };
    
    getAuthTokenFromTerminus();

    if (isLoggedIn()) {
      redirectToDashboard();
    }else{
      // redirect to auth
      const host = window.location.hostname;
      const hostTokenizer = host.split(".")
      hostTokenizer[0]="auth"
      
      router.push(`https://${hostTokenizer.join(".")}`);
    }
  }, []);

  // const renderStep = (loginStep: number) => {
  //   // TODO: add MFA step
  //   switch (loginStep) {
  //     case 1:
  //       return (
  //         <LoginStep
  //           email={email}
  //           setEmail={setEmail}
  //           password={password}
  //           setPassword={setPassword}
  //           setStep={setStep}
  //         />
  //       );
  //     case 2:
  //       // TODO: add MFA step
  //       return <MFAStep email={email} password={password} />;
  //     default:
  //       return <div />;
  //   }
  // };

  return (
    <div className="flex h-screen flex-col justify-start bg-bunker-800 px-6">
      <Head>
        <title>{t("common.head-title", { title: t("login.title") })}</title>
        <link rel="icon" href="/infisical.ico" />
        <meta property="og:image" content="/images/message.png" />
        <meta property="og:title" content={t("login.og-title") ?? ""} />
        <meta name="og:description" content={t("login.og-description") ?? ""} />
      </Head>
      <Link href="/">
        <div className="mb-8 mt-20 flex cursor-pointer justify-center">
          <Image src="/images/biglogo.png" height={90} width={120} alt="long logo" />
        </div>
      </Link>
      { /* renderStep(step) */ }
      <div className="absolute right-4 top-0 mt-4 flex items-center justify-center">
        <div className="mx-auto w-48">
          <ListBox
            isSelected={lang}
            onChange={setLanguage}
            data={["en", "ko", "fr", "pt-BR"]}
            isFull
            text={`${t("common.language")}: `}
          />
        </div>
      </div>
    </div>
  );
}

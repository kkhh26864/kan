import Link from "next/link";
import { useState } from "react";

import { useRouter } from "next/navigation";
import { Auth } from "~/components/AuthForm";
import { PageHead } from "~/components/PageHead";
import PatternedBackground from "~/components/PatternedBackground";
import { authClient } from "@kan/auth/client";

export default function LoginPage() {
  const router = useRouter();
  const [isMagicLinkSent, setIsMagicLinkSent] = useState<boolean>(false);
  const [magicLinkRecipient, setMagicLinkRecipient] = useState<string>("");

  const handleMagicLinkSent = (value: boolean, recipient: string) => {
    setIsMagicLinkSent(value);
    setMagicLinkRecipient(recipient);
  };

  const { data } = authClient.useSession();

  if (data?.user?.id) router.push("/boards");

  return (
    <>
      <PageHead title="Login | kan.bn" />
      <main className="h-screen bg-light-100 pt-20 dark:bg-dark-50 sm:pt-0">
        <div className="justify-top flex h-full flex-col items-center px-4 sm:justify-center">
          <div className="z-10 flex w-full flex-col items-center">
            <Link href="/">
              <h1 className="mb-6 text-lg font-bold tracking-tight text-light-1000 dark:text-dark-1000">
                kan.bn
              </h1>
            </Link>
            <p className="mb-10 text-3xl font-bold tracking-tight text-light-1000 dark:text-dark-1000">
              {isMagicLinkSent ? "Check your inbox" : "Welcome back"}
            </p>
            {isMagicLinkSent ? (
              <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                <p className="text-md mt-2 text-center text-light-1000 dark:text-dark-1000">
                  {`Click on the link we've sent to ${magicLinkRecipient} to sign in.`}
                </p>
              </div>
            ) : (
              <div className="w-full rounded-lg border border-light-500 bg-light-300 px-4 py-10 dark:border-dark-400 dark:bg-dark-200 sm:max-w-md lg:px-10">
                <div className="sm:mx-auto sm:w-full sm:max-w-sm">
                  <Auth setIsMagicLinkSent={handleMagicLinkSent} />
                </div>
              </div>
            )}
            <p className="mt-4 text-sm text-light-1000 dark:text-dark-1000">
              Don't have an account?{" "}
              <span className="underline">
                <Link href="/signup">Sign up</Link>
              </span>
            </p>
          </div>
          <PatternedBackground />
        </div>
      </main>
    </>
  );
}

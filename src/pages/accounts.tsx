import {
  RedirectToSignIn,
  SignedIn,
  SignedOut,
  UserProfile,
} from "@clerk/nextjs";
import { type NextPage } from "next";
import Head from "next/head";

const AccountsPage: NextPage = () => {
  return (
    <>
      <Head>
        <title>SmartApply - Account</title>
        <meta property="og:title" content="SmartApply - Account" key="title" />
      </Head>
      <UserProfile />
    </>
  );
};

export default AccountsPage;
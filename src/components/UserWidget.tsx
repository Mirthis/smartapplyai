import { SignedIn, SignedOut, useClerk, useUser } from "@clerk/nextjs";
import { Menu, Transition } from "@headlessui/react";

import { Fragment } from "react";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";

import { api } from "~/lib/api";

export default function UserWidget() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  const { data: proStatus } = api.user.getProState.useQuery();

  return (
    <>
      <SignedIn>
        <div className="flex gap-x-2 items-center">
          {proStatus && !proStatus.hasPro && (
            <Link
              href="/upgrade"
              className="font-semibold link-accent hidden sm:block"
            >
              {proStatus.hasTrialSubscription ? (
                <p>Trialing Pro</p>
              ) : (
                <p>Upgrade to Pro</p>
              )}
            </Link>
          )}
          <Menu as="div" className="relative inline-block text-left">
            <div>
              <Menu.Button className="btn-ghost btn-circle btn inline-flex w-full justify-center rounded-md  px-2 py-2 text-sm font-medium focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-opacity-75">
                {user?.imageUrl && (
                  <Image
                    src={user.imageUrl}
                    className="h-8 w-8 rounded-full"
                    alt="Profile Image"
                    width={32}
                    height={32}
                  />
                )}
              </Menu.Button>
            </div>
            <Transition
              as={Fragment}
              enter="transition ease-out duration-100"
              enterFrom="transform opacity-0 scale-95"
              enterTo="transform opacity-100 scale-100"
              leave="transition ease-in duration-75"
              leaveFrom="transform opacity-100 scale-100"
              leaveTo="transform opacity-0 scale-95"
            >
              <Menu.Items className="absolute right-0 mt-2 w-56 origin-top-right divide-y divide-base-content rounded-md bg-base-100  ring-1 ring-black ring-opacity-5 focus:outline-none">
                <div className="px-1 py-1 ">
                  <Menu.Item>
                    {({ active }) => (
                      <Link href="/profile">
                        <button
                          className={`${
                            active
                              ? "bg-primary text-primary-content"
                              : "text-base-content"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          Profile
                        </button>
                      </Link>
                    )}
                  </Menu.Item>

                  <Menu.Item>
                    {({ active }) => (
                      <div>
                        {proStatus && !proStatus.hasPro ? (
                          <Link href="/upgrade">
                            <button
                              className={`${
                                active
                                  ? "bg-accent text-accent-content"
                                  : "text-accent"
                              } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                            >
                              Upgrae to Pro
                            </button>
                          </Link>
                        ) : (
                          <Link href="/subscription">
                            <button
                              className={`${
                                active
                                  ? "bg-primary text-primary-content"
                                  : "text-base-content"
                              } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                            >
                              Manage Pro Subscription
                            </button>
                          </Link>
                        )}
                      </div>
                    )}
                  </Menu.Item>
                  <Menu.Item>
                    {({ active }) => (
                      <Link href="/accounts">
                        <button
                          className={`${
                            active
                              ? "bg-primary text-primary-content"
                              : "text-base-content"
                          } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                        >
                          Manage Account
                        </button>
                      </Link>
                    )}
                  </Menu.Item>
                </div>
                <div className="px-1 py-1">
                  <Menu.Item>
                    {({ active }) => (
                      <button
                        onClick={() => void signOut(() => router.push("/"))}
                        className={`${
                          active
                            ? "bg-primary text-primary-content"
                            : "text-base-content"
                        } group flex w-full items-center rounded-md px-2 py-2 text-sm`}
                      >
                        Sing Out
                      </button>
                    )}
                  </Menu.Item>
                </div>
              </Menu.Items>
            </Transition>
          </Menu>
        </div>
      </SignedIn>
      <SignedOut>
        <div className="space-x-2">
          <Link
            className="hidden md:inline btn-link btn-primary btn no-underline"
            href="/sign-in"
          >
            Log In
          </Link>
          <Link className="btn-primary btn" href="/sign-up">
            Sign Up
          </Link>
        </div>
      </SignedOut>
    </>
  );
}

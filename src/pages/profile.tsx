import { ArrowUpFromLine, Plus, SquarePen, Trash2 } from "lucide-react";

import { useState } from "react";

import { type NextPage } from "next";

import { api } from "~/lib/api";
import { MAX_APPLICANTS, MAX_APPLICANTS_WO_PRO } from "~/lib/config";

import { Layout, Title } from "~/components";
import {
  DeleteProfileApplicantModal,
  EditProfileApplicantModal,
} from "~/components/modals";
import { ProMarker } from "~/components/utils";
// import { ProMarker } from "~/components/utils";
import Spinner from "~/components/utils/Spinner";

import { useHasPro } from "~/hooks/useHasPro";
import { type ApplicantData, type ApplicantFormData } from "~/types/types";

const ProfilePage: NextPage = () => {
  const utils = api.useContext();
  const { hasPro } = useHasPro();

  const {
    isLoading,
    data: applicants,
    isError,
  } = api.applicant.getForLoggedUser.useQuery({ isInProfile: true });

  const { mutate: setApplicantAsMain, isLoading: settingAsMain } =
    api.applicant.setAsMain.useMutation({
      onSuccess: () => {
        void utils.applicant.getForLoggedUser.invalidate();
      },
    });

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRemoveOpen, setIsRemoveOpen] = useState(false);
  const [modalApplicant, setModalApplicant] = useState<ApplicantData>();
  const mainApplicant = applicants?.find((a) => a.isMain);
  const otherApplicants = applicants?.filter((a) => a.id !== mainApplicant?.id);

  const handleNewApplicant = () => {
    setModalApplicant(undefined);
    setIsEditOpen(true);
  };

  const handleEditApplicant = (selectedApplicant: ApplicantData) => {
    setModalApplicant(selectedApplicant);
    setIsEditOpen(true);
  };

  const handleRemoveApplicant = (selectedApplicant: ApplicantData) => {
    setModalApplicant(selectedApplicant);
    setIsRemoveOpen(true);
  };

  const handleSetAsMain = (selectedApplicant: ApplicantFormData) => {
    // TODO: fix typing so that id is not optional
    if (selectedApplicant.id) {
      void setApplicantAsMain({ id: selectedApplicant.id });
    }
  };

  // const { data: dbUser } = api.user.get.useQuery();
  // const hasPro = (dbUser?._count?.subscriptions ?? 0) > 0;

  return (
    <Layout title="Profile">
      <EditProfileApplicantModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        initApplicant={modalApplicant}
      />
      {modalApplicant && (
        <DeleteProfileApplicantModal
          isOpen={isRemoveOpen}
          onClose={() => setIsRemoveOpen(false)}
          applicant={modalApplicant}
        />
      )}

      <Title title="Profile" />
      <div className="flex items-center gap-x-4">
        <Title title="Saved Applicants" type="section" />
        {applicants &&
          applicants.length < MAX_APPLICANTS &&
          (applicants.length < MAX_APPLICANTS_WO_PRO || hasPro) && (
            <button
              aria-label="Add New Applicant"
              className="font-bold uppercase text-accent flex gap-x-2 items-center hover:underline underline-offset-2 "
              onClick={handleNewApplicant}
              disabled={
                isLoading
                // || (!hasPro && applicants && applicants.length > 0)
              }
            >
              <Plus className="h-6 w-6 " />
              <p>Add new</p>
            </button>
          )}
        {/* {!hasPro && <ProMarker />} */}
      </div>
      {applicants && applicants.length >= MAX_APPLICANTS && (
        <p className="-mt-2 mb-4 text-sm">
          You created {applicants.length} of {MAX_APPLICANTS} applicant.
        </p>
      )}
      {isError && (
        <p className="text-error">
          An error occurred while fetching applicant data.
        </p>
      )}
      {/* TODO: add skeleton for loader */}
      {isLoading && <Spinner text="Loading applicant data..." />}
      {!isLoading && applicants?.length === 0 && (
        <p>No applicant details saved.</p>
      )}
      <div className="flex flex-col lg:flex-row gap-4">
        {mainApplicant && (
          <>
            <div className="flex-1">
              <div className="flex items-center gap-x-4">
                <Title title="Main Applicant" type="subsection" />
                <button
                  aria-label="Edit Main Applicant"
                  className="btn-ghost btn-circle btn"
                  onClick={() => handleEditApplicant(mainApplicant)}
                >
                  <SquarePen className="h-6 w-6 text-accent" />
                </button>
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {mainApplicant.jobTitle}
                </p>
                <p className="text-lg">
                  {mainApplicant.firstName} {mainApplicant.lastName}
                </p>
                <Title title="Resume" type="subsubsection" />
                <p className="line-clamp-3">{mainApplicant.resume}</p>
                {mainApplicant.skills && (
                  <>
                    <Title title="Skills" type="subsubsection" />
                    <p className="line-clamp-3">{mainApplicant.skills}</p>
                  </>
                )}
                {mainApplicant.experience && (
                  <>
                    <Title title="Experience" type="subsubsection" />
                    <p className="line-clamp-3">{mainApplicant.experience}</p>
                  </>
                )}
              </div>
            </div>
            <div className="divider lg:hidden" />
            <div className="flex-1">
              <Title title="Other Applicants" type="subsection" />
              {!hasPro ? (
                <div>
                  <ProMarker text="Upgrade to pro to save multiple applicants" />
                </div>
              ) : (
                <>
                  {otherApplicants && otherApplicants.length === 0 && (
                    <p>You have no other applicants saved.</p>
                  )}
                  {otherApplicants && otherApplicants.length > 0 && (
                    <div className="flex  flex-col">
                      {otherApplicants.map((applicant, i) => (
                        <>
                          <div
                            key={applicant.id}
                            className="flex card card-body flex-row border border-secondary items-center justify-between"
                          >
                            <p>
                              <span className="font-semibold">
                                {applicant.jobTitle}
                              </span>
                              <br />
                              {applicant.firstName} {applicant.lastName}
                            </p>
                            <div className="flex">
                              <button
                                aria-label="Edit Applicant"
                                className="btn-ghost btn-circle btn"
                                onClick={() => handleEditApplicant(applicant)}
                              >
                                <SquarePen className="h-6 w-6 text-accent" />
                              </button>

                              <button
                                aria-label="Set as Main Applicant"
                                className="btn-ghost btn-circle btn"
                                onClick={() => handleSetAsMain(applicant)}
                                disabled={settingAsMain}
                              >
                                {settingAsMain ? (
                                  <Spinner className="h-6 w-6 text-success" />
                                ) : (
                                  <ArrowUpFromLine className="h-6 w-6 text-success" />
                                )}
                              </button>

                              <button
                                aria-label="Remove Applicant"
                                className="btn-ghost btn-circle btn"
                                onClick={() => handleRemoveApplicant(applicant)}
                              >
                                <Trash2 className="h-6 w-6 text-error" />
                              </button>
                            </div>
                          </div>
                          {i !== otherApplicants.length - 1 && (
                            <div className="divider" />
                          )}
                        </>
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  );
};

export default ProfilePage;

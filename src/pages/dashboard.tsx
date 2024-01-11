import {
  ChatBubbleLeftRightIcon,
  ClipboardDocumentCheckIcon,
  DocumentTextIcon,
} from "@heroicons/react/24/outline";
import {
  PencilIcon,
  PlusIcon,
  TrashIcon,
  UserIcon,
} from "@heroicons/react/24/solid";

import { useState } from "react";

import { type NextPage } from "next";
import Link from "next/link";

import { Layout, Title } from "~/components";
import { DeleteApplicationModal } from "~/components/modals";
import EditApplicationModal from "~/components/modals/EditApplicationModal";
import Spinner from "~/components/utils/Spinner";

import { api } from "~/lib/api";
import { type ApplicationData } from "~/types/types";

const ApplicationsPage: NextPage = () => {
  const {
    data: applications,
    isLoading,
    isError,
  } = api.application.getAllForUser.useQuery();
  const [isDeleteApplicationOpen, setIsDeleteApplicationOpen] = useState(false);
  const [isEditApplicationOpen, setIsEditApplicationOpen] = useState(false);

  const [selectedApplication, setSelectedApplication] =
    useState<ApplicationData>();

  const handleNew = () => {
    setSelectedApplication(undefined);
    setIsEditApplicationOpen(true);
  };

  const handleDelete = (application: ApplicationData) => {
    setSelectedApplication(application);
    setIsDeleteApplicationOpen(true);
  };

  const handleEdit = (application: ApplicationData) => {
    setSelectedApplication(application);
    setIsEditApplicationOpen(true);
  };

  return (
    <Layout
      title="Saved Applications"
      description="Visit and manage saved applications for your account"
    >
      {selectedApplication && (
        <DeleteApplicationModal
          isOpen={isDeleteApplicationOpen}
          onClose={() => setIsDeleteApplicationOpen(false)}
          application={selectedApplication}
        />
      )}
      <EditApplicationModal
        isOpen={isEditApplicationOpen}
        onClose={() => setIsEditApplicationOpen(false)}
        application={selectedApplication}
      />
      <div className="flex items-center gap-x-4">
        <Title title="Saved Applications" />
        <button
          className="btn-ghost btn flex gap-x-2 text-accent underline"
          onClick={handleNew}
        >
          <PlusIcon className="h-6 w-6 " />
          <p>Create New</p>
        </button>
      </div>
      {isError ? (
        <p className="font-semibold">Error loading saved applications</p>
      ) : (
        <>
          {isLoading && <Spinner text={"Loading Saved Applications"} />}
          {!isLoading && applications?.length === 0 && (
            <p className="font-semibold">No saved applications</p>
          )}
          {!isLoading && applications?.length !== 0 && (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
              {applications?.map((application) => (
                <div
                  key={application.id}
                  className="card h-full w-full border border-primary xl:w-96"
                >
                  <div className="card-body flex flex-col gap-y-2">
                    <h2 className="card-title">
                      {application.job.title}{" "}
                      {application.job.companyName
                        ? ` @ ${application.job.companyName}`
                        : ""}
                    </h2>
                    <div className="flex items-center gap-x-2">
                      <UserIcon className="h-6 w-6" />
                      <p>
                        {application.applicant.firstName}{" "}
                        {application.applicant.lastName} -{" "}
                        {application.applicant.jobTitle}
                      </p>
                    </div>

                    <div>
                      <div className="divider" />
                      <div className="grid w-full grid-cols-3">
                        <Link
                          className="hover:bg-base-200 py-2"
                          href={`/coverletter/${application.id}`}
                        >
                          <div className="flex flex-col items-center gap-y-2 text-primary-focus">
                            <DocumentTextIcon className="h-10 w-10" />
                            <p>Cover Letters</p>
                          </div>
                        </Link>
                        <Link
                          className="hover:bg-base-200 py-2"
                          href={`/interview/${application.id}`}
                        >
                          <div className="flex flex-col items-center gap-y-2 text-primary-focus">
                            <ChatBubbleLeftRightIcon className="h-10 w-10" />
                            <p>Interview</p>
                          </div>
                        </Link>
                        <Link
                          className="hover:bg-base-200 py-2"
                          href={`/test/${application.id}`}
                        >
                          <div className="flex flex-col items-center gap-y-2 text-primary-focus">
                            <ClipboardDocumentCheckIcon className="h-10 w-10" />
                            <p>Test</p>
                          </div>
                        </Link>
                      </div>
                      <div className="divider" />
                    </div>
                    <div className="flex gap-y-2">
                      <div className="card-actions justify-center text-sm flex-1 ">
                        <button
                          className="font-bold uppercase text-secondary flex gap-x-2 items-center hover:underline"
                          onClick={() => handleEdit(application)}
                        >
                          <PencilIcon className="h-6 w-6" />
                          Edit
                        </button>
                      </div>
                      <div className="card-actions justify-center text-sm flex-1 ">
                        <button
                          className="font-bold flex gap-x-2 items-center uppercase text-error hover:underline"
                          onClick={() => handleDelete(application)}
                        >
                          <TrashIcon className="h-6 w-6" />
                          Delete
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </Layout>
  );
};

export default ApplicationsPage;
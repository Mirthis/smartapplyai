import { FileUp, PencilLine } from "lucide-react";

import { useEffect, useState } from "react";

import { cn } from "~/lib/utils";

import {
  type ApplicantData,
  type ApplicantFormData,
  type ParsedResume,
} from "~/types/types";

import FileUpload from "../FileUpload";
import ApplicantForm from "../forms/ApplicantForm";
import Modal from "./Modal";

type EditProfileMode = "edit" | "upload";

const EditProfileApplicantModal = ({
  isOpen,
  onClose,
  initApplicant,
}: {
  isOpen: boolean;
  onClose: () => void;
  initApplicant?: ApplicantData | undefined;
}) => {
  const [mode, setMode] = useState<EditProfileMode>("upload");
  const [applicant, setApplicant] = useState<ApplicantFormData | undefined>(
    initApplicant
  );

  useEffect(() => {
    setMode(initApplicant ? "edit" : "upload");
  }, [initApplicant]);

  useEffect(() => {
    setApplicant(initApplicant);
  }, [initApplicant]);

  const onParseSuccess = (parsedResume: ParsedResume) => {
    const newApplicant: ApplicantFormData = {
      firstName: parsedResume.firstName,
      lastName: parsedResume.lastName,
      jobTitle: parsedResume.jobTitle,
      resume: parsedResume.summary,
      skills: parsedResume.skills.join("\n"),
      isMain: applicant?.isMain ?? true,
      experience: parsedResume.experience
        .map(
          ({ company, title, description }) =>
            `${title} @ ${company}\n${description}`
        )
        .join("\n\n"),
    };
    setApplicant((prev) => {
      if (prev) {
        return {
          ...prev,
          ...newApplicant,
        };
      }
      return newApplicant;
    });
    setMode("edit");
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => onClose()}
      title="Edit Applicant Details"
    >
      <div role="tablist" className="tabs tabs-bordered grid grid-cols-2">
        <a
          onClick={() => setMode("edit")}
          role="tab"
          className={cn("tab tab-bordered", { "tab-active": mode === "edit" })}
        >
          <PencilLine className="h-4 w-4" />
          Edit Details
        </a>
        <a
          role="tab"
          onClick={() => setMode("upload")}
          className={cn("tab tab-bordered", {
            "tab-active": mode === "upload",
          })}
        >
          <FileUp className="h-4 w-4" />
          Populate from file
        </a>
      </div>
      <div className="pt-2">
        {mode === "edit" && (
          <ApplicantForm applicant={applicant} onSuccess={() => onClose()} />
        )}
        {mode === "upload" && (
          <div>
            <FileUpload onParseSuccess={onParseSuccess} />
          </div>
        )}
      </div>
    </Modal>
  );
};

export default EditProfileApplicantModal;

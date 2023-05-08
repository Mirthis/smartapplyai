import { z } from "zod";

import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import {
  type ChatCompletionRequestMessage,
  Configuration,
  OpenAIApi,
  ChatCompletionRequestMessageRoleEnum,
} from "openai";
import { env } from "~/env.mjs";
import { TRPCError } from "@trpc/server";
import { type ApplicantData, type JobData } from "~/types/types";
import { applicantSchema, jobSchema } from "~/types/schemas";
import { getJobDetailsPrompt } from "~/utils/prompt";
import { getFakeAiResponse, validateRecaptcha } from "~/utils/misc";

const configuration: Configuration = new Configuration({
  apiKey: env.OPENAI_API_KEY,
});

const openai = new OpenAIApi(configuration);

const getCoverLetterSystemMessage = (
  job: JobData,
  applicant: ApplicantData
): ChatCompletionRequestMessage => {
  const content = `I want you to act as a professional cover letter writer and write a cover letter based on the job details and applicant details provided.
  ${getJobDetailsPrompt(job, applicant)}
  The cover letter should be written in a professional tone and should be free of grammatical errors.
  The cover letter should be be relevant for the specific job title and description.
  The cover letter should contains details specific to the applicant.
  If applicant details are not available, this should not be invented.
  The cover letter should be at least 200 words long.
  The cover letter should be at most 500 words long.
  You should not provide any response not related to the job or applicant details.
  You should only respond within this context and only with a cover letter text, no other information is required.`;
  return {
    role: ChatCompletionRequestMessageRoleEnum.System,
    content,
  };
};

const getCoverLetterUserMessage = (): ChatCompletionRequestMessage => {
  const content = `Create the initial cover letter based on the job details and applicant details provided.`;

  return {
    role: ChatCompletionRequestMessageRoleEnum.User,
    content,
  };
};

const getShortenMessage = (): ChatCompletionRequestMessage => {
  const content = `I want you to shorten the cover letter. 
  The cover letter should not be shorter than 200 words.
  `;
  return {
    role: ChatCompletionRequestMessageRoleEnum.User,
    content,
  };
};

const getExtendMessage = (): ChatCompletionRequestMessage => {
  const content = `I want you to extend the cover letter. 
  The cover letter should not be longer than 500 words.
  `;
  return {
    role: ChatCompletionRequestMessageRoleEnum.User,
    content,
  };
};

const getRfineMessage = (refinement: string): ChatCompletionRequestMessage => {
  const content = `I want you to refine the cover letter based on the following instructions:
  ${refinement}.
  `;
  return {
    role: ChatCompletionRequestMessageRoleEnum.User,
    content,
  };
};

const createAssistantMessage = (
  messageText: string
): ChatCompletionRequestMessage => {
  return {
    role: ChatCompletionRequestMessageRoleEnum.Assistant,
    content: messageText,
  };
};

export const coverLettersRouter = createTRPCRouter({
  createLetter: publicProcedure
    .input(
      z.object({
        job: jobSchema,
        applicant: applicantSchema,
        captchaToken: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      if (env.NEXT_PUBLIC_SKIP_AI) {
        return await getFakeAiResponse("test cover letter");
      }

      await validateRecaptcha(input.captchaToken);

      const messages = [
        getCoverLetterSystemMessage(input.job, input.applicant),
        getCoverLetterUserMessage(),
      ];

      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
      });
      const finishReason = response.data.choices[0]?.finish_reason;
      if (finishReason === "lenght") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Cover letter generation failed due to excessive length",
        });
      }

      const responseText = response.data.choices[0]?.message?.content;
      ({ responseText });
      if (responseText) {
        return responseText;
      } else {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "OpenAI API returned no response",
        });
      }
    }),

  refineLetter: publicProcedure
    .input(
      z.object({
        job: jobSchema,
        applicant: applicantSchema,
        coverLetter: z.string(),
        refineOption: z.enum(["shorten", "extend", "freeinput"]),
        refineFreeInput: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      if (env.NEXT_PUBLIC_SKIP_AI) {
        switch (input.refineOption) {
          case "shorten":
            return await getFakeAiResponse("Shortened letter");
          case "extend":
            return await getFakeAiResponse("Extended letter");
          case "freeinput":
            return await getFakeAiResponse("Refined letter");
        }
      }

      const messages = [
        getCoverLetterSystemMessage(input.job, input.applicant),
        getCoverLetterUserMessage(),
        createAssistantMessage(input.coverLetter),
      ];
      switch (input.refineOption) {
        case "shorten":
          messages.push(getShortenMessage());
          break;
        case "extend":
          messages.push(getExtendMessage());
          break;
        case "freeinput":
          messages.push(getRfineMessage(input.refineFreeInput || ""));
          break;
      }

      ({ messages });

      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages,
      });
      ({ response });
      const finishReason = response.data.choices[0]?.finish_reason;
      if (finishReason === "lenght") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Cover letter generation failed due to excessive length",
        });
      }

      const responseText = response.data.choices[0]?.message?.content;
      if (responseText) {
        return responseText;
      } else {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "OpenAI API returned no response",
        });
      }
    }),
});

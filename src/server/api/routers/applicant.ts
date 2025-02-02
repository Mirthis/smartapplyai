import { TRPCError } from "@trpc/server";
import { z } from "zod";

import { MAX_APPLICANTS, MAX_APPLICANTS_WO_PRO } from "~/lib/config";
import { openAI } from "~/lib/openai";

import { applicantSchema } from "~/types/schemas";
import { type ParsedResume } from "~/types/types";

import { createTRPCRouter, protectedProcedure } from "../trpc";

export const applicantRouter = createTRPCRouter({
  createOrUpdate: protectedProcedure
    .input(
      z.object({
        applicant: applicantSchema,
        setAsMain: z.boolean().nullish(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // if applicant.id is null, create new applicant in db, otherwise update existing applicant
      // return applicant
      const isMain = input?.setAsMain ?? true;
      const applicant = input.applicant;
      const userId = ctx.auth.userId;
      const queryData = {
        userId: userId,
        firstName: applicant.firstName,
        lastName: applicant.lastName,
        jobTitle: applicant.jobTitle,
        resume: applicant.resume,
        experience: applicant.experience,
        skills: applicant.skills,
      };

      // Check that id exists and userId is the same as the userId in the applicant
      if (applicant.id) {
        await ctx.prisma.applicant.findUniqueOrThrow({
          where: {
            id_userId: {
              id: applicant.id,
              userId: userId,
            },
          },
        });
      } else {
        const applicantCount = await ctx.prisma.applicant.count({
          where: {
            userId: userId,
          },
        });
        const user = await ctx.prisma.user.findUniqueOrThrow({
          where: {
            id: ctx.auth.userId,
          },
          include: {
            subscriptions: {
              where: {
                status: {
                  in: ["active", "trialing"],
                },
              },
            },
          },
        });

        const activeSubscription = user.subscriptions.find(
          (s) => s.status === "active"
        );
        const hasPro = user.lifetimePro || !!activeSubscription;

        if (
          applicantCount >= MAX_APPLICANTS ||
          (!hasPro && applicantCount >= MAX_APPLICANTS_WO_PRO)
        ) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "You have reached the maximum number of applicants",
          });
        }
      }

      if (isMain) {
        await ctx.prisma.applicant.updateMany({
          where: {
            userId: userId,
          },
          data: {
            isMain: false,
          },
        });
      }

      const returnApplicant = await ctx.prisma.applicant.upsert({
        where: {
          id: applicant.id ?? "N/A",
        },
        update: {
          ...queryData,
          isInProfile: true,
          isMain: isMain,
        },
        create: {
          ...queryData,
          isInProfile: true,
          isMain: isMain,
        },
      });

      return returnApplicant;
    }),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      // return applicant with id
      const applicant = await ctx.prisma.applicant.findUnique({
        where: {
          id: input.id,
        },
      });
      return applicant;
    }),

  getByUserId: protectedProcedure
    .input(z.object({ userId: z.string() }))
    .query(async ({ ctx, input }) => {
      // return applicant with id
      const applicant = await ctx.prisma.applicant.findMany({
        where: {
          userId: input.userId,
        },
      });
      return applicant;
    }),

  getForLoggedUser: protectedProcedure
    .input(z.object({ isInProfile: z.boolean() }).optional())
    .query(async ({ ctx, input }) => {
      const isInProfile = input?.isInProfile ?? true;
      // return applicant with id
      const userId = ctx.auth.userId;
      const applicant = await ctx.prisma.applicant.findMany({
        where: {
          userId: userId,
          isInProfile: isInProfile,
        },
      });
      return applicant;
    }),

  setAsMain: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // return applicant with id  and set as main
      const userId = ctx.auth.userId;

      await ctx.prisma.applicant.updateMany({
        where: {
          userId: userId,
        },
        data: {
          isMain: false,
        },
      });

      const applicant = await ctx.prisma.applicant.update({
        where: {
          id_userId: {
            id: input.id,
            userId: userId,
          },
        },
        data: {
          isMain: true,
        },
      });
      return applicant;
    }),

  deleteFromProfile: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // return applicant with id
      const userId = ctx.auth.userId;
      const applicant = await ctx.prisma.applicant.delete({
        where: {
          id_userId: {
            id: input.id,
            userId: userId,
          },
        },
      });
      return applicant;
    }),
  parseResume: protectedProcedure
    .input(z.object({ resumeText: z.string() }))
    .mutation(async ({ input }) => {
      const response = await openAI.chat.completions.create({
        model: "gpt-3.5-turbo",
        messages: [
          {
            content: `I want you to extract the applicant details from the resume text provided.
              Details needed are first name and last name, resume summary, skills and professional experience (company name, job title, job description).
              Result should be in JSON format: { firstName: string, lastName: string, jobTitle:string, summary: string, skills: string[], experience: { company: string, title: string, description: string }[] }`,
            role: "system",
          },
          {
            content: input.resumeText,
            role: "user",
          },
        ],
      });
      const responseText = response.choices[0]?.message?.content;
      if (!responseText) {
        throw new Error("OpenAI API returned no response");
      }
      const parsedResume: ParsedResume = JSON.parse(
        responseText
      ) as ParsedResume;
      return parsedResume;
    }),
});

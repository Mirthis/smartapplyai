import { createTRPCRouter, protectedProcedure } from "../trpc";

export const usersRouter = createTRPCRouter({
  getOnboardingState: protectedProcedure.query(async ({ ctx }) => {
    const applicant = await ctx.prisma.applicant.findFirst({
      where: {
        userId: ctx.auth.userId,
      },
    });
    const application = await ctx.prisma.application.findFirst({
      where: {
        userId: ctx.auth.userId,
      },
    });
    return {
      hasApplicant: !!applicant,
      hasApplication: !!application,
    };
    // return {
    //   hasApplicant: true,
    //   hasApplication: true,
    // };
  }),
  get: protectedProcedure.query(async ({ ctx }) => {
    // return profile by id
    const user = await ctx.prisma.user.findUniqueOrThrow({
      where: {
        id: ctx.auth.userId,
      },
      select: {
        id: true,
        email: true,
        stripeId: true,
        lifetimePro: true,
        _count: {
          select: {
            subscriptions: {
              where: { status: { in: ["active", "trialing"] } },
            },
          },
        },
      },
    });
    return user;
  }),
  getProState: protectedProcedure.query(async ({ ctx }) => {
    // return profile by id
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
          include: {
            price: {
              include: {
                product: true,
              },
            },
          },
          orderBy: {
            currentPeriodEnd: "desc",
          },
        },
      },
    });

    const hasLifetimePro = user.lifetimePro;
    const hasSubscription = user.subscriptions.length > 0;
    const trailSubscription = user.subscriptions.find(
      (s) => s.status === "trialing"
    );
    const activeSubscription = user.subscriptions.find(
      (s) => s.status === "active"
    );
    const hasTrialSubscription = !!trailSubscription;
    const hasActiveSubscription = !!activeSubscription;
    const hasPro = hasLifetimePro || hasActiveSubscription;

    return {
      hasPro,
      hasSubscription,
      hasLifetimePro,
      hasTrialSubscription,
      trailSubscription,
      activeSubscription,
    };
  }),
});

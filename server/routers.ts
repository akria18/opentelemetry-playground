import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { 
  validateOtelConfig, 
  isOtelcolAvailable, 
  getOtelcolVersion 
} from "./otel-validator";

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // OpenTelemetry Configuration Validation
  otel: router({
    /**
     * Validate an OpenTelemetry configuration
     * Uses the otelcol binary if available, falls back to structural validation
     */
    validate: publicProcedure
      .input(z.object({
        config: z.string().min(1, "Configuration cannot be empty"),
      }))
      .mutation(async ({ input }) => {
        const result = await validateOtelConfig(input.config);
        return result;
      }),

    /**
     * Check if the otelcol binary is available
     */
    status: publicProcedure.query(async () => {
      const available = await isOtelcolAvailable();
      const version = available ? await getOtelcolVersion() : null;
      
      return {
        binaryAvailable: available,
        binaryVersion: version,
        validationMode: available ? 'binary' : 'fallback',
      };
    }),
  }),
});

export type AppRouter = typeof appRouter;

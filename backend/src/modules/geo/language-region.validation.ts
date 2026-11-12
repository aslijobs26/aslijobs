import { z } from "zod";

export const reverseGeocodeBodySchema = z
  .object({
    lat: z.number().finite(),
    lon: z.number().finite(),
  })
  .superRefine((value, ctx) => {
    if (
      value.lat < -90 ||
      value.lat > 90 ||
      value.lon < -180 ||
      value.lon > 180
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["lat"],
        message: "A valid location is required.",
      });
    }
  });

export type ReverseGeocodeBody = z.infer<typeof reverseGeocodeBodySchema>;

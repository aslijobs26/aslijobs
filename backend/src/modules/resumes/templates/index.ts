import type {
  ResumeTemplateId,
} from "../resume.types.js";
import { RESUME_TEMPLATE_IDS } from "../resume.constants.js";

export type ResumeTemplateDefinition = {
  id: ResumeTemplateId;
  label: string;
  description: string;
  /** Whether the template is intended for ATS parsers. */
  atsOptimized: boolean;
  /** Phase when HTML/PDF assets will ship. */
  implementationPhase: number;
};

/**
 * Template metadata registry only.
 * Phase 1: no HTML/PDF assets or rendering logic.
 */
export const RESUME_TEMPLATE_REGISTRY: ReadonlyArray<ResumeTemplateDefinition> =
  [
    {
      id: "ats_professional",
      label: "ATS Professional",
      description: "Clean, parser-friendly layout for automated screening.",
      atsOptimized: true,
      implementationPhase: 2,
    },
    {
      id: "modern",
      label: "Modern",
      description: "Contemporary layout with clearer visual hierarchy.",
      atsOptimized: true,
      implementationPhase: 3,
    },
    {
      id: "blue_collar",
      label: "Blue Collar",
      description: "Optimized for trade and field-work roles.",
      atsOptimized: true,
      implementationPhase: 3,
    },
    {
      id: "grey_collar",
      label: "Grey Collar",
      description: "Balanced layout for skilled service and ops roles.",
      atsOptimized: true,
      implementationPhase: 3,
    },
    {
      id: "simple",
      label: "Simple",
      description: "Minimal single-column resume.",
      atsOptimized: true,
      implementationPhase: 3,
    },
  ];

export function getResumeTemplateById(
  templateId: ResumeTemplateId,
): ResumeTemplateDefinition | undefined {
  return RESUME_TEMPLATE_REGISTRY.find((template) => template.id === templateId);
}

export function listResumeTemplateIds(): readonly ResumeTemplateId[] {
  return RESUME_TEMPLATE_IDS;
}

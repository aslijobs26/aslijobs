import mongoose from "mongoose";
import { HTTP_STATUS } from "../../../constants/http-status.js";
import { AppError } from "../../../middleware/error.middleware.js";
import { buildListPagination } from "../../../utils/pagination.js";
import { resolveEmployerPosterImageUrl } from "../../employers/employer-poster-image.js";
import { EmployerModel } from "../../employers/employer.model.js";
import type {
  OperationsEmployerListItem,
  OperationsEmployersListResult,
} from "./operations-employers.types.js";
import type { ListOperationsEmployersQuery } from "./operations-employers.validation.js";

function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function resolveDisplayName(employer: {
  accountType?: string;
  companyName?: string;
  establishmentName?: string;
  firstName?: string;
  lastName?: string;
}): string {
  const companyName = employer.companyName?.trim() ?? "";
  const establishmentName = employer.establishmentName?.trim() ?? "";
  const personName = [employer.firstName, employer.lastName]
    .filter(Boolean)
    .join(" ")
    .trim();

  if (employer.accountType === "individual") {
    return establishmentName || personName || companyName || "Individual employer";
  }

  return companyName || establishmentName || personName || "Employer";
}

function toListItem(employer: {
  _id: mongoose.Types.ObjectId;
  accountType?: string;
  companyName?: string;
  establishmentName?: string;
  firstName?: string;
  lastName?: string;
  whatsappNumber?: string;
  emailAddress?: string;
  city?: string;
  state?: string;
  registrationStatus?: string;
  isWhatsappVerified?: boolean;
  companyLogo?: { url?: string } | null;
  profilePhoto?: { url?: string } | null;
}): OperationsEmployerListItem {
  return {
    id: employer._id.toString(),
    accountType: employer.accountType ?? "",
    displayName: resolveDisplayName(employer),
    companyName: employer.companyName?.trim() ?? "",
    establishmentName: employer.establishmentName?.trim() ?? "",
    whatsappNumber: employer.whatsappNumber?.trim() ?? "",
    emailAddress: employer.emailAddress?.trim() ?? "",
    city: employer.city?.trim() ?? "",
    state: employer.state?.trim() ?? "",
    registrationStatus: employer.registrationStatus ?? "",
    registrationCompleted: employer.registrationStatus === "completed",
    isWhatsappVerified: Boolean(employer.isWhatsappVerified),
    logoUrl: resolveEmployerPosterImageUrl(employer),
  };
}

export const operationsEmployersService = {
  async listEmployers(
    query: ListOperationsEmployersQuery,
  ): Promise<OperationsEmployersListResult> {
    const filter: Record<string, unknown> = {
      registrationStatus: "completed",
    };

    const search = query.search.trim();
    if (search) {
      const pattern = new RegExp(escapeRegex(search), "i");
      filter.$or = [
        { companyName: pattern },
        { establishmentName: pattern },
        { whatsappNumber: pattern },
        { emailAddress: pattern },
        { firstName: pattern },
        { lastName: pattern },
        { city: pattern },
        { state: pattern },
      ];
    }

    const skip = (query.page - 1) * query.limit;

    const [employers, total] = await Promise.all([
      EmployerModel.find(filter)
        .sort({ companyName: 1, establishmentName: 1, createdAt: -1 })
        .skip(skip)
        .limit(query.limit)
        .select(
          "accountType companyName establishmentName firstName lastName whatsappNumber emailAddress city state registrationStatus isWhatsappVerified companyLogo profilePhoto",
        )
        .lean(),
      EmployerModel.countDocuments(filter),
    ]);

    return {
      employers: employers.map((employer) => toListItem(employer)),
      pagination: buildListPagination(query.page, query.limit, total),
    };
  },

  async getEmployerById(employerId: string): Promise<OperationsEmployerListItem> {
    if (!mongoose.Types.ObjectId.isValid(employerId)) {
      throw new AppError("Employer not found.", HTTP_STATUS.NOT_FOUND);
    }

    const employer = await EmployerModel.findOne({
      _id: new mongoose.Types.ObjectId(employerId),
      registrationStatus: "completed",
    })
      .select(
        "accountType companyName establishmentName firstName lastName whatsappNumber emailAddress city state registrationStatus isWhatsappVerified companyLogo profilePhoto",
      )
      .lean();

    if (!employer) {
      throw new AppError("Employer not found.", HTTP_STATUS.NOT_FOUND);
    }

    return toListItem(employer);
  },
};

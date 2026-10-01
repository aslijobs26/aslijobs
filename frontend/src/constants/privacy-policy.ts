import type { MessageKey } from "@/i18n/translate";
import type { LegalKeyedBlockSource, LegalKeyedSectionSource } from "@/types/legal";

function paragraph(key: MessageKey): LegalKeyedBlockSource {
  return { type: "paragraph", key };
}

function list(keys: readonly MessageKey[]): LegalKeyedBlockSource {
  return { type: "list", keys };
}

function lines(keys: readonly MessageKey[]): LegalKeyedBlockSource {
  return { type: "contact-lines", keys };
}

const scopeItems = [
  "privacy.sections.scope.items.i1",
  "privacy.sections.scope.items.i2",
  "privacy.sections.scope.items.i3",
  "privacy.sections.scope.items.i4",
  "privacy.sections.scope.items.i5",
  "privacy.sections.scope.items.i6",
  "privacy.sections.scope.items.i7",
  "privacy.sections.scope.items.i8",
  "privacy.sections.scope.items.i9",
  "privacy.sections.scope.items.i10",
  "privacy.sections.scope.items.i11",
  "privacy.sections.scope.items.i12",
  "privacy.sections.scope.items.i13",
  "privacy.sections.scope.items.i14",
  "privacy.sections.scope.items.i15",
] as const satisfies readonly MessageKey[];

const jobSeekerItems = [
  "privacy.sections.jobSeekerInformation.items.i1",
  "privacy.sections.jobSeekerInformation.items.i2",
  "privacy.sections.jobSeekerInformation.items.i3",
  "privacy.sections.jobSeekerInformation.items.i4",
  "privacy.sections.jobSeekerInformation.items.i5",
  "privacy.sections.jobSeekerInformation.items.i6",
  "privacy.sections.jobSeekerInformation.items.i7",
  "privacy.sections.jobSeekerInformation.items.i8",
  "privacy.sections.jobSeekerInformation.items.i9",
  "privacy.sections.jobSeekerInformation.items.i10",
  "privacy.sections.jobSeekerInformation.items.i11",
  "privacy.sections.jobSeekerInformation.items.i12",
  "privacy.sections.jobSeekerInformation.items.i13",
  "privacy.sections.jobSeekerInformation.items.i14",
  "privacy.sections.jobSeekerInformation.items.i15",
  "privacy.sections.jobSeekerInformation.items.i16",
  "privacy.sections.jobSeekerInformation.items.i17",
  "privacy.sections.jobSeekerInformation.items.i18",
  "privacy.sections.jobSeekerInformation.items.i19",
  "privacy.sections.jobSeekerInformation.items.i20",
  "privacy.sections.jobSeekerInformation.items.i21",
  "privacy.sections.jobSeekerInformation.items.i22",
  "privacy.sections.jobSeekerInformation.items.i23",
  "privacy.sections.jobSeekerInformation.items.i24",
  "privacy.sections.jobSeekerInformation.items.i25",
  "privacy.sections.jobSeekerInformation.items.i26",
  "privacy.sections.jobSeekerInformation.items.i27",
] as const satisfies readonly MessageKey[];

const employerItems = [
  "privacy.sections.employerInformation.items.i1",
  "privacy.sections.employerInformation.items.i2",
  "privacy.sections.employerInformation.items.i3",
  "privacy.sections.employerInformation.items.i4",
  "privacy.sections.employerInformation.items.i5",
  "privacy.sections.employerInformation.items.i6",
  "privacy.sections.employerInformation.items.i7",
  "privacy.sections.employerInformation.items.i8",
  "privacy.sections.employerInformation.items.i9",
  "privacy.sections.employerInformation.items.i10",
  "privacy.sections.employerInformation.items.i11",
  "privacy.sections.employerInformation.items.i12",
  "privacy.sections.employerInformation.items.i13",
  "privacy.sections.employerInformation.items.i14",
  "privacy.sections.employerInformation.items.i15",
  "privacy.sections.employerInformation.items.i16",
  "privacy.sections.employerInformation.items.i17",
  "privacy.sections.employerInformation.items.i18",
  "privacy.sections.employerInformation.items.i19",
  "privacy.sections.employerInformation.items.i20",
  "privacy.sections.employerInformation.items.i21",
  "privacy.sections.employerInformation.items.i22",
  "privacy.sections.employerInformation.items.i23",
  "privacy.sections.employerInformation.items.i24",
] as const satisfies readonly MessageKey[];

const jobPostingItems = [
  "privacy.sections.jobPostingApplication.items.i1",
  "privacy.sections.jobPostingApplication.items.i2",
  "privacy.sections.jobPostingApplication.items.i3",
  "privacy.sections.jobPostingApplication.items.i4",
  "privacy.sections.jobPostingApplication.items.i5",
  "privacy.sections.jobPostingApplication.items.i6",
  "privacy.sections.jobPostingApplication.items.i7",
  "privacy.sections.jobPostingApplication.items.i8",
  "privacy.sections.jobPostingApplication.items.i9",
  "privacy.sections.jobPostingApplication.items.i10",
  "privacy.sections.jobPostingApplication.items.i11",
  "privacy.sections.jobPostingApplication.items.i12",
  "privacy.sections.jobPostingApplication.items.i13",
  "privacy.sections.jobPostingApplication.items.i14",
  "privacy.sections.jobPostingApplication.items.i15",
  "privacy.sections.jobPostingApplication.items.i16",
  "privacy.sections.jobPostingApplication.items.i17",
  "privacy.sections.jobPostingApplication.items.i18",
  "privacy.sections.jobPostingApplication.items.i19",
] as const satisfies readonly MessageKey[];

const whatsappItems = [
  "privacy.sections.whatsappCommunication.items.i1",
  "privacy.sections.whatsappCommunication.items.i2",
  "privacy.sections.whatsappCommunication.items.i3",
  "privacy.sections.whatsappCommunication.items.i4",
  "privacy.sections.whatsappCommunication.items.i5",
  "privacy.sections.whatsappCommunication.items.i6",
  "privacy.sections.whatsappCommunication.items.i7",
  "privacy.sections.whatsappCommunication.items.i8",
  "privacy.sections.whatsappCommunication.items.i9",
  "privacy.sections.whatsappCommunication.items.i10",
  "privacy.sections.whatsappCommunication.items.i11",
  "privacy.sections.whatsappCommunication.items.i12",
  "privacy.sections.whatsappCommunication.items.i13",
  "privacy.sections.whatsappCommunication.items.i14",
] as const satisfies readonly MessageKey[];

const videoItems = [
  "privacy.sections.videoProfiles.items.i1",
  "privacy.sections.videoProfiles.items.i2",
  "privacy.sections.videoProfiles.items.i3",
  "privacy.sections.videoProfiles.items.i4",
  "privacy.sections.videoProfiles.items.i5",
  "privacy.sections.videoProfiles.items.i6",
  "privacy.sections.videoProfiles.items.i7",
  "privacy.sections.videoProfiles.items.i8",
  "privacy.sections.videoProfiles.items.i9",
  "privacy.sections.videoProfiles.items.i10",
] as const satisfies readonly MessageKey[];

const languageItems = [
  "privacy.sections.regionalLanguage.items.i1",
  "privacy.sections.regionalLanguage.items.i2",
  "privacy.sections.regionalLanguage.items.i3",
  "privacy.sections.regionalLanguage.items.i4",
  "privacy.sections.regionalLanguage.items.i5",
  "privacy.sections.regionalLanguage.items.i6",
  "privacy.sections.regionalLanguage.items.i7",
  "privacy.sections.regionalLanguage.items.i8",
  "privacy.sections.regionalLanguage.items.i9",
] as const satisfies readonly MessageKey[];

const locationItems = [
  "privacy.sections.locationData.items.i1",
  "privacy.sections.locationData.items.i2",
  "privacy.sections.locationData.items.i3",
  "privacy.sections.locationData.items.i4",
  "privacy.sections.locationData.items.i5",
  "privacy.sections.locationData.items.i6",
  "privacy.sections.locationData.items.i7",
  "privacy.sections.locationData.items.i8",
] as const satisfies readonly MessageKey[];

const deviceItems = [
  "privacy.sections.deviceUsage.items.i1",
  "privacy.sections.deviceUsage.items.i2",
  "privacy.sections.deviceUsage.items.i3",
  "privacy.sections.deviceUsage.items.i4",
  "privacy.sections.deviceUsage.items.i5",
  "privacy.sections.deviceUsage.items.i6",
  "privacy.sections.deviceUsage.items.i7",
  "privacy.sections.deviceUsage.items.i8",
  "privacy.sections.deviceUsage.items.i9",
  "privacy.sections.deviceUsage.items.i10",
  "privacy.sections.deviceUsage.items.i11",
  "privacy.sections.deviceUsage.items.i12",
  "privacy.sections.deviceUsage.items.i13",
  "privacy.sections.deviceUsage.items.i14",
] as const satisfies readonly MessageKey[];

const paymentItems = [
  "privacy.sections.paymentBilling.items.i1",
  "privacy.sections.paymentBilling.items.i2",
  "privacy.sections.paymentBilling.items.i3",
  "privacy.sections.paymentBilling.items.i4",
  "privacy.sections.paymentBilling.items.i5",
  "privacy.sections.paymentBilling.items.i6",
  "privacy.sections.paymentBilling.items.i7",
  "privacy.sections.paymentBilling.items.i8",
  "privacy.sections.paymentBilling.items.i9",
  "privacy.sections.paymentBilling.items.i10",
  "privacy.sections.paymentBilling.items.i11",
] as const satisfies readonly MessageKey[];

const collectItems = [
  "privacy.sections.howWeCollect.items.i1",
  "privacy.sections.howWeCollect.items.i2",
  "privacy.sections.howWeCollect.items.i3",
  "privacy.sections.howWeCollect.items.i4",
  "privacy.sections.howWeCollect.items.i5",
  "privacy.sections.howWeCollect.items.i6",
  "privacy.sections.howWeCollect.items.i7",
  "privacy.sections.howWeCollect.items.i8",
  "privacy.sections.howWeCollect.items.i9",
  "privacy.sections.howWeCollect.items.i10",
  "privacy.sections.howWeCollect.items.i11",
  "privacy.sections.howWeCollect.items.i12",
  "privacy.sections.howWeCollect.items.i13",
  "privacy.sections.howWeCollect.items.i14",
] as const satisfies readonly MessageKey[];

const useItems = [
  "privacy.sections.howWeUse.items.i1",
  "privacy.sections.howWeUse.items.i2",
  "privacy.sections.howWeUse.items.i3",
  "privacy.sections.howWeUse.items.i4",
  "privacy.sections.howWeUse.items.i5",
  "privacy.sections.howWeUse.items.i6",
  "privacy.sections.howWeUse.items.i7",
  "privacy.sections.howWeUse.items.i8",
  "privacy.sections.howWeUse.items.i9",
  "privacy.sections.howWeUse.items.i10",
  "privacy.sections.howWeUse.items.i11",
  "privacy.sections.howWeUse.items.i12",
  "privacy.sections.howWeUse.items.i13",
  "privacy.sections.howWeUse.items.i14",
  "privacy.sections.howWeUse.items.i15",
  "privacy.sections.howWeUse.items.i16",
  "privacy.sections.howWeUse.items.i17",
  "privacy.sections.howWeUse.items.i18",
  "privacy.sections.howWeUse.items.i19",
  "privacy.sections.howWeUse.items.i20",
  "privacy.sections.howWeUse.items.i21",
  "privacy.sections.howWeUse.items.i22",
  "privacy.sections.howWeUse.items.i23",
  "privacy.sections.howWeUse.items.i24",
  "privacy.sections.howWeUse.items.i25",
  "privacy.sections.howWeUse.items.i26",
  "privacy.sections.howWeUse.items.i27",
] as const satisfies readonly MessageKey[];

const legalBasisItems = [
  "privacy.sections.legalBasis.items.i1",
  "privacy.sections.legalBasis.items.i2",
  "privacy.sections.legalBasis.items.i3",
  "privacy.sections.legalBasis.items.i4",
  "privacy.sections.legalBasis.items.i5",
  "privacy.sections.legalBasis.items.i6",
  "privacy.sections.legalBasis.items.i7",
  "privacy.sections.legalBasis.items.i8",
  "privacy.sections.legalBasis.items.i9",
] as const satisfies readonly MessageKey[];

const sharingEmployerItems = [
  "privacy.sections.sharingEmployers.items.i1",
  "privacy.sections.sharingEmployers.items.i2",
  "privacy.sections.sharingEmployers.items.i3",
  "privacy.sections.sharingEmployers.items.i4",
  "privacy.sections.sharingEmployers.items.i5",
  "privacy.sections.sharingEmployers.items.i6",
  "privacy.sections.sharingEmployers.items.i7",
  "privacy.sections.sharingEmployers.items.i8",
  "privacy.sections.sharingEmployers.items.i9",
  "privacy.sections.sharingEmployers.items.i10",
  "privacy.sections.sharingEmployers.items.i11",
  "privacy.sections.sharingEmployers.items.i12",
  "privacy.sections.sharingEmployers.items.i13",
  "privacy.sections.sharingEmployers.items.i14",
] as const satisfies readonly MessageKey[];

const sharingSeekerItems = [
  "privacy.sections.sharingJobSeekers.items.i1",
  "privacy.sections.sharingJobSeekers.items.i2",
  "privacy.sections.sharingJobSeekers.items.i3",
  "privacy.sections.sharingJobSeekers.items.i4",
  "privacy.sections.sharingJobSeekers.items.i5",
  "privacy.sections.sharingJobSeekers.items.i6",
  "privacy.sections.sharingJobSeekers.items.i7",
  "privacy.sections.sharingJobSeekers.items.i8",
  "privacy.sections.sharingJobSeekers.items.i9",
  "privacy.sections.sharingJobSeekers.items.i10",
] as const satisfies readonly MessageKey[];

const providerItems = [
  "privacy.sections.sharingServiceProviders.items.i1",
  "privacy.sections.sharingServiceProviders.items.i2",
  "privacy.sections.sharingServiceProviders.items.i3",
  "privacy.sections.sharingServiceProviders.items.i4",
  "privacy.sections.sharingServiceProviders.items.i5",
  "privacy.sections.sharingServiceProviders.items.i6",
  "privacy.sections.sharingServiceProviders.items.i7",
  "privacy.sections.sharingServiceProviders.items.i8",
  "privacy.sections.sharingServiceProviders.items.i9",
  "privacy.sections.sharingServiceProviders.items.i10",
  "privacy.sections.sharingServiceProviders.items.i11",
  "privacy.sections.sharingServiceProviders.items.i12",
  "privacy.sections.sharingServiceProviders.items.i13",
] as const satisfies readonly MessageKey[];

const securityItems = [
  "privacy.sections.dataSecurity.items.i1",
  "privacy.sections.dataSecurity.items.i2",
  "privacy.sections.dataSecurity.items.i3",
  "privacy.sections.dataSecurity.items.i4",
  "privacy.sections.dataSecurity.items.i5",
  "privacy.sections.dataSecurity.items.i6",
  "privacy.sections.dataSecurity.items.i7",
  "privacy.sections.dataSecurity.items.i8",
  "privacy.sections.dataSecurity.items.i9",
  "privacy.sections.dataSecurity.items.i10",
  "privacy.sections.dataSecurity.items.i11",
] as const satisfies readonly MessageKey[];

const rightsItems = [
  "privacy.sections.userRights.items.i1",
  "privacy.sections.userRights.items.i2",
  "privacy.sections.userRights.items.i3",
  "privacy.sections.userRights.items.i4",
  "privacy.sections.userRights.items.i5",
  "privacy.sections.userRights.items.i6",
  "privacy.sections.userRights.items.i7",
  "privacy.sections.userRights.items.i8",
] as const satisfies readonly MessageKey[];

const employerUseItems = [
  "privacy.sections.employerCandidateData.items.i1",
  "privacy.sections.employerCandidateData.items.i2",
  "privacy.sections.employerCandidateData.items.i3",
  "privacy.sections.employerCandidateData.items.i4",
  "privacy.sections.employerCandidateData.items.i5",
  "privacy.sections.employerCandidateData.items.i6",
  "privacy.sections.employerCandidateData.items.i7",
  "privacy.sections.employerCandidateData.items.i8",
  "privacy.sections.employerCandidateData.items.i9",
  "privacy.sections.employerCandidateData.items.i10",
] as const satisfies readonly MessageKey[];

const cookieItems = [
  "privacy.sections.cookies.items.i1",
  "privacy.sections.cookies.items.i2",
  "privacy.sections.cookies.items.i3",
  "privacy.sections.cookies.items.i4",
  "privacy.sections.cookies.items.i5",
  "privacy.sections.cookies.items.i6",
  "privacy.sections.cookies.items.i7",
  "privacy.sections.cookies.items.i8",
] as const satisfies readonly MessageKey[];

const grievanceLines = [
  "privacy.sections.grievanceContact.lines.l1",
  "privacy.sections.grievanceContact.lines.l2",
  "privacy.sections.grievanceContact.lines.l3",
  "privacy.sections.grievanceContact.lines.l4",
  "privacy.sections.grievanceContact.lines.l5",
] as const satisfies readonly MessageKey[];

const contactLines = [
  "privacy.sections.contact.lines.l1",
  "privacy.sections.contact.lines.l2",
  "privacy.sections.contact.lines.l3",
  "privacy.sections.contact.lines.l4",
  "privacy.sections.contact.lines.l5",
  "privacy.sections.contact.lines.l6",
] as const satisfies readonly MessageKey[];

export const PRIVACY_SECTIONS: LegalKeyedSectionSource[] = [
  {
    id: "overview",
    navLabelKey: "privacy.sections.overview.navLabel",
    blocks: [
      paragraph("privacy.sections.overview.p1"),
      paragraph("privacy.sections.overview.p2"),
    ],
  },
  {
    id: "about-aslijobs",
    navLabelKey: "privacy.sections.aboutAslijobs.navLabel",
    titleKey: "privacy.sections.aboutAslijobs.title",
    blocks: [
      paragraph("privacy.sections.aboutAslijobs.p1"),
      paragraph("privacy.sections.aboutAslijobs.p2"),
      paragraph("privacy.sections.aboutAslijobs.p3"),
    ],
  },
  {
    id: "scope",
    navLabelKey: "privacy.sections.scope.navLabel",
    titleKey: "privacy.sections.scope.title",
    blocks: [
      paragraph("privacy.sections.scope.p1"),
      paragraph("privacy.sections.scope.p2"),
      list(scopeItems),
    ],
  },
  {
    id: "personal-information",
    navLabelKey: "privacy.sections.personalInformation.navLabel",
    titleKey: "privacy.sections.personalInformation.title",
    blocks: [paragraph("privacy.sections.personalInformation.p1")],
  },
  {
    id: "job-seeker-information",
    navLabelKey: "privacy.sections.jobSeekerInformation.navLabel",
    titleKey: "privacy.sections.jobSeekerInformation.title",
    blocks: [
      paragraph("privacy.sections.jobSeekerInformation.p1"),
      list(jobSeekerItems),
      paragraph("privacy.sections.jobSeekerInformation.p2"),
    ],
  },
  {
    id: "employer-information",
    navLabelKey: "privacy.sections.employerInformation.navLabel",
    titleKey: "privacy.sections.employerInformation.title",
    blocks: [
      paragraph("privacy.sections.employerInformation.p1"),
      list(employerItems),
      paragraph("privacy.sections.employerInformation.p2"),
    ],
  },
  {
    id: "job-posting-application",
    navLabelKey: "privacy.sections.jobPostingApplication.navLabel",
    titleKey: "privacy.sections.jobPostingApplication.title",
    blocks: [
      paragraph("privacy.sections.jobPostingApplication.p1"),
      list(jobPostingItems),
      paragraph("privacy.sections.jobPostingApplication.p2"),
    ],
  },
  {
    id: "whatsapp-communication",
    navLabelKey: "privacy.sections.whatsappCommunication.navLabel",
    titleKey: "privacy.sections.whatsappCommunication.title",
    blocks: [
      paragraph("privacy.sections.whatsappCommunication.p1"),
      list(whatsappItems),
      paragraph("privacy.sections.whatsappCommunication.p2"),
      paragraph("privacy.sections.whatsappCommunication.p3"),
    ],
  },
  {
    id: "video-profiles",
    navLabelKey: "privacy.sections.videoProfiles.navLabel",
    titleKey: "privacy.sections.videoProfiles.title",
    blocks: [
      paragraph("privacy.sections.videoProfiles.p1"),
      paragraph("privacy.sections.videoProfiles.p2"),
      list(videoItems),
      paragraph("privacy.sections.videoProfiles.p3"),
      paragraph("privacy.sections.videoProfiles.p4"),
      paragraph("privacy.sections.videoProfiles.p5"),
    ],
  },
  {
    id: "regional-language",
    navLabelKey: "privacy.sections.regionalLanguage.navLabel",
    titleKey: "privacy.sections.regionalLanguage.title",
    blocks: [
      paragraph("privacy.sections.regionalLanguage.p1"),
      list(languageItems),
      paragraph("privacy.sections.regionalLanguage.p2"),
    ],
  },
  {
    id: "location-data",
    navLabelKey: "privacy.sections.locationData.navLabel",
    titleKey: "privacy.sections.locationData.title",
    blocks: [
      paragraph("privacy.sections.locationData.p1"),
      list(locationItems),
      paragraph("privacy.sections.locationData.p2"),
    ],
  },
  {
    id: "device-usage",
    navLabelKey: "privacy.sections.deviceUsage.navLabel",
    titleKey: "privacy.sections.deviceUsage.title",
    blocks: [
      paragraph("privacy.sections.deviceUsage.p1"),
      list(deviceItems),
      paragraph("privacy.sections.deviceUsage.p2"),
    ],
  },
  {
    id: "payment-billing",
    navLabelKey: "privacy.sections.paymentBilling.navLabel",
    titleKey: "privacy.sections.paymentBilling.title",
    blocks: [
      paragraph("privacy.sections.paymentBilling.p1"),
      list(paymentItems),
      paragraph("privacy.sections.paymentBilling.p2"),
    ],
  },
  {
    id: "how-we-collect",
    navLabelKey: "privacy.sections.howWeCollect.navLabel",
    titleKey: "privacy.sections.howWeCollect.title",
    blocks: [
      paragraph("privacy.sections.howWeCollect.p1"),
      list(collectItems),
      paragraph("privacy.sections.howWeCollect.p2"),
    ],
  },
  {
    id: "how-we-use",
    navLabelKey: "privacy.sections.howWeUse.navLabel",
    titleKey: "privacy.sections.howWeUse.title",
    blocks: [
      paragraph("privacy.sections.howWeUse.p1"),
      list(useItems),
    ],
  },
  {
    id: "legal-basis",
    navLabelKey: "privacy.sections.legalBasis.navLabel",
    titleKey: "privacy.sections.legalBasis.title",
    blocks: [
      paragraph("privacy.sections.legalBasis.p1"),
      list(legalBasisItems),
      paragraph("privacy.sections.legalBasis.p2"),
    ],
  },
  {
    id: "sharing-employers",
    navLabelKey: "privacy.sections.sharingEmployers.navLabel",
    titleKey: "privacy.sections.sharingEmployers.title",
    blocks: [
      paragraph("privacy.sections.sharingEmployers.p1"),
      list(sharingEmployerItems),
      paragraph("privacy.sections.sharingEmployers.p2"),
    ],
  },
  {
    id: "sharing-job-seekers",
    navLabelKey: "privacy.sections.sharingJobSeekers.navLabel",
    titleKey: "privacy.sections.sharingJobSeekers.title",
    blocks: [
      paragraph("privacy.sections.sharingJobSeekers.p1"),
      list(sharingSeekerItems),
      paragraph("privacy.sections.sharingJobSeekers.p2"),
    ],
  },
  {
    id: "sharing-service-providers",
    navLabelKey: "privacy.sections.sharingServiceProviders.navLabel",
    titleKey: "privacy.sections.sharingServiceProviders.title",
    blocks: [
      paragraph("privacy.sections.sharingServiceProviders.p1"),
      list(providerItems),
      paragraph("privacy.sections.sharingServiceProviders.p2"),
    ],
  },
  {
    id: "ai-automation",
    navLabelKey: "privacy.sections.aiAutomation.navLabel",
    titleKey: "privacy.sections.aiAutomation.title",
    blocks: [
      paragraph("privacy.sections.aiAutomation.p1"),
      paragraph("privacy.sections.aiAutomation.p2"),
      paragraph("privacy.sections.aiAutomation.p3"),
      paragraph("privacy.sections.aiAutomation.p4"),
    ],
  },
  {
    id: "promotions-campaigns",
    navLabelKey: "privacy.sections.promotionsCampaigns.navLabel",
    titleKey: "privacy.sections.promotionsCampaigns.title",
    blocks: [
      paragraph("privacy.sections.promotionsCampaigns.p1"),
      paragraph("privacy.sections.promotionsCampaigns.p2"),
      paragraph("privacy.sections.promotionsCampaigns.p3"),
    ],
  },
  {
    id: "data-security",
    navLabelKey: "privacy.sections.dataSecurity.navLabel",
    titleKey: "privacy.sections.dataSecurity.title",
    blocks: [
      paragraph("privacy.sections.dataSecurity.p1"),
      paragraph("privacy.sections.dataSecurity.p2"),
      list(securityItems),
      paragraph("privacy.sections.dataSecurity.p3"),
    ],
  },
  {
    id: "data-retention",
    navLabelKey: "privacy.sections.dataRetention.navLabel",
    titleKey: "privacy.sections.dataRetention.title",
    blocks: [
      paragraph("privacy.sections.dataRetention.p1"),
      paragraph("privacy.sections.dataRetention.p2"),
      paragraph("privacy.sections.dataRetention.p3"),
      paragraph("privacy.sections.dataRetention.p4"),
    ],
  },
  {
    id: "user-rights",
    navLabelKey: "privacy.sections.userRights.navLabel",
    titleKey: "privacy.sections.userRights.title",
    blocks: [
      paragraph("privacy.sections.userRights.p1"),
      list(rightsItems),
      paragraph("privacy.sections.userRights.p2"),
    ],
  },
  {
    id: "correction-update",
    navLabelKey: "privacy.sections.correctionUpdate.navLabel",
    titleKey: "privacy.sections.correctionUpdate.title",
    blocks: [
      paragraph("privacy.sections.correctionUpdate.p1"),
      paragraph("privacy.sections.correctionUpdate.p2"),
      paragraph("privacy.sections.correctionUpdate.p3"),
    ],
  },
  {
    id: "consent-opt-out",
    navLabelKey: "privacy.sections.consentOptOut.navLabel",
    titleKey: "privacy.sections.consentOptOut.title",
    blocks: [
      paragraph("privacy.sections.consentOptOut.p1"),
      paragraph("privacy.sections.consentOptOut.p2"),
      paragraph("privacy.sections.consentOptOut.p3"),
    ],
  },
  {
    id: "childrens-privacy",
    navLabelKey: "privacy.sections.childrensPrivacy.navLabel",
    titleKey: "privacy.sections.childrensPrivacy.title",
    blocks: [
      paragraph("privacy.sections.childrensPrivacy.p1"),
      paragraph("privacy.sections.childrensPrivacy.p2"),
    ],
  },
  {
    id: "employer-candidate-data",
    navLabelKey: "privacy.sections.employerCandidateData.navLabel",
    titleKey: "privacy.sections.employerCandidateData.title",
    blocks: [
      paragraph("privacy.sections.employerCandidateData.p1"),
      list(employerUseItems),
      paragraph("privacy.sections.employerCandidateData.p2"),
    ],
  },
  {
    id: "cookies",
    navLabelKey: "privacy.sections.cookies.navLabel",
    titleKey: "privacy.sections.cookies.title",
    blocks: [
      paragraph("privacy.sections.cookies.p1"),
      paragraph("privacy.sections.cookies.p2"),
      list(cookieItems),
      paragraph("privacy.sections.cookies.p3"),
    ],
  },
  {
    id: "third-party-links",
    navLabelKey: "privacy.sections.thirdPartyLinks.navLabel",
    titleKey: "privacy.sections.thirdPartyLinks.title",
    blocks: [
      paragraph("privacy.sections.thirdPartyLinks.p1"),
      paragraph("privacy.sections.thirdPartyLinks.p2"),
    ],
  },
  {
    id: "international-transfers",
    navLabelKey: "privacy.sections.internationalTransfers.navLabel",
    titleKey: "privacy.sections.internationalTransfers.title",
    blocks: [
      paragraph("privacy.sections.internationalTransfers.p1"),
      paragraph("privacy.sections.internationalTransfers.p2"),
    ],
  },
  {
    id: "data-breach",
    navLabelKey: "privacy.sections.dataBreach.navLabel",
    titleKey: "privacy.sections.dataBreach.title",
    blocks: [
      paragraph("privacy.sections.dataBreach.p1"),
      paragraph("privacy.sections.dataBreach.p2"),
      paragraph("privacy.sections.dataBreach.p3"),
    ],
  },
  {
    id: "grievance-contact",
    navLabelKey: "privacy.sections.grievanceContact.navLabel",
    titleKey: "privacy.sections.grievanceContact.title",
    blocks: [
      paragraph("privacy.sections.grievanceContact.p1"),
      lines(grievanceLines),
      paragraph("privacy.sections.grievanceContact.p2"),
    ],
  },
  {
    id: "changes",
    navLabelKey: "privacy.sections.changes.navLabel",
    titleKey: "privacy.sections.changes.title",
    blocks: [
      paragraph("privacy.sections.changes.p1"),
      paragraph("privacy.sections.changes.p2"),
      paragraph("privacy.sections.changes.p3"),
    ],
  },
  {
    id: "contact",
    navLabelKey: "privacy.sections.contact.navLabel",
    titleKey: "privacy.sections.contact.title",
    blocks: [
      paragraph("privacy.sections.contact.p1"),
      lines(contactLines),
    ],
  },
];

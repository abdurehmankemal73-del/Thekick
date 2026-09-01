import type { BeltLevel } from "@/db/schema";

export const CLUB = {
  shortName: "THE KICK",
  fullName: "JJU THE KICK INTERNATIONAL TAEKWONDO CLUB",
  federation: "International Taekwon-Do Federation (ITF)",
  federationShort: "ITF",
} as const;

export const FOOTER_CONTACT = {
  location: "Jigjiga University",
  email: "abdurehmankemal73@gmail.com",
  telegram: "@Abdi_oro_tech_12",
  phone: "0946293933",
  phoneDisplay: "0946 293 933",
  tel: "+251946293933",
} as const;

export const BELT_LEVELS = [
  "WHITE",
  "WHITE_YELLOW_TAG",
  "YELLOW",
  "YELLOW_GREEN_TAG",
  "GREEN",
  "GREEN_BLUE_TAG",
  "BLUE",
  "BLUE_RED_TAG",
  "RED",
  "RED_BLACK_TAG",
  "BLACK",
  "DAN_1",
] as const satisfies readonly BeltLevel[];

export const BELT_LABELS: Record<BeltLevel, string> = {
  WHITE: "White Belt",
  WHITE_YELLOW_TAG: "White Belt with Yellow Stripe",
  YELLOW: "Yellow Belt",
  YELLOW_GREEN_TAG: "Yellow Belt with Green Stripe",
  GREEN: "Green Belt",
  GREEN_BLUE_TAG: "Green Belt with Blue Stripe",
  BLUE: "Blue Belt",
  BLUE_RED_TAG: "Blue Belt with Red Stripe",
  RED: "Red Belt",
  RED_BLACK_TAG: "Red Belt with Black Stripe",
  BLACK: "Black Belt",
  DAN_1: "1st Dan",
};

export const ABSENCE_TYPES = ["FAMILY", "CLASS_EXAM", "SICK", "JOURNEY"] as const;

export const ABSENCE_LABELS: Record<(typeof ABSENCE_TYPES)[number], string> = {
  FAMILY: "Family",
  CLASS_EXAM: "Class/Exam",
  SICK: "Sick",
  JOURNEY: "Journey",
};

export const ACCOUNT_STATUSES = ["PENDING", "ACTIVE", "SUSPENDED", "REJECTED"] as const;

export const ACCOUNT_STATUS_LABELS: Record<(typeof ACCOUNT_STATUSES)[number], string> = {
  PENDING: "Pending",
  ACTIVE: "Approved",
  SUSPENDED: "Suspended",
  REJECTED: "Rejected",
};

export const PERMISSION_STATUSES = ["PENDING", "APPROVED", "REJECTED"] as const;

export const ANNOUNCEMENT_STATUSES = ["DRAFT", "PUBLISHED"] as const;

export const EVENT_TYPES = [
  "TRAINING",
  "BELT_EXAM",
  "COMPETITION",
  "GRADUATION",
  "MEETING",
  "SPECIAL",
] as const;

export const EVENT_TYPE_LABELS: Record<(typeof EVENT_TYPES)[number], string> = {
  TRAINING: "Training session",
  BELT_EXAM: "Belt examination",
  COMPETITION: "Competition",
  GRADUATION: "Graduation ceremony",
  MEETING: "Club meeting",
  SPECIAL: "Special event",
};

export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
export const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"] as const;

export const PASSWORD_HINT =
  "At least 8 characters, including one letter and one number.";

export const PAGE_SIZE = 12;
export const MAX_PAGE_SIZE = 50;

export const DEFAULT_CLUB_SETTINGS = {
  email: "abdurehmankemal73@gmail.com",
  phone: "0946293933",
  telegram: "@Abdi_oro_tech_12",
  location: "Jigjiga University, Jigjiga, Ethiopia",
  schedule:
    "Monday Wednesday Friday — Morning 5:30 AM\nSaturday — Evening 9:30 PM",
  facebookUrl: "",
  instagramUrl: "",
  youtubeUrl: "",
  about:
    "THE KICK is JJU THE KICK INTERNATIONAL TAEKWONDO CLUB. We are an ITF Taekwon-Do club at Jigjiga University. We teach skill, good manners, and respect.",
  mission:
    "To teach real ITF Taekwon-Do with care, safety, and respect. We help students become strong, kind, and sure of themselves.",
  vision:
    "To be a known university ITF club, famous for good training and good manners.",
  philosophy:
    "At THE KICK we train respect, honesty, hard work, self control, and a strong spirit. We teach the moves with care. We also train the heart.",
  itfInfo:
    "The International Taekwon-Do Federation (ITF) is the first Taekwon-Do group, started by General Choi Hong Hi. ITF training teaches patterns, sparring, basic moves, and good manners.",
  activities:
    "Belt classes, pattern practice, safe sparring, theory, body training, and club events. Teachers give belt tests.",
  achievements:
    "THE KICK is growing at Jigjiga University. Students move from white belt toward 1st Dan.",
  instructors: [
    {
      name: "Boosabum Abdurehman Kemal",
      title: "2nd Dan",
      bio: "",
    },
  ],
};

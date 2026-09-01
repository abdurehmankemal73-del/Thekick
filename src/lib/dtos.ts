import type { Grade, User } from "@/db/schema";
import { BELT_LABELS } from "@/lib/constants";

export function publicUser(user: User) {
  return {
    id: user.id,
    fullName: user.fullName,
    email: user.email,
    telegramUsername: user.telegramUsername,
    role: user.role,
    beltLevel: user.beltLevel,
    beltLabel: user.beltLevel ? BELT_LABELS[user.beltLevel] : null,
    accountStatus: user.accountStatus,
    createdAt: user.createdAt,
  };
}

export function sameBeltMember(user: Pick<User, "fullName" | "beltLevel">) {
  return {
    fullName: user.fullName,
    beltLevel: user.beltLevel,
    beltLabel: user.beltLevel ? BELT_LABELS[user.beltLevel] : null,
  };
}

export function publicGrade(grade: Grade) {
  return {
    id: grade.id,
    assessmentName: grade.assessmentName,
    patternScore: grade.patternScore,
    sparringScore: grade.sparringScore,
    kicksScore: grade.kicksScore,
    theoryScore: grade.theoryScore,
    disciplineScore: grade.disciplineScore,
    overallScore: grade.overallScore,
    result: grade.result,
    instructorComment: grade.instructorComment,
    assessmentDate: grade.assessmentDate,
    createdAt: grade.createdAt,
  };
}

export function adminStudent(user: User) {
  const { passwordHash: _passwordHash, ...safe } = user;
  return {
    ...safe,
    beltLabel: user.beltLevel ? BELT_LABELS[user.beltLevel] : null,
  };
}

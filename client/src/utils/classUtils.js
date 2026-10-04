
/**
 * Utility functions for Class A and Class B student partitioning:
 * - Enrollment number 1 to 63 (ending in 001 to 063) => Class A
 * - Enrollment number 64 to remaining (064+ & non-24) => Class B
 */

export const getStudentClass = (enrolment, uid) => {
  let roll = null;

  // 1. Enrollment number takes absolute priority (GTU 12-digit format, e.g. 246250307001 to 246250307118)
  if (enrolment) {
    const clean = String(enrolment).trim();
    if (clean.startsWith('24')) {
      const match = clean.match(/(\d{3})$/);
      if (match) roll = parseInt(match[1], 10);
    } else {
      // Non-24 (e.g. 236250307037 or D2D remaining students) go to Class B
      return 'Class B';
    }
  }

  // 2. Fallback to UID if enrollment is not provided
  if (roll === null && uid) {
    const match = String(uid).match(/(\d+)$/);
    if (match) {
      const num = parseInt(match[1], 10);
      // Students 1 to 51 have enrollment numbers 1 to 63 (Class A)
      if (num >= 1 && num <= 51) return 'Class A';
      return 'Class B';
    }
  }

  // Enrollment 1 to 63 is Class A, 64 to remaining is Class B
  if (roll !== null && roll >= 1 && roll <= 63) {
    return 'Class A';
  }
  return 'Class B';
};

export const matchesClassFilter = (studentClass, filter) => {
  if (!filter || filter === 'All') return true;
  if (filter === 'Class A' || filter === 'Batch A') {
    return studentClass === 'Class A' || studentClass === 'Batch A';
  }
  if (filter === 'Class B' || filter === 'Batch B' || filter === 'Class BB') {
    return studentClass === 'Class B' || studentClass === 'Batch B' || studentClass === 'Class BB';
  }
  return studentClass === filter;
};

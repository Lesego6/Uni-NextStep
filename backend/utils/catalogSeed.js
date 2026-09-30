const db = require("../database");

const defaultUniversities = [
  { id: 1, abbr: "UCT", name: "University of Cape Town", province: "Western Cape", location: "Cape Town" },
  { id: 2, abbr: "Wits", name: "University of the Witwatersrand", province: "Gauteng", location: "Johannesburg" },
  { id: 3, abbr: "SU", name: "Stellenbosch University", province: "Western Cape", location: "Stellenbosch" },
  { id: 4, abbr: "UP", name: "University of Pretoria", province: "Gauteng", location: "Pretoria" },
  { id: 5, abbr: "UKZN", name: "University of KwaZulu-Natal", province: "KwaZulu-Natal", location: "Durban" },
  { id: 6, abbr: "UJ", name: "University of Johannesburg", province: "Gauteng", location: "Johannesburg" },
  { id: 7, abbr: "RU", name: "Rhodes University", province: "Eastern Cape", location: "Grahamstown" },
  { id: 8, abbr: "NWU", name: "North-West University", province: "North West", location: "Potchefstroom" },
  { id: 9, abbr: "UFH", name: "University of Fort Hare", province: "Eastern Cape", location: "Alice" },
  { id: 10, abbr: "UNISA", name: "University of South Africa", province: "Gauteng", location: "Pretoria" },
  { id: 11, abbr: "UL", name: "University of Limpopo", province: "Limpopo", location: "Polokwane" },
  { id: 12, abbr: "UFS", name: "University of the Free State", province: "Free State", location: "Bloemfontein" },
  { id: 13, abbr: "TUT", name: "Tshwane University of Technology", province: "Gauteng", location: "Pretoria" },
  { id: 14, abbr: "CPUT", name: "Cape Peninsula University of Technology", province: "Western Cape", location: "Cape Town" },
  { id: 15, abbr: "DUT", name: "Durban University of Technology", province: "KwaZulu-Natal", location: "Durban" },
  { id: 16, abbr: "UWC", name: "University of the Western Cape", province: "Western Cape", location: "Bellville" }
];

const defaultCourses = [
  { id: 101, name: "BSc Computer Science", field: "Science & Technology", minAps: 32 },
  { id: 102, name: "BCom Accounting", field: "Commerce", minAps: 34 },
  { id: 103, name: "BA Psychology", field: "Humanities", minAps: 28 },
  { id: 104, name: "BIT (Information Technology)", field: "Science & Technology", minAps: 30 },
  { id: 105, name: "BCom Economics", field: "Commerce", minAps: 32 },
  { id: 106, name: "Bachelor of Laws", field: "Law", minAps: 32 },
  { id: 107, name: "Bachelor of Medicine and Surgery", field: "Health Sciences", minAps: 36 },
  { id: 108, name: "BSc Nursing", field: "Health Sciences", minAps: 28 },
  { id: 109, name: "BEd Foundation Phase", field: "Education", minAps: 24 },
  { id: 110, name: "BSc Agriculture", field: "Agriculture", minAps: 28 }
];

const defaultCourseUniversities = [
  { courseId: 101, universityId: 1 }, { courseId: 101, universityId: 2 }, { courseId: 101, universityId: 3 }, { courseId: 101, universityId: 4 }, { courseId: 101, universityId: 6 },
  { courseId: 102, universityId: 1 }, { courseId: 102, universityId: 2 }, { courseId: 102, universityId: 4 }, { courseId: 102, universityId: 6 },
  { courseId: 103, universityId: 1 }, { courseId: 103, universityId: 3 }, { courseId: 103, universityId: 6 },
  { courseId: 104, universityId: 4 }, { courseId: 104, universityId: 6 }, { courseId: 104, universityId: 13 },
  { courseId: 105, universityId: 1 }, { courseId: 105, universityId: 2 }, { courseId: 105, universityId: 6 },
  { courseId: 106, universityId: 1 }, { courseId: 106, universityId: 2 }, { courseId: 106, universityId: 3 },
  { courseId: 107, universityId: 1 }, { courseId: 107, universityId: 5 }, { courseId: 107, universityId: 12 },
  { courseId: 108, universityId: 5 }, { courseId: 108, universityId: 9 }, { courseId: 108, universityId: 12 },
  { courseId: 109, universityId: 1 }, { courseId: 109, universityId: 3 }, { courseId: 109, universityId: 8 },
  { courseId: 110, universityId: 1 }, { courseId: 110, universityId: 11 }, { courseId: 110, universityId: 12 }
];

async function ensureSeededCatalog(executor = db) {
  for (const university of defaultUniversities) {
    await executor.prepare(`
      INSERT IGNORE INTO universities (id, abbr, name, province, location)
      VALUES (?, ?, ?, ?, ?)
    `).run(university.id, university.abbr, university.name, university.province, university.location);
  }

  for (const course of defaultCourses) {
    await executor.prepare(`
      INSERT IGNORE INTO courses (id, name, field, min_aps)
      VALUES (?, ?, ?, ?)
    `).run(course.id, course.name, course.field, course.minAps);
  }

  for (const link of defaultCourseUniversities) {
    await executor.prepare(`
      INSERT IGNORE INTO course_universities (course_id, university_id)
      VALUES (?, ?)
    `).run(link.courseId, link.universityId);
  }
}

module.exports = {
  defaultCourses,
  defaultCourseUniversities,
  defaultUniversities,
  ensureSeededCatalog
};

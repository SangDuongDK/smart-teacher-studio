import {
  PrismaClient,
  Role,
  AccountStatus,
  ExerciseType,
  SkillType,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('--- Bắt đầu nạp dữ liệu mẫu (Seeding Database) ---');

  // 1. Tạo sẵn 9 khối lớp (Lớp 1 đến Lớp 9)
  const grades = [];
  for (let i = 1; i <= 9; i++) {
    const gradeName = `Grade ${i}`;
    const grade = await prisma.grade.upsert({
      where: { name: gradeName },
      update: {},
      create: {
        name: gradeName,
        description: `Chương trình tiếng Anh chuẩn K-9 - Lớp ${i}`,
      },
    });
    grades.push(grade);
  }
  console.log('-> Đã tạo xong danh mục 9 khối lớp (Grade 1 - Grade 9).');

  // 2. Tạo các chủ đề (Topic) mẫu cho Grade 5
  const grade5 = grades.find((g) => g.name === 'Grade 5');
  let topicAnimals: any = null;

  if (grade5) {
    topicAnimals = await prisma.topic.upsert({
      where: { id: 'sample-topic-animals-g5' },
      update: {},
      create: {
        id: 'sample-topic-animals-g5',
        gradeId: grade5.id,
        unitName: 'Unit 3',
        name: 'Animals',
        description: 'Chủ đề về động vật hoang dã và vật nuôi',
      },
    });

    await prisma.topic.upsert({
      where: { id: 'sample-topic-family-g5' },
      update: {},
      create: {
        id: 'sample-topic-family-g5',
        gradeId: grade5.id,
        unitName: 'Unit 1',
        name: 'Family and Friends',
        description: 'Chủ đề về gia đình và các mối quan hệ bạn bè',
      },
    });
    console.log('-> Đã tạo các chủ đề mẫu (Topics) cho Grade 5.');
  }

  // 3. Tạo tài khoản mẫu cho 3 vai trò
  const defaultPassword = await bcrypt.hash('Admin@123456', 10);
  const teacherPassword = await bcrypt.hash('Teacher@123456', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@smartteacher.edu.vn' },
    update: {},
    create: {
      email: 'admin@smartteacher.edu.vn',
      fullName: 'System Administrator',
      passwordHash: defaultPassword,
      role: Role.ADMIN,
      status: AccountStatus.ACTIVE,
    },
  });
  console.log(`-> Tạo Admin: ${admin.email} (Mật khẩu: Admin@123456)`);

  const reviewer = await prisma.user.upsert({
    where: { email: 'reviewer@smartteacher.edu.vn' },
    update: {},
    create: {
      email: 'reviewer@smartteacher.edu.vn',
      fullName: 'Tổ Trưởng Chuyên Môn',
      passwordHash: teacherPassword,
      role: Role.REVIEWER,
      status: AccountStatus.ACTIVE,
    },
  });
  console.log(`-> Tạo Reviewer: ${reviewer.email} (Mật khẩu: Teacher@123456)`);

  const teacher = await prisma.user.upsert({
    where: { email: 'teacher@smartteacher.edu.vn' },
    update: {},
    create: {
      email: 'teacher@smartteacher.edu.vn',
      fullName: 'Giáo Viên Tiếng Anh K-9',
      passwordHash: teacherPassword,
      role: Role.TEACHER,
      status: AccountStatus.ACTIVE,
    },
  });
  console.log(`-> Tạo Teacher: ${teacher.email} (Mật khẩu: Teacher@123456)`);

  // 4. Nạp câu hỏi mẫu cho Ngân hàng câu hỏi (Tuần 6)
  if (grade5 && topicAnimals) {
    const sampleQuestions = [
      // 1. Trắc nghiệm (MULTIPLE_CHOICE)
      {
        type: ExerciseType.MULTIPLE_CHOICE,
        skill: SkillType.READING,
        difficulty: 'EASY',
        content: 'Which animal is known as the "King of the Jungle"?',
        options: ['Tiger', 'Lion', 'Elephant', 'Monkey'],
        correctAnswer: 'Lion',
        explanation: 'Sư tử (Lion) được mệnh danh là chúa sơn lâm trong tiếng Anh.',
        tags: ['Animals', 'Vocabulary', 'Grade 5'],
        gradeId: grade5.id,
        topicId: topicAnimals.id,
        createdById: teacher.id,
      },

      // 2. Điền từ (FILL_IN_BLANK)
      {
        type: ExerciseType.FILL_IN_BLANK,
        skill: SkillType.WRITING,
        difficulty: 'MEDIUM',
        content: 'Elephants have a long ______ that they use to drink water and pick up food.',
        options: { placeholder: '______', hint: 'Bắt đầu bằng chữ T (vòi voi)' },
        correctAnswer: 'trunk',
        explanation: 'Vòi của con voi trong tiếng Anh là "trunk".',
        tags: ['Animals', 'Spelling', 'Grade 5'],
        gradeId: grade5.id,
        topicId: topicAnimals.id,
        createdById: teacher.id,
      },

      // 3. Nối từ (MATCHING)
      {
        type: ExerciseType.MATCHING,
        skill: SkillType.READING,
        difficulty: 'EASY',
        content: 'Match each animal with its sound.',
        options: [
          { left: 'Dog', right: 'Barks' },
          { left: 'Cat', right: 'Meows' },
          { left: 'Duck', right: 'Quacks' },
          { left: 'Cow', right: 'Moos' },
        ],
        correctAnswer: {
          Dog: 'Barks',
          Cat: 'Meows',
          Duck: 'Quacks',
          Cow: 'Moos',
        },
        explanation: 'Nối tên các con vật với âm thanh đặc trưng của chúng.',
        tags: ['Animals', 'Matching', 'Grade 5'],
        gradeId: grade5.id,
        topicId: topicAnimals.id,
        createdById: teacher.id,
      },

      // 4. Sắp xếp câu (REORDER_SENTENCE)
      {
        type: ExerciseType.REORDER_SENTENCE,
        skill: SkillType.WRITING,
        difficulty: 'MEDIUM',
        content: 'Put the words in the correct order to form a complete sentence.',
        options: ['A cheetah', 'can run', 'faster than', 'any other', 'land animal.'],
        correctAnswer: ['A cheetah', 'can run', 'faster than', 'any other', 'land animal.'],
        explanation: 'Cấu trúc so sánh hơn: S + can run faster than + danh từ.',
        tags: ['Grammar', 'Comparatives', 'Grade 5'],
        gradeId: grade5.id,
        topicId: topicAnimals.id,
        createdById: teacher.id,
      },

      // 5. Đúng / Sai (TRUE_FALSE)
      {
        type: ExerciseType.TRUE_FALSE,
        skill: SkillType.READING,
        difficulty: 'MEDIUM',
        content: "Read the sentence and decide if it is TRUE or FALSE:\n'Penguins are birds that can fly very high in the sky.'",
        options: ['TRUE', 'FALSE'],
        correctAnswer: 'FALSE',
        explanation: 'Chim cánh cụt (Penguins) là loài chim nhưng không biết bay, chúng chỉ biết bơi.',
        tags: ['Animals', 'True False', 'Reading'],
        gradeId: grade5.id,
        topicId: topicAnimals.id,
        createdById: teacher.id,
      },
    ];

    for (const q of sampleQuestions) {
      await prisma.question.create({
        data: q,
      });
    }
    console.log(`-> Đã nạp thành công ${sampleQuestions.length} câu hỏi mẫu cho Ngân hàng câu hỏi!`);
  }

  console.log('--- Hoàn thành nạp dữ liệu mẫu! ---');
}

main()
  .catch((e) => {
    console.error('Lỗi nạp seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
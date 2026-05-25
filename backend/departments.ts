// src/seedFacultiesDepartments.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();

// Define interfaces
interface IDepartment {
  name: string;
  faculty: string;
}

interface IFaculty {
  name: string;
  departments: string[];
}

// Database connection
async function connectDB() {
  try{
    await mongoose.connect(process.env.MONGO_URI || '', {
      useNewUrlParser: true,
    } as mongoose.ConnectOptions);
    console.log('Database connected successfully ✅');
  } catch (error) {
    console.error('Database connection error:', error);
    process.exit(1);
  }
}

// Faculty and department data
const facultyData: IFaculty[] = [
  {
    name: 'Faculty of Agriculture',
    departments: [
      'Agric Economics and Extension',
      'Agriculture (Agronomy/Animal Science)',
      'Fisheries and Aquaculture',
      'Forestry and Wildlife Management'
    ]
  },
  {
    name: 'Faculty of Arts',
    departments: [
      'Arabic Studies',
      'Christian Religious Studies',
      'English and Literary Studies',
      'French',
      'History and International Studies',
      'Islamic Studies',
      'Nigerian Languages (Hausa Language)',
      'Philosophy',
      'Theatre and Media Arts',
      'Fine Arts'
    ]
  },
  {
    name: 'Faculty of Computing',
    departments: [
      'Computer Science',
      'Cyber Security',
      'Information Technology'
    ]
  },
  {
    name: 'Faculty of Education',
    departments: [
      'Education & Integrated Science',
      'Education & Biology',
      'Education & Chemistry',
      'Education & Computer Science',
      'Education & Mathematics',
      'Education & Physics',
      'EDUCATION AND FRENCH',
      'EDUCATION AND GEOGRAPHY',
      'EDUCATION AND HISTORY',
      'HEALTH EDUCATION',
      'HUMAN KINETICS',
      'EDUCATION AND CHRISTIAN RELIGIOUS STUDIES',
      'EDUCATION AND ARABIC',
      'EDUCATIONAL MANAGEMENT',
      'PRIMARY EDUCATION STUDIES',
      'EARLY CHILDHOOD EDUCATION',
      'GUIDANCE AND COUNSELLING',
      'ADULT EDUCATION',
      'EDUCATION AND ENGLISH LANGUAGE',
      'EDUCATION AND HAUSA',
      'SOCIAL STUDIES AND CIVIC EDUCATION',
      'ECONOMICS EDUCATION',
      'CREATIVE ARTS EDUCATION',
      'LANGUAGE ARTS AND COMMUNICATION'
    ]
  },
  {
    name: 'Faculty of Management Science',
    departments: [
      'Accounting',
      'Business Administration',
      'Entrepreneurship Studies',
      'Procurement Management',
      'Public Administration',
      'Petroleum Information Management'
    ]
  },
  {
    name: 'Faculty of Science',
    departments: [
      'Anatomy',
      'Biochemistry',
      'Biology (Plant Science and Bio Technology/Botany)',
      'Chemistry',
      'Geography',
      'Geology',
      'Industrial Chemistry',
      'Mathematics',
      'Microbiology',
      'Physics',
      'Science Laboratory Technology',
      'Statistics',
      'Zoology',
      'Glass and Silicate Technology',
      'Industrial Design'
    ]
  },
  {
    name: 'Faculty of Social Sciences',
    departments: [
      'Criminology and Security Studies',
      'Economics',
      'Mass Communication',
      'Political Science',
      'Psychology',
      'Social work',
      'Sociology',
      'Library and Information Science'
    ]
  },
  {
    name: 'College of Medicine',
    departments: [
      'Medicine and Surgery',
      'Nursing',
      'Medical Laboratory Science',
      'Physiology',
      'Radiography'
    ]
  }
];

// Seed function
async function seedDatabase() {
  await connectDB();

  const Faculty = mongoose.model<IFaculty>('Faculty', new mongoose.Schema({
    name: String,
    departments: [String]
  }));

  const Department = mongoose.model<IDepartment>('Department', new mongoose.Schema({
    name: String,
    faculty: String
  }));

  try {
    for (const facultyItem of facultyData) {
      // Find or create faculty
      const faculty = await Faculty.findOneAndUpdate(
        { name: facultyItem.name },
        { $setOnInsert: { name: facultyItem.name } },
        { upsert: true, new: true }
      );

      // Process each department
      for (const deptName of facultyItem.departments) {
        await Department.findOneAndUpdate(
          { 
            name: deptName,
            faculty: faculty._id 
          },
          {
            $setOnInsert: {
              name: deptName,
              faculty: faculty._id
            }
          },
          { upsert: true }
        );
      }

      // Remove departments not in the current data (optional)
      await Department.deleteMany({
        faculty: faculty._id,
        name: { $nin: facultyItem.departments }
      });
    }

    console.log('Database updated successfully');
  } catch (error) {
    console.error('Error updating database:', error);
  } finally {
    mongoose.disconnect();
  }
}
// Execute
seedDatabase();
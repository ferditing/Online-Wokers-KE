// backend/scripts/seed-skills.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
dotenv.config();
import Skill from '../models/Skill'; // adjust path if your model is elsewhere

async function main() {
  const uri = process.env.MONGO_URI;
  if (!uri) {
    console.error('MONGO_URI environment variable is not set');
    process.exit(1);
  }
  console.log('Connecting to', uri);
  await mongoose.connect(uri, {});

  console.log('Dropping existing skills collection (if exists)...');
  try {
    await Skill.collection.drop();
    console.log('Dropped collection.');
  } catch (err: any) {
    if (err.codeName === 'NamespaceNotFound') {
      console.log('No existing skills collection found — continuing.');
    } else {
      console.warn('Drop error (continuing):', err.message);
    }
  }

  const skills = [
    // Software Engineering (web/backend/frontend)
    { key: 'python_developer', name: 'Python Developer', category: 'Software Engineering' },
    { key: 'r_programmer', name: 'R Programmer / Data Analyst', category: 'Software Engineering' },
    { key: 'react_developer', name: 'React Developer', category: 'Software Engineering' },
    { key: 'cpp_developer', name: 'C / C++ Programmer', category: 'Software Engineering' },
    { key: 'java_developer', name: 'Java Developer', category: 'Software Engineering' },
    { key: 'nodejs_developer', name: 'Node.js Developer', category: 'Software Engineering' },
    { key: 'golang_developer', name: 'Golang Developer', category: 'Software Engineering' },
    { key: 'dotnet_developer', name: '.NET Developer', category: 'Software Engineering' },
    { key: 'fullstack_developer', name: 'Full-stack Developer', category: 'Software Engineering' },
    { key: 'backend_developer', name: 'Backend Developer', category: 'Software Engineering' },
    { key: 'frontend_developer', name: 'Frontend Developer', category: 'Software Engineering' },
    { key: 'devops_engineer', name: 'DevOps Engineer', category: 'Software Engineering' },
    { key: 'qa_engineer', name: 'QA / Test Engineer', category: 'Software Engineering' },
    { key: 'data_engineer', name: 'Data Engineer', category: 'Software Engineering' },
    { key: 'ml_engineer', name: 'Machine Learning Engineer', category: 'Software Engineering' },

    // Mobile
    { key: 'android_developer', name: 'Android Developer (Kotlin/Java)', category: 'Mobile' },
    { key: 'ios_developer', name: 'iOS Developer (Swift)', category: 'Mobile' },
    { key: 'react_native_developer', name: 'React Native Developer', category: 'Mobile' },
    { key: 'flutter_developer', name: 'Flutter Developer', category: 'Mobile' },

    // Data & Analysis
    { key: 'data_entry', name: 'Data Entry', category: 'Data' },
    { key: 'excel_poweruser', name: 'Microsoft Excel (advanced)', category: 'Data' },
    { key: 'powerbi_analyst', name: 'Power BI / Tableau', category: 'Data' },
    { key: 'statistical_analyst', name: 'Statistical Analyst', category: 'Data' },

    // Accounting & Finance
    { key: 'bookkeeping', name: 'Bookkeeping', category: 'Accounting' },
    { key: 'tax_preparation', name: 'Tax Preparation', category: 'Accounting' },
    { key: 'payroll_specialist', name: 'Payroll Specialist', category: 'Accounting' },
    { key: 'financial_analysis', name: 'Financial Analysis', category: 'Accounting' },
    { key: 'quickbooks', name: 'QuickBooks', category: 'Accounting' },
    { key: 'sage', name: 'Sage Accounting', category: 'Accounting' },

    // Design & Creative
    { key: 'graphic_design', name: 'Graphic Design', category: 'Design' },
    { key: 'ui_ux', name: 'UI / UX Design', category: 'Design' },
    { key: 'motion_graphics', name: 'Motion Graphics', category: 'Design' },

    // Content & Marketing
    { key: 'content_writing', name: 'Content Writing', category: 'Marketing' },
    { key: 'copywriting', name: 'Copywriting', category: 'Marketing' },
    { key: 'seo_specialist', name: 'SEO Specialist', category: 'Marketing' },
    { key: 'social_media', name: 'Social Media Manager', category: 'Marketing' },

    // Support & Admin
    { key: 'customer_support', name: 'Customer Support / Live Chat', category: 'Support' },
    { key: 'virtual_assistant', name: 'Virtual Assistant', category: 'Support' },
    { key: 'hr_specialist', name: 'HR Specialist', category: 'Support' },

    // Misc / Trades
    { key: 'civil_engineering', name: 'Civil Engineering', category: 'Engineering' },
    { key: 'electrical_engineering', name: 'Electrical Engineering', category: 'Engineering' },

    // Add any other specific skills you mentioned
    { key: 'python_scripting', name: 'Python Scripting', category: 'Software Engineering' },
    { key: 'r_statistical_programming', name: 'R Statistical Programming', category: 'Software Engineering' },
    { key: 'react_js', name: 'React.js', category: 'Software Engineering' },
    { key: 'cpp_programming', name: 'C++ Programming', category: 'Software Engineering' },
    { key: 'pp_programming', name: 'C# / .NET (placeholder PP)', category: 'Software Engineering' },
    // ... you can append more items here
  ];

  console.log(`Inserting ${skills.length} skills...`);
  await Skill.insertMany(skills);
  console.log('Done. Inserted skills.');

  await mongoose.disconnect();
  console.log('Disconnected. Seed complete.');
}

main().catch(err => {
  console.error('Seed failed', err);
  process.exit(1);
});

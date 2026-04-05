export type CareerTheme = {
  id: string;
  title: string;
  blurb: string;
  hue: number;
};

export const CAREER_THEMES: CareerTheme[] = [
  {
    id: 'cybersecurity',
    title: 'Cybersecurity',
    blurb: 'Protect systems, spot threats, and build secure habits.',
    hue: 265,
  },
  {
    id: 'designer',
    title: 'Designer',
    blurb: 'Turn ideas into clear, beautiful experiences.',
    hue: 210,
  },
  {
    id: 'data_analyst',
    title: 'Data Analyst',
    blurb: 'Make sense of data and tell stories with evidence.',
    hue: 190,
  },
  {
    id: 'software_engineer',
    title: 'Software Engineer',
    blurb: 'Build products with logic, code, and continuous improvement.',
    hue: 245,
  },
];

export function getCareerById(id: string): CareerTheme | undefined {
  return CAREER_THEMES.find((c) => c.id === id);
}

export type CareerCatalogItem = {
  id: string;
  name: string;
  shortDescription: string;
  clusterId: CareerTheme['id'];
};

// High-level catalog used for recommendations and result screen.
// clusterId maps each career into one of the task engine tracks.
export const CAREER_CATALOG: CareerCatalogItem[] = [
  // Cybersecurity / infrastructure
  {
    id: 'cybersecurity_analyst',
    name: 'Cybersecurity Analyst',
    shortDescription: 'Monitor systems, investigate threats, and reduce security risk.',
    clusterId: 'cybersecurity',
  },
  {
    id: 'application_security_engineer',
    name: 'Application Security Engineer',
    shortDescription: 'Secure apps by reviewing code, designs, and auth flows.',
    clusterId: 'cybersecurity',
  },
  {
    id: 'cloud_security_engineer',
    name: 'Cloud Security Engineer',
    shortDescription: 'Harden cloud infrastructure and automate security controls.',
    clusterId: 'cybersecurity',
  },
  {
    id: 'soc_analyst',
    name: 'SOC Analyst',
    shortDescription: 'Respond to alerts and incidents in real time.',
    clusterId: 'cybersecurity',
  },
  {
    id: 'security_researcher',
    name: 'Security Researcher',
    shortDescription: 'Study vulnerabilities, exploits, and advanced attack patterns.',
    clusterId: 'cybersecurity',
  },
  {
    id: 'network_engineer',
    name: 'Network Engineer',
    shortDescription: 'Design and maintain reliable, secure networks.',
    clusterId: 'cybersecurity',
  },

  // Software engineering / data / AI
  {
    id: 'software_engineer_backend',
    name: 'Backend Software Engineer',
    shortDescription: 'Build APIs, services, and business logic.',
    clusterId: 'software_engineer',
  },
  {
    id: 'software_engineer_frontend',
    name: 'Frontend Software Engineer',
    shortDescription: 'Create interactive, responsive user interfaces.',
    clusterId: 'software_engineer',
  },
  {
    id: 'fullstack_engineer',
    name: 'Full‑Stack Engineer',
    shortDescription: 'Work across frontend, backend, and integrations.',
    clusterId: 'software_engineer',
  },
  {
    id: 'mobile_app_developer',
    name: 'Mobile App Developer',
    shortDescription: 'Build apps for phones and tablets.',
    clusterId: 'software_engineer',
  },
  {
    id: 'data_scientist',
    name: 'Data Scientist',
    shortDescription: 'Use statistics and ML to answer questions with data.',
    clusterId: 'data_analyst',
  },
  {
    id: 'data_analyst',
    name: 'Data Analyst',
    shortDescription: 'Clean data, build dashboards, and support decisions.',
    clusterId: 'data_analyst',
  },
  {
    id: 'ml_engineer',
    name: 'Machine Learning Engineer',
    shortDescription: 'Train, deploy, and monitor ML models in production.',
    clusterId: 'software_engineer',
  },
  {
    id: 'ai_researcher',
    name: 'AI Researcher',
    shortDescription: 'Explore new algorithms and model architectures.',
    clusterId: 'data_analyst',
  },
  {
    id: 'business_intelligence_analyst',
    name: 'Business Intelligence Analyst',
    shortDescription: 'Build reports and insights for business stakeholders.',
    clusterId: 'data_analyst',
  },
  {
    id: 'devops_engineer',
    name: 'DevOps / SRE Engineer',
    shortDescription: 'Automate deployments and keep systems reliable.',
    clusterId: 'software_engineer',
  },

  // Design / creative / product
  {
    id: 'ui_ux_designer',
    name: 'UI/UX Designer',
    shortDescription: 'Design clear, intuitive digital interfaces.',
    clusterId: 'designer',
  },
  {
    id: 'product_designer',
    name: 'Product Designer',
    shortDescription: 'Shape products from research to high‑fidelity designs.',
    clusterId: 'designer',
  },
  {
    id: 'visual_designer',
    name: 'Visual Designer',
    shortDescription: 'Work on branding, visuals, and marketing assets.',
    clusterId: 'designer',
  },
  {
    id: 'graphic_designer',
    name: 'Graphic Designer',
    shortDescription: 'Create posters, social assets, and print visuals.',
    clusterId: 'designer',
  },
  {
    id: 'interaction_designer',
    name: 'Interaction Designer',
    shortDescription: 'Design how users move through and feel in an experience.',
    clusterId: 'designer',
  },
  {
    id: 'game_designer',
    name: 'Game Designer',
    shortDescription: 'Design game mechanics, levels, and player experience.',
    clusterId: 'designer',
  },
  {
    id: 'animator',
    name: 'Animator',
    shortDescription: 'Bring stories and interfaces to life with motion.',
    clusterId: 'designer',
  },
  {
    id: 'video_editor',
    name: 'Video Editor',
    shortDescription: 'Edit and craft stories using video footage.',
    clusterId: 'designer',
  },
  {
    id: 'content_creator',
    name: 'Content Creator',
    shortDescription: 'Produce content for platforms like YouTube or Instagram.',
    clusterId: 'designer',
  },
  {
    id: 'product_manager',
    name: 'Product Manager',
    shortDescription: 'Define product direction and coordinate teams.',
    clusterId: 'software_engineer',
  },

  // Engineering (mechanical, civil, etc.)
  {
    id: 'mechanical_engineer',
    name: 'Mechanical Engineer',
    shortDescription: 'Design machines, devices, and mechanical systems.',
    clusterId: 'software_engineer',
  },
  {
    id: 'civil_engineer',
    name: 'Civil Engineer',
    shortDescription: 'Plan and build infrastructure like roads and bridges.',
    clusterId: 'software_engineer',
  },
  {
    id: 'architect',
    name: 'Architect',
    shortDescription: 'Design buildings and spaces for people to use.',
    clusterId: 'designer',
  },
  {
    id: 'robotics_engineer',
    name: 'Robotics Engineer',
    shortDescription: 'Build and program robots and automation systems.',
    clusterId: 'software_engineer',
  },
  {
    id: 'automotive_engineer',
    name: 'Automotive Engineer',
    shortDescription: 'Work on vehicle systems and performance.',
    clusterId: 'software_engineer',
  },
  {
    id: 'environmental_engineer',
    name: 'Environmental Engineer',
    shortDescription: 'Solve environmental challenges using engineering.',
    clusterId: 'data_analyst',
  },

  // Business / finance / entrepreneurship
  {
    id: 'entrepreneur',
    name: 'Entrepreneur',
    shortDescription: 'Start and grow new products, services, or companies.',
    clusterId: 'software_engineer',
  },
  {
    id: 'business_analyst',
    name: 'Business Analyst',
    shortDescription: 'Analyze processes and suggest business improvements.',
    clusterId: 'data_analyst',
  },
  {
    id: 'investment_banker',
    name: 'Investment Banker',
    shortDescription: 'Work on large financial deals and investments.',
    clusterId: 'data_analyst',
  },
  {
    id: 'financial_analyst',
    name: 'Financial Analyst',
    shortDescription: 'Interpret financial data and build models.',
    clusterId: 'data_analyst',
  },
  {
    id: 'digital_marketer',
    name: 'Digital Marketer',
    shortDescription: 'Run campaigns across social, search, and email.',
    clusterId: 'designer',
  },
  {
    id: 'growth_marketer',
    name: 'Growth Marketer',
    shortDescription: 'Experiment with tactics to grow products and users.',
    clusterId: 'data_analyst',
  },
  {
    id: 'sales_engineer',
    name: 'Sales Engineer',
    shortDescription: 'Explain technical products to customers and partners.',
    clusterId: 'software_engineer',
  },

  // Science / medicine / psychology / social impact
  {
    id: 'doctor',
    name: 'Doctor',
    shortDescription: 'Diagnose and treat patients in healthcare settings.',
    clusterId: 'data_analyst',
  },
  {
    id: 'nurse',
    name: 'Nurse',
    shortDescription: 'Provide direct care and support to patients.',
    clusterId: 'data_analyst',
  },
  {
    id: 'pharmacist',
    name: 'Pharmacist',
    shortDescription: 'Work with medicines and advise on safe use.',
    clusterId: 'data_analyst',
  },
  {
    id: 'physiotherapist',
    name: 'Physiotherapist',
    shortDescription: 'Help people recover movement and reduce pain.',
    clusterId: 'data_analyst',
  },
  {
    id: 'psychologist',
    name: 'Psychologist',
    shortDescription: 'Study human behavior and support mental health.',
    clusterId: 'designer',
  },
  {
    id: 'research_scientist',
    name: 'Research Scientist',
    shortDescription: 'Run experiments and publish scientific findings.',
    clusterId: 'data_analyst',
  },
  {
    id: 'biotechnologist',
    name: 'Biotechnologist',
    shortDescription: 'Apply biology and tech to health and agriculture.',
    clusterId: 'data_analyst',
  },
  {
    id: 'environmental_scientist',
    name: 'Environmental Scientist',
    shortDescription: 'Study the environment and human impact.',
    clusterId: 'data_analyst',
  },
  {
    id: 'social_worker',
    name: 'Social Worker',
    shortDescription: 'Support individuals, families, and communities.',
    clusterId: 'designer',
  },
  {
    id: 'teacher',
    name: 'Teacher',
    shortDescription: 'Help students learn and grow in classrooms.',
    clusterId: 'designer',
  },

  // Law / policy / communication
  {
    id: 'lawyer',
    name: 'Lawyer',
    shortDescription: 'Represent clients and interpret the law.',
    clusterId: 'designer',
  },
  {
    id: 'policy_analyst',
    name: 'Policy Analyst',
    shortDescription: 'Study and recommend changes to public policy.',
    clusterId: 'data_analyst',
  },
  {
    id: 'journalist',
    name: 'Journalist',
    shortDescription: 'Investigate and report news stories.',
    clusterId: 'designer',
  },
  {
    id: 'technical_writer',
    name: 'Technical Writer',
    shortDescription: 'Explain complex topics clearly in documentation.',
    clusterId: 'software_engineer',
  },
  {
    id: 'communications_specialist',
    name: 'Communications Specialist',
    shortDescription: 'Craft messaging for organizations and campaigns.',
    clusterId: 'designer',
  },
  {
    id: 'hr_specialist',
    name: 'HR Specialist',
    shortDescription: 'Support hiring, onboarding, and people operations.',
    clusterId: 'designer',
  },

  // Trades / practical careers (clustered loosely)
  {
    id: 'electrician',
    name: 'Electrician',
    shortDescription: 'Install and maintain electrical systems.',
    clusterId: 'software_engineer',
  },
  {
    id: 'plumber',
    name: 'Plumber',
    shortDescription: 'Install and repair water and drainage systems.',
    clusterId: 'software_engineer',
  },
  {
    id: 'mechanic',
    name: 'Mechanic',
    shortDescription: 'Diagnose and repair vehicles and machinery.',
    clusterId: 'software_engineer',
  },
  {
    id: 'carpenter',
    name: 'Carpenter',
    shortDescription: 'Build and repair wooden structures and furniture.',
    clusterId: 'designer',
  },
];


